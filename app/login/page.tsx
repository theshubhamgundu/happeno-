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
    const { user, isLoading, login } = useAuth();
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
            const destination = user.role === 'team' && user.portalMode === 'edit'
                ? '/edit-registration'
                : `/dashboard/${user.role}`;
            router.push(destination);
        }
    }, [user, isLoading, router]);

    if (isLoading || (user && user.role)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-[#0f766e] rounded-full animate-spin" />
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
            // Try Participant
            let response = await fetch('/api/auth/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: id, password: pass })
            });
            let data = await response.json();
            
            if (response.ok && data.success) {
                setDetectedRole("Participant");
                login('team', { teamId: data.teamId, name: data.teamName, portalMode: data.portalMode });
                return;
            }
            if (response.status === 403 && data.error && !data.error.includes("Invalid")) {
                setError(data.error);
                setIsVerifying(false);
                return;
            }

            // Try Admin
            response = await fetch('/api/auth/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'admin', id, password: pass })
            });
            data = await response.json();
            
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

            setError("Invalid ID or Password");
        } catch (err) {
            console.error("Login error:", err);
            setError("System error. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#F8F9FA] via-white to-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle grid pattern background */}
            <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-100/10 blur-[160px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-100/10 blur-[160px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="font-display font-extrabold text-5xl md:text-6xl text-[#0f172a] mb-2">
                        Tri-City Hackathon
                    </h1>
                    <p className="font-body text-gray-600 text-base md:text-lg">
                        Sign in to access your dashboard
                    </p>
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
                    <div className="pro-card rounded-xl p-8 bg-white border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            {/* Role badge */}
                            <div className="flex justify-center">
                                <div className={`px-4 py-2 rounded-full bg-gradient-to-r from-[#0f172a] to-[#0f766e] flex items-center gap-2 shadow-sm`}>
                                    <UserCircle size={16} className="text-white" />
                                    <span className="text-xs font-display font-bold uppercase tracking-wider text-white">Unified Login</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100" />

                            {/* ID Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-600">
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
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-base font-body text-[#0f172a] placeholder:text-gray-400 focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-teal-500/20 transition-all"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-600">
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
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-base font-body text-[#0f172a] placeholder:text-gray-400 focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-teal-500/20 transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
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
                                    className="p-3 rounded-lg bg-red-50 border border-red-200"
                                >
                                    <p className="text-red-700 text-xs font-body font-semibold">{error}</p>
                                </motion.div>
                            )}

                            {/* Detected role indicator */}
                            {detectedRole && !error && (
                                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                    <ShieldCheck size={16} className="text-emerald-600" />
                                    <span className="text-emerald-700 text-xs font-body font-semibold uppercase tracking-wider">
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
                                        <div className="w-5 h-5 border-2 border-[#0f172a]/20 border-t-[#0f172a] rounded-full animate-spin" />
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
                            <div className="pt-3 border-t border-gray-100 text-center">
                                <p className="font-body text-xs text-gray-500">
                                    Contact the organizer if you don&apos;t have credentials
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-center"
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-[#0f172a] hover:border-gray-300 transition-all font-display font-semibold text-sm uppercase tracking-wider group"
                    >
                        <ArrowLeft size={16} />
                        Back to Landing Page
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}
