"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface User {
    role: "teacher" | "student";
    username?: string; // For teacher
    name?: string;     // For student
    rollNo?: string;   // For student
    id?: string;       // For student
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (!user && pathname !== "/login") {
                router.push("/login");
            } else if (user && pathname === "/login") {
                if (user.role === "teacher") {
                    router.push("/");
                } else {
                    router.push("/student/dashboard");
                }
            }
        }
    }, [user, isLoading, pathname, router]);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem("currentUser", JSON.stringify(userData));
        if (userData.role === "teacher") {
            router.push("/");
        } else {
            router.push("/student/dashboard");
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("currentUser");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
