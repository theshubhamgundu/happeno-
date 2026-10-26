"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type Role = 'team' | 'judge' | 'volunteer' | 'admin' | 'livescore' | null;

interface AuthContextType {
    user: { role: Role; id?: string; teamId?: string; name?: string; portalMode?: 'edit' | 'event' | 'closed' } | null;
    login: (role: Role, data?: { id?: string; teamId?: string; name?: string; portalMode?: 'edit' | 'event' | 'closed' }) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<{ role: Role; id?: string; teamId?: string; name?: string; portalMode?: 'edit' | 'event' | 'closed' } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

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
                        name: session.name,
                        portalMode: session.portalMode
                    });
                }
            })
            .catch(error => console.error('Session restore failed:', error))
            .finally(() => {
                if (active) setIsLoading(false);
            });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (user?.role !== 'team') return;

        let active = true;
        const refreshPortalMode = async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const response = await fetch('/api/auth/session', { cache: 'no-store' });
                if (!response.ok) {
                    if (active) {
                        setUser(null);
                        router.replace('/login');
                    }
                    return;
                }

                const session = await response.json();
                if (!active) return;
                if (!session?.authenticated) {
                    setUser(null);
                    router.replace('/login');
                    return;
                }
                if (session.role !== 'team') return;
                const portalMode = session.portalMode as 'edit' | 'event' | 'closed';
                setUser(current => {
                    if (current?.role !== 'team' || current.portalMode === portalMode) return current;
                    return { ...current, portalMode };
                });

                if (portalMode === 'closed' && pathname.startsWith('/dashboard/team')) {
                    setUser(null);
                    router.replace('/login');
                } else if (portalMode === 'edit' && pathname.startsWith('/dashboard/team')) {
                    // Do not force redirect to help anymore
                }
            } catch (error) {
                console.error('Participant portal mode refresh failed:', error);
            }
        };

        void refreshPortalMode();
        const interval = setInterval(() => void refreshPortalMode(), 300000);
        window.addEventListener('focus', refreshPortalMode);
        return () => {
            active = false;
            clearInterval(interval);
            window.removeEventListener('focus', refreshPortalMode);
        };
    }, [user?.role, pathname, router]);

    const login = (role: Role, data?: { id?: string; teamId?: string; name?: string; portalMode?: 'edit' | 'event' | 'closed' }) => {
        setUser({ role, ...data });
        const destination = role === 'team' && data?.portalMode === 'edit'
            ? '/help'
            : `/dashboard/${role}`;
        router.push(destination);
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
