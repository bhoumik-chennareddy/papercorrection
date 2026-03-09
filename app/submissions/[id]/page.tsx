"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, FileText, Percent, Award, BookOpen, MessageSquare, HandHeart, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from "recharts";
import { useAuth } from "../../context/AuthContext";

interface RubricCriterion {
    criterion: string;
    marks: number;
    maxMarks: number;
}

interface QuestionResult {
    questionNumber: string;
    marksObtained: number;
    maxMarks: number;
    similarity: number;
    studentAnswer: string;
    referenceAnswer: string;
    feedback?: string;
    rubricBreakdown?: RubricCriterion[];
    reEvaluationStatus?: 'requested' | 'resolved';
    reEvaluationReason?: string;
}

interface StudentSubmission {
    id: string;
    classId: string;
    studentId: string;
    fileName: string;
    fileData: string; // base64
    uploadedAt: string;
    status: "uploaded" | "processing" | "graded";
    totalMarks?: number;
    maxMarks?: number;
    percentage?: number;
    overallFeedback?: string;
    questionResults?: QuestionResult[];
}

interface Class {
    id: string;
    subjectId: string;
    name: string;
}

interface Student {
    id: string;
    classId: string;
    name: string;
    rollNo: string;
}

export default function SubmissionDetail() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [submission, setSubmission] = useState<StudentSubmission | null>(null);
    const [classData, setClassData] = useState<Class | null>(null);
    const [student, setStudent] = useState<Student | null>(null);

    // Re-evaluation Form State (Student)
    const [requestQuestionNo, setRequestQuestionNo] = useState<string | null>(null);
    const [reason, setReason] = useState("");

    // Resolve Form State (Teacher)
    const [resolveQuestionNo, setResolveQuestionNo] = useState<string | null>(null);
    const [newMarks, setNewMarks] = useState<number>(0);

    useEffect(() => {
        if (params.id && user) {
            const storedSubmissions = localStorage.getItem("studentSubmissions");
            if (storedSubmissions) {
                const submissions: StudentSubmission[] = JSON.parse(storedSubmissions);
                const found = submissions.find((s) => s.id === params.id);
                if (found) {
                    if (user.role === "student" && found.studentId !== user.id) {
                        router.push("/student/dashboard");
                        return;
                    }

                    setSubmission(found);

                    // load class
                    const storedClasses = localStorage.getItem("classes");
                    if (storedClasses) {
                        const classes: Class[] = JSON.parse(storedClasses);
                        const foundClass = classes.find(c => c.id === found.classId);
                        if (foundClass) setClassData(foundClass);
                    }

                    // load student
                    const storedStudents = localStorage.getItem("students");
                    if (storedStudents) {
                        const students: Student[] = JSON.parse(storedStudents);
                        const foundStudent = students.find(s => s.id === found.studentId);
                        if (foundStudent) setStudent(foundStudent);
                    }
                }
            }
        }
    }, [params.id, user, router]);

    const handleRequestReevaluation = (questionNumber: string) => {
        if (!submission || !user) return;

        const storedSubmissions = localStorage.getItem("studentSubmissions");
        if (storedSubmissions) {
            const allSubmissions: StudentSubmission[] = JSON.parse(storedSubmissions);
            const index = allSubmissions.findIndex(s => s.id === submission.id);
            if (index !== -1 && allSubmissions[index].questionResults) {
                const qIndex = allSubmissions[index].questionResults!.findIndex(q => q.questionNumber === questionNumber);
                if (qIndex !== -1) {
                    allSubmissions[index].questionResults![qIndex].reEvaluationStatus = 'requested';
                    allSubmissions[index].questionResults![qIndex].reEvaluationReason = reason;

                    localStorage.setItem("studentSubmissions", JSON.stringify(allSubmissions));
                    setSubmission(allSubmissions[index]);
                    setRequestQuestionNo(null);
                    setReason("");
                    alert("Re-evaluation request submitted!");
                }
            }
        }
    };

    const handleResolveReevaluation = (questionNumber: string, maxMarks: number) => {
        if (!submission || !user || user.role !== "teacher") return;

        let adjustedMarks = newMarks;
        if (adjustedMarks < 0) adjustedMarks = 0;
        if (adjustedMarks > maxMarks) adjustedMarks = maxMarks;

        const storedSubmissions = localStorage.getItem("studentSubmissions");
        if (storedSubmissions) {
            const allSubmissions: StudentSubmission[] = JSON.parse(storedSubmissions);
            const index = allSubmissions.findIndex(s => s.id === submission.id);

            if (index !== -1 && allSubmissions[index].questionResults) {
                const qIndex = allSubmissions[index].questionResults!.findIndex(q => q.questionNumber === questionNumber);
                if (qIndex !== -1) {
                    allSubmissions[index].questionResults![qIndex].marksObtained = adjustedMarks;
                    allSubmissions[index].questionResults![qIndex].reEvaluationStatus = 'resolved';

                    // Update total marks and percentage
                    const totalMarks = allSubmissions[index].questionResults!.reduce((sum, q) => sum + (Number(q.marksObtained) || 0), 0);
                    const totalMaxMarks = allSubmissions[index].maxMarks || 1;
                    const percentage = Math.round((totalMarks / totalMaxMarks) * 100);

                    allSubmissions[index].totalMarks = totalMarks;
                    allSubmissions[index].percentage = percentage;

                    localStorage.setItem("studentSubmissions", JSON.stringify(allSubmissions));
                    setSubmission(allSubmissions[index]);
                    setResolveQuestionNo(null);
                    alert("Marks updated successfully!");
                }
            }
        }
    };

    if (!submission) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="text-zinc-400 animate-pulse">Loading submission details...</div>
            </div>
        );
    }

    const {
        fileName,
        fileData,
        uploadedAt,
        totalMarks,
        maxMarks,
        percentage,
        overallFeedback,
        questionResults = []
    } = submission;

    const isImage = fileData?.startsWith("data:image");

    return (
        <div className="p-8 pb-20">
            {/* Top Navigation */}
            <div className="mb-6">
                <Link
                    href={user?.role === "teacher" ? `/classes/${submission.classId}` : "/student/dashboard"}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors w-fit"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to {user?.role === "teacher" ? "Class" : "Dashboard"}</span>
                </Link>
            </div>

            {/* Header / Overview Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-white">{student?.name || "Unknown Student"}</h1>
                            {classData && (
                                <span className="px-3 py-1 text-xs font-bold text-purple-400 rounded-full bg-purple-400/10 border border-purple-400/20">
                                    {classData.name}
                                </span>
                            )}
                            {student?.rollNo && (
                                <span className="text-zinc-500 font-mono text-sm ml-2">Roll: {student.rollNo}</span>
                            )}
                        </div>
                        <p className="text-zinc-400 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {fileName} • Uploaded on {new Date(uploadedAt).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-6 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-400 mb-1 flex items-center gap-1"><Award className="w-4 h-4" /> Marks</span>
                            <span className="text-2xl font-bold text-white tracking-tight">
                                {totalMarks !== undefined ? totalMarks : "--"} <span className="text-zinc-500 text-lg">/ {maxMarks !== undefined ? maxMarks : "--"}</span>
                            </span>
                        </div>
                        <div className="w-px h-12 bg-zinc-700" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-400 mb-1 flex items-center gap-1"><Percent className="w-4 h-4" /> Score</span>
                            <span className={`text-2xl font-bold tracking-tight ${percentage !== undefined && percentage >= 80 ? 'text-emerald-400' : percentage !== undefined && percentage >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                {percentage !== undefined ? `${percentage}%` : "--"}
                            </span>
                        </div>
                    </div>
                </div>

                {overallFeedback && (
                    <div className="mt-6 pt-6 border-t border-zinc-800/80">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-1">AI Professor Feedback</h3>
                                <p className="text-zinc-200 text-lg leading-relaxed">{overallFeedback}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Score Distribution Chart */}
                {questionResults && questionResults.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-zinc-800/80">
                        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Percent className="w-4 h-4 text-purple-400" />
                            Performance Distribution by Question (%)
                        </h3>
                        <div className="h-64 w-full bg-zinc-950/50 rounded-xl p-4 border border-zinc-800">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={questionResults.map(qr => ({
                                        subject: `Q${qr.questionNumber}`,
                                        score: qr.maxMarks > 0 ? Math.round((qr.marksObtained / qr.maxMarks) * 100) : 0,
                                    }))}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                                    <XAxis dataKey="subject" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                                    <YAxis domain={[0, 100]} stroke="#a1a1aa" tick={{ fill: '#52525b', fontSize: 10 }} tickFormatter={(val) => `${val}%`} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                                        itemStyle={{ color: '#c084fc', fontWeight: 'bold' }}
                                        cursor={{ fill: '#27272a', opacity: 0.4 }}
                                        formatter={(value: any) => [`${value}%`, 'Score']}
                                    />
                                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                        {
                                            questionResults.map((qr, index) => {
                                                const score = qr.maxMarks > 0 ? (qr.marksObtained / qr.maxMarks) * 100 : 0;
                                                const color = score === 100 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                                                return <Cell key={`cell-${index}`} fill={color} />;
                                            })
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Parsed Questions & Feedback */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-purple-400" />
                        Question Breakdown & AI Feedback
                    </h2>

                    {questionResults.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
                            No question data found.
                        </div>
                    ) : (
                        questionResults.map((qr, idx) => (
                            <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-colors">
                                {/* Score Indicator Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${qr.marksObtained === qr.maxMarks ? 'bg-emerald-500' : qr.marksObtained > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-zinc-800 text-white font-bold w-10 h-10 rounded-lg flex items-center justify-center text-lg border border-zinc-700 shadow-sm">
                                            Q{qr.questionNumber}
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-bold text-white text-lg">{qr.marksObtained}</span>
                                            <span className="text-zinc-500"> / {qr.maxMarks} marks</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        {qr.marksObtained === qr.maxMarks ? (
                                            <span className="text-emerald-400 flex items-center gap-1 bg-emerald-400/10 px-2 py-1 rounded"><CheckCircle2 className="w-4 h-4" /> Perfect</span>
                                        ) : qr.marksObtained === 0 ? (
                                            <span className="text-red-400 flex items-center gap-1 bg-red-400/10 px-2 py-1 rounded"><XCircle className="w-4 h-4" /> Incorrect</span>
                                        ) : (
                                            <span className="text-amber-400 flex items-center gap-1 bg-amber-400/10 px-2 py-1 rounded"><AlertCircle className="w-4 h-4" /> Partial</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {qr.feedback && (
                                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">AI Reasoning</span>
                                            <p className="text-zinc-200 text-sm leading-relaxed">{qr.feedback}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Student's Answer</span>
                                            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 text-sm text-zinc-300 min-h-[80px]">
                                                {qr.studentAnswer || <span className="text-zinc-600 italic">No answer detected.</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Reference Answer</span>
                                            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 text-sm text-zinc-300 min-h-[80px]">
                                                {qr.referenceAnswer}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Re-evaluation Teacher Alert */}
                                    {user?.role === "teacher" && qr.reEvaluationStatus === "requested" && (
                                        <div className="mt-4 p-4 border border-amber-500/40 bg-amber-500/10 rounded-lg">
                                            <div className="flex items-center gap-2 text-amber-500 font-bold mb-2">
                                                <HandHeart className="w-5 h-5" /> RE-EVALUATION REQUESTED
                                            </div>
                                            <p className="text-zinc-300 text-sm italic mb-4">"{qr.reEvaluationReason}"</p>

                                            {resolveQuestionNo !== qr.questionNumber ? (
                                                <button
                                                    onClick={() => {
                                                        setResolveQuestionNo(qr.questionNumber);
                                                        setNewMarks(qr.marksObtained);
                                                    }}
                                                    className="w-full sm:w-auto px-4 py-2 bg-amber-500 text-amber-950 font-bold rounded shadow hover:bg-amber-400 transition"
                                                >
                                                    Update Evaluation
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded border border-zinc-800">
                                                    <div>
                                                        <label className="text-xs text-zinc-500 block mb-1">New Marks</label>
                                                        <input
                                                            type="number"
                                                            value={newMarks}
                                                            onChange={(e) => setNewMarks(Number(e.target.value))}
                                                            className="w-24 px-3 py-1.5 bg-zinc-800 text-white border border-zinc-700 rounded focus:border-amber-500 focus:outline-none"
                                                            max={qr.maxMarks}
                                                            min={0}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleResolveReevaluation(qr.questionNumber, qr.maxMarks)}
                                                        className="mt-5 px-4 py-1.5 bg-emerald-600 text-white font-medium rounded hover:bg-emerald-500 transition shadow"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setResolveQuestionNo(null)}
                                                        className="mt-5 px-4 py-1.5 text-zinc-400 hover:text-white transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Re-evaluation Student Controls */}
                                    {user?.role === "student" && (
                                        <div className="mt-4 border-t border-zinc-800/80 pt-4">
                                            {!qr.reEvaluationStatus ? (
                                                requestQuestionNo === qr.questionNumber ? (
                                                    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                                                        <label className="text-sm font-medium text-zinc-300 block mb-2">What went wrong in the evaluation?</label>
                                                        <textarea
                                                            className="w-full bg-zinc-800 border-zinc-700 text-white p-3 rounded-lg mb-3 focus:outline-none focus:border-purple-500"
                                                            rows={3}
                                                            placeholder="e.g., I used a different formula but the final answer is correct..."
                                                            value={reason}
                                                            onChange={(e) => setReason(e.target.value)}
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleRequestReevaluation(qr.questionNumber)}
                                                                disabled={!reason.trim()}
                                                                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg disabled:opacity-50 hover:bg-purple-500 transition"
                                                            >
                                                                Submit Request
                                                            </button>
                                                            <button
                                                                onClick={() => { setRequestQuestionNo(null); setReason(""); }}
                                                                className="px-4 py-2 text-zinc-400 hover:text-white transition"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setRequestQuestionNo(qr.questionNumber)}
                                                        className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
                                                    >
                                                        <HandHeart className="w-4 h-4" /> Request Re-evaluation
                                                    </button>
                                                )
                                            ) : qr.reEvaluationStatus === 'requested' ? (
                                                <div className="text-sm text-amber-400 font-medium flex items-center gap-1 bg-amber-400/10 px-3 py-2 rounded-lg border border-amber-400/20 w-fit">
                                                    <AlertCircle className="w-4 h-4" /> Re-evaluation Requested. Waiting for teacher...
                                                </div>
                                            ) : (
                                                <div className="text-sm text-emerald-400 font-medium flex items-center gap-1 bg-emerald-400/10 px-3 py-2 rounded-lg border border-emerald-400/20 w-fit">
                                                    <Check className="w-4 h-4" /> Re-evaluation Resolved
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right Column: Original Paper Preview */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-purple-400" />
                        Original Submission
                    </h2>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:sticky lg:top-8 flex flex-col min-h-[600px]">
                        {isImage ? (
                            <div className="flex-1 relative w-full h-[600px] rounded-lg overflow-hidden border border-zinc-700">
                                <Image
                                    src={fileData}
                                    alt="Student submission"
                                    fill
                                    className="object-contain bg-zinc-950"
                                />
                            </div>
                        ) : (
                            <div className="flex-1 rounded-lg overflow-hidden border border-zinc-700 flex flex-col">
                                <iframe
                                    src={fileData}
                                    className="w-full flex-1 min-h-[600px] bg-white rounded-lg"
                                    title="Student PDF"
                                />
                            </div>
                        )}
                        <p className="text-center text-sm text-zinc-500 mt-4">
                            Showing the exact document evaluated by the AI grader.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
