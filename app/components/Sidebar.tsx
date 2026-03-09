import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, BookOpen, FileText, BarChart3, GraduationCap, AlertCircle, Upload } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const [pendingCount, setPendingCount] = useState(0);

    // Re-check pending requests when pathname changes (simulating real-time local updates)
    useEffect(() => {
        const storedSubmissions = localStorage.getItem("studentSubmissions");
        if (storedSubmissions) {
            const submissions = JSON.parse(storedSubmissions);
            let count = 0;
            submissions.forEach((sub: any) => {
                if (sub.questionResults) {
                    const pending = sub.questionResults.filter((qr: any) => qr.reEvaluationStatus === 'requested').length;
                    count += pending;
                }
            });
            setPendingCount(count);
        }
    }, [pathname]);

    const navItems = [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Subjects", href: "/subjects", icon: BookOpen },
        { name: "Grade Papers", href: "/grade", icon: FileText },
        { name: "Bulk Upload", href: "/uploads", icon: Upload },
        { name: "Reports", href: "/reports", icon: BarChart3 },
        { name: "Re-evaluations", href: "/reevaluations", icon: AlertCircle, badge: pendingCount },
    ];

    const isActive = (href: string) => {
        if (href === "/") return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 h-screen sticky top-0 flex flex-col">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg">AI Grader</h1>
                        <p className="text-zinc-500 text-xs">Teacher Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${active
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </div>
                            {item.badge !== undefined && item.badge > 0 && (
                                <div className={`px-2 py-0.5 text-xs font-bold rounded-full ${active ? 'bg-white text-purple-600' : 'bg-amber-500 text-white'}`}>
                                    {item.badge}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 text-center">
                    Powered by AI
                </div>
            </div>
        </aside>
    );
}
