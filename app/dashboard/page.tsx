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
        <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
