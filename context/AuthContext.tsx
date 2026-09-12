"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Role = 'team' | 'judge' | 'volunteer' | 'admin' | null;

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
        const savedRole = localStorage.getItem("tricity_role") as Role;
        const savedId = localStorage.getItem("tricity_id");
        const savedTeamId = localStorage.getItem("tricity_team_id");
        const savedName = localStorage.getItem("tricity_name");

        if (savedRole) {
            setUser({
                role: savedRole,
                id: savedId || undefined,
                teamId: savedTeamId || undefined,
                name: savedName || undefined
            });
        }
        setIsLoading(false);
    }, []);

    const login = (role: Role, data?: { id?: string; teamId?: string; name?: string }) => {
        localStorage.setItem("tricity_role", role as string);
        if (data?.id) localStorage.setItem("tricity_id", data.id);
        if (data?.teamId) localStorage.setItem("tricity_team_id", data.teamId);
        if (data?.name) localStorage.setItem("tricity_name", data.name);

        setUser({ role, ...data });
        router.push(`/dashboard/${role}`);
    };

    const logout = () => {
        localStorage.removeItem("tricity_role");
        localStorage.removeItem("tricity_id");
        localStorage.removeItem("tricity_team_id");
        localStorage.removeItem("tricity_name");
        setUser(null);
        router.push("/login");
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
