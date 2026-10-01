"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
    LayoutDashboard,
    Award,
    ShieldCheck,
    Phone,
    SlidersHorizontal,
    ExternalLink,
    Copy,
    Check,
    ChevronDown,
    X,
    Laptop,
    Sparkles
} from "lucide-react";
import Link from "next/link";

export default function RoleTestSwitcher() {
    const { user, login } = useAuth();
    const router = useRouter();
    const [isSwitching, setIsSwitching] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success(`Copied ${key} to clipboard!`);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleSwitchRole = async (targetRole: 'team' | 'judge' | 'volunteer' | 'admin') => {
        setIsSwitching(targetRole);
        try {
            const res = await fetch('/api/auth/test-switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: targetRole })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to switch role');
            }

            toast.success(data.message || `Switched to ${targetRole}`);

            if (targetRole === 'team') {
                login('team', { teamId: data.teamId, name: data.teamName, portalMode: 'event' });
            } else if (targetRole === 'judge') {
                login('judge', { id: data.id, name: data.name });
            } else if (targetRole === 'volunteer') {
                login('volunteer', { id: data.id, name: data.name });
            } else if (targetRole === 'admin') {
                login('admin', { id: data.id, name: data.name });
            }

            window.location.href = data.destination;
        } catch (err: unknown) {
            console.error('Role switch failed:', err);
            toast.error(err instanceof Error ? err.message : 'Could not switch role');
        } finally {
            setIsSwitching(null);
        }
    };

    return (
        <div className="relative z-50 print:hidden">
            {/* Top Quick-Switcher Pill Bar */}
            <div className="bg-slate-900 border-b border-white/10 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-md">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFEE00] text-black font-black uppercase text-[10px] tracking-wider">
                        <Sparkles size={11} /> Test Suite
                    </span>
                    <span className="text-white/60 hidden sm:inline">Active Role:</span>
                    <span className="font-bold text-white capitalize bg-white/10 px-2 py-0.5 rounded text-[11px]">
                        {user?.role === 'judge' ? 'Evaluator' : user?.role === 'team' ? 'Participant' : user?.role || 'Guest'}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        onClick={() => void handleSwitchRole('team')}
                        disabled={isSwitching !== null}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                            user?.role === 'team'
                                ? "bg-teal-500 text-white shadow-sm ring-1 ring-white/30"
                                : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
                        }`}
                        title="Switch session to Participant Portal"
                    >
                        <Award size={12} />
                        <span>Participant</span>
                        {isSwitching === 'team' && <span className="animate-spin ml-1">⋯</span>}
                    </button>

                    <button
                        onClick={() => void handleSwitchRole('judge')}
                        disabled={isSwitching !== null}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                            user?.role === 'judge'
                                ? "bg-[#FFEE00] text-black shadow-sm ring-1 ring-white/30 font-black"
                                : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
                        }`}
                        title="Switch session to Evaluator Portal"
                    >
                        <ShieldCheck size={12} />
                        <span>Evaluator</span>
                        {isSwitching === 'judge' && <span className="animate-spin ml-1">⋯</span>}
                    </button>

                    <button
                        onClick={() => void handleSwitchRole('volunteer')}
                        disabled={isSwitching !== null}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                            user?.role === 'volunteer'
                                ? "bg-indigo-500 text-white shadow-sm ring-1 ring-white/30"
                                : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
                        }`}
                        title="Switch session to Volunteer Portal"
                    >
                        <Phone size={12} />
                        <span>Volunteer</span>
                        {isSwitching === 'volunteer' && <span className="animate-spin ml-1">⋯</span>}
                    </button>

                    <button
                        onClick={() => void handleSwitchRole('admin')}
                        disabled={isSwitching !== null}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                            user?.role === 'admin'
                                ? "bg-rose-500 text-white shadow-sm ring-1 ring-white/30"
                                : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
                        }`}
                        title="Switch session to Admin Dashboard"
                    >
                        <LayoutDashboard size={12} />
                        <span>Admin</span>
                        {isSwitching === 'admin' && <span className="animate-spin ml-1">⋯</span>}
                    </button>

                    <button
                        onClick={() => setIsExpanded(prev => !prev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] transition-all ml-1 shadow-sm"
                        title="Test all 3 dashboards simultaneously"
                    >
                        <Laptop size={12} />
                        <span className="hidden md:inline">Test All At Once</span>
                        <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Expanded "Test All at Once" Multi-Role Modal / Tray */}
            {isExpanded && (
                <div className="bg-slate-950 border-b border-teal-500/30 text-white p-5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
                    <div className="max-w-6xl mx-auto space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div>
                                <h3 className="text-base font-black italic uppercase tracking-wider text-[#FFEE00] flex items-center gap-2">
                                    <Laptop size={18} /> Test All 3 Dashboards Simultaneously
                                </h3>
                                <p className="text-xs text-white/60 mt-0.5">
                                    Because browser cookies isolate accounts per window, use these direct links and credentials to test Participant, Evaluator, and Volunteer screens all at once!
                                </p>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* 3 Role Cards with Test Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Participant */}
                            <div className="rounded-2xl border border-teal-500/20 bg-teal-950/20 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-teal-300 font-black text-sm uppercase">
                                        <Award size={16} /> 1. Participant
                                    </div>
                                    <span className="text-[10px] font-mono bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded">
                                        /dashboard/team
                                    </span>
                                </div>
                                <p className="text-[11px] text-white/70">
                                    Tests problem statement submission, github/demo URLs, team roster, and live digital pass.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px]">
                                    <div className="flex items-center justify-between text-white/50">
                                        <span>Test ID:</span>
                                        <code className="text-teal-300 font-mono font-bold">TC-101</code>
                                    </div>
                                    <div className="flex items-center justify-between text-white/50">
                                        <span>Mode:</span>
                                        <span className="text-emerald-400 font-bold">Event Live (Open)</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('team')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs uppercase tracking-wider transition-colors text-center"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Evaluator */}
                            <div className="rounded-2xl border border-[#FFEE00]/20 bg-amber-950/20 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#FFEE00] font-black text-sm uppercase">
                                        <ShieldCheck size={16} /> 2. Evaluator
                                    </div>
                                    <span className="text-[10px] font-mono bg-[#FFEE00]/20 text-amber-200 px-2 py-0.5 rounded">
                                        /dashboard/judge
                                    </span>
                                </div>
                                <p className="text-[11px] text-white/70">
                                    Tests track filter (7 tracks), team scoring rubric (1-10), feedback, and offline phone queue.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px]">
                                    <div className="flex items-center justify-between text-white/50">
                                        <span>Assigned Tracks:</span>
                                        <span className="text-[#FFEE00] font-bold">All 7 Tracks Filterable</span>
                                    </div>
                                    <div className="flex items-center justify-between text-white/50">
                                        <span>Offline Queue:</span>
                                        <span className="text-emerald-400 font-bold">Active & Synced</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('judge')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-xl bg-[#FFEE00] hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider transition-colors text-center"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Volunteer */}
                            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-indigo-300 font-black text-sm uppercase">
                                        <Phone size={16} /> 3. Volunteer
                                    </div>
                                    <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded">
                                        /dashboard/volunteer
                                    </span>
                                </div>
                                <p className="text-[11px] text-white/70">
                                    Tests continuous QR barcode scanner, rapid check-in, meal pass validation, and mentor dispatch.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px]">
                                    <div className="flex items-center justify-between text-white/50">
                                        <span>Scanner:</span>
                                        <span className="text-indigo-300 font-bold">Live Camera / Manual</span>
                                    </div>
                                    <div className="flex items-center justify-between text-white/50">
                                        <span>Mentor Tickets:</span>
                                        <span className="text-indigo-300 font-bold">Real-time Feed</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('volunteer')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-wider transition-colors text-center"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Live 3-in-1 Simulator Link & Multi-window Instructions */}
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                                    <Laptop size={14} className="text-teal-400" />
                                    How to test all 3 simultaneously:
                                </h4>
                                <p className="text-[11px] text-white/60 leading-relaxed">
                                    Option 1: Open <strong>Evaluator</strong> in this tab, open <strong>Participant</strong> in an Incognito window, and open <strong>Volunteer</strong> in a secondary browser (or phone).
                                    <br />
                                    Option 2: Open our <strong>Live 3-in-1 Dashboard Simulator</strong> to preview all three screens side-by-side!
                                </p>
                            </div>
                            <Link
                                href="/dashboard/role-preview"
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs uppercase tracking-wider transition-all shrink-0 shadow-lg"
                            >
                                <Laptop size={14} /> Open 3-in-1 Simulator <ExternalLink size={12} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
