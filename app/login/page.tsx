"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Link } from "next-view-transitions";
import {
    Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft,
    Users, Gavel, HandHelping, Settings
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase, teamSupabase } from "@/lib/supabase";
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
        color: "from-blue-500 to-cyan-400",
        glow: "bg-blue-500/20",
        desc: "Access your team dashboard, submit ideas & view assignments"
    },
    {
        key: "judge",
        label: "Judge",
        icon: Gavel,
        color: "from-amber-500 to-slate-800",
        glow: "bg-amber-500/20",
        desc: "Evaluate projects, score submissions & provide feedback"
    },
    {
        key: "volunteer",
        label: "Volunteer",
        icon: HandHelping,
        color: "from-emerald-500 to-green-400",
        glow: "bg-emerald-500/20",
        desc: "Manage event logistics, assist teams & coordinate tasks"
    },
    {
        key: "admin",
        label: "Admin",
        icon: Settings,
        color: "from-slate-900 to-slate-800",
        glow: "bg-slate-900/20",
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
            <div className="min-h-screen bg-[#06000D] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
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
                const { data: teamData } = await teamSupabase
                    .from('registrations')
                    .select('team_id, team_name, password')
                    .ilike('team_id', id)
                    .eq('password', pass)
                    .maybeSingle();

                if (teamData) {
                    setDetectedRole("Participant");
                    login('team', { teamId: teamData.team_id, name: teamData.team_name });
                } else {
                    setError("Invalid Participant ID or Password");
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
        <main className="min-h-screen bg-[#06000D] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-slate-900/10 blur-[160px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-slate-900/10 blur-[160px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-3 text-white">
                        TRICITY <span className="text-[#FFEE00]">PORTAL</span>
                    </h1>
                    <p className="text-white/40 font-medium text-sm">
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
                                        className="group relative bg-white/[0.04] border border-white/10 rounded-3xl p-6 text-left backdrop-blur-md hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300 overflow-hidden cursor-pointer"
                                    >
                                        {/* Glow on hover */}
                                        <div className={`absolute -top-10 -right-10 w-32 h-32 ${role.glow} blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                                        <div className="relative z-10">
                                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon size={22} className="text-white" />
                                            </div>
                                            <h3 className="text-white font-black text-lg uppercase tracking-tight mb-1">
                                                {role.label}
                                            </h3>
                                            <p className="text-white/30 text-xs font-medium leading-relaxed">
                                                {role.desc}
                                            </p>
                                            <div className="mt-4 flex items-center gap-1.5 text-white/20 group-hover:text-white/50 transition-colors">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Open Demo</span>
                                                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
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
                            <div className="bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
                                {/* Card glow */}
                                <div className={`absolute top-0 right-0 w-56 h-56 ${activeRole?.glow} blur-[80px] rounded-full pointer-events-none`} />

                                <div className="relative z-10 space-y-5">
                                    {/* Back button + Role badge */}
                                    <div className="flex items-center justify-between mb-2">
                                        <button
                                            onClick={handleBack}
                                            className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors group"
                                        >
                                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                                        </button>
                                        <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${activeRole?.color} flex items-center gap-2`}>
                                            {activeRole && <activeRole.icon size={13} className="text-white" />}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">{activeRole?.label}</span>
                                        </div>
                                    </div>

                                    {/* ID Field */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
                                            {selectedRole === "admin" ? "Admin ID" : `${activeRole?.label} ID`}
                                        </label>
                                        <input
                                            type="text"
                                            id="login-id"
                                            autoComplete="username"
                                            placeholder=""
                                            value={loginId}
                                            onChange={(e) => { setLoginId(e.target.value); setError(""); }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFEE00]/50 focus:bg-white/[0.08] transition-all font-bold"
                                        />
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
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
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFEE00]/50 focus:bg-white/[0.08] transition-all font-bold pr-14"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-2"
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
                                            className="p-3 rounded-xl bg-slate-900/10 border border-slate-800/20 text-center"
                                        >
                                            <p className="text-slate-900 text-xs font-bold uppercase tracking-wide">{error}</p>
                                        </motion.div>
                                    )}

                                    {/* Detected role indicator */}
                                    {detectedRole && !error && (
                                        <div className="flex items-center justify-center gap-2">
                                            <ShieldCheck size={14} className="text-green-400" />
                                            <span className="text-green-400 text-xs font-bold uppercase tracking-widest">
                                                {detectedRole} verified — redirecting...
                                            </span>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isVerifying}
                                        className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-[0_4px_0_#9333ea] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2 group mt-2 ${isVerifying
                                            ? 'bg-[#FFEE00]/50 text-black/50 cursor-not-allowed'
                                            : 'bg-[#FFEE00] hover:bg-[#E6D600] text-black'
                                            }`}
                                    >
                                        {isVerifying ? (
                                            <>
                                                <div className="w-5 h-5 border-[3px] border-black/30 border-t-black rounded-full animate-spin" />
                                                <span>Verifying...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Access {activeRole?.label} Dashboard</span>
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    {/* Credentials hint */}
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-center text-white/20 text-[9px] uppercase tracking-widest font-bold">
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
                        className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-[#FFEE00] hover:bg-white/10 hover:border-[#FFEE00]/20 transition-all font-black uppercase italic text-[10px] tracking-[0.2em] group backdrop-blur-md"
                    >
                        <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                        Back to Landing Page
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}
