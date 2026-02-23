"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, FileText, Percent, Award, BookOpen, MessageSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface QuestionResult {
    questionNumber: string;
    marksObtained: number;
    maxMarks: number;
    similarity: number;
    studentAnswer: string;
    referenceAnswer: string;
    feedback?: string;
}

interface StudentSubmission {
    id: string;
    subjectId: string;
    studentName: string;
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

interface Subject {
    id: string;
    name: string;
    color: string;
}

export default function SubmissionDetail() {
    const params = useParams();
    const router = useRouter();
    const [submission, setSubmission] = useState<StudentSubmission | null>(null);
    const [subject, setSubject] = useState<Subject | null>(null);

    useEffect(() => {
        if (params.id) {
            const storedSubmissions = localStorage.getItem("studentSubmissions");
            if (storedSubmissions) {
                const submissions: StudentSubmission[] = JSON.parse(storedSubmissions);
                const found = submissions.find((s) => s.id === params.id);
                if (found) {
                    setSubmission(found);

                    // load subject
                    const storedSubjects = localStorage.getItem("subjects");
                    if (storedSubjects) {
                        const subjects: Subject[] = JSON.parse(storedSubjects);
                        const foundSubject = subjects.find(s => s.id === found.subjectId);
                        if (foundSubject) setSubject(foundSubject);
                    }
                }
            }
        }
    }, [params.id]);

    if (!submission) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="text-zinc-400 animate-pulse">Loading submission details...</div>
            </div>
        );
    }

    const {
        studentName,
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
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Uploads</span>
                </button>
            </div>

            {/* Header / Overview Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-white">{studentName}</h1>
                            {subject && (
                                <span
                                    className="px-3 py-1 text-xs font-bold text-white rounded-full bg-opacity-20 border border-opacity-30"
                                    style={{ backgroundColor: `${subject.color}20`, borderColor: subject.color, color: subject.color }}
                                >
                                    {subject.name}
                                </span>
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
                            <span className={`text-2xl font-bold tracking-tight ${percentage! >= 80 ? 'text-emerald-400' : percentage! >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
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
