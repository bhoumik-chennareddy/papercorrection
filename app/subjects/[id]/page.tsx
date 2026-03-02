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
    const [classes, setClasses] = useState<any[]>([]);
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [newClassName, setNewClassName] = useState("");

    useEffect(() => {
        const storedSubjects = localStorage.getItem("subjects");
        if (storedSubjects) {
            const subjects: Subject[] = JSON.parse(storedSubjects);
            const found = subjects.find((s) => s.id === params.id);
            if (found) {
                setSubject(found);
                loadClasses(found.id);
            } else {
                router.push("/subjects");
            }
        }
    }, [params.id, router]);

    const loadClasses = (subjectId: string) => {
        const storedClasses = localStorage.getItem("classes");
        if (storedClasses) {
            const allClasses: any[] = JSON.parse(storedClasses);
            setClasses(allClasses.filter((c) => c.subjectId === subjectId));
        }
    };

    const handleCreateClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim() || !subject) return;

        const newClass = {
            id: Date.now().toString(),
            subjectId: subject.id,
            name: newClassName,
            studentCount: 0,
            createdAt: new Date().toISOString(),
        };

        const storedClasses = localStorage.getItem("classes");
        const allClasses = storedClasses ? JSON.parse(storedClasses) : [];
        const updatedClasses = [...allClasses, newClass];

        localStorage.setItem("classes", JSON.stringify(updatedClasses));
        setClasses([...classes, newClass]);
        setNewClassName("");
        setIsCreatingClass(false);
    };

    const handleDeleteClass = (classId: string) => {
        if (!confirm("Are you sure you want to delete this class? This will also remove all its students, answer keys, and submissions.")) return;

        const storedClasses = localStorage.getItem("classes");
        if (storedClasses) {
            const allClasses: any[] = JSON.parse(storedClasses);
            const updatedClasses = allClasses.filter((c) => c.id !== classId);
            localStorage.setItem("classes", JSON.stringify(updatedClasses));
            setClasses(classes.filter((c) => c.id !== classId));
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: subject.color }}
                        />
                        <h1 className="text-4xl font-bold text-white">{subject.name}</h1>
                    </div>
                    {subject.description && (
                        <p className="text-zinc-400">{subject.description}</p>
                    )}
                </div>
                <button
                    onClick={() => setIsCreatingClass(!isCreatingClass)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/30"
                >
                    <Users className="w-5 h-5" />
                    New Class
                </button>
            </div>

            {/* Create Class Form */}
            {isCreatingClass && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Create New Class/Section</h2>
                    <form onSubmit={handleCreateClass} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Class Name *
                            </label>
                            <input
                                type="text"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="e.g., Section A, 10th Grade"
                                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder:text-zinc-500"
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
                            >
                                Create Class
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreatingClass(false)}
                                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Classes Grid */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    Classes & Sections
                </h2>

                {classes.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 mb-4">No classes created for this subject yet.</p>
                        <button
                            onClick={() => setIsCreatingClass(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
                        >
                            <Users className="w-4 h-4" />
                            Create Your First Class
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((c) => (
                            <Link
                                href={`/classes/${c.id}`}
                                key={c.id}
                                className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 hover:border-purple-500/50 transition-all block group relative"
                            >
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent navigating to class page
                                            handleDeleteClass(c.id);
                                        }}
                                        className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Class"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-4 pr-10">{c.name}</h3>
                                <div className="flex gap-4 mb-4 text-sm">
                                    <div className="flex items-center gap-1 text-zinc-400">
                                        <Users className="w-4 h-4" />
                                        <span>{c.studentCount} students</span>
                                    </div>
                                </div>
                                <div className="text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                    Manage Class <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
