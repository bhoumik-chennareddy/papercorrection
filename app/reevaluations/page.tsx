"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, FileText, ArrowRight, UserCircle2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface PendingRequest {
    subId: string;
    classId: string;
    studentId: string;
    studentName: string;
    className: string;
    questionNumber: string;
    reason: string;
    marksObtained: number;
    maxMarks: number;
}

export default function ReEvaluationsPage() {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

    useEffect(() => {
        if (!user || user.role !== "teacher") return;

        const storedSubmissions = localStorage.getItem("studentSubmissions");
        const storedClasses = localStorage.getItem("classes");
        const storedStudents = localStorage.getItem("students");

        if (storedSubmissions && storedClasses && storedStudents) {
            const submissions = JSON.parse(storedSubmissions);
            const classes = JSON.parse(storedClasses);
            const students = JSON.parse(storedStudents);

            const requests: PendingRequest[] = [];

            submissions.forEach((sub: any) => {
                if (sub.questionResults) {
                    sub.questionResults.forEach((qr: any) => {
                        if (qr.reEvaluationStatus === "requested") {
                            const student = students.find((s: any) => s.id === sub.studentId);
                            const cls = classes.find((c: any) => c.id === sub.classId);

                            requests.push({
                                subId: sub.id,
                                classId: sub.classId,
                                studentId: sub.studentId,
                                studentName: student ? student.name : "Unknown Student",
                                className: cls ? cls.name : "Unknown Class",
                                questionNumber: qr.questionNumber,
                                reason: qr.reEvaluationReason,
                                marksObtained: qr.marksObtained,
                                maxMarks: qr.maxMarks,
                            });
                        }
                    });
                }
            });

            setPendingRequests(requests);
        }
    }, [user]);

    if (!user || user.role !== "teacher") return null;

    return (
        <div className="p-8 pb-32">
            <div className="mb-8 flex items-center gap-4">
                <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Re-evaluation Requests</h1>
                    <p className="text-zinc-400">Review and resolve manual mark adjustments requested by students.</p>
                </div>
            </div>

            {pendingRequests.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-16 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500/50 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">All Caught Up!</h3>
                    <p className="text-zinc-400">There are no pending re-evaluation requests at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pendingRequests.map((req, idx) => (
                        <div key={`${req.subId}-${req.questionNumber}-${idx}`} className="bg-zinc-900 border border-amber-500/30 rounded-xl overflow-hidden shadow-lg shadow-amber-500/5 flex flex-col group">
                            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/30">
                                <div className="flex items-center gap-3">
                                    <UserCircle2 className="w-8 h-8 text-zinc-500" />
                                    <div>
                                        <h3 className="text-white font-bold">{req.studentName}</h3>
                                        <p className="text-xs text-zinc-500">{req.className}</p>
                                    </div>
                                </div>
                                <div className="bg-zinc-800 px-3 py-1 rounded text-white font-bold border border-zinc-700">
                                    Q{req.questionNumber}
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-2">Student's Reason</span>
                                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-lg text-zinc-300 text-sm italic mb-6 min-h-[80px]">
                                    "{req.reason}"
                                </div>

                                <div className="flex justify-between items-center mt-auto">
                                    <div className="text-sm text-zinc-400">
                                        Current Marks: <span className="font-bold text-white">{req.marksObtained} / {req.maxMarks}</span>
                                    </div>
                                    <Link
                                        href={`/submissions/${req.subId}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-lg transition-colors shadow-sm"
                                    >
                                        Review <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
