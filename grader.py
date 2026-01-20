
import numpy as np
from sentence_transformers import SentenceTransformer

class ExamGrader:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        """Initialize the grader with a sentence transformer model."""
        self.model = SentenceTransformer(model_name)
        self.centroid = None
        self.thresholds = None
        self.max_marks = None
    
    def build_centroid(self, reference_answers, max_marks=3, thresholds=(0.6, 0.7, 0.9)):
        """
        Build a reference centroid from multiple high-quality answers.
        
        Args:
            reference_answers: List of strings (perfect/near-perfect answers)
            max_marks: Maximum score for this question
            thresholds: Tuple of (t1, t2, t3) for marking boundaries
        """
        embeddings = self.model.encode(reference_answers, convert_to_numpy=True)
        self.centroid = embeddings.mean(axis=0)
        self.centroid = self.centroid / np.linalg.norm(self.centroid)
        self.max_marks = max_marks
        self.thresholds = thresholds
        print(f"✅ Centroid built from {len(reference_answers)} reference answers")
    
    def grade(self, student_answer):
        """
        Grade a student answer.
        
        Returns:
            dict: {"similarity": float, "marks": int, "max_marks": int}
        """
        if self.centroid is None:
            raise ValueError("Must call build_centroid() first!")
        
        # Encode and normalize
        emb = self.model.encode(student_answer, convert_to_numpy=True)
        emb = emb / np.linalg.norm(emb)
        
        # Similarity
        similarity = float(np.dot(emb, self.centroid))
        
        # Map to marks
        t1, t2, t3 = self.thresholds
        if similarity >= t3:
            marks = 3
        elif similarity >= t2:
            marks = 2
        elif similarity >= t1:
            marks = 1
        else:
            marks = 0
        
        marks = min(marks, self.max_marks)
        
        return {
            "similarity": round(similarity, 3),
            "marks": marks,
            "max_marks": self.max_marks
        }
