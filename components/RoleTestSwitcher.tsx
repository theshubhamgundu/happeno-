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
            {/* Top Quick-Switcher Pill Bar - Crisp Light Theme */}
            <div className="bg-white border-b border-slate-200 text-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px] tracking-wider uppercase">
                        <Sparkles size={11} className="text-amber-600" /> Test Suite
                    </span>
                    <span className="text-slate-400 hidden sm:inline">Active Role:</span>
                    <span className="font-bold text-slate-800 capitalize bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {user?.role === 'judge' ? 'Evaluator' : user?.role === 'team' ? 'Participant' : user?.role || 'Guest'}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        onClick={() => void handleSwitchRole('team')}
                        disabled={isSwitching !== null}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all border ${
                            user?.role === 'team'
                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
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
                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
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
                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
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
                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                        title="Switch session to Admin Dashboard"
                    >
                        <LayoutDashboard size={12} />
                        <span>Admin</span>
                        {isSwitching === 'admin' && <span className="animate-spin ml-1">⋯</span>}
                    </button>

                    <button
                        onClick={() => setIsExpanded(prev => !prev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition-all ml-1 shadow-sm"
                        title="Test all 3 dashboards simultaneously"
                    >
                        <Laptop size={12} />
                        <span className="hidden md:inline">Test All At Once</span>
                        <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Expanded "Test All at Once" Multi-Role Modal / Tray - Crisp Light Theme */}
            {isExpanded && (
                <div className="bg-slate-50 border-b border-slate-200 text-slate-800 p-5 shadow-lg animate-in slide-in-from-top-2 duration-200">
                    <div className="max-w-6xl mx-auto space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Laptop size={18} className="text-teal-600" /> Test All 3 Dashboards Simultaneously
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Because browser cookies isolate accounts per window, use these direct links and credentials to test Participant, Evaluator, and Volunteer screens all at once!
                                </p>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* 3 Role Cards with Test Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Participant */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                                        <Award size={16} className="text-teal-600" /> 1. Participant
                                    </div>
                                    <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded">
                                        /dashboard/team
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Tests problem statement submission, github/demo URLs, team members, and live digital pass.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span>Test ID:</span>
                                        <code className="text-teal-700 font-mono font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">TRI26009</code>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span>Mode:</span>
                                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Event Live (Open)</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('team')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors text-center shadow-sm"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Evaluator */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                        <ShieldCheck size={16} className="text-teal-600" /> 2. Evaluator
                                    </div>
                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                                        /dashboard/judge
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Tests team lookup, rubric scoring (1-10), feedback, and offline phone resilience.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span>Role:</span>
                                        <span className="text-slate-800 font-bold">Evaluator Panel</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span>Offline Queue:</span>
                                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active & Synced</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('judge')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors text-center shadow-sm"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Volunteer */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                        <Phone size={16} className="text-teal-600" /> 3. Volunteer
                                    </div>
                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                                        /dashboard/volunteer
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Tests continuous QR barcode scanner, rapid check-in, and meal pass verification.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span>Scanner:</span>
                                        <span className="text-slate-800 font-bold">Live Camera / Manual</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span>Status:</span>
                                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Ready</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('volunteer')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors text-center shadow-sm"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Live 3-in-1 Simulator Link & Multi-window Instructions */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <Laptop size={14} className="text-teal-600" />
                                    How to test all 3 simultaneously:
                                </h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Option 1: Open <strong>Evaluator</strong> in this tab, open <strong>Participant</strong> in an Incognito window, and open <strong>Volunteer</strong> in a secondary browser (or phone).
                                    <br />
                                    Option 2: Open our <strong>Live 3-in-1 Dashboard Simulator</strong> to preview all three screens side-by-side!
                                </p>
                            </div>
                            <Link
                                href="/dashboard/role-preview"
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shrink-0 shadow-sm"
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
