"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Home, LayoutDashboard } from "lucide-react";
import { useHackathon } from "@/context/HackathonContext";

import { teamSupabase as supabase } from "@/lib/supabase";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

const SuccessContent = () => {
    const searchParams = useSearchParams();
    const transactionId = searchParams.get('transactionId');
    const { registerTeam } = useHackathon();
    const [registration, setRegistration] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchDetails() {
            if (!transactionId) return;

            try {
                const { data, error } = await supabase
                    .from('registrations')
                    .select('*')
                    .eq('transaction_id', transactionId)
                    .single();

                if (data) {
                    setRegistration(data);
                    // Also update context if local storage was used
                    const pendingKey = `pending_registration_${transactionId}`;
                    const pendingData = localStorage.getItem(pendingKey);
                    if (pendingData) {
                        const parsed = JSON.parse(pendingData);
                        registerTeam(parsed);
                        localStorage.removeItem(pendingKey);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch registration success details:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchDetails();
    }, [transactionId, registerTeam]);

    if (loading) {
        return <div className="min-h-screen bg-[#0B0114] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#FFEE00] border-t-transparent rounded-full animate-spin" />
        </div>;
    }

    return (
        <div className="min-h-screen bg-[#0B0114] flex items-center justify-center p-4 font-poppins">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center backdrop-blur-xl shadow-2xl"
            >
                <div className="mb-6 relative inline-block">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="bg-green-500 w-20 h-20 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(34,197,94,0.4)]"
                    >
                        <CheckCircle2 size={40} className="text-white" />
                    </motion.div>
                </div>

                <h2 className="text-3xl font-black italic uppercase italic tracking-tighter text-white mb-2">Registration Confirmed!</h2>
                <p className="text-white/60 font-medium mb-6 leading-relaxed">
                    Team <span className="text-purple-400 font-bold">{registration?.team_name || "Your team"}</span> is ready for war.
                </p>

                {registration?.team_id && (
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-2">Your Login Credentials</p>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold">Team ID</label>
                                <div className="flex items-center justify-between text-white font-mono text-lg bg-white/5 p-2 rounded-lg mt-1">
                                    <span>{registration.team_id}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(registration.team_id);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-white/40" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold">Password</label>
                                <div className="flex items-center justify-between text-white font-mono text-lg bg-white/5 p-2 rounded-lg mt-1">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={registration.password || "********"}
                                        readOnly
                                        className="bg-transparent border-none focus:outline-none w-full"
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-2 hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} className="text-white/40" /> : <Eye size={16} className="text-white/40" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-3 bg-[#FFEE00] text-black font-black uppercase italic py-4 rounded-2xl shadow-[8px_8px_0_#9E00F9] hover:-translate-y-1 hover:-translate-x-1 transition-all active:translate-y-0 active:translate-x-0"
                    >
                        <LayoutDashboard size={20} />
                        Launch Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-3 bg-white/5 text-white/60 font-bold py-3 rounded-2xl hover:bg-white/10 transition-all"
                    >
                        <Home size={18} />
                        Back to Home
                    </Link>
                </div>

                <p className="mt-6 text-[10px] text-white/30 uppercase tracking-widest font-mono">
                    A confirmation email has been sent to the team captain.
                </p>
            </motion.div>
        </div>
    );
};

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0B0114] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
