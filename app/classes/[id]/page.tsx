"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Key, Upload, BarChart3, Plus, Trash2, Edit2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from "recharts";

// --- Types ---
interface Class {
    id: string;
    subjectId: string;
    name: string;
    studentCount: number;
}

interface Student {
    id: string;
    classId: string;
    name: string;
    rollNo: string;
}

interface Question {
    id: string;
    questionNumber: string;
    questionText?: string;
    referenceAnswer: string;
    maxMarks: number;
}

interface AnswerKey {
    id: string;
    classId: string; // Changed from subjectId
    questions: Question[];
}

interface StudentSubmission {
    id: string;
    classId: string; // Changed from subjectId
    studentId: string; // Changed from studentName string
    fileName: string;
    fileData: string;
    uploadedAt: string;
    status: "uploaded" | "processing" | "graded";
    totalMarks?: number;
    maxMarks?: number;
    percentage?: number;
    questionResults?: any[];
}

export default function ClassWorkspace() {
    const params = useParams();
    const router = useRouter();
    const [classData, setClassData] = useState<Class | null>(null);
    const [subjectName, setSubjectName] = useState("");

    // Tabs state
    const [activeTab, setActiveTab] = useState<"students" | "keys" | "submissions" | "report">("students");

    // Students state
    const [students, setStudents] = useState<Student[]>([]);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: "", rollNo: "" });

    // Answer Key state
    const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null);
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ questionNumber: "", questionText: "", referenceAnswer: "", maxMarks: 5 });

    // Submissions state
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [isGrading, setIsGrading] = useState(false);
    const [gradingProgress, setGradingProgress] = useState("");

    useEffect(() => {
        if (!params.id) return;

        // Load Class
        const storedClasses = localStorage.getItem("classes");
        if (storedClasses) {
            const allClasses: Class[] = JSON.parse(storedClasses);
            const currentClass = allClasses.find((c) => c.id === params.id);
            if (currentClass) {
                setClassData(currentClass);

                // Get Subject Name for breadcrumb
                const storedSubjects = localStorage.getItem("subjects");
                if (storedSubjects) {
                    const subjects = JSON.parse(storedSubjects);
                    const subject = subjects.find((s: any) => s.id === currentClass.subjectId);
                    if (subject) setSubjectName(subject.name);
                }

                loadDataForClass(currentClass.id);
            } else {
                router.push("/subjects");
            }
        }
    }, [params.id, router]);

    const loadDataForClass = (classId: string) => {
        // Load Students
        const storedStudents = localStorage.getItem("students");
        if (storedStudents) {
            const allStudents: Student[] = JSON.parse(storedStudents);
            setStudents(allStudents.filter(s => s.classId === classId));
        }

        // Load Answer Key
        const storedKeys = localStorage.getItem("answerKeys");
        if (storedKeys) {
            const allKeys: AnswerKey[] = JSON.parse(storedKeys);
            const key = allKeys.find(k => k.classId === classId);
            if (key) setAnswerKey(key);
        }

        // Load Submissions
        const storedSubmissions = localStorage.getItem("studentSubmissions");
        if (storedSubmissions) {
            const allSubs: StudentSubmission[] = JSON.parse(storedSubmissions);
            setSubmissions(allSubs.filter(s => s.classId === classId));
        }
    };

    // --- Student Actions ---
    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudent.name.trim() || !newStudent.rollNo.trim() || !classData) return;

        const student = {
            id: Date.now().toString(),
            classId: classData.id,
            name: newStudent.name.trim(),
            rollNo: newStudent.rollNo.trim()
        };

        const storedStudents = localStorage.getItem("students");
        const allStudents = storedStudents ? JSON.parse(storedStudents) : [];
        const updated = [...allStudents, student];

        localStorage.setItem("students", JSON.stringify(updated));
        setStudents([...students, student]);
        setNewStudent({ name: "", rollNo: "" });
        setIsAddingStudent(false);

        // Update class student count
        updateClassStudentCount(classData.id, [...students, student].length);
    };

    const handleDeleteStudent = (id: string) => {
        if (!confirm("Remove this student? Their submissions will also be deleted.")) return;
        const storedStudents = localStorage.getItem("students");
        if (storedStudents) {
            const allStudents: Student[] = JSON.parse(storedStudents);
            const updated = allStudents.filter(s => s.id !== id);
            localStorage.setItem("students", JSON.stringify(updated));
            setStudents(students.filter(s => s.id !== id));
            updateClassStudentCount(classData!.id, students.length - 1);
        }
    };

    const updateClassStudentCount = (classId: string, count: number) => {
        const storedClasses = localStorage.getItem("classes");
        if (storedClasses) {
            const allClasses: Class[] = JSON.parse(storedClasses);
            const updated = allClasses.map(c => c.id === classId ? { ...c, studentCount: count } : c);
            localStorage.setItem("classes", JSON.stringify(updated));
            setClassData(updated.find(c => c.id === classId) || classData);
        }
    }

    // --- Answer Key Actions ---
    const handleAddQuestion = () => {
        if (!newQuestion.questionNumber || !newQuestion.referenceAnswer || !classData) return;

        const question: Question = {
            id: Date.now().toString(),
            questionNumber: newQuestion.questionNumber,
            questionText: newQuestion.questionText,
            referenceAnswer: newQuestion.referenceAnswer,
            maxMarks: newQuestion.maxMarks,
        };

        const storedKeys = localStorage.getItem("answerKeys");
        const allKeys: AnswerKey[] = storedKeys ? JSON.parse(storedKeys) : [];

        let existingKeyIndex = allKeys.findIndex(k => k.classId === classData.id);
        let updatedKey: AnswerKey;

        if (existingKeyIndex >= 0) {
            updatedKey = {
                ...allKeys[existingKeyIndex],
                questions: [...allKeys[existingKeyIndex].questions, question]
            };
            allKeys[existingKeyIndex] = updatedKey;
        } else {
            updatedKey = {
                id: Date.now().toString(),
                classId: classData.id,
                questions: [question]
            };
            allKeys.push(updatedKey);
        }

        localStorage.setItem("answerKeys", JSON.stringify(allKeys));
        setAnswerKey(updatedKey);
        setNewQuestion({ questionNumber: "", questionText: "", referenceAnswer: "", maxMarks: 5 });
        setIsAddingQuestion(false);
    };

    const handleDeleteQuestion = (questionId: string) => {
        if (!answerKey || !classData) return;

        const updatedQuestions = answerKey.questions.filter(q => q.id !== questionId);
        const updatedKey = { ...answerKey, questions: updatedQuestions };

        const storedKeys = localStorage.getItem("answerKeys");
        if (storedKeys) {
            const allKeys: AnswerKey[] = JSON.parse(storedKeys);
            const updatedKeys = allKeys.map(k => k.classId === classData.id ? updatedKey : k);
            localStorage.setItem("answerKeys", JSON.stringify(updatedKeys));
        }

        setAnswerKey(updatedKey);
    };

    // --- Submission Actions ---
    const handleFileUpload = async (studentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !classData) return;
        const file = e.target.files[0];

        try {
            const base64 = await fileToBase64(file);
            const submission: StudentSubmission = {
                id: Date.now().toString() + Math.random(),
                classId: classData.id,
                studentId: studentId,
                fileName: file.name,
                fileData: base64,
                uploadedAt: new Date().toISOString(),
                status: "uploaded",
            };

            const storedSubmissions = localStorage.getItem("studentSubmissions");
            const allSubmissions = storedSubmissions ? JSON.parse(storedSubmissions) : [];

            // Remove old submission for this student if exists
            const filteredAll = allSubmissions.filter((s: StudentSubmission) => !(s.classId === classData.id && s.studentId === studentId));
            const updated = [...filteredAll, submission];

            localStorage.setItem("studentSubmissions", JSON.stringify(updated));
            setSubmissions([...submissions.filter(s => s.studentId !== studentId), submission]);
        } catch (error) {
            console.error(error);
            alert("Error reading file");
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleGradeAll = async () => {
        if (!classData || !answerKey || answerKey.questions.length === 0) {
            alert("Please add answer keys first!");
            return;
        }

        const ungradedSubmissions = submissions.filter(s => s.status === "uploaded");
        if (ungradedSubmissions.length === 0) {
            alert("No ungraded papers to process!");
            return;
        }

        setIsGrading(true);
        setGradingProgress(`Processing ${ungradedSubmissions.length} papers...`);

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

            // We need to resolve student names for the backend
            const payload = {
                submissions: ungradedSubmissions.map(s => {
                    const student = students.find(st => st.id === s.studentId);
                    return {
                        id: s.id,
                        studentName: student ? student.name : "Unknown",
                        fileData: s.fileData,
                    };
                }),
                answerKeys: answerKey.questions.map((q) => ({
                    questionNumber: q.questionNumber,
                    referenceAnswer: q.referenceAnswer,
                    maxMarks: q.maxMarks,
                })),
            };

            const response = await axios.post(`${API_BASE_URL}/grade-batch`, payload);

            if (response.data.status === "success") {
                const results = response.data.results;
                const updatedSubmissions = submissions.map((sub) => {
                    const result = results.find((r: any) => r.submissionId === sub.id);
                    if (result && result.status === "success") {
                        return {
                            ...sub,
                            status: "graded" as const,
                            totalMarks: result.totalMarks,
                            maxMarks: result.totalMaxMarks,
                            percentage: result.percentage,
                            questionResults: result.questionResults,
                        };
                    }
                    return sub;
                });

                // Save back to local storage
                const storedSubmissions = localStorage.getItem("studentSubmissions");
                if (storedSubmissions) {
                    const allSubmissions: StudentSubmission[] = JSON.parse(storedSubmissions);
                    const merged = allSubmissions.map(s => {
                        const updated = updatedSubmissions.find(us => us.id === s.id);
                        return updated || s;
                    });
                    localStorage.setItem("studentSubmissions", JSON.stringify(merged));
                }

                setSubmissions(updatedSubmissions);
                alert(`Successfully graded ${results.filter((r: any) => r.status === "success").length} papers!`);
                setActiveTab("report"); // Switch to report automatically
            }
        } catch (error: any) {
            console.error("Grading error:", error);
            alert(`Error grading papers: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsGrading(false);
            setGradingProgress("");
        }
    };

    if (!classData) return <div className="p-8 text-zinc-400">Loading class...</div>;

    // Report Calculations
    const gradedSubmissions = submissions.filter(s => s.status === "graded").sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

    // Distribution for chart
    const distributeBy10s = () => {
        const ranges = [
            { range: "0-20%", count: 0 },
            { range: "21-40%", count: 0 },
            { range: "41-60%", count: 0 },
            { range: "61-80%", count: 0 },
            { range: "81-100%", count: 0 },
        ];

        gradedSubmissions.forEach(sub => {
            const p = sub.percentage || 0;
            if (p <= 20) ranges[0].count++;
            else if (p <= 40) ranges[1].count++;
            else if (p <= 60) ranges[2].count++;
            else if (p <= 80) ranges[3].count++;
            else ranges[4].count++;
        });

        return ranges;
    };

    return (
        <div className="p-8 pb-32">
            {/* Breadcrumb */}
            <Link
                href={`/subjects/${classData.subjectId}`}
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to {subjectName || "Subject"}
            </Link>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">{classData.name} Workspace</h1>
                <p className="text-zinc-400">Manage students, answer keys, and grading for this class.</p>
            </div>

            {/* Custom Tabs */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1 mb-8 w-fit">
                <button
                    onClick={() => setActiveTab("students")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-medium text-sm transition-all ${activeTab === 'students' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                >
                    <Users className="w-4 h-4" /> Students ({students.length})
                </button>
                <button
                    onClick={() => setActiveTab("keys")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-medium text-sm transition-all ${activeTab === 'keys' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                >
                    <Key className="w-4 h-4" /> Answer Key ({answerKey?.questions?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab("submissions")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-medium text-sm transition-all ${activeTab === 'submissions' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                >
                    <Upload className="w-4 h-4" /> Papers
                </button>
                <button
                    onClick={() => setActiveTab("report")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-medium text-sm transition-all ${activeTab === 'report' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                >
                    <BarChart3 className="w-4 h-4" /> Class Report
                </button>
            </div>

            {/* --- TAB CONTENT --- */}

            {/* STUDENTS TAB */}
            {activeTab === "students" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Class Roster</h2>
                        <button
                            onClick={() => setIsAddingStudent(!isAddingStudent)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all border border-zinc-700"
                        >
                            <Plus className="w-4 h-4" /> Add Student
                        </button>
                    </div>

                    {isAddingStudent && (
                        <form onSubmit={handleAddStudent} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Student Name</label>
                                <input
                                    type="text" required value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Roll Number</label>
                                <input
                                    type="text" required value={newStudent.rollNo} onChange={e => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                                    placeholder="e.g. 001"
                                    className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-purple-500"
                                />
                            </div>
                            <button type="submit" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-all h-[42px]">
                                Save
                            </button>
                        </form>
                    )}

                    {students.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                            No students added yet. Add students to build your class roster!
                        </div>
                    ) : (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800 bg-zinc-950/50">
                                        <th className="p-4 text-sm font-medium text-zinc-400">Roll No</th>
                                        <th className="p-4 text-sm font-medium text-zinc-400">Student Name</th>
                                        <th className="p-4 text-sm font-medium text-zinc-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.sort((a, b) => a.rollNo.localeCompare(b.rollNo)).map(student => (
                                        <tr key={student.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                                            <td className="p-4 text-zinc-300 font-mono text-sm">{student.rollNo}</td>
                                            <td className="p-4 text-white font-medium">{student.name}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDeleteStudent(student.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ANSWER KEY TAB */}
            {activeTab === "keys" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Class Answer Key</h2>
                        <button
                            onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all border border-zinc-700"
                        >
                            <Plus className="w-4 h-4" /> Add Question
                        </button>
                    </div>

                    {isAddingQuestion && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Add New Question</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Question Number *</label>
                                        <input type="text" value={newQuestion.questionNumber} onChange={(e) => setNewQuestion({ ...newQuestion, questionNumber: e.target.value })} className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Max Marks *</label>
                                        <input type="number" value={newQuestion.maxMarks} onChange={(e) => setNewQuestion({ ...newQuestion, maxMarks: parseInt(e.target.value) || 0 })} min="1" className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-purple-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Reference Answer *</label>
                                    <textarea value={newQuestion.referenceAnswer} onChange={(e) => setNewQuestion({ ...newQuestion, referenceAnswer: e.target.value })} rows={4} className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-purple-500" />
                                </div>
                                <button onClick={handleAddQuestion} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all">Save Question</button>
                            </div>
                        </div>
                    )}

                    {!answerKey || answerKey.questions.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                            No questions added yet. Construct your rubric here.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {answerKey.questions.sort((a, b) => parseInt(a.questionNumber) - parseInt(b.questionNumber)).map(q => (
                                <div key={q.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-white bg-zinc-800 px-3 py-1 rounded">Q{q.questionNumber}</span>
                                            <span className="text-sm text-zinc-400">{q.maxMarks} marks max</span>
                                        </div>
                                        <p className="text-zinc-300 border-l-2 border-purple-500/50 pl-3 italic text-sm mt-3">{q.referenceAnswer}</p>
                                    </div>
                                    <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded h-fit self-start">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SUBMISSIONS & GRADING TAB */}
            {activeTab === "submissions" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-end">
                        <h2 className="text-xl font-bold text-white">Student Papers</h2>
                        {submissions.filter(s => s.status === 'uploaded').length > 0 && (
                            <button
                                onClick={handleGradeAll}
                                disabled={isGrading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {isGrading ? "Grading in Progress..." : `Grade ${submissions.filter(s => s.status === 'uploaded').length} Uploaded Papers`}
                            </button>
                        )}
                    </div>

                    {students.length === 0 ? (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-6 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" /> Add students to your roster first in the Students tab!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {students.sort((a, b) => a.rollNo.localeCompare(b.rollNo)).map(student => {
                                const submission = submissions.find(s => s.studentId === student.id);
                                return (
                                    <div key={student.id} className={`border rounded-xl p-5 relative overflow-hidden transition-all ${submission ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-zinc-800/50 border-dashed'}`}>

                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{student.name}</h3>
                                                <span className="text-xs text-zinc-500 font-mono">Roll: {student.rollNo}</span>
                                            </div>
                                            {submission?.status === "graded" && (
                                                <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded text-sm font-bold border border-emerald-500/20 flex flex-col items-center">
                                                    <span>{submission.totalMarks}/{submission.maxMarks}</span>
                                                </div>
                                            )}
                                        </div>

                                        {!submission ? (
                                            <div className="mt-4">
                                                <input
                                                    type="file"
                                                    id={`file-${student.id}`}
                                                    className="hidden"
                                                    accept=".pdf,image/*"
                                                    onChange={(e) => handleFileUpload(student.id, e)}
                                                />
                                                <label htmlFor={`file-${student.id}`} className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg cursor-pointer text-sm text-zinc-300 font-medium transition-colors">
                                                    <Upload className="w-4 h-4 text-purple-400" /> Upload Paper
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="mt-4 space-y-3">
                                                <div className="text-xs text-zinc-400 flex items-center gap-2 bg-zinc-950 p-2 rounded">
                                                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                                                    <span className="truncate">{submission.fileName}</span>
                                                </div>

                                                {submission.status === "graded" && (
                                                    <Link href={`/submissions/${submission.id}`} className="block text-center w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/20">
                                                        View Full Report
                                                    </Link>
                                                )}

                                                {submission.status === "uploaded" && (
                                                    <div className="text-center w-full py-2 bg-amber-500/10 text-amber-500 rounded-lg text-sm font-medium border border-amber-500/20">
                                                        Ready for Grading
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* REPORT TAB */}
            {activeTab === "report" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {gradedSubmissions.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            No papers have been graded yet.
                        </div>
                    ) : (
                        <>
                            {/* Stats Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                    <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2">Class Average</div>
                                    <div className="text-3xl font-bold text-white mb-1">
                                        {Math.round(gradedSubmissions.reduce((acc, sub) => acc + (sub.percentage || 0), 0) / gradedSubmissions.length)}%
                                    </div>
                                    <div className="text-xs text-zinc-500">Across {gradedSubmissions.length} graded papers</div>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                    <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2">Highest Score</div>
                                    <div className="text-3xl font-bold text-emerald-400 mb-1">
                                        {gradedSubmissions[0].percentage}%
                                    </div>
                                    <div className="text-xs text-zinc-500">By {students.find(s => s.id === gradedSubmissions[0].studentId)?.name}</div>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                    <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2">Lowest Score</div>
                                    <div className="text-3xl font-bold text-red-400 mb-1">
                                        {gradedSubmissions[gradedSubmissions.length - 1].percentage}%
                                    </div>
                                    <div className="text-xs text-zinc-500">Needs review</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Distribution Graph */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-6">Score Distribution</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={distributeBy10s()}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                <XAxis dataKey="range" stroke="#71717a" tickLine={false} axisLine={false} />
                                                <YAxis stroke="#71717a" tickLine={false} axisLine={false} allowDecimals={false} />
                                                <RechartsTooltip cursor={{ fill: '#27272a', opacity: 0.4 }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Leaderboard */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-6">Class Leaderboard</h3>
                                    <div className="space-y-3">
                                        {gradedSubmissions.map((sub, idx) => {
                                            const student = students.find(s => s.id === sub.studentId);
                                            return (
                                                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${idx === 0 ? 'bg-amber-400 text-amber-950 shadow-amber-500/20' : idx === 1 ? 'bg-zinc-300 text-zinc-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-white">{student?.name}</div>
                                                            <div className="text-xs text-zinc-500 font-mono">Roll: {student?.rollNo}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-emerald-400">{sub.percentage}%</div>
                                                        <div className="text-xs text-zinc-500">{sub.totalMarks}/{sub.maxMarks}</div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
