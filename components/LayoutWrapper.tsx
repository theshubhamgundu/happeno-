"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GlassNavBar from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && user?.role === 'team' && pathname === '/') {
            router.push('/dashboard/team');
        }
    }, [user, isLoading, pathname, router]);

    const isDashboard = pathname?.startsWith("/dashboard");
    const isLogin = pathname === "/login";

    const isSpecialPage = isDashboard || isLogin || pathname === "/registrations-count" || pathname === "/livescore";

    if (isSpecialPage) {
        return <>{children}</>;
    }

    return (
        <>
            <GlassNavBar />
            {children}
            <Footer />
        </>
    );
}
