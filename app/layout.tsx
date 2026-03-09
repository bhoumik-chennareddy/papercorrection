"use client";

import Sidebar from "./components/Sidebar";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { usePathname } from "next/navigation";
import { LogOut, GraduationCap } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading...</div>;
  }

  const isLoginPage = pathname === "/login";

  if (isLoginPage || !user) {
    return <main className="min-h-screen bg-zinc-950">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {user.role === "teacher" && <Sidebar />}
      {user.role === "student" && (
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 h-screen sticky top-0 flex flex-col">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Student Portal</h1>
              </div>
            </div>
            <p className="text-zinc-400 text-sm font-medium">{user.name}</p>
            <p className="text-zinc-600 text-xs font-mono">Roll No: {user.rollNo}</p>
          </div>
          <div className="flex-1 p-4">
            <div className="px-4 py-3 bg-blue-600/10 text-blue-400 rounded-lg font-medium border border-blue-500/20">
              My Submissions
            </div>
          </div>
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={logout}
              className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors w-full p-2 px-4 rounded-lg hover:bg-zinc-800"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>
      )}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute top-4 right-8 z-10">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 shadow shadow-black/20"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
