import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, FileText, Key, BarChart3, GraduationCap, Upload } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Subjects", href: "/subjects", icon: BookOpen },
        { name: "Answer Keys", href: "/answer-keys", icon: Key },
        { name: "Upload Papers", href: "/uploads", icon: Upload },
        { name: "Grade Papers", href: "/grade", icon: FileText },
        { name: "Reports", href: "/reports", icon: BarChart3 },
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
                        <p className="text-zinc-500 text-xs">Smart Exam System</p>
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
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
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
