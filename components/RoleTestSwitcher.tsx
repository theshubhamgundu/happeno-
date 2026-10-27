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
        <div className="relative z-50 print:hidden font-sans">
            {/* Top Quick-Switcher Pill Bar - Neo-Brutalist */}
            <div className="bg-[#f7cb46] border-b-2 border-black text-black px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-[0_2px_0px_#000]">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white text-black border-2 border-black font-black text-[10px] tracking-wider uppercase shadow-[1.5px_1.5px_0px_#000]">
                        <Sparkles size={11} className="text-black" /> Test Suite
                    </span>
                    <span className="text-black font-bold hidden sm:inline">Active Role:</span>
                    <span className="font-black text-white capitalize bg-black border-2 border-black px-2 py-0.5 rounded text-[11px] shadow-[1.5px_1.5px_0px_#000]">
                        {user?.role === 'judge' ? 'Evaluator' : user?.role === 'team' ? 'Participant' : user?.role || 'Guest'}
                    </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => void handleSwitchRole('team')}
                        disabled={isSwitching !== null}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-black text-[11px] transition-all border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] ${
                            user?.role === 'team'
                                ? "bg-[#99e885] text-black"
                                : "bg-white hover:bg-neutral-100 text-black"
                        }`}
                        title="Switch session to Participant Portal"
                    >
                        <Award size={13} />
                        <span>Participant</span>
                        {isSwitching === 'team' && <span className="animate-spin ml-1">⋯</span>}
                    </button>

                    <button
                        onClick={() => void handleSwitchRole('judge')}
                        disabled={isSwitching !== null}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-black text-[11px] transition-all border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] ${
                            user?.role === 'judge'
                                ? "bg-[#c0f7fe] text-black"
                                : "bg-white hover:bg-neutral-100 text-black"
                        }`}
                        title="Switch session to Evaluator Portal"
                    >
                        <ShieldCheck size={13} />
                        <span>Evaluator</span>
                        {isSwitching === 'judge' && <span className="animate-spin ml-1">⋯</span>}
                    </button>

                    <button
                        onClick={() => void handleSwitchRole('volunteer')}
                        disabled={isSwitching !== null}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-black text-[11px] transition-all border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] ${
                            user?.role === 'volunteer'
                                ? "bg-[#ffdc8b] text-black"
                                : "bg-white hover:bg-neutral-100 text-black"
                        }`}
                        title="Switch session to Volunteer Portal"
                    >
                        <Phone size={13} />
                        <span>Volunteer</span>
                        {isSwitching === 'volunteer' && <span className="animate-spin ml-1">⋯</span>}
                    </button>

                    <button
                        onClick={() => void handleSwitchRole('admin')}
                        disabled={isSwitching !== null}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-black text-[11px] transition-all border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] ${
                            user?.role === 'admin'
                                ? "bg-[#fe90e8] text-black"
                                : "bg-white hover:bg-neutral-100 text-black"
                        }`}
                        title="Switch session to Admin Dashboard"
                    >
                        <LayoutDashboard size={13} />
                        <span>Admin</span>
                        {isSwitching === 'admin' && <span className="animate-spin ml-1">⋯</span>}
                    </button>

                    <button
                        onClick={() => setIsExpanded(prev => !prev)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#fe90e8] hover:bg-[#fe90e8]/85 text-black font-black text-[11px] transition-all ml-1 border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                        title="Test all 3 dashboards simultaneously"
                    >
                        <Laptop size={13} />
                        <span className="hidden md:inline">Test All At Once</span>
                        <ChevronDown size={13} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Expanded "Test All at Once" Multi-Role Modal / Tray - Neo-Brutalist */}
            {isExpanded && (
                <div className="bg-[#ede8f5] border-b-2 border-black text-black p-5 shadow-[0_4px_0px_#000] animate-in slide-in-from-top-2 duration-200">
                    <div className="max-w-6xl mx-auto space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                            <div>
                                <h3 className="text-base font-black text-black flex items-center gap-2">
                                    <Laptop size={18} className="text-black" /> Test All 3 Dashboards Simultaneously
                                </h3>
                                <p className="text-xs text-neutral-700 font-semibold mt-0.5">
                                    Because browser cookies isolate accounts per window, use these direct links and credentials to test Participant, Evaluator, and Volunteer screens all at once!
                                </p>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-black hover:bg-neutral-200 p-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* 3 Role Cards with Test Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Participant */}
                            <div className="rounded-xl border-2 border-black bg-white p-4 space-y-3 shadow-[3px_3px_0px_#000]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-black font-black text-sm">
                                        <Award size={16} /> 1. Participant
                                    </div>
                                    <span className="text-[10px] font-mono font-bold bg-[#ffdc8b] text-black border border-black px-2 py-0.5 rounded">
                                        /dashboard/team
                                    </span>
                                </div>
                                <p className="text-[11px] text-neutral-700 font-medium leading-relaxed">
                                    Tests problem statement submission, github/demo URLs, team members, and live digital pass.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t-2 border-black text-[11px]">
                                    <div className="flex items-center justify-between text-neutral-800 font-semibold">
                                        <span>Test ID:</span>
                                        <code className="text-black font-mono font-bold bg-[#ffdc8b] px-1.5 py-0.5 rounded border border-black">TRI26009</code>
                                    </div>
                                    <div className="flex items-center justify-between text-neutral-800 font-semibold">
                                        <span>Mode:</span>
                                        <span className="text-black font-bold bg-[#99e885] px-2 py-0.5 rounded border border-black">Event Live (Open)</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('team')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-lg bg-[#f7cb46] hover:bg-[#ffd24d] text-black font-black text-xs transition-transform text-center shadow-[2px_2px_0px_#000] border-2 border-black hover:translate-x-[1px] hover:translate-y-[1px]"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Evaluator */}
                            <div className="rounded-xl border-2 border-black bg-white p-4 space-y-3 shadow-[3px_3px_0px_#000]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-black font-black text-sm">
                                        <ShieldCheck size={16} /> 2. Evaluator
                                    </div>
                                    <span className="text-[10px] font-mono font-bold bg-[#c0f7fe] text-black border border-black px-2 py-0.5 rounded">
                                        /dashboard/judge
                                    </span>
                                </div>
                                <p className="text-[11px] text-neutral-700 font-medium leading-relaxed">
                                    Tests team lookup, rubric scoring (1-10), feedback, and offline phone resilience.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t-2 border-black text-[11px]">
                                    <div className="flex items-center justify-between text-neutral-800 font-semibold">
                                        <span>Role:</span>
                                        <span className="text-black font-bold">Evaluator Panel</span>
                                    </div>
                                    <div className="flex items-center justify-between text-neutral-800 font-semibold">
                                        <span>Offline Queue:</span>
                                        <span className="text-black font-bold bg-[#99e885] px-2 py-0.5 rounded border border-black">Active & Synced</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('judge')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-lg bg-[#c0f7fe] hover:bg-[#a5f3fd] text-black font-black text-xs transition-transform text-center shadow-[2px_2px_0px_#000] border-2 border-black hover:translate-x-[1px] hover:translate-y-[1px]"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Volunteer */}
                            <div className="rounded-xl border-2 border-black bg-white p-4 space-y-3 shadow-[3px_3px_0px_#000]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-black font-black text-sm">
                                        <Phone size={16} /> 3. Volunteer
                                    </div>
                                    <span className="text-[10px] font-mono font-bold bg-[#99e885] text-black border border-black px-2 py-0.5 rounded">
                                        /dashboard/volunteer
                                    </span>
                                </div>
                                <p className="text-[11px] text-neutral-700 font-medium leading-relaxed">
                                    Tests continuous QR barcode scanner, rapid check-in, and meal pass verification.
                                </p>
                                <div className="space-y-1.5 pt-2 border-t-2 border-black text-[11px]">
                                    <div className="flex items-center justify-between text-neutral-800 font-semibold">
                                        <span>Scanner:</span>
                                        <span className="text-black font-bold">Live Camera / Manual</span>
                                    </div>
                                    <div className="flex items-center justify-between text-neutral-800 font-semibold">
                                        <span>Status:</span>
                                        <span className="text-black font-bold bg-[#99e885] px-2 py-0.5 rounded border border-black">Ready</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => void handleSwitchRole('volunteer')}
                                        disabled={isSwitching !== null}
                                        className="flex-1 py-2 rounded-lg bg-[#ffdc8b] hover:bg-[#fed77a] text-black font-black text-xs transition-transform text-center shadow-[2px_2px_0px_#000] border-2 border-black hover:translate-x-[1px] hover:translate-y-[1px]"
                                    >
                                        1-Click Switch
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Live 3-in-1 Simulator Link & Multi-window Instructions */}
                        <div className="rounded-xl border-2 border-black bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[3px_3px_0px_#000]">
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-black flex items-center gap-1.5">
                                    <Laptop size={14} />
                                    How to test all 3 simultaneously:
                                </h4>
                                <p className="text-[11px] text-neutral-700 font-medium leading-relaxed">
                                    Option 1: Open <strong>Evaluator</strong> in this tab, open <strong>Participant</strong> in an Incognito window, and open <strong>Volunteer</strong> in a secondary browser (or phone).
                                    <br />
                                    Option 2: Open our <strong>Live 3-in-1 Dashboard Simulator</strong> to preview all three screens side-by-side!
                                </p>
                            </div>
                            <Link
                                href="/dashboard/role-preview"
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#f7cb46] hover:bg-[#ffd24d] text-black font-black text-xs transition-transform shrink-0 shadow-[2px_2px_0px_#000] border-2 border-black hover:translate-x-[1px] hover:translate-y-[1px]"
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
