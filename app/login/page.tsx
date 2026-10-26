"use client";

import { motion } from "framer-motion";
import { Link } from "next-view-transitions";
import {
    Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft,
    UserCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Main Login Page ──────────────────────────────────────────────────
export default function LoginPage() {
    const { user, isLoading, login, logout } = useAuth();
    const router = useRouter();

    const [loginId, setLoginId] = useState("");
    const [loginPass, setLoginPass] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [detectedRole, setDetectedRole] = useState<string | null>(null);

    // Redirect if already logged in
    useEffect(() => {
        if (!isLoading && user && user.role) {
            router.replace(`/dashboard/${user.role}`);
        }
    }, [user, isLoading, router]);

    if (isLoading || (user && user.role)) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-[#ea580c] rounded-full animate-spin" />
            </div>
        );
    }

    const handleSubmit = async () => {
        setError("");
        const id = loginId.trim();
        const pass = loginPass.trim();

        if (!id) { setError("Please enter your ID"); return; }
        if (!pass) { setError("Please enter your password"); return; }

        setIsVerifying(true);

        try {
            // Try Admin First
            let response = await fetch('/api/auth/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'admin', id, password: pass })
            });
            let data = await response.json();

            if (response.ok && data.success) {
                setDetectedRole("Admin");
                login('admin', { id: data.id, name: data.name });
                return;
            }

            // Try Judge
            response = await fetch('/api/auth/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'judge', id, password: pass })
            });
            data = await response.json();

            if (response.ok && data.success) {
                setDetectedRole("Judge");
                login('judge', { id: data.id, name: data.name });
                return;
            }

            // Try Volunteer
            response = await fetch('/api/auth/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'volunteer', id, password: pass })
            });
            data = await response.json();

            if (response.ok && data.success) {
                setDetectedRole("Volunteer");
                login('volunteer', { id: data.id, name: data.name });
                return;
            }

            // Try Participant / Team
            response = await fetch('/api/auth/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: id, password: pass })
            });
            data = await response.json();

            if (response.ok && data.success) {
                setDetectedRole("Team");
                login('team', { teamId: data.teamId, name: data.teamName, portalMode: data.portalMode || 'event' });
                return;
            }

            if (data?.error) {
                setError(data.error);
                return;
            }

            setError("Invalid ID or Password");
        } catch (err) {
            console.error("Login error:", err);
            setError("System error. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle grid pattern background */}
            <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600/10 blur-[160px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-600/10 blur-[160px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-2">
                        Happeno
                    </h1>
                    <p className="font-body text-zinc-400 text-sm md:text-base">
                        Workspace & Access Portal
                    </p>
                    <div className="badge-orange-grain mt-3">
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        <span>Happeno Hackathon</span>
                    </div>
                </motion.div>

                {/* ─── Login Form ─── */}
                <motion.div
                    key="login-form"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="pro-card rounded-xl p-8 bg-[#0d0d12] border border-zinc-800 shadow-sm relative overflow-hidden">
                        <div className="relative z-10 space-y-6">


                            {/* ID Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                                    Login ID
                                </label>
                                <input
                                    type="text"
                                    id="login-id"
                                    autoComplete="username"
                                    placeholder="Enter your ID"
                                    value={loginId}
                                    onChange={(e) => { setLoginId(e.target.value); setError(""); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-base font-body text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-orange-500/20 transition-all"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="login-pass"
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        value={loginPass}
                                        onChange={(e) => { setLoginPass(e.target.value); setError(""); }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-base font-body text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-orange-500/20 transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-lg bg-red-950/40 border border-red-500/30"
                                >
                                    <p className="text-red-400 text-xs font-body font-semibold">{error}</p>
                                </motion.div>
                            )}

                            {/* Detected role indicator */}
                            {detectedRole && !error && (
                                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                                    <ShieldCheck size={16} className="text-emerald-400" />
                                    <span className="text-emerald-300 text-xs font-body font-semibold uppercase tracking-wider">
                                        {detectedRole} verified — redirecting...
                                    </span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isVerifying}
                                className="btn-primary w-full mt-2"
                            >
                                {isVerifying ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>

                            {/* Credentials hint */}
                            <div className="pt-4 border-t border-zinc-800 text-center">
                                <p className="font-body text-xs text-zinc-500 mb-1">
                                    Happeno Hackathon
                                </p>
                                <div className="font-body text-xs text-zinc-400 font-medium">
                                    <p>support@happeno.in</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>


            </div>
        </main>
    );
}
