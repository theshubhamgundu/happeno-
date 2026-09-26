"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Link } from "next-view-transitions";
import {
    Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft,
    Users, Gavel, HandHelping, Settings
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_JUDGE, DEMO_TEAM_ID, DEMO_VOLUNTEER } from "@/lib/demo-data";

// ─── Constants ────────────────────────────────────────────────────────
const ADMIN_ID = "admin@tricity";
const ADMIN_PASS = "@Snapx1911";

type RoleOption = "participant" | "judge" | "volunteer" | "admin";

const ROLES: { key: RoleOption; label: string; icon: typeof Users; color: string; glow: string; desc: string }[] = [
    {
        key: "participant",
        label: "Participant",
        icon: Users,
        color: "from-[#0f766e] to-[#0d9488]",
        glow: "bg-teal-500/20",
        desc: "Access your team dashboard, submit ideas & view assignments"
    },
    {
        key: "judge",
        label: "Judge",
        icon: Gavel,
        color: "from-[#0f172a] to-[#1e293b]",
        glow: "bg-slate-500/20",
        desc: "Evaluate projects, score submissions & provide feedback"
    },
    {
        key: "volunteer",
        label: "Volunteer",
        icon: HandHelping,
        color: "from-[#0f766e] to-[#14b8a6]",
        glow: "bg-teal-400/20",
        desc: "Manage event logistics, assist teams & coordinate tasks"
    },
    {
        key: "admin",
        label: "Admin",
        icon: Settings,
        color: "from-[#0f172a] to-[#0f766e]",
        glow: "bg-teal-500/20",
        desc: "Full control — manage registrations, judges & the event"
    },
];

// ─── Main Login Page ──────────────────────────────────────────────────
export default function LoginPage() {
    const { user, isLoading, login } = useAuth();
    const router = useRouter();

    const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
    const [loginId, setLoginId] = useState("");
    const [loginPass, setLoginPass] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [detectedRole, setDetectedRole] = useState<string | null>(null);

    // Redirect if already logged in
    useEffect(() => {
        if (!isLoading && user && user.role) {
            router.push(`/dashboard/${user.role}`);
        }
    }, [user, isLoading, router]);

    if (isLoading || (user && user.role)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-[#0f766e] rounded-full animate-spin" />
            </div>
        );
    }

    const handleBack = () => {
        setSelectedRole(null);
        setLoginId("");
        setLoginPass("");
        setError("");
        setDetectedRole(null);
    };

    // The four role cards are intentionally one-click demo entry points. These
    // identifiers are local session data only; no demo account is written to Supabase.
    const openDemoDashboard = (role: RoleOption) => {
        if (role === "participant") {
            login("team", { teamId: DEMO_TEAM_ID, name: "Team Nova" });
            return;
        }
        if (role === "judge") {
            login("judge", { id: DEMO_JUDGE.generatedId, name: DEMO_JUDGE.name });
            return;
        }
        if (role === "volunteer") {
            login("volunteer", { id: DEMO_VOLUNTEER.generatedId, name: DEMO_VOLUNTEER.name });
            return;
        }
        login("admin", { id: "DEMO-ADMIN-01", name: "Demo Administrator" });
    };

    const handleSubmit = async () => {
        setError("");
        const id = loginId.trim();
        const pass = loginPass.trim();

        if (!id) { setError("Please enter your ID"); return; }
        if (!pass) { setError("Please enter your password"); return; }

        setIsVerifying(true);

        try {
            if (selectedRole === "admin") {
                if (id.toLowerCase() === ADMIN_ID.toLowerCase() && pass === ADMIN_PASS) {
                    setDetectedRole("Admin");
                    login('admin', { id: ADMIN_ID });
                } else {
                    setError("Invalid Admin credentials");
                }
                return;
            }

            if (selectedRole === "participant") {
                const response = await fetch('/api/auth/team', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teamId: id, password: pass })
                });
                const teamData = await response.json();

                if (response.ok && teamData.success) {
                    setDetectedRole("Participant");
                    login('team', { teamId: teamData.teamId, name: teamData.teamName });
                } else {
                    setError(teamData.error || "Invalid Participant ID or Password");
                }
                return;
            }

            if (selectedRole === "judge") {
                const { data: judgeData } = await supabase
                    .from('judges')
                    .select('*')
                    .ilike('generated_id', id)
                    .eq('password', pass)
                    .maybeSingle();

                if (judgeData) {
                    setDetectedRole("Judge");
                    login('judge', { id: judgeData.generated_id, name: judgeData.name });
                } else {
                    setError("Invalid Judge ID or Password");
                }
                return;
            }

            if (selectedRole === "volunteer") {
                const { data: volData } = await supabase
                    .from('volunteers')
                    .select('*')
                    .ilike('generated_id', id)
                    .eq('password', pass)
                    .maybeSingle();

                if (volData) {
                    setDetectedRole("Volunteer");
                    login('volunteer', { id: volData.generated_id, name: volData.name });
                } else {
                    setError("Invalid Volunteer ID or Password");
                }
                return;
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("System error. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    const activeRole = ROLES.find(r => r.key === selectedRole);

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
                        {selectedRole ? `Sign in as ${activeRole?.label}` : "Select your role to continue"}
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {!selectedRole ? (
                        /* ─── Role Selection Grid ─── */
                        <motion.div
                            key="role-grid"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {ROLES.map((role, i) => {
                                const Icon = role.icon;
                                return (
                                    <motion.button
                                        key={role.key}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: i * 0.08 }}
                                        onClick={() => openDemoDashboard(role.key)}
                                        className="group pro-card rounded-xl p-6 text-left bg-white border border-gray-200 hover:border-teal-600 transition-all duration-300 overflow-hidden cursor-pointer"
                                    >
                                        <div className="relative z-10">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 shadow-sm`}>
                                                <Icon size={20} className="text-white" />
                                            </div>
                                            <h3 className="font-display font-bold text-lg text-[#0f172a] mb-2">
                                                {role.label}
                                            </h3>
                                            <p className="font-body text-sm text-gray-600 leading-relaxed">
                                                {role.desc}
                                            </p>
                                            <div className="mt-4 flex items-center gap-1.5 text-[#0f766e] text-xs font-mono font-semibold uppercase tracking-wider group-hover:text-teal-700 transition-colors">
                                                <span>Continue</span>
                                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    ) : (
                        /* ─── Login Form ─── */
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
                                    {/* Back button + Role badge */}
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={handleBack}
                                            className="flex items-center gap-2 text-gray-600 hover:text-[#0f172a] transition-colors group"
                                        >
                                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Back</span>
                                        </button>
                                        <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${activeRole?.color} flex items-center gap-2`}>
                                            {activeRole && <activeRole.icon size={12} className="text-white" />}
                                            <span className="text-xs font-display font-bold uppercase tracking-wider text-white">{activeRole?.label}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100" />

                                    {/* ID Field */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-600">
                                            {selectedRole === "admin" ? "Admin ID" : `${activeRole?.label} ID`}
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
                                                <span>Access {activeRole?.label} Dashboard</span>
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
                    )}
                </AnimatePresence>

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
