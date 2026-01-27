"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Upload, Key, Users, Trash2 } from "lucide-react";
import Link from "next/link";

interface Subject {
    id: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    createdAt: string;
    questionCount: number;
    studentCount: number;
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
    subjectId: string;
    questions: Question[];
}

export default function SubjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [subject, setSubject] = useState<Subject | null>(null);
    const [questionCount, setQuestionCount] = useState(0);

    useEffect(() => {
        const stored = localStorage.getItem("subjects");
        if (stored) {
            const subjects: Subject[] = JSON.parse(stored);
            const found = subjects.find((s) => s.id === params.id);
            if (found) {
                setSubject(found);
                loadQuestionCount(found.id);
            } else {
                router.push("/subjects");
            }
        }
    }, [params.id, router]);

    const loadQuestionCount = (subjectId: string) => {
        const storedKeys = localStorage.getItem("answerKeys");
        if (storedKeys) {
            const answerKeys: AnswerKey[] = JSON.parse(storedKeys);
            const answerKey = answerKeys.find((ak) => ak.subjectId === subjectId);
            setQuestionCount(answerKey?.questions.length || 0);
        }
    };

    if (!subject) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="text-zinc-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Back Button */}
            <Link
                href="/subjects"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Subjects
            </Link>

            {/* Subject Header */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
                <div
                    className="h-2 w-full rounded-full mb-6"
                    style={{ backgroundColor: subject.color }}
                />
                <h1 className="text-4xl font-bold text-white mb-2">{subject.name}</h1>
                {subject.description && (
                    <p className="text-zinc-400 mb-4">{subject.description}</p>
                )}
                <div className="flex gap-6 text-sm text-zinc-400">
                    <span>Created: {new Date(subject.createdAt).toLocaleDateString()}</span>
                    <span>{questionCount} Questions</span>
                    <span>{subject.studentCount} Students Graded</span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link
                    href={`/answer-keys?subject=${subject.id}`}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all group"
                >
                    <div className="bg-purple-600/20 p-3 rounded-lg w-fit mb-4 group-hover:bg-purple-600/30 transition-all">
                        <Key className="w-6 h-6 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Answer Keys</h3>
                    <p className="text-sm text-zinc-400 mb-4">
                        Manage reference answers for grading
                    </p>
                    <span className="text-purple-400 text-sm font-medium">
                        {questionCount} question{questionCount !== 1 ? "s" : ""} →
                    </span>
                </Link>

                <Link
                    href={`/uploads?subject=${subject.id}`}
                    className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-all group ${questionCount === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:border-blue-500/50"
                        }`}
                >
                    <div className={`bg-blue-600/20 p-3 rounded-lg w-fit mb-4 ${questionCount > 0 ? "group-hover:bg-blue-600/30" : ""} transition-all`}>
                        <Upload className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Upload Papers</h3>
                    <p className="text-sm text-zinc-400 mb-4">
                        Bulk upload student answer sheets
                    </p>
                    <span className={`text-sm font-medium ${questionCount === 0 ? "text-zinc-500" : "text-blue-400"}`}>
                        {questionCount === 0 ? "Add answer keys first" : `${subject.studentCount} uploaded →`}
                    </span>
                </Link>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 opacity-50 cursor-not-allowed">
                    <div className="bg-emerald-600/20 p-3 rounded-lg w-fit mb-4">
                        <Users className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">View Results</h3>
                    <p className="text-sm text-zinc-400 mb-4">
                        See graded papers and analytics
                    </p>
                    <span className="text-zinc-500 text-sm font-medium">Phase 6 - Coming soon...</span>
                </div>
            </div>

            {/* Graded Papers (Placeholder) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Graded Papers</h2>
                {questionCount === 0 ? (
                    <div className="text-center py-12">
                        <Key className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 mb-2">No answer keys created yet</p>
                        <p className="text-sm text-zinc-600">
                            Add answer keys first to start grading student papers
                        </p>
                        <Link
                            href={`/answer-keys?subject=${subject.id}`}
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
                        >
                            <Key className="w-4 h-4" />
                            Create Answer Keys
                        </Link>
                    </div>
                ) : subject.studentCount === 0 ? (
                    <div className="text-center py-12">
                        <Upload className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 mb-2">No papers uploaded yet</p>
                        <p className="text-sm text-zinc-600 mb-4">
                            Upload student papers to start grading
                        </p>
                        <Link
                            href={`/uploads?subject=${subject.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Papers
                        </Link>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 mb-2">{subject.studentCount} papers uploaded</p>
                        <p className="text-sm text-zinc-600">
                            Automated grading coming in Phase 4-5
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
