"use client";

import { motion } from "framer-motion";
import { Link } from "next-view-transitions";
import {
    Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft,
    Sparkles
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
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-black border-t-[#FF5722] rounded-full animate-spin" />
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
                login('team', { id: data.team.teamId, name: data.team.teamName });
                return;
            }

            // If none worked
            setError("Invalid credentials. Check your ID and password.");
        } catch {
            setError("System error. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 relative">
            {/* Top Navigation */}
            <div className="absolute top-6 left-6 z-20">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black bg-white text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] transition-all"
                >
                    <ArrowLeft size={14} />
                    <span>BACK TO HOME</span>
                </Link>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-[#FBBF24] border-2 border-black text-black font-mono text-xs font-black shadow-[2px_2px_0px_#000]">
                        <Sparkles size={12} />
                        <span>HAPPENO ACCESS PORTAL</span>
                    </div>
                    <h1 className="font-display font-black text-4xl text-black tracking-tight mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-neutral-600 font-medium">
                        Enter your credentials to access your workspace
                    </p>
                </motion.div>

                {/* ─── Login Form ─── */}
                <motion.div
                    key="login-form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="w-full"
                >
                    <div className="bg-white border-2 border-black rounded-2xl p-7 sm:p-8 shadow-[4px_4px_0px_#000000] relative">
                        <div className="space-y-5">
                            {/* ID Field */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-mono font-black uppercase tracking-wider text-black">
                                    Login ID
                                </label>
                                <input
                                    type="text"
                                    id="login-id"
                                    autoComplete="username"
                                    placeholder="e.g. TEAM-101 or ADMIN-01"
                                    value={loginId}
                                    onChange={(e) => { setLoginId(e.target.value); setError(""); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    className="w-full bg-[#FAF9F5] border-2 border-black rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000] transition-all"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-mono font-black uppercase tracking-wider text-black">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="login-pass"
                                        autoComplete="current-password"
                                        placeholder="••••••••••••"
                                        value={loginPass}
                                        onChange={(e) => { setLoginPass(e.target.value); setError(""); }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        className="w-full bg-[#FAF9F5] border-2 border-black rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000] transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors p-1"
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
                                    className="p-3 rounded-xl bg-red-50 border-2 border-red-500 text-red-600 text-xs font-bold"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Detected role indicator */}
                            {detectedRole && !error && (
                                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 border-2 border-emerald-600 text-emerald-700">
                                    <ShieldCheck size={16} className="text-emerald-600" />
                                    <span className="text-xs font-mono font-black uppercase tracking-wider">
                                        {detectedRole} verified — redirecting...
                                    </span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isVerifying}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[#FF5722] text-white font-mono font-black text-sm uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_#000000] transition-all disabled:opacity-50"
                            >
                                {isVerifying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        <span>VERIFYING...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>SIGN IN</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>

                            {/* Credentials hint */}
                            <div className="pt-4 border-t-2 border-neutral-100 text-center">
                                <p className="font-mono text-xs text-neutral-500 font-bold mb-1">
                                    Happeno Hackathon OS
                                </p>
                                <div className="font-mono text-xs text-neutral-700 font-medium">
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
