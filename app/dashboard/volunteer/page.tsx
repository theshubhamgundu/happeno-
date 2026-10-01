"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    CheckCircle2,
    X,
    Volume2,
    VolumeX,
    Users,
    Zap,
    Clock,
    ShieldAlert
} from "lucide-react";

import { useHackathon, Project } from "@/context/HackathonContext";
import { useState, useCallback } from "react";
import { QRScanner } from "@/components/QRScanner";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EVENT_MEALS } from "@/lib/meals";

interface ScanAuditEntry {
    id: string;
    timestamp: string;
    teamId: string;
    teamName: string;
    passType: 'leader' | 'member' | 'legacy';
    status: 'PERMITTED' | 'ALREADY_CHECKED_IN' | 'ALREADY_CLAIMED' | 'NOT_INCLUDED' | 'REJECTED' | 'ALL_MEALS_CLAIMED' | 'NEEDS_CHECKIN' | 'DUPLICATE_SCAN';
    message: string;
    mealLabel?: string;
    memberId?: string;
}

export default function VolunteerDashboard() {
    const { projects, isLoading, checkInTeam } = useHackathon();
    
    // UI Navigation & Mode state
    const [isRapidMode, setIsRapidMode] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Inspection Modal state
    const [inspectedTeam, setInspectedTeam] = useState<Project | null>(null);

    // Live Scan Feedback
    const [lastScanEntry, setLastScanEntry] = useState<ScanAuditEntry | null>(null);

    // Handle incoming QR Scan
    const processScan = useCallback(async (data: string): Promise<boolean> => {
        let teamId = data.trim();
        let passType: 'legacy' | 'leader' | 'member' = 'legacy';
        let memberId = '';

        try {
            const parsed = JSON.parse(data);
            teamId = String(parsed.teamId || parsed.registrationId || teamId).trim();
            passType = parsed.passType === 'leader' || parsed.passType === 'member' ? parsed.passType : 'legacy';
            memberId = typeof parsed.memberId === 'string' ? parsed.memberId : '';
        } catch { }

        if (!teamId) {
            toast.error('Invalid QR code scanned.');
            return false;
        }

        try {
            const response = await fetch('/api/volunteer/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, passType, memberId })
            });
            const payload = await response.json();
            
            if (!response.ok || !payload.success) {
                const errorMsg = payload.error || 'Scan could not be verified.';
                toast.error(errorMsg);
                const failedEntry: ScanAuditEntry = {
                    id: Math.random().toString(36).substring(7),
                    timestamp: new Date().toLocaleTimeString(),
                    teamId,
                    teamName: 'Unknown / Not Found',
                    passType,
                    status: 'REJECTED',
                    message: errorMsg
                };
                setLastScanEntry(failedEntry);
                return false;
            }

            const result = payload.result as Record<string, unknown>;
            const teamName = String(result.teamName || 'Team');
            const canonicalTeamId = String(result.teamId || teamId).toUpperCase();
            const mealKey = typeof result.mealKey === 'string' ? result.mealKey : '';
            const mealConfig = EVENT_MEALS.find(meal => meal.key === mealKey);
            const mealLabel = mealConfig ? `${mealConfig.dayLabel} ${mealConfig.mealLabel}` : mealKey;
            const status = (result.status as ScanAuditEntry['status']) || 'PERMITTED';

            let msg = '';
            let isSuccess = false;

            if (status === 'PERMITTED' && passType !== 'member') {
                msg = 'Check-in validated! Gate entry authorized (8:00 AM – 11:00 AM window).';
                isSuccess = true;
                toast.success(`${teamName} checked in.`);
                // Sync context state
                const targetProject = projects.find(p => String(p.teamId).toUpperCase() === canonicalTeamId || String(p.id).toUpperCase() === canonicalTeamId);
                if (targetProject) {
                    targetProject.isCheckedIn = true;
                    targetProject.checkedInAt = new Date().toISOString();
                }
            } else if (status === 'ALREADY_CHECKED_IN') {
                msg = 'Team has already completed gate check-in.';
                isSuccess = true; // still a valid pass, just warning
                toast.warning(`${teamName} was already checked in.`);
            } else if (status === 'PERMITTED') {
                msg = `${mealLabel} granted. Single-use token logged.`;
                isSuccess = true;
                toast.success(`${teamName}: ${mealLabel} claimed.`);
            } else if (status === 'DUPLICATE_SCAN') {
                msg = 'Duplicate scan within cooldown window.';
                isSuccess = false;
                toast.warning('Duplicate scan. Wait a moment.');
            } else if (status === 'ALL_MEALS_CLAIMED') {
                msg = 'All included meal tokens have been claimed.';
                isSuccess = false;
                toast.error('All meals have already been claimed.');
            } else if (status === 'NEEDS_CHECKIN') {
                msg = 'Must scan team leader gate pass (8–11 AM) before claiming meals.';
                isSuccess = false;
                toast.error('Team must check in at gate first!');
            } else {
                msg = 'Meal pass not purchased for this participant (Gate-only registration).';
                isSuccess = false;
                toast.error('No meal pass purchased for this participant.');
            }

            const newEntry: ScanAuditEntry = {
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toLocaleTimeString(),
                teamId: canonicalTeamId,
                teamName,
                passType,
                status,
                message: msg,
                mealLabel,
                memberId
            };

            setLastScanEntry(newEntry);

            // If not in rapid mode, trigger the inspection modal
            if (!isRapidMode) {
                const target = projects.find(p => String(p.teamId).toUpperCase() === canonicalTeamId || String(p.id).toUpperCase() === canonicalTeamId);
                if (target) setInspectedTeam(target);
            }

            return isSuccess;
        } catch (error) {
            console.error('Volunteer scan failed:', error);
            toast.error('Network error during scan.');
            return false;
        }
    }, [isRapidMode, projects]);

    // Handle Inspection Modal Check-in
    const confirmInspectionCheckIn = async (projectId: string | number, teamName: string) => {
        try {
            const success = await checkInTeam(projectId);
            if (success) {
                const project = projects.find(p => p.id === projectId);
                const entry: ScanAuditEntry = {
                    id: Math.random().toString(36).substring(7),
                    timestamp: new Date().toLocaleTimeString(),
                    teamId: project?.teamId || String(projectId),
                    teamName,
                    passType: 'legacy',
                    status: 'PERMITTED',
                    message: 'Checked in by volunteer inspection.'
                };
                setLastScanEntry(entry);
            }
        } catch (error) {
            console.error('Inspection check-in failed:', error);
            toast.error('Failed to check in team.');
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout type="volunteer" title="Gate Scanner" hideHeader hideSidebar>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="w-10 h-10 border-4 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest text-center">Loading Gate Scanner...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="volunteer" title="Gate Scanner" hideHeader hideSidebar>
            <div className="max-w-2xl mx-auto space-y-5 py-4">
                {/* Mode & Sound controls bar */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#14b8a6] animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800">Gate QR Scanner</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Rapid Mode Toggle */}
                        <button
                            onClick={() => setIsRapidMode(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                                isRapidMode
                                    ? 'bg-amber-400/10 border-amber-400/40 text-amber-700'
                                    : 'bg-slate-100 border-slate-200 text-slate-500'
                            }`}
                            title="In Rapid Mode, the scanner resets automatically without opening a modal"
                        >
                            <Zap size={12} className={isRapidMode ? "text-amber-500" : "text-slate-400"} />
                            {isRapidMode ? "Rapid Continuous ON" : "Inspect Mode"}
                        </button>

                        {/* Audio Toggle */}
                        <button
                            onClick={() => setSoundEnabled(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                                soundEnabled
                                    ? 'bg-[#14b8a6]/10 border-[#14b8a6]/40 text-[#0d9488]'
                                    : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}
                        >
                            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                            {soundEnabled ? "Audio On" : "Muted"}
                        </button>
                    </div>
                </div>

                {/* QR Scanner Component */}
                <div className="rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                    <QRScanner
                        onScan={processScan}
                        embedded={true}
                        continuous={isRapidMode}
                        autoResetMs={1300}
                        soundEnabled={soundEnabled}
                        onToggleSound={() => setSoundEnabled(v => !v)}
                        title={isRapidMode ? "Rapid Gate Check-in" : "Pass Inspection Scan"}
                        subtitle={isRapidMode ? "Continuous active scanning enabled" : "Modal inspect enabled"}
                    />
                </div>

                {/* Live Target Card (Last Scanned) */}
                {lastScanEntry && (
                    <motion.div
                        key={lastScanEntry.id}
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`rounded-2xl border p-5 relative overflow-hidden shadow-sm ${
                            lastScanEntry.status === 'PERMITTED'
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                : lastScanEntry.status === 'ALREADY_CHECKED_IN' || lastScanEntry.status === 'DUPLICATE_SCAN'
                                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                    : 'bg-rose-50/70 border-rose-200 text-rose-950'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black ${
                                    lastScanEntry.status === 'PERMITTED'
                                        ? 'bg-emerald-600 text-white'
                                        : lastScanEntry.status === 'ALREADY_CHECKED_IN' || lastScanEntry.status === 'DUPLICATE_SCAN'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-rose-600 text-white'
                                }`}>
                                    {lastScanEntry.status === 'PERMITTED' ? <CheckCircle2 size={22} /> :
                                        lastScanEntry.status === 'ALREADY_CHECKED_IN' ? <Clock size={22} /> :
                                            <ShieldAlert size={22} />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black uppercase tracking-tight leading-tight">
                                        {lastScanEntry.teamName}
                                    </h4>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        ID: {lastScanEntry.teamId} • {lastScanEntry.timestamp}
                                    </span>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                lastScanEntry.status === 'PERMITTED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : lastScanEntry.status === 'ALREADY_CHECKED_IN'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                                {lastScanEntry.passType === 'member' ? 'Meal Token' : 'Gate Pass'}
                            </span>
                        </div>
                        <p className="text-sm font-semibold mt-3 pt-3 border-t border-slate-200/60">
                            {lastScanEntry.message}
                        </p>
                        {lastScanEntry.mealLabel && (
                            <div className="mt-2 text-xs font-bold text-teal-700">
                                Meal Slot: {lastScanEntry.mealLabel}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* ═══════════ TEAM DETAILS INSPECTION MODAL ═══════════ */}
            <AnimatePresence>
                {inspectedTeam && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setInspectedTeam(null)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl z-[260] overflow-hidden text-slate-900"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tight text-slate-900">
                                        {inspectedTeam.team || inspectedTeam.name}
                                    </h3>
                                    <span className="text-xs font-mono font-bold text-teal-700 mt-0.5 block">
                                        ID: {inspectedTeam.teamId || inspectedTeam.id}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setInspectedTeam(null)}
                                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 text-xs">
                                {/* Captain info */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Team Lead / Captain</span>
                                    <div className="text-sm font-bold text-slate-900">{inspectedTeam.captain || 'Unassigned'}</div>
                                    {inspectedTeam.captainMobile && (
                                        <div className="text-slate-600 font-mono text-xs">{inspectedTeam.captainMobile}</div>
                                    )}
                                    {inspectedTeam.college && (
                                        <div className="text-slate-500">{inspectedTeam.college}</div>
                                    )}
                                </div>

                                {/* Room / Location */}
                                {(inspectedTeam.room || inspectedTeam.track) && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {inspectedTeam.room && (
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                <span className="text-[9px] font-bold uppercase text-slate-400 block">Assigned Room</span>
                                                <span className="text-xs font-bold text-slate-800">{inspectedTeam.room}</span>
                                            </div>
                                        )}
                                        {inspectedTeam.track && (
                                            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                                                <span className="text-[9px] font-bold uppercase text-teal-700 block">Track</span>
                                                <span className="text-xs font-bold text-teal-800">{inspectedTeam.track}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Roster */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                                        Team Members ({inspectedTeam.members?.length || 0})
                                    </span>
                                    {inspectedTeam.members?.map((member, idx) => {
                                        const name = typeof member === 'string' ? member : member.fullName;
                                        const email = typeof member === 'string' ? '' : member.email;
                                        return (
                                            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-slate-800 block">{name}</span>
                                                    {email && <span className="text-[10px] text-slate-500">{email}</span>}
                                                </div>
                                                <span className="text-[10px] font-mono font-semibold text-slate-400">#{idx + 1}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Check in action in modal */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                {!inspectedTeam.isCheckedIn ? (
                                    <button
                                        onClick={async () => {
                                            await confirmInspectionCheckIn(inspectedTeam.id, inspectedTeam.team || inspectedTeam.name);
                                            setInspectedTeam(null);
                                        }}
                                        className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold uppercase text-xs tracking-wider transition-all shadow-sm"
                                    >
                                        Check In Team Now
                                    </button>
                                ) : (
                                    <div className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase text-xs text-center">
                                        Team Already Checked In ✓
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
            `}</style>
        </DashboardLayout>
    );
}
