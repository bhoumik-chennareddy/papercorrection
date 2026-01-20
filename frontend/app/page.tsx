"use client";

import { useState } from "react";
import axios from "axios";
import { Upload, CheckCircle, FileText } from "lucide-react";

export default function Home() {
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
    <main className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Paper Grader</h1>
        <p className="text-gray-500 mb-8">Upload a student's answer sheet to grade it automatically.</p>

        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center mb-6 cursor-pointer hover:bg-gray-50 transition relative">
            <input type="file" onChange={handleFileChange} className="hidden" id="fileUpload" accept="image/*" />
            <label htmlFor="fileUpload" className="flex flex-col items-center cursor-pointer w-full h-full">
                <Upload className="w-12 h-12 text-blue-500 mb-4" />
                <span className="text-gray-600 font-medium">
                    {file ? file.name : "Click to Upload Answer Sheet (Image)"}
                </span>
            </label>
        </div>

        {/* Reference Answer */}
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference Answer (Teacher's Key)</label>
            <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center"
        >
            {loading ? "Grading..." : "Grade Answer"}
        </button>

        {/* Results Section */}
        {result && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center mb-4">
                    <CheckCircle className="text-green-600 w-6 h-6 mr-2" />
                    <h3 className="text-lg font-bold text-green-800">Grading Complete</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                        <span className="text-sm text-gray-500 uppercase tracking-wide">Marks Awarded</span>
                        <p className="text-3xl font-extrabold text-blue-600">{result.grade.marks} <span className="text-gray-400 text-lg">/ {result.grade.max_marks}</span></p>
                    </div>
                    <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                        <span className="text-sm text-gray-500 uppercase tracking-wide">Similarity Score</span>
                        <p className="text-3xl font-extrabold text-purple-600">{(result.grade.similarity * 100).toFixed(1)}%</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded shadow-sm border border-gray-100 mb-4">
                    <div className="flex items-center mb-2">
                        <FileText className="w-4 h-4 text-gray-400 mr-2"/>
                        <span className="text-sm font-semibold text-gray-700">Extracted Text</span>
                    </div>
                    <p className="text-gray-600 italic text-sm border-l-2 border-gray-200 pl-3">"{result.extracted_text}"</p>
                </div>
                
                <p className="text-green-800 font-medium">{result.feedback}</p>
            </div>
        )}
      </div>
    </main>
  );
}
