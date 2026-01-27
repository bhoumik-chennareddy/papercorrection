"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, TrendingUp, Users, FileCheck } from "lucide-react";
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

export default function Dashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalGraded, setTotalGraded] = useState(0);

  useEffect(() => {
    // Load subjects from localStorage
    const stored = localStorage.getItem("subjects");
    if (stored) {
      const parsedSubjects: Subject[] = JSON.parse(stored);
      setSubjects(parsedSubjects);
      const total = parsedSubjects.reduce((sum, s) => sum + s.studentCount, 0);
      setTotalGraded(total);
    }
  }, []);

  const stats = [
    { label: "Total Subjects", value: subjects.length, icon: BookOpen, color: "purple" },
    { label: "Papers Graded", value: totalGraded, icon: FileCheck, color: "blue" },
    { label: "Total Questions", value: subjects.reduce((sum, s) => sum + s.questionCount, 0), icon: TrendingUp, color: "emerald" },
    { label: "Total Students", value: subjects.reduce((sum, s) => sum + s.studentCount, 0), icon: Users, color: "pink" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-400">Welcome back! Here's your grading overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-${stat.color}-600/20 p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-500`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-zinc-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/subjects"
            className="flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all border border-zinc-700 hover:border-purple-500/50"
          >
            <Plus className="w-5 h-5 text-purple-500" />
            <span className="text-white font-medium">Create New Subject</span>
          </Link>
          <Link
            href="/grade"
            className="flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all border border-zinc-700 hover:border-blue-500/50"
          >
            <FileCheck className="w-5 h-5 text-blue-500" />
            <span className="text-white font-medium">Grade Papers</span>
          </Link>
          <Link
            href="/answer-keys"
            className="flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all border border-zinc-700 hover:border-emerald-500/50"
          >
            <BookOpen className="w-5 h-5 text-emerald-500" />
            <span className="text-white font-medium">Manage Answer Keys</span>
          </Link>
        </div>
      </div>

      {/* Recent Subjects */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Subjects</h2>
        {subjects.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 mb-4">No subjects created yet</p>
            <Link
              href="/subjects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Your First Subject
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.slice(0, 5).map((subject) => (
              <Link
                key={subject.id}
                href={`/subjects/${subject.id}`}
                className="flex items-center justify-between p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all border border-zinc-700 hover:border-purple-500/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div>
                    <h3 className="text-white font-medium">{subject.name}</h3>
                    {subject.description && (
                      <p className="text-sm text-zinc-500">{subject.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-zinc-400">
                  <span>{subject.questionCount} questions</span>
                  <span>{subject.studentCount} students</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
