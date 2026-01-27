"use client";

import { useState } from "react";
import axios from "axios";
import { Upload, CheckCircle, FileText } from "lucide-react";

export default function GradePage() {
    const [file, setFile] = useState<File | null>(null);
    const [reference, setReference] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // 1. Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // 2. Submit for Grading (CORRECTED FOR FILE UPLOAD)
    const handleGrade = async () => {
        if (!file || !reference) return alert("Please upload a file and provide a reference answer.");

        setLoading(true);
        setResult(null); // Reset previous results

        try {
            // Create a FormData object to send the file + text
            const formData = new FormData();
            formData.append("file", file);
            formData.append("reference_answer", reference);
            formData.append("max_marks", "5");

            // Send to the backend
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
            const response = await axios.post(`${apiBaseUrl}/grade`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setResult(response.data);
        } catch (error) {
            console.error(error);
            alert("Error grading paper. Check if backend is running!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full bg-zinc-900 rounded-xl shadow-2xl shadow-purple-500/10 border border-zinc-800 p-8">
                <h1 className="text-3xl font-bold text-white mb-2">Grade Single Paper</h1>
                <p className="text-zinc-400 mb-8">Upload a student's answer sheet to grade it automatically.</p>

                {/* Upload Section */}
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-10 flex flex-col items-center justify-center mb-6 cursor-pointer hover:bg-zinc-800/50 hover:border-purple-500/50 transition-all duration-300 relative group">
                    <input type="file" onChange={handleFileChange} className="hidden" id="fileUpload" accept="image/*" />
                    <label htmlFor="fileUpload" className="flex flex-col items-center cursor-pointer w-full h-full">
                        <Upload className="w-12 h-12 text-purple-500 mb-4 group-hover:text-purple-400 transition-colors" />
                        <span className="text-zinc-300 font-medium">
                            {file ? file.name : "Click to Upload Answer Sheet (Image)"}
                        </span>
                    </label>
                </div>

                {/* Reference Answer */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Reference Answer (Teacher's Key)</label>
                    <textarea
                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder:text-zinc-500"
                        rows={4}
                        placeholder="Enter the correct answer here..."
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                    />
                </div>

                {/* Grade Button */}
                <button
                    onClick={handleGrade}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Grading..." : "Grade Answer"}
                </button>

                {/* Results Section */}
                {result && (
                    <div className="mt-8 p-6 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-700/50 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500 backdrop-blur-sm">
                        <div className="flex items-center mb-4">
                            <CheckCircle className="text-emerald-400 w-6 h-6 mr-2" />
                            <h3 className="text-lg font-bold text-emerald-300">Grading Complete</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-zinc-800/80 p-4 rounded shadow-sm border border-zinc-700">
                                <span className="text-sm text-zinc-400 uppercase tracking-wide">Marks Awarded</span>
                                <p className="text-3xl font-extrabold text-blue-400">{result.grade.marks} <span className="text-zinc-500 text-lg">/ {result.grade.max_marks}</span></p>
                            </div>
                            <div className="bg-zinc-800/80 p-4 rounded shadow-sm border border-zinc-700">
                                <span className="text-sm text-zinc-400 uppercase tracking-wide">Similarity Score</span>
                                <p className="text-3xl font-extrabold text-purple-400">{(result.grade.similarity * 100).toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="bg-zinc-800/80 p-4 rounded shadow-sm border border-zinc-700 mb-4">
                            <div className="flex items-center mb-2">
                                <FileText className="w-4 h-4 text-zinc-400 mr-2" />
                                <span className="text-sm font-semibold text-zinc-300">Extracted Text</span>
                            </div>
                            <p className="text-zinc-300 italic text-sm border-l-2 border-purple-500/50 pl-3">"{result.extracted_text}"</p>
                        </div>

                        <p className="text-emerald-300 font-medium">{result.feedback}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
