import modal
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util
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
model_grading = None

def _ensure_models():
    global model_gemini, model_grading
    if model_gemini is None or model_grading is None:
        GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY environment variable is not set.")
        genai.configure(api_key=GEMINI_API_KEY)
        model_gemini = genai.GenerativeModel('gemini-2.0-flash-exp')
        model_grading = SentenceTransformer('all-MiniLM-L6-v2')

@fastapi_app.post("/grade")
async def grade_paper(
    file: UploadFile = File(...), 
    reference_answer: str = Form(...),
    max_marks: int = Form(5)
):
    _ensure_models()
    try:
        print("🔹 Step 1: Reading uploaded image...")
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        print("✅ Image read complete.")

        print("🔹 Step 2: Starting OCR with Gemini...")
        response = model_gemini.generate_content([
            "Transcribe the handwritten text in this image exactly as it is written. Do not add any commentary.", 
            image
        ])
        student_text = response.text.strip()
        print(f"📄 Extracted: {student_text}")

        if not student_text:
            return {"status": "error", "message": "Could not read any text from the image."}

        print("🔹 Step 3: Computing similarity with SentenceTransformer...")
        embedding_student = model_grading.encode(student_text, convert_to_tensor=True)
        embedding_reference = model_grading.encode(reference_answer, convert_to_tensor=True)
        similarity_score = util.pytorch_cos_sim(embedding_student, embedding_reference).item()
        print(f"📊 Similarity score: {similarity_score}")

        marks = round(similarity_score * max_marks, 1)
        if marks < 0: marks = 0
        feedback = "Excellent!" if similarity_score > 0.8 else \
                   "Good attempt." if similarity_score > 0.5 else \
                   "Needs improvement."
        print(f"✅ Grading complete. Marks: {marks}/{max_marks}")

        return {
            "status": "success",
            "extracted_text": student_text,
            "grade": {
                "marks": marks,
                "max_marks": max_marks,
                "similarity": float(similarity_score)
            },
            "feedback": feedback
        }
    except Exception as e:
        print(f"❌ Error in /grade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@fastapi_app.post("/grade-batch")
async def grade_batch(payload: Dict[str, Any] = Body(...)):
    """
    Grade multiple student submissions for a subject using answer keys.
    
    Expected payload:
    {
        "submissions": [
            {
                "id": "submission_id",
                "studentName": "John Doe",
                "fileData": "base64_string"
            }
        ],
        "answerKeys": [
            {
                "questionNumber": "1",
                "referenceAnswer": "The answer...",
                "maxMarks": 10
            }
        ]
    }
    """
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
                
                # Check if it's a PDF and convert to image
                try:
                    # Try to open as image first
                    image = Image.open(io.BytesIO(image_bytes))
                    print("✅ Loaded as image")
                except Exception as img_error:
                    # If that fails, try as PDF
                    print("📄 Detected PDF, converting to image...")
                    try:
                        # Import here to avoid local dependency issues
                        from pdf2image import convert_from_bytes
                        
                        # Convert PDF first page to image
                        images = convert_from_bytes(image_bytes, first_page=1, last_page=1)
                        if images:
                            image = images[0]
                            print("✅ PDF converted to image")
                        else:
                            raise Exception("PDF conversion returned no images")
                    except Exception as pdf_error:
                        print(f"❌ Failed to load file: {pdf_error}")
                        raise Exception(f"Could not process file as image or PDF: {img_error}, {pdf_error}")
                
                
                # Step 1: Extract questions and answers using Gemini
                print("🔹 Extracting questions from paper...")
                extraction_prompt = f"""
You are analyzing a student's answer sheet. Your job is to:
1. Detect ALL question numbers in this paper (they might be formatted as: Q1, 1., Q2, 2., Question 1, etc.)
2. For each question number, extract the student's complete answer

Return ONLY a JSON object in this exact format (no markdown, no code blocks):
{{
  "questions": [
    {{"questionNumber": "1", "answer": "student's answer to question 1"}},
    {{"questionNumber": "2", "answer": "student's answer to question 2"}}
  ]
}}

If you cannot find any questions, return: {{"questions": []}}
"""
                
                response = model_gemini.generate_content([extraction_prompt, image])
                extracted_text = response.text.strip()
                
                # Clean up response (remove markdown code blocks if present)
                if extracted_text.startswith("```"):
                    extracted_text = extracted_text.split("```")[1]
                    if extracted_text.startswith("json"):
                        extracted_text = extracted_text[4:].strip()
                
                print(f"📄 Raw extraction: {extracted_text[:200]}...")
                
                try:
                    extracted_data = json.loads(extracted_text)
                    student_answers = extracted_data.get("questions", [])
                except json.JSONDecodeError:
                    print("⚠️ Failed to parse JSON, trying to extract manually...")
                    student_answers = []
                
                print(f"✅ Found {len(student_answers)} answers from student")
                
                # Step 2: Grade each question
                question_results = []
                total_marks = 0
                total_max_marks = 0
                
                for answer_key in answer_keys:
                    key_q_num = str(answer_key.get("questionNumber", "")).strip()
                    reference_answer = answer_key.get("referenceAnswer", "")
                    max_marks = answer_key.get("maxMarks", 5)
                    
                    total_max_marks += max_marks
                    
                    # Find matching student answer
                    student_answer = None
                    for sa in student_answers:
                        sa_q_num = str(sa.get("questionNumber", "")).strip()
                        # Normalize question numbers (remove Q, dots, spaces)
                        normalized_key = key_q_num.replace("Q", "").replace("q", "").replace(".", "").strip()
                        normalized_student = sa_q_num.replace("Q", "").replace("q", "").replace(".", "").strip()
                        
                        if normalized_key == normalized_student:
                            student_answer = sa.get("answer", "")
                            break
                    
                    if not student_answer:
                        print(f"⚠️ Question {key_q_num} not found in student's paper")
                        question_results.append({
                            "questionNumber": key_q_num,
                            "marksObtained": 0,
                            "maxMarks": max_marks,
                            "similarity": 0,
                            "studentAnswer": "NOT FOUND",
                            "referenceAnswer": reference_answer
                        })
                        continue
                    
                    # Calculate similarity
                    print(f"🔹 Grading Q{key_q_num}...")
                    embedding_student = model_grading.encode(student_answer, convert_to_tensor=True)
                    embedding_reference = model_grading.encode(reference_answer, convert_to_tensor=True)
                    similarity_score = util.pytorch_cos_sim(embedding_student, embedding_reference).item()
                    
                    marks_obtained = round(similarity_score * max_marks, 1)
                    if marks_obtained < 0: marks_obtained = 0
                    
                    total_marks += marks_obtained
                    
                    question_results.append({
                        "questionNumber": key_q_num,
                        "marksObtained": marks_obtained,
                        "maxMarks": max_marks,
                        "similarity": float(similarity_score),
                        "studentAnswer": student_answer[:200],  # Truncate for response
                        "referenceAnswer": reference_answer[:200]
                    })
                    
                    print(f"✅ Q{key_q_num}: {marks_obtained}/{max_marks} (similarity: {similarity_score:.2f})")
                
                # Calculate percentage and feedback
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
        "sentence-transformers",
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
