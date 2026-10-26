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
            {/* Top Quick-Switcher Pill Bar - Crisp Dark Theme */}
            <div className="bg-[#0d0d12] border-b border-zinc-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black text-amber-300 border border-amber-500/30 font-bold text-[10px] tracking-wider uppercase">
                        <Sparkles size={11} className="text-amber-500" /> Test Suite
                    </span>
                    <span className="text-white hidden sm:inline">Active Role:</span>
                    <span className="font-bold text-white capitalize bg-black border border-zinc-800 px-2 py-0.5 rounded text-[11px]">
                        {user?.role === 'judge' ? 'Evaluator' : user?.role === 'team' ? 'Participant' : user?.role || 'Guest'}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        onClick={() => void handleSwitchRole('team')}
                        disabled={isSwitching !== null}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all border ${
                            user?.role === 'team'
                                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white border-orange-400/40 shadow-[0_0_12px_rgba(234,88,12,0.35)]"
                                : "bg-black hover:bg-zinc-900 text-white border-zinc-800"
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all border ${
                            user?.role === 'judge'
                                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white border-orange-400/40 shadow-[0_0_12px_rgba(234,88,12,0.35)]"
                                : "bg-black hover:bg-zinc-900 text-white border-zinc-800"
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all border ${
                            user?.role === 'volunteer'
                                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white border-orange-400/40 shadow-[0_0_12px_rgba(234,88,12,0.35)]"
                                : "bg-black hover:bg-zinc-900 text-white border-zinc-800"
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all border ${
                            user?.role === 'admin'
                                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white border-orange-400/40 shadow-[0_0_12px_rgba(234,88,12,0.35)]"
                                : "bg-black hover:bg-zinc-900 text-white border-zinc-800"
                        }`}
                        title="Switch session to Admin Dashboard"
                    >
                        <LayoutDashboard size={12} />
                        <span>Admin</span>
                        {isSwitching === 'admin' && <span className="animate-spin ml-1">⋯</span>}
                    </button>

                    <button
                        onClick={() => setIsExpanded(prev => !prev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-[11px] transition-all ml-1 shadow-[0_0_14px_rgba(234,88,12,0.35)] border border-orange-400/30"
                        title="Test all 3 dashboards simultaneously"
                    >
                        <Laptop size={12} />
                        <span className="hidden md:inline">Test All At Once</span>
                        <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Expanded "Test All at Once" Multi-Role Modal / Tray - Crisp Dark Theme */}
            {isExpanded && (
                <div className="bg-[#09090b] border-b border-zinc-800 text-white p-5 shadow-lg animate-in slide-in-from-top-2 duration-200">
                    <div className="max-w-6xl mx-auto space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Laptop size={18} className="text-orange-500" /> Test All 3 Dashboards Simultaneously
                                </h3>
                                <p className="text-xs text-white/90 mt-0.5">
                                    Because browser cookies isolate accounts per window, use these direct links and credentials to test Participant, Evaluator, and Volunteer screens all at once!
                                </p>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-white hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* 3 Role Cards with Test Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Participant */}
                            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12] p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                                        <Award size={16} className="text-orange-500" /> 1. Participant
                                    </div>
                                    <span className="text-[10px] font-mono bg-black text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded">
                                        /dashboard/team
                                    </span>
                                </div>
                                <p className="text-[11px] text-white/90 leading-relaxed">
                                    Tests problem statement submission, github/demo URLs, team members, and live digital pass.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-[11px]">
                                    <div className="flex items-center justify-between text-white">
                                        <span>Test ID:</span>
                                        <code className="text-orange-400 font-mono font-bold bg-black px-1.5 py-0.5 rounded border border-orange-500/30">TRI26009</code>
                                    </div>
                                    <div className="flex items-center justify-between text-white">
                                        <span>Mode:</span>
                                        <span className="text-white font-bold bg-black px-2 py-0.5 rounded border border-zinc-800">Event Live (Open)</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('team')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition-colors text-center shadow-[0_0_12px_rgba(234,88,12,0.3)] border border-orange-400/30"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Evaluator */}
                            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12] p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                                        <ShieldCheck size={16} className="text-orange-500" /> 2. Evaluator
                                    </div>
                                    <span className="text-[10px] font-mono bg-black text-white border border-zinc-800 px-2 py-0.5 rounded">
                                        /dashboard/judge
                                    </span>
                                </div>
                                <p className="text-[11px] text-white/90 leading-relaxed">
                                    Tests team lookup, rubric scoring (1-10), feedback, and offline phone resilience.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-[11px]">
                                    <div className="flex items-center justify-between text-white">
                                        <span>Role:</span>
                                        <span className="text-white font-bold">Evaluator Panel</span>
                                    </div>
                                    <div className="flex items-center justify-between text-white">
                                        <span>Offline Queue:</span>
                                        <span className="text-white font-bold bg-black px-2 py-0.5 rounded border border-zinc-800">Active & Synced</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('judge')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition-colors text-center shadow-[0_0_12px_rgba(234,88,12,0.3)] border border-orange-400/30"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Volunteer */}
                            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12] p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                                        <Phone size={16} className="text-orange-500" /> 3. Volunteer
                                    </div>
                                    <span className="text-[10px] font-mono bg-black text-white border border-zinc-800 px-2 py-0.5 rounded">
                                        /dashboard/volunteer
                                    </span>
                                </div>
                                <p className="text-[11px] text-white/90 leading-relaxed">
                                    Tests continuous QR barcode scanner, rapid check-in, and meal pass verification.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-[11px]">
                                    <div className="flex items-center justify-between text-white">
                                        <span>Scanner:</span>
                                        <span className="text-white font-bold">Live Camera / Manual</span>
                                    </div>
                                    <div className="flex items-center justify-between text-white">
                                        <span>Status:</span>
                                        <span className="text-white font-bold bg-black px-2 py-0.5 rounded border border-zinc-800">Ready</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('volunteer')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition-colors text-center shadow-[0_0_12px_rgba(234,88,12,0.3)] border border-orange-400/30"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Live 3-in-1 Simulator Link & Multi-window Instructions */}
                        <div className="rounded-xl border border-zinc-800 bg-[#0d0d12] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <Laptop size={14} className="text-orange-500" />
                                    How to test all 3 simultaneously:
                                </h4>
                                <p className="text-[11px] text-white/90 leading-relaxed">
                                    Option 1: Open <strong>Evaluator</strong> in this tab, open <strong>Participant</strong> in an Incognito window, and open <strong>Volunteer</strong> in a secondary browser (or phone).
                                    <br />
                                    Option 2: Open our <strong>Live 3-in-1 Dashboard Simulator</strong> to preview all three screens side-by-side!
                                </p>
                            </div>
                            <Link
                                href="/dashboard/role-preview"
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition-all shrink-0 shadow-[0_0_12px_rgba(234,88,12,0.3)] border border-orange-400/30"
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
