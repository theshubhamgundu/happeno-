"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && user?.role === 'team' && pathname === '/') {
            router.push('/dashboard/team');
        }
    }, [user, isLoading, pathname, router]);

    return (
        <>
            {children}
        </>
    );
}
