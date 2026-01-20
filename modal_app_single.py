import modal
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util
import google.generativeai as genai
from PIL import Image
import io

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
        model_gemini = genai.GenerativeModel('gemini-3-flash-preview')
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

# --- MODAL WRAPPER ---
app = modal.App("paper-grader-backend")
image = (
    modal.Image.debian_slim()
    .pip_install(
        "fastapi",
        "uvicorn[standard]",
        "pillow",
        "sentence-transformers",
        "google-generativeai",
        "python-multipart",
    )
)

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("gemini-api-key")],
)
@modal.asgi_app()
def asgi_app():
    return fastapi_app
