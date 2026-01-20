from grader import ExamGrader

grader = ExamGrader()

reference_answers = [
    "Paris is the capital of France and is known for the Eiffel Tower.",
    "The capital city of France is Paris, famous for its Eiffel Tower.",
    "Paris, France's capital, is home to the iconic Eiffel Tower."
]

grader.build_centroid(reference_answers, max_marks=3, thresholds=(0.6, 0.7, 0.9))

good_answer = "The capital of France is Paris, which has the Eiffel Tower."
bad_answer = "I don't know the answer."

print("Good answer:", grader.grade(good_answer))
print("Bad answer:", grader.grade(bad_answer))
