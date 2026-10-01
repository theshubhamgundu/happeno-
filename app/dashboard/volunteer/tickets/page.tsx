"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function VolunteerTicketsRedirect() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === 'admin') {
            router.replace('/dashboard/admin/tickets');
        } else {
            router.replace('/dashboard/volunteer');
        }
    }, [user, router]);

    return (
        <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
