"use client";

import { useState, useEffect } from "react";
import { Plus, BookOpen, Edit, Trash2, Eye } from "lucide-react";
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

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newSubject, setNewSubject] = useState({
        name: "",
        description: "",
        color: "#8b5cf6", // purple-500
    });

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = () => {
        const stored = localStorage.getItem("subjects");
        if (stored) {
            setSubjects(JSON.parse(stored));
        }
    };

    const saveSubjects = (updatedSubjects: Subject[]) => {
        localStorage.setItem("subjects", JSON.stringify(updatedSubjects));
        setSubjects(updatedSubjects);
    };

    const handleCreateSubject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject.name.trim()) return;

        const subject: Subject = {
            id: Date.now().toString(),
            name: newSubject.name,
            description: newSubject.description,
            color: newSubject.color,
            createdAt: new Date().toISOString(),
            questionCount: 0,
            studentCount: 0,
        };

        const updated = [...subjects, subject];
        saveSubjects(updated);
        setNewSubject({ name: "", description: "", color: "#8b5cf6" });
        setIsCreating(false);
    };

    const handleDeleteSubject = (id: string) => {
        if (!confirm("Are you sure you want to delete this subject?")) return;
        const updated = subjects.filter((s) => s.id !== id);
        saveSubjects(updated);
    };

    const colorOptions = [
        { name: "Purple", value: "#8b5cf6" },
        { name: "Blue", value: "#3b82f6" },
        { name: "Emerald", value: "#10b981" },
        { name: "Pink", value: "#ec4899" },
        { name: "Orange", value: "#f97316" },
        { name: "Red", value: "#ef4444" },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Subjects</h1>
                    <p className="text-zinc-400">Manage your subjects and exams</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/30"
                >
                    <Plus className="w-5 h-5" />
                    New Subject
                </button>
            </div>

            {/* Create Subject Form */}
            {isCreating && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Create New Subject</h2>
                    <form onSubmit={handleCreateSubject} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Subject Name *
                            </label>
                            <input
                                type="text"
                                value={newSubject.name}
                                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                placeholder="e.g., Mathematics, Physics, Chemistry"
                                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder:text-zinc-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                value={newSubject.description}
                                onChange={(e) =>
                                    setNewSubject({ ...newSubject, description: e.target.value })
                                }
                                placeholder="Brief description of this subject"
                                rows={3}
                                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Color Theme
                            </label>
                            <div className="flex gap-3">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setNewSubject({ ...newSubject, color: color.value })}
                                        className={`w-10 h-10 rounded-lg transition-all ${newSubject.color === color.value
                                                ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                                                : "hover:scale-110"
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
                            >
                                Create Subject
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Subjects Grid */}
            {subjects.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                    <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No subjects yet</h3>
                    <p className="text-zinc-400 mb-6">
                        Create your first subject to start grading papers
                    </p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Create Subject
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((subject) => (
                        <div
                            key={subject.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all"
                        >
                            {/* Color Strip */}
                            <div
                                className="h-1 w-full rounded-full mb-4"
                                style={{ backgroundColor: subject.color }}
                            />

                            {/* Subject Info */}
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-white mb-2">{subject.name}</h3>
                                {subject.description && (
                                    <p className="text-sm text-zinc-400">{subject.description}</p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="flex gap-4 mb-4 text-sm">
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{subject.questionCount} questions</span>
                                </div>
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <Eye className="w-4 h-4" />
                                    <span>{subject.studentCount} graded</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Link
                                    href={`/subjects/${subject.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all text-sm"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </Link>
                                <button
                                    onClick={() => handleDeleteSubject(subject.id)}
                                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
