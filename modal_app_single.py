import modal
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from PIL import Image
import io
import json
import base64
from typing import List, Dict, Any

# --- FASTAPI APP (lazy init) ---
fastapi_app = FastAPI()
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy globals
model_gemini = None

def _ensure_models():
    global model_gemini
    if model_gemini is None:
        GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY environment variable is not set.")
        genai.configure(api_key=GEMINI_API_KEY)
        model_gemini = genai.GenerativeModel('gemini-2.5-flash')

@fastapi_app.post("/grade-batch")
async def grade_batch(payload: Dict[str, Any] = Body(...)):
    _ensure_models()
    
    try:
        submissions = payload.get("submissions", [])
        answer_keys = payload.get("answerKeys", [])
        
        if not submissions or not answer_keys:
            raise HTTPException(status_code=400, detail="Missing submissions or answer keys")
        
        print(f"🔹 Processing {len(submissions)} submissions with {len(answer_keys)} answer keys...")
        
        results = []
        
        for submission in submissions:
            try:
                student_name = submission.get("studentName", "Unknown")
                file_data = submission.get("fileData", "")
                submission_id = submission.get("id", "")
                
                print(f"\n📝 Grading: {student_name}...")
                
                # Decode base64 image/PDF
                if file_data.startswith("data:"):
                    file_data = file_data.split(",")[1]
                
                image_bytes = base64.b64decode(file_data)
                images = []
                
                # Check if it's a PDF and convert to image
                try:
                    # Try to open as image first
                    img = Image.open(io.BytesIO(image_bytes))
                    images.append(img)
                    print("✅ Loaded as image")
                except Exception as img_error:
                    # If that fails, try as PDF
                    print("📄 Detected PDF, converting to image...")
                    try:
                        from pdf2image import convert_from_bytes
                        # Convert all pages (no first_page, last_page limit)
                        pdf_images = convert_from_bytes(image_bytes)
                        if pdf_images:
                            images.extend(pdf_images)
                            print(f"✅ PDF converted to {len(images)} images")
                        else:
                            raise Exception("PDF conversion returned no images")
                    except Exception as pdf_error:
                        print(f"❌ Failed to load file: {pdf_error}")
                        raise Exception(f"Could not process file as image or PDF: {img_error}, {pdf_error}")
                
                # Prepare answer keys context
                answer_keys_json = json.dumps(answer_keys)
                
                print("🔹 Prompting Gemini to grade the paper...")
                grading_prompt = f"""
You are an expert professor grading a student's answer sheet. 
You are provided with images of the student's submission (which may be multiple pages).

Here is the Answer Key in JSON format:
{answer_keys_json}

Your task:
1. Identify the student's answers for each question listed in the answer key.
2. Evaluate the student's answer against the referenceAnswer.
3. Assign marks for each question up to the maxMarks. Be fair: if the student demonstrates understanding of the core concepts but uses different wording, award full or partial credit. If the answer is completely wrong or missing, give 0.
4. Provide a very brief 1-2 sentence feedback explaining the marks given.
5. Provide the exact text from the student's answer (or a summary if it's very long).

Return ONLY a JSON object exactly like this, with NO markdown formatting around it (no ```json):
{{
  "questions": [
    {{
      "questionNumber": "1",
      "marksObtained": 8.5,
      "maxMarks": 10,
      "feedback": "Core concept is correct but missed explaining XYZ.",
      "studentAnswer": "The extracted or summarized student answer..."
    }}
  ]
}}
"""
                
                contents = [grading_prompt] + images
                response = model_gemini.generate_content(contents)
                extracted_text = response.text.strip()
                
                if extracted_text.startswith("```"):
                    extracted_text = extracted_text.split("```")[1]
                    if extracted_text.startswith("json"):
                        extracted_text = extracted_text[4:].strip()
                
                print(f"📄 Raw extraction: {extracted_text[:200]}...")
                
                try:
                    graded_data = json.loads(extracted_text)
                    graded_questions = graded_data.get("questions", [])
                except json.JSONDecodeError:
                    raise Exception("Failed to parse Gemini JSON output")
                
                question_results = []
                total_marks = 0
                total_max_marks = 0
                
                for answer_key in answer_keys:
                    key_q_num = str(answer_key.get("questionNumber", "")).strip()
                    max_marks = answer_key.get("maxMarks", 5)
                    reference_answer = answer_key.get("referenceAnswer", "")
                    total_max_marks += max_marks
                    
                    # Find matched grade
                    matched_q = None
                    for gq in graded_questions:
                        if str(gq.get("questionNumber", "")).strip() == key_q_num:
                            matched_q = gq
                            break
                    
                    if matched_q:
                        marks_obtained = float(matched_q.get("marksObtained", 0))
                        marks_obtained = min(max(marks_obtained, 0), max_marks)  # clamp
                        feedback = matched_q.get("feedback", "No feedback provided.")
                        student_ans = matched_q.get("studentAnswer", "Could not extract.")
                    else:
                        print(f"⚠️ Question {key_q_num} not graded by Gemini")
                        marks_obtained = 0
                        feedback = "Question not found in student's paper."
                        student_ans = "NOT FOUND"
                        
                    total_marks += marks_obtained
                    question_results.append({
                        "questionNumber": key_q_num,
                        "marksObtained": marks_obtained,
                        "maxMarks": max_marks,
                        "feedback": feedback,
                        "studentAnswer": student_ans,
                        "referenceAnswer": reference_answer
                    })
                    
                    print(f"✅ Q{key_q_num}: {marks_obtained}/{max_marks}")
                
                percentage = (total_marks / total_max_marks * 100) if total_max_marks > 0 else 0
                
                if percentage >= 80:
                    overall_feedback = "Excellent work!"
                elif percentage >= 60:
                    overall_feedback = "Good performance!"
                elif percentage >= 40:
                    overall_feedback = "Satisfactory. Keep improving!"
                else:
                    overall_feedback = "Needs significant improvement."
                
                results.append({
                    "submissionId": submission_id,
                    "studentName": student_name,
                    "status": "success",
                    "totalMarks": round(total_marks, 1),
                    "totalMaxMarks": total_max_marks,
                    "percentage": round(percentage, 1),
                    "overallFeedback": overall_feedback,
                    "questionResults": question_results
                })
                
                print(f"✅ {student_name}: {total_marks}/{total_max_marks} ({percentage:.1f}%)")
                
            except Exception as e:
                print(f"❌ Error grading {submission.get('studentName', 'Unknown')}: {e}")
                results.append({
                    "submissionId": submission.get("id", ""),
                    "studentName": submission.get("studentName", "Unknown"),
                    "status": "error",
                    "error": str(e)
                })
        
        return {
            "status": "success",
            "results": results
        }
        
    except Exception as e:
        print(f"❌ Error in /grade-batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- MODAL WRAPPER ---
app = modal.App("paper-grader-backend")
image = (
    modal.Image.debian_slim()
    .apt_install("poppler-utils")  # Required for pdf2image
    .pip_install(
        "fastapi",
        "uvicorn[standard]",
        "pillow",
        "google-generativeai",
        "python-multipart",
        "pdf2image",
    )
)

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("gemini-api-key")],
    timeout=600,  # 10 minutes for batch processing
)
@modal.asgi_app()
def asgi_app():
    return fastapi_app
