"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Upload, FileText, X, Check, AlertCircle, BookOpen, Users, Zap, TrendingUp } from "lucide-react";
import axios from "axios";

interface Subject {
    id: string;
    name: string;
    color: string;
    questionCount: number;
}

interface StudentFile {
    id: string;
    file: File;
    studentName: string;
    status: "pending" | "uploaded" | "error";
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
    questionResults?: any[];
}

interface Question {
    id: string;
    questionNumber: string;
    referenceAnswer: string;
    maxMarks: number;
}

interface AnswerKey {
    id: string;
    subjectId: string;
    questions: Question[];
}

function UploadsPageContent() {
    const searchParams = useSearchParams();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
    const [files, setFiles] = useState<StudentFile[]>([]);
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isGrading, setIsGrading] = useState(false);
    const [gradingProgress, setGradingProgress] = useState("");

    useEffect(() => {
        loadData();
        const subjectParam = searchParams.get("subject");
        if (subjectParam) {
            setSelectedSubjectId(subjectParam);
        }
    }, [searchParams]);

    useEffect(() => {
        if (selectedSubjectId) {
            loadSubmissionsForSubject(selectedSubjectId);
        }
    }, [selectedSubjectId]);

    const loadData = () => {
        const storedSubjects = localStorage.getItem("subjects");
        if (storedSubjects) {
            setSubjects(JSON.parse(storedSubjects));
        }

        const storedSubmissions = localStorage.getItem("studentSubmissions");
        if (storedSubmissions) {
            setSubmissions(JSON.parse(storedSubmissions));
        }
    };

    const loadSubmissionsForSubject = (subjectId: string) => {
        const storedSubmissions = localStorage.getItem("studentSubmissions");
        if (storedSubmissions) {
            const allSubmissions: StudentSubmission[] = JSON.parse(storedSubmissions);
            const filtered = allSubmissions.filter((s) => s.subjectId === subjectId);
            setSubmissions(allSubmissions);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const selectedFiles = Array.from(e.target.files);
        const newFiles: StudentFile[] = selectedFiles.map((file) => ({
            id: `${Date.now()}-${Math.random()}`,
            file: file,
            studentName: extractStudentName(file.name),
            status: "pending",
        }));

        setFiles([...files, ...newFiles]);
    };

    const extractStudentName = (filename: string): string => {
        const nameWithoutExt = filename.replace(/\.(pdf|png|jpg|jpeg)$/i, "");
        const cleaned = nameWithoutExt.replace(/_/g, " ");
        return cleaned;
    };

    const updateStudentName = (fileId: string, newName: string) => {
        setFiles(files.map((f) => (f.id === fileId ? { ...f, studentName: newName } : f)));
    };

    const removeFile = (fileId: string) => {
        setFiles(files.filter((f) => f.id !== fileId));
    };

    const handleUploadAll = async () => {
        if (!selectedSubjectId) {
            alert("Please select a subject first");
            return;
        }

        if (files.length === 0) {
            alert("No files to upload");
            return;
        }

        setIsUploading(true);

        const newSubmissions: StudentSubmission[] = [];

        for (const fileItem of files) {
            try {
                const base64 = await fileToBase64(fileItem.file);

                const submission: StudentSubmission = {
                    id: Date.now().toString() + Math.random(),
                    subjectId: selectedSubjectId,
                    studentName: fileItem.studentName,
                    fileName: fileItem.file.name,
                    fileData: base64,
                    uploadedAt: new Date().toISOString(),
                    status: "uploaded",
                };

                newSubmissions.push(submission);

                setFiles((prev) =>
                    prev.map((f) => (f.id === fileItem.id ? { ...f, status: "uploaded" } : f))
                );
            } catch (error) {
                console.error("Error uploading file:", error);
                setFiles((prev) =>
                    prev.map((f) => (f.id === fileItem.id ? { ...f, status: "error" } : f))
                );
            }
        }

        const existingSubmissions = localStorage.getItem("studentSubmissions");
        const allSubmissions = existingSubmissions
            ? [...JSON.parse(existingSubmissions), ...newSubmissions]
            : newSubmissions;

        localStorage.setItem("studentSubmissions", JSON.stringify(allSubmissions));
        setSubmissions(allSubmissions);

        updateSubjectStudentCount(selectedSubjectId, allSubmissions);

        setIsUploading(false);
        setFiles([]);
        alert(`Successfully uploaded ${newSubmissions.length} student papers!`);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const updateSubjectStudentCount = (subjectId: string, allSubmissions: StudentSubmission[]) => {
        const storedSubjects = localStorage.getItem("subjects");
        if (storedSubjects) {
            const subjects: Subject[] = JSON.parse(storedSubjects);
            const subjectSubmissions = allSubmissions.filter((s) => s.subjectId === subjectId);
            const updatedSubjects = subjects.map((s) =>
                s.id === subjectId ? { ...s, studentCount: subjectSubmissions.length } : s
            );
            localStorage.setItem("subjects", JSON.stringify(updatedSubjects));
            setSubjects(updatedSubjects);
        }
    };

    const handleGradeAll = async () => {
        if (!selectedSubjectId) {
            alert("Please select a subject");
            return;
        }

        // Get answer keys for this subject
        const storedKeys = localStorage.getItem("answerKeys");
        if (!storedKeys) {
            alert("No answer keys found. Please create answer keys first!");
            return;
        }

        const answerKeys: AnswerKey[] = JSON.parse(storedKeys);
        const subjectAnswerKey = answerKeys.find((ak) => ak.subjectId === selectedSubjectId);

        if (!subjectAnswerKey || subjectAnswerKey.questions.length === 0) {
            alert("No answer keys found for this subject. Please add answer keys first!");
            return;
        }

        // Get ungraded submissions
        const ungradedSubmissions = currentSubmissions.filter((s) => s.status === "uploaded");

        if (ungradedSubmissions.length === 0) {
            alert("No ungraded papers to process!");
            return;
        }

        setIsGrading(true);
        setGradingProgress(`Processing ${ungradedSubmissions.length} papers...`);

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

            const payload = {
                submissions: ungradedSubmissions.map((s) => ({
                    id: s.id,
                    studentName: s.studentName,
                    fileData: s.fileData,
                })),
                answerKeys: subjectAnswerKey.questions.map((q) => ({
                    questionNumber: q.questionNumber,
                    referenceAnswer: q.referenceAnswer,
                    maxMarks: q.maxMarks,
                })),
            };

            console.log("Sending to backend:", { ...payload, submissions: payload.submissions.map(s => ({ ...s, fileData: '...' })) });

            const response = await axios.post(`${API_BASE_URL}/grade-batch`, payload);

            console.log("Backend response:", response.data);

            if (response.data.status === "success") {
                const results = response.data.results;

                // Update submissions with grades
                const updatedSubmissions = submissions.map((sub) => {
                    const result = results.find((r: any) => r.submissionId === sub.id);
                    if (result && result.status === "success") {
                        return {
                            ...sub,
                            status: "graded" as const,
                            totalMarks: result.totalMarks,
                            maxMarks: result.totalMaxMarks,
                            percentage: result.percentage,
                            questionResults: result.questionResults,
                        };
                    }
                    return sub;
                });

                localStorage.setItem("studentSubmissions", JSON.stringify(updatedSubmissions));
                setSubmissions(updatedSubmissions);

                setGradingProgress("");
                alert(`Successfully graded ${results.filter((r: any) => r.status === "success").length} papers!`);
            }
        } catch (error: any) {
            console.error("Grading error:", error);
            alert(`Error grading papers: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsGrading(false);
            setGradingProgress("");
        }
    };

    const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
    const currentSubmissions = submissions.filter((s) => s.subjectId === selectedSubjectId);
    const ungradedCount = currentSubmissions.filter((s) => s.status === "uploaded").length;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Upload Student Papers</h1>
                <p className="text-zinc-400">Bulk upload student answer sheets for grading</p>
            </div>

            {/* Subject Selector */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Select Subject *
                </label>
                <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full md:w-96 p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                >
                    <option value="">Choose a subject...</option>
                    {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                            {subject.name} ({subject.questionCount} questions)
                        </option>
                    ))}
                </select>
                {selectedSubject && selectedSubject.questionCount === 0 && (
                    <div className="mt-3 flex items-center gap-2 text-amber-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>No answer keys found for this subject. Add answer keys first!</span>
                    </div>
                )}
            </div>

            {/* No subject selected */}
            {!selectedSubjectId && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                    <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Select a Subject</h3>
                    <p className="text-zinc-400">Choose a subject to upload student papers</p>
                </div>
            )}

            {/* Upload Section */}
            {selectedSubjectId && (
                <>
                    {/* File Upload Area */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: selectedSubject?.color }}
                            />
                            {selectedSubject?.name}
                        </h2>

                        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-10 mb-6 cursor-pointer hover:bg-zinc-800/50 hover:border-purple-500/50 transition-all duration-300 relative group">
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="fileUpload"
                                accept=".pdf,image/*"
                                multiple
                            />
                            <label
                                htmlFor="fileUpload"
                                className="flex flex-col items-center cursor-pointer w-full h-full"
                            >
                                <Upload className="w-12 h-12 text-purple-500 mb-4 group-hover:text-purple-400 transition-colors" />
                                <span className="text-zinc-300 font-medium mb-2">
                                    Click to Upload Student Papers
                                </span>
                                <span className="text-sm text-zinc-500">
                                    PDF or Image files • Multiple files supported
                                </span>
                            </label>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-3 mb-6">
                                {files.map((fileItem) => (
                                    <div
                                        key={fileItem.id}
                                        className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center gap-4"
                                    >
                                        <FileText className="w-8 h-8 text-blue-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-zinc-500 mb-2">{fileItem.file.name}</div>
                                            <input
                                                type="text"
                                                value={fileItem.studentName}
                                                onChange={(e) => updateStudentName(fileItem.id, e.target.value)}
                                                placeholder="Student Name"
                                                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {fileItem.status === "uploaded" && (
                                                <Check className="w-5 h-5 text-emerald-400" />
                                            )}
                                            {fileItem.status === "error" && (
                                                <AlertCircle className="w-5 h-5 text-red-400" />
                                            )}
                                            <button
                                                onClick={() => removeFile(fileItem.id)}
                                                className="p-2 hover:bg-zinc-700 rounded transition-colors"
                                            >
                                                <X className="w-4 h-4 text-zinc-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Button */}
                        {files.length > 0 && (
                            <button
                                onClick={handleUploadAll}
                                disabled={isUploading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? "Uploading..." : `Upload ${files.length} Paper${files.length !== 1 ? "s" : ""}`}
                            </button>
                        )}
                    </div>

                    {/* Grade All Button */}
                    {ungradedCount > 0 && (
                        <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-emerald-400" />
                                        Ready to Grade
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        {ungradedCount} paper{ungradedCount !== 1 ? "s" : ""} waiting for automated grading
                                    </p>
                                </div>
                                <button
                                    onClick={handleGradeAll}
                                    disabled={isGrading}
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGrading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Grading...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5" />
                                            Grade All Papers
                                        </>
                                    )}
                                </button>
                            </div>
                            {gradingProgress && (
                                <div className="mt-3 text-sm text-emerald-400">{gradingProgress}</div>
                            )}
                        </div>
                    )}

                    {/* Uploaded Papers List */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">
                            Uploaded Papers ({currentSubmissions.length})
                        </h2>

                        {currentSubmissions.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500">No papers uploaded yet</p>
                                <p className="text-sm text-zinc-600 mt-2">
                                    Upload student papers to get started
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentSubmissions.map((submission) => (
                                    <div
                                        key={submission.id}
                                        className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center justify-between hover:border-zinc-600 transition-all"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <FileText className="w-8 h-8 text-blue-400" />
                                            <div className="flex-1">
                                                <h3 className="text-white font-medium">{submission.studentName}</h3>
                                                <p className="text-sm text-zinc-500">{submission.fileName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {submission.status === "graded" && submission.totalMarks !== undefined && (
                                                <div className="text-right bg-emerald-600/20 px-3 py-2 rounded-lg">
                                                    <div className="text-emerald-400 font-bold text-lg">
                                                        {submission.totalMarks}/{submission.maxMarks}
                                                    </div>
                                                    <div className="text-xs text-emerald-400/70">
                                                        {submission.percentage}%
                                                    </div>
                                                </div>
                                            )}
                                            <div className="text-right">
                                                <div className="text-xs text-zinc-500">
                                                    {new Date(submission.uploadedAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm">
                                                    {submission.status === "uploaded" && (
                                                        <span className="text-blue-400">Uploaded</span>
                                                    )}
                                                    {submission.status === "processing" && (
                                                        <span className="text-amber-400">Processing...</span>
                                                    )}
                                                    {submission.status === "graded" && (
                                                        <span className="text-emerald-400">Graded ✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default function UploadsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-zinc-400">Loading...</div>}>
            <UploadsPageContent />
        </Suspense>
    );
}
