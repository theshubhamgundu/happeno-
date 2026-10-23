"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading } = useAuth();

    // Keep homepage accessible to everyone
    useEffect(() => {
        // No forced redirect away from homepage
    }, [user, isLoading, pathname, router]);

    return (
        <>
            {children}
        </>
    );
}
