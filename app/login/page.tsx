"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Users, UserCircle2, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [role, setRole] = useState<"teacher" | "student" | null>(null);
    const [teacherUsername, setTeacherUsername] = useState("");
    const [studentName, setStudentName] = useState("");
    const [studentRollNo, setStudentRollNo] = useState("");
    const [error, setError] = useState("");

    const handleTeacherLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherUsername.trim()) {
            setError("Please enter a username");
            return;
        }
        login({ role: "teacher", username: teacherUsername });
    };

    const handleStudentLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!studentName.trim() || !studentRollNo.trim()) {
            setError("Please enter both Name and Roll Number");
            return;
        }

        const storedStudents = localStorage.getItem("students");
        if (!storedStudents) {
            setError("No students found in the system. Please ask your teacher to add you.");
            return;
        }

        const students: any[] = JSON.parse(storedStudents);
        const matchedStudent = students.find(
            (s) =>
                s.name.toLowerCase() === studentName.trim().toLowerCase() &&
                String(s.rollNo).trim() === studentRollNo.trim()
        );

        if (matchedStudent) {
            login({
                role: "student",
                id: matchedStudent.id,
                name: matchedStudent.name,
                rollNo: matchedStudent.rollNo,
            });
        } else {
            setError("Invalid Name or Roll Number. Please ensure it exactly matches what your teacher provided.");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="flex flex-col items-center justify-center mb-10">
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-2xl mb-4 shadow-lg shadow-purple-500/20">
                        <GraduationCap className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">AI Grader</h1>
                    <p className="text-zinc-500 text-center">Smart Exam System for Teachers and Students</p>
                </div>

                {!role ? (
                    <div className="space-y-4">
                        <button
                            onClick={() => setRole("teacher")}
                            className="w-full flex items-center justify-between p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-purple-500/50 hover:bg-zinc-800 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-purple-500/10 p-3 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                    <UserCircle2 className="w-8 h-8 text-purple-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-white mb-1">I am a Teacher</h3>
                                    <p className="text-zinc-500 text-sm">Manage classes, papers, and grades</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                        </button>

                        <button
                            onClick={() => setRole("student")}
                            className="w-full flex items-center justify-between p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-blue-500/50 hover:bg-zinc-800 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/10 p-3 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <Users className="w-8 h-8 text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-white mb-1">I am a Student</h3>
                                    <p className="text-zinc-500 text-sm">View your answer papers and feedback</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                        </button>
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 relative">
                        <button
                            onClick={() => {
                                setRole(null);
                                setError("");
                            }}
                            className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors text-sm font-medium"
                        >
                            Back
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">
                            {role === "teacher" ? "Teacher Login" : "Student Login"}
                        </h2>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        {role === "teacher" ? (
                            <form onSubmit={handleTeacherLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                                    <input
                                        type="text"
                                        value={teacherUsername}
                                        onChange={(e) => setTeacherUsername(e.target.value)}
                                        placeholder="Enter any username..."
                                        className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all"
                                >
                                    Continue to Dashboard
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleStudentLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={studentName}
                                        onChange={(e) => setStudentName(e.target.value)}
                                        placeholder="e.g. John Doe"
                                        className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Roll Number</label>
                                    <input
                                        type="text"
                                        value={studentRollNo}
                                        onChange={(e) => setStudentRollNo(e.target.value)}
                                        placeholder="e.g. 101"
                                        className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                                >
                                    View My Results
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
