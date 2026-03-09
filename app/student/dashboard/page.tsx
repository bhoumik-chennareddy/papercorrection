"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { FileText, Calendar, CheckCircle2, Award, ArrowRight } from "lucide-react";

interface Subject {
    id: string;
    name: string;
    color: string;
}

interface Class {
    id: string;
    subjectId: string;
    name: string;
}

interface StudentSubmission {
    id: string;
    classId: string;
    studentId: string;
    fileName: string;
    uploadedAt: string;
    status: "uploaded" | "processing" | "graded";
    totalMarks?: number;
    maxMarks?: number;
    percentage?: number;
}

export default function StudentDashboard() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        if (!user || user.role !== "student") return;

        const storedSubmissions = localStorage.getItem("studentSubmissions");
        if (storedSubmissions) {
            const allSubmissions: StudentSubmission[] = JSON.parse(storedSubmissions);
            setSubmissions(allSubmissions.filter((s) => s.studentId === user.id));
        }

        const storedClasses = localStorage.getItem("classes");
        if (storedClasses) {
            setClasses(JSON.parse(storedClasses));
        }

        const storedSubjects = localStorage.getItem("subjects");
        if (storedSubjects) {
            setSubjects(JSON.parse(storedSubjects));
        }
    }, [user]);

    if (!user || user.role !== "student") return null;

    const gradedSubmissions = submissions.filter((s) => s.status === "graded");
    const pendingSubmissions = submissions.filter((s) => s.status !== "graded");

    const getClassName = (classId: string) => classes.find((c) => c.id === classId)?.name || "Unknown Class";
    const getSubjectNameAndColor = (classId: string) => {
        const classObj = classes.find((c) => c.id === classId);
        const subjectObj = subjects.find((s) => s.id === classObj?.subjectId);
        return {
            name: subjectObj?.name || "Unknown Subject",
            color: subjectObj?.color || "#8b5cf6",
        };
    };

    return (
        <div className="p-8 pb-32">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Welcome, {user.name}!</h1>
                <p className="text-zinc-400">Here are your graded papers and recent submissions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-500/10 p-2 rounded-lg">
                            <Award className="w-5 h-5 text-purple-500" />
                        </div>
                        <h3 className="text-zinc-400 font-medium">Graded Papers</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{gradedSubmissions.length}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-amber-500/10 p-2 rounded-lg">
                            <Calendar className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="text-zinc-400 font-medium">Pending Grading</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{pendingSubmissions.length}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-zinc-400 font-medium">Average Score</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {gradedSubmissions.length > 0
                            ? Math.round(
                                gradedSubmissions.reduce((acc, sub) => acc + (sub.percentage || 0), 0) /
                                gradedSubmissions.length
                            ) + "%"
                            : "N/A"}
                    </p>
                </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-6">Your Graded Papers</h2>
            {gradedSubmissions.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    No graded papers available yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gradedSubmissions
                        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                        .map((sub) => {
                            const { name: subjectName, color } = getSubjectNameAndColor(sub.classId);
                            return (
                                <div
                                    key={sub.id}
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group flex flex-col"
                                >
                                    <div className="h-2 w-full" style={{ backgroundColor: color }} />
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{subjectName}</h3>
                                                <p className="text-sm text-zinc-500">{getClassName(sub.classId)}</p>
                                            </div>
                                            <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-lg font-bold border border-emerald-500/20">
                                                {sub.percentage}%
                                            </div>
                                        </div>
                                        <div className="text-sm text-zinc-400 mb-6 flex-1 flex flex-col justify-end">
                                            <div className="flex justify-between mb-1">
                                                <span>Marks:</span>
                                                <span className="text-white font-medium">{sub.totalMarks} / {sub.maxMarks}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Date:</span>
                                                <span>{new Date(sub.uploadedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/submissions/${sub.id}`}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 group-hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700 font-medium"
                                        >
                                            View Report <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            {pendingSubmissions.length > 0 && (
                <>
                    <h2 className="text-xl font-bold text-white mt-12 mb-6">Pending Papers</h2>
                    <div className="space-y-3">
                        {pendingSubmissions.map((sub) => {
                            const { name: subjectName, color } = getSubjectNameAndColor(sub.classId);
                            return (
                                <div key={sub.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                        <div>
                                            <h4 className="text-white font-medium">{subjectName} - {getClassName(sub.classId)}</h4>
                                            <span className="text-xs text-zinc-500">Uploaded {new Date(sub.uploadedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-amber-500/10 text-amber-500 text-sm rounded font-medium border border-amber-500/20">
                                        Pending Grading
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
