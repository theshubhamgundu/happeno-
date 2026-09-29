"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Role = 'team' | 'judge' | 'volunteer' | 'admin' | 'livescore' | null;

interface AuthContextType {
    user: { role: Role; id?: string; teamId?: string; name?: string } | null;
    login: (role: Role, data?: { id?: string; teamId?: string; name?: string }) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<{ role: Role; id?: string; teamId?: string; name?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let active = true;
        fetch('/api/auth/session', { cache: 'no-store' })
            .then(async response => response.ok ? response.json() : null)
            .then(session => {
                if (active && session?.authenticated) {
                    setUser({
                        role: session.role as Role,
                        id: session.id,
                        teamId: session.teamId,
                        name: session.name
                    });
                }
            })
            .catch(error => console.error('Session restore failed:', error))
            .finally(() => {
                if (active) setIsLoading(false);
            });
        return () => { active = false; };
    }, []);

    const login = (role: Role, data?: { id?: string; teamId?: string; name?: string }) => {
        setUser({ role, ...data });
        router.push(`/dashboard/${role}`);
    };

    const logout = () => {
        void fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
            setUser(null);
            router.push('/login');
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
