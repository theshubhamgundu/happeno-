"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardRedirect() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (user && user.role) {
                router.push(`/dashboard/${user.role}`);
            } else {
                router.push("/login");
            }
        }
    }, [user, isLoading, router]);

    return (
        <div className="min-h-screen bg-[#06000D] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
