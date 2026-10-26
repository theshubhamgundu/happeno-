"use client";

import { useState } from "react";
import {
    Award,
    ShieldCheck,
    Phone,
    ArrowLeft,
    ExternalLink,
    RefreshCw,
    Maximize2,
    Laptop,
    Smartphone,
    Monitor
} from "lucide-react";
import Link from "next/link";
import RoleTestSwitcher from "@/components/RoleTestSwitcher";

export default function RolePreviewPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'participant' | 'evaluator' | 'volunteer'>('all');
    const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('desktop');
    const [reloadKey, setReloadKey] = useState(0);

    const refreshFrames = () => {
        setReloadKey(k => k + 1);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Top Global Role Switcher */}
            <RoleTestSwitcher />

            {/* Sub-header Controls */}
            <div className="bg-slate-900/90 border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/admin"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Admin
                    </Link>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div>
                        <h1 className="text-lg font-black italic uppercase tracking-wider text-white flex items-center gap-2">
                            <Laptop size={18} className="text-[#FFEE00]" /> 3-in-1 Multi-Role Testing Hub
                        </h1>
                        <p className="text-[11px] text-white/50">
                            Test Participant, Evaluator, and Volunteer workflows side-by-side.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View mode toggle */}
                    <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'all' ? 'bg-teal-500 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                            Side-by-Side (3-in-1)
                        </button>
                        <button
                            onClick={() => setActiveTab('participant')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'participant' ? 'bg-teal-500 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                            Participant
                        </button>
                        <button
                            onClick={() => setActiveTab('evaluator')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'evaluator' ? 'bg-[#FFEE00] text-black font-black' : 'text-white/60 hover:text-white'}`}
                        >
                            Evaluator
                        </button>
                        <button
                            onClick={() => setActiveTab('volunteer')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'volunteer' ? 'bg-orange-600 text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            Volunteer
                        </button>
                    </div>

                    <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
                        <button
                            onClick={() => setDeviceMode('desktop')}
                            className={`p-1.5 rounded-lg transition-all ${deviceMode === 'desktop' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                            title="Desktop layout"
                        >
                            <Monitor size={15} />
                        </button>
                        <button
                            onClick={() => setDeviceMode('mobile')}
                            className={`p-1.5 rounded-lg transition-all ${deviceMode === 'mobile' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                            title="Mobile phone frames"
                        >
                            <Smartphone size={15} />
                        </button>
                    </div>

                    <button
                        onClick={refreshFrames}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
                        title="Refresh previews"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Split View Content Grid */}
            <main className="flex-1 p-4 md:p-6 overflow-x-auto">
                <div className={`grid gap-6 ${
                    activeTab === 'all'
                        ? 'grid-cols-1 lg:grid-cols-3 min-w-[1050px] lg:min-w-0'
                        : 'grid-cols-1 max-w-5xl mx-auto'
                }`}>
                    {/* PANEL 1: PARTICIPANT */}
                    {(activeTab === 'all' || activeTab === 'participant') && (
                        <div className="flex flex-col rounded-3xl border border-teal-500/30 bg-slate-900/60 shadow-2xl overflow-hidden min-h-[750px]">
                            <div className="px-5 py-3.5 bg-teal-950/40 border-b border-teal-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Award size={18} className="text-teal-400" />
                                    <div>
                                        <h2 className="text-xs font-black uppercase tracking-wider text-teal-300">
                                            1. Participant Portal
                                        </h2>
                                        <span className="text-[10px] text-white/40 font-mono">/dashboard/team</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href="/dashboard/team"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 text-xs font-bold inline-flex items-center gap-1"
                                        title="Open in new window"
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                            <div className="flex-1 bg-black relative flex items-center justify-center p-2">
                                <div className={`w-full h-full transition-all ${deviceMode === 'mobile' ? 'max-w-[420px] border-4 border-slate-700 rounded-3xl overflow-hidden' : ''}`}>
                                    <iframe
                                        key={`participant-${reloadKey}`}
                                        src="/dashboard/team"
                                        className="w-full h-full min-h-[700px] border-0 bg-white"
                                        title="Participant Dashboard Preview"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PANEL 2: EVALUATOR (JUDGE) */}
                    {(activeTab === 'all' || activeTab === 'evaluator') && (
                        <div className="flex flex-col rounded-3xl border border-amber-500/30 bg-slate-900/60 shadow-2xl overflow-hidden min-h-[750px]">
                            <div className="px-5 py-3.5 bg-amber-950/40 border-b border-amber-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-[#FFEE00]" />
                                    <div>
                                        <h2 className="text-xs font-black uppercase tracking-wider text-amber-300">
                                            2. Evaluator Portal
                                        </h2>
                                        <span className="text-[10px] text-white/40 font-mono">/dashboard/judge</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href="/dashboard/judge"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold inline-flex items-center gap-1"
                                        title="Open in new window"
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                            <div className="flex-1 bg-black relative flex items-center justify-center p-2">
                                <div className={`w-full h-full transition-all ${deviceMode === 'mobile' ? 'max-w-[420px] border-4 border-slate-700 rounded-3xl overflow-hidden' : ''}`}>
                                    <iframe
                                        key={`evaluator-${reloadKey}`}
                                        src="/dashboard/judge"
                                        className="w-full h-full min-h-[700px] border-0 bg-slate-950"
                                        title="Evaluator Dashboard Preview"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PANEL 3: VOLUNTEER */}
                    {(activeTab === 'all' || activeTab === 'volunteer') && (
                        <div className="flex flex-col rounded-3xl border border-orange-500/30 bg-zinc-900/60 shadow-2xl overflow-hidden min-h-[750px]">
                            <div className="px-5 py-3.5 bg-orange-950/40 border-b border-orange-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Phone size={18} className="text-orange-400" />
                                    <div>
                                        <h2 className="text-xs font-black uppercase tracking-wider text-orange-300">
                                            3. Volunteer Portal
                                        </h2>
                                        <span className="text-[10px] text-white/40 font-mono">/dashboard/volunteer</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href="/dashboard/volunteer"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 text-xs font-bold inline-flex items-center gap-1"
                                        title="Open in new window"
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                            <div className="flex-1 bg-black relative flex items-center justify-center p-2">
                                <div className={`w-full h-full transition-all ${deviceMode === 'mobile' ? 'max-w-[420px] border-4 border-slate-700 rounded-3xl overflow-hidden' : ''}`}>
                                    <iframe
                                        key={`volunteer-${reloadKey}`}
                                        src="/dashboard/volunteer"
                                        className="w-full h-full min-h-[700px] border-0 bg-slate-950"
                                        title="Volunteer Dashboard Preview"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
