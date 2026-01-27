"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Key, Trash2, Edit2, BookOpen, Save, X } from "lucide-react";

interface Subject {
    id: string;
    name: string;
    color: string;
}

interface Question {
    id: string;
    questionNumber: string;
    questionText?: string;
    referenceAnswer: string;
    maxMarks: number;
    createdAt: string;
}

interface AnswerKey {
    id: string;
    subjectId: string;
    questions: Question[];
    createdAt: string;
    updatedAt: string;
}

export default function AnswerKeysPage() {
    const searchParams = useSearchParams();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
    const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([]);
    const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [newQuestion, setNewQuestion] = useState({
        questionNumber: "",
        questionText: "",
        referenceAnswer: "",
        maxMarks: 5,
    });

    useEffect(() => {
        loadData();
        // Check if subject ID was passed in URL
        const subjectParam = searchParams.get("subject");
        if (subjectParam) {
            setSelectedSubjectId(subjectParam);
        }
    }, [searchParams]);

    useEffect(() => {
        if (selectedSubjectId) {
            loadQuestionsForSubject(selectedSubjectId);
        }
    }, [selectedSubjectId, answerKeys]);

    const loadData = () => {
        // Load subjects
        const storedSubjects = localStorage.getItem("subjects");
        if (storedSubjects) {
            setSubjects(JSON.parse(storedSubjects));
        }

        // Load answer keys
        const storedKeys = localStorage.getItem("answerKeys");
        if (storedKeys) {
            setAnswerKeys(JSON.parse(storedKeys));
        }
    };

    const loadQuestionsForSubject = (subjectId: string) => {
        const answerKey = answerKeys.find((ak) => ak.subjectId === subjectId);
        setCurrentQuestions(answerKey?.questions || []);
    };

    const saveAnswerKeys = (updatedKeys: AnswerKey[]) => {
        localStorage.setItem("answerKeys", JSON.stringify(updatedKeys));
        setAnswerKeys(updatedKeys);
        updateSubjectQuestionCount(selectedSubjectId, updatedKeys);
    };

    const updateSubjectQuestionCount = (subjectId: string, keys: AnswerKey[]) => {
        const storedSubjects = localStorage.getItem("subjects");
        if (storedSubjects) {
            const subjects: Subject[] = JSON.parse(storedSubjects);
            const answerKey = keys.find((ak) => ak.subjectId === subjectId);
            const updatedSubjects = subjects.map((s) =>
                s.id === subjectId
                    ? { ...s, questionCount: answerKey?.questions.length || 0 }
                    : s
            );
            localStorage.setItem("subjects", JSON.stringify(updatedSubjects));
            setSubjects(updatedSubjects);
        }
    };

    const handleAddQuestion = () => {
        if (!selectedSubjectId || !newQuestion.questionNumber || !newQuestion.referenceAnswer) {
            alert("Please fill in required fields");
            return;
        }

        const question: Question = {
            id: Date.now().toString(),
            questionNumber: newQuestion.questionNumber,
            questionText: newQuestion.questionText,
            referenceAnswer: newQuestion.referenceAnswer,
            maxMarks: newQuestion.maxMarks,
            createdAt: new Date().toISOString(),
        };

        let updatedKeys = [...answerKeys];
        const existingKeyIndex = updatedKeys.findIndex((ak) => ak.subjectId === selectedSubjectId);

        if (existingKeyIndex >= 0) {
            // Update existing answer key
            updatedKeys[existingKeyIndex] = {
                ...updatedKeys[existingKeyIndex],
                questions: [...updatedKeys[existingKeyIndex].questions, question],
                updatedAt: new Date().toISOString(),
            };
        } else {
            // Create new answer key
            const newKey: AnswerKey = {
                id: Date.now().toString(),
                subjectId: selectedSubjectId,
                questions: [question],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            updatedKeys.push(newKey);
        }

        saveAnswerKeys(updatedKeys);
        setNewQuestion({ questionNumber: "", questionText: "", referenceAnswer: "", maxMarks: 5 });
        setIsAdding(false);
    };

    const handleDeleteQuestion = (questionId: string) => {
        if (!confirm("Delete this question?")) return;

        const updatedKeys = answerKeys.map((ak) => {
            if (ak.subjectId === selectedSubjectId) {
                return {
                    ...ak,
                    questions: ak.questions.filter((q) => q.id !== questionId),
                    updatedAt: new Date().toISOString(),
                };
            }
            return ak;
        });

        saveAnswerKeys(updatedKeys);
    };

    const handleEditQuestion = (question: Question) => {
        setEditingId(question.id);
        setIsAdding(false);
        setNewQuestion({
            questionNumber: question.questionNumber,
            questionText: question.questionText || "",
            referenceAnswer: question.referenceAnswer,
            maxMarks: question.maxMarks,
        });
    };

    const handleSaveEdit = () => {
        if (!editingId) return;

        const updatedKeys = answerKeys.map((ak) => {
            if (ak.subjectId === selectedSubjectId) {
                return {
                    ...ak,
                    questions: ak.questions.map((q) =>
                        q.id === editingId
                            ? {
                                ...q,
                                questionNumber: newQuestion.questionNumber,
                                questionText: newQuestion.questionText,
                                referenceAnswer: newQuestion.referenceAnswer,
                                maxMarks: newQuestion.maxMarks,
                            }
                            : q
                    ),
                    updatedAt: new Date().toISOString(),
                };
            }
            return ak;
        });

        saveAnswerKeys(updatedKeys);
        setEditingId(null);
        setNewQuestion({ questionNumber: "", questionText: "", referenceAnswer: "", maxMarks: 5 });
    };

    const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Answer Keys</h1>
                <p className="text-zinc-400">Create and manage reference answers for grading</p>
            </div>

            {/* Subject Selector */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Select Subject
                </label>
                <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full md:w-96 p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                >
                    <option value="">Choose a subject...</option>
                    {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                            {subject.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* No subject selected */}
            {!selectedSubjectId && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                    <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Select a Subject</h3>
                    <p className="text-zinc-400">Choose a subject to view or add answer keys</p>
                </div>
            )}

            {/* Questions for selected subject */}
            {selectedSubjectId && (
                <>
                    {/* Header with Add button */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: selectedSubject?.color }}
                                />
                                {selectedSubject?.name}
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">
                                {currentQuestions.length} question{currentQuestions.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsAdding(!isAdding);
                                setEditingId(null);
                                setNewQuestion({ questionNumber: "", questionText: "", referenceAnswer: "", maxMarks: 5 });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/30"
                        >
                            <Plus className="w-5 h-5" />
                            Add Question
                        </button>
                    </div>

                    {/* Add/Edit Question Form */}
                    {(isAdding || editingId) && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-bold text-white mb-4">
                                {editingId ? "Edit Question" : "Add New Question"}
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Question Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={newQuestion.questionNumber}
                                            onChange={(e) =>
                                                setNewQuestion({ ...newQuestion, questionNumber: e.target.value })
                                            }
                                            placeholder="e.g., 1, 2, 3a, Q1"
                                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder:text-zinc-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Max Marks *
                                        </label>
                                        <input
                                            type="number"
                                            value={newQuestion.maxMarks}
                                            onChange={(e) =>
                                                setNewQuestion({ ...newQuestion, maxMarks: parseInt(e.target.value) || 0 })
                                            }
                                            min="1"
                                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Question Text (Optional)
                                    </label>
                                    <textarea
                                        value={newQuestion.questionText}
                                        onChange={(e) =>
                                            setNewQuestion({ ...newQuestion, questionText: e.target.value })
                                        }
                                        placeholder="The actual question for reference..."
                                        rows={2}
                                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder:text-zinc-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Reference Answer *
                                    </label>
                                    <textarea
                                        value={newQuestion.referenceAnswer}
                                        onChange={(e) =>
                                            setNewQuestion({ ...newQuestion, referenceAnswer: e.target.value })
                                        }
                                        placeholder="The correct/model answer..."
                                        rows={4}
                                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder:text-zinc-500"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={editingId ? handleSaveEdit : handleAddQuestion}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {editingId ? "Save Changes" : "Add Question"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsAdding(false);
                                            setEditingId(null);
                                            setNewQuestion({ questionNumber: "", questionText: "", referenceAnswer: "", maxMarks: 5 });
                                        }}
                                        className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Questions List */}
                    {currentQuestions.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                            <Key className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-400">No questions added yet</p>
                            <p className="text-sm text-zinc-500 mt-2">
                                Click "Add Question" to create your first question
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {currentQuestions
                                .sort((a, b) => {
                                    const numA = parseInt(a.questionNumber) || 0;
                                    const numB = parseInt(b.questionNumber) || 0;
                                    return numA - numB;
                                })
                                .map((question) => (
                                    <div
                                        key={question.id}
                                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold text-sm px-3 py-1 rounded-lg"
                                                >
                                                    Q{question.questionNumber}
                                                </div>
                                                <div className="bg-zinc-800 text-zinc-300 text-sm px-3 py-1 rounded-lg">
                                                    {question.maxMarks} marks
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditQuestion(question)}
                                                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuestion(question.id)}
                                                    className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {question.questionText && (
                                            <div className="mb-3">
                                                <span className="text-xs text-zinc-500 uppercase tracking-wide">Question</span>
                                                <p className="text-zinc-300 text-sm mt-1">{question.questionText}</p>
                                            </div>
                                        )}

                                        <div>
                                            <span className="text-xs text-zinc-500 uppercase tracking-wide">Reference Answer</span>
                                            <p className="text-white mt-1 border-l-2 border-purple-500/50 pl-3">
                                                {question.referenceAnswer}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
