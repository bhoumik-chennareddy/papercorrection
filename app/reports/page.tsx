"use client";

import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Reports & Analytics</h1>
                <p className="text-zinc-400">View performance insights and export data</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <BarChart3 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Phase 6 Coming Soon</h3>
                <p className="text-zinc-400 mb-6">
                    This feature will provide detailed analytics and reporting capabilities
                </p>
                <p className="text-sm text-zinc-500">
                    You'll see student performance, question analysis, and export options
                </p>
            </div>
        </div>
    );
}
