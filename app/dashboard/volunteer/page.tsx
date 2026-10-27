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
    ShieldAlert,
    Utensils,
    Network
} from "lucide-react";

import { useHackathon, Project } from "@/context/HackathonContext";
import { useState, useCallback } from "react";
import { QRScanner } from "@/components/QRScanner";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
    const [activeModule, setActiveModule] = useState<'checkin' | 'meal' | 'networking'>('checkin');
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

        // --- MODULE SPECIFIC ROUTING ---
        let endpoint = '';
        if (activeModule === 'checkin') {
            endpoint = '/api/volunteer/checkin';
        } else if (activeModule === 'meal') {
            endpoint = '/api/volunteer/dinner';
        } else if (activeModule === 'networking') {
            endpoint = '/api/volunteer/networking';
        }

        try {
            const response = await fetch(endpoint, {
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
            const status = (result.status as ScanAuditEntry['status']) || 'PERMITTED';

            let msg = '';
            let isSuccess = false;

            if (status === 'PERMITTED' && activeModule === 'checkin') {
                msg = 'Check-in validated! Gate entry authorized.';
                isSuccess = true;
                toast.success(`${teamName} checked in.`);
                // Sync context state
                const targetProject = projects.find(p => String(p.teamId).toUpperCase() === canonicalTeamId || String(p.id).toUpperCase() === canonicalTeamId);
                if (targetProject) {
                    targetProject.isCheckedIn = true;
                    targetProject.checkedInAt = new Date().toISOString();
                }
            } else if (status === 'PERMITTED' && (activeModule === 'meal' || activeModule === 'networking')) {
                const label = activeModule === 'networking' ? 'Networking Event' : 'Dinner';
                msg = `${label} granted for ${result.memberName || 'Participant'}.`;
                isSuccess = true;
                toast.success(`${teamName}: ${label} claimed.`);
            } else if (status === 'ALREADY_CHECKED_IN') {
                msg = 'Team has already completed gate check-in.';
                isSuccess = true; // still a valid pass, just warning
                toast.warning(`${teamName} was already checked in.`);
            } else if (status === 'ALREADY_CLAIMED') {
                const label = activeModule === 'networking' ? 'Networking' : 'Dinner';
                msg = `${result.memberName || 'Participant'} has already claimed ${label}.`;
                isSuccess = false;
                toast.error(`${label} already claimed.`);
            } else if (status === 'NEEDS_CHECKIN') {
                msg = 'Must scan team leader gate pass first!';
                isSuccess = false;
                toast.error('Team must check in at gate first!');
            } else {
                msg = `Access Pass not valid for this participant.`;
                isSuccess = false;
                toast.error('Pass validation failed for this participant.');
            }

            const newEntry: ScanAuditEntry = {
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toLocaleTimeString(),
                teamId: canonicalTeamId,
                teamName,
                passType,
                status,
                message: msg,
                mealLabel: activeModule === 'meal' ? 'Dinner' : (activeModule === 'networking' ? 'Networking' : undefined),
                memberId
            };

            setLastScanEntry(newEntry);

            // If not in rapid mode, trigger the inspection modal
            if (!isRapidMode && activeModule === 'checkin') {
                const target = projects.find(p => String(p.teamId).toUpperCase() === canonicalTeamId || String(p.id).toUpperCase() === canonicalTeamId);
                if (target) setInspectedTeam(target);
            }

            return isSuccess;
        } catch (error) {
            console.error('Volunteer scan failed:', error);
            toast.error('Network error during scan.');
            return false;
        }
    }, [isRapidMode, projects, activeModule]);

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
            <DashboardLayout type="volunteer" title="Scanner" hideHeader hideSidebar>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="w-10 h-10 border-4 border-black border-t-[#f7cb46] rounded-full animate-spin" />
                    <p className="text-black font-black uppercase text-xs tracking-widest text-center">Loading Scanner...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="volunteer" title="Scanner" hideHeader hideSidebar>
            <div className="max-w-2xl mx-auto space-y-5 py-4">
                
                {/* ═══════════ MODULE TABS ═══════════ */}
                <div className="flex bg-white p-1.5 rounded-xl w-full border-2 border-black shadow-[4px_4px_0px_#000] gap-1.5">
                    <button
                        onClick={() => { setActiveModule('checkin'); setLastScanEntry(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border-2 ${
                            activeModule === 'checkin'
                                ? 'bg-[#c0f7fe] text-black border-black shadow-[2px_2px_0px_#000]'
                                : 'bg-transparent text-neutral-800 border-transparent hover:bg-neutral-100 hover:border-black'
                        }`}
                    >
                        <Users size={16} />
                        Gate Check-ins
                    </button>
                    <button
                        onClick={() => { setActiveModule('meal'); setLastScanEntry(null); setIsRapidMode(true); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border-2 ${
                            activeModule === 'meal'
                                ? 'bg-[#ffdc8b] text-black border-black shadow-[2px_2px_0px_#000]'
                                : 'bg-transparent text-neutral-800 border-transparent hover:bg-neutral-100 hover:border-black'
                        }`}
                    >
                        <Utensils size={16} />
                        Dinner Pass
                    </button>
                    <button
                        onClick={() => { setActiveModule('networking'); setLastScanEntry(null); setIsRapidMode(true); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border-2 ${
                            activeModule === 'networking'
                                ? 'bg-[#fe90e8] text-black border-black shadow-[2px_2px_0px_#000]'
                                : 'bg-transparent text-neutral-800 border-transparent hover:bg-neutral-100 hover:border-black'
                        }`}
                    >
                        <Network size={16} />
                        Networking
                    </button>
                </div>

                {/* Mode & Sound controls bar */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_#000]">
                        <span className={`h-2.5 w-2.5 rounded-full border border-black animate-pulse ${activeModule === 'checkin' ? 'bg-[#c0f7fe]' : (activeModule === 'networking' ? 'bg-[#fe90e8]' : 'bg-[#ffdc8b]')}`} />
                        <span className="text-xs font-black uppercase tracking-wider text-black">
                            {activeModule === 'checkin' ? 'Gate QR Scanner' : (activeModule === 'networking' ? 'Networking QR Scanner' : 'Dinner QR Scanner')}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Rapid Mode Toggle (Only show for checkin, meal is always rapid) */}
                        {activeModule === 'checkin' && (
                            <button
                                onClick={() => setIsRapidMode(v => !v)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black text-[10px] font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_#000] ${
                                    isRapidMode
                                        ? 'bg-[#f7cb46] text-black'
                                        : 'bg-white text-black hover:bg-neutral-100'
                                }`}
                                title="In Rapid Mode, the scanner resets automatically without opening a modal"
                            >
                                <Zap size={12} className="text-black" />
                                {isRapidMode ? "Rapid Continuous ON" : "Inspect Mode"}
                            </button>
                        )}

                        {/* Audio Toggle */}
                        <button
                            onClick={() => setSoundEnabled(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black text-[10px] font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_#000] ${
                                soundEnabled
                                    ? 'bg-[#99e885] text-black'
                                    : 'bg-white text-black hover:bg-neutral-100'
                            }`}
                        >
                            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                            {soundEnabled ? "Audio On" : "Muted"}
                        </button>
                    </div>
                </div>

                {/* QR Scanner Component */}
                <div className="rounded-xl overflow-hidden shadow-[4px_4px_0px_#000] border-2 border-black bg-white">
                    <QRScanner
                        onScan={processScan}
                        embedded={true}
                        continuous={activeModule === 'meal' ? true : isRapidMode}
                        autoResetMs={1300}
                        soundEnabled={soundEnabled}
                        onToggleSound={() => setSoundEnabled(v => !v)}
                        title={activeModule === 'checkin' ? (isRapidMode ? "Rapid Gate Check-in" : "Pass Inspection Scan") : "Rapid Dinner Check-in"}
                        subtitle={activeModule === 'meal' ? "Scan Individual Participant QR Codes" : (isRapidMode ? "Continuous active scanning enabled" : "Modal inspect enabled")}
                    />
                </div>

                {/* Live Target Card (Last Scanned) */}
                {lastScanEntry && (
                    <motion.div
                        key={lastScanEntry.id}
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`rounded-xl border-2 border-black p-5 relative overflow-hidden shadow-[4px_4px_0px_#000] ${
                            lastScanEntry.status === 'PERMITTED'
                                ? 'bg-[#99e885] text-black'
                                : lastScanEntry.status === 'ALREADY_CHECKED_IN' || lastScanEntry.status === 'ALREADY_CLAIMED'
                                    ? 'bg-[#ffdc8b] text-black'
                                    : 'bg-[#fe90e8] text-black'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-lg border-2 border-black flex items-center justify-center font-black bg-white text-black shadow-[2px_2px_0px_#000]">
                                    {lastScanEntry.status === 'PERMITTED' ? <CheckCircle2 size={22} /> :
                                        (lastScanEntry.status === 'ALREADY_CHECKED_IN' || lastScanEntry.status === 'ALREADY_CLAIMED') ? <Clock size={22} /> :
                                            <ShieldAlert size={22} />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black uppercase tracking-tight leading-tight text-black">
                                        {lastScanEntry.teamName}
                                    </h4>
                                    <span className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider">
                                        ID: {lastScanEntry.teamId} • {lastScanEntry.timestamp}
                                    </span>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-white border-2 border-black text-black shadow-[1.5px_1.5px_0px_#000]">
                                {lastScanEntry.passType === 'member' ? 'Meal Token' : 'Gate Pass'}
                            </span>
                        </div>
                        <p className="text-sm font-bold mt-3 pt-3 border-t-2 border-black text-black">
                            {lastScanEntry.message}
                        </p>
                        {lastScanEntry.mealLabel && (
                            <div className="mt-2 text-xs font-black text-black bg-white inline-block px-2 py-0.5 rounded border border-black">
                                Meal Slot: {lastScanEntry.mealLabel}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* ═══════════ TEAM DETAILS INSPECTION MODAL ═══════════ */}
            <AnimatePresence>
                {inspectedTeam && activeModule === 'checkin' && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setInspectedTeam(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_#000] z-[260] overflow-hidden text-black"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-black">
                                        {inspectedTeam.team || inspectedTeam.name}
                                    </h3>
                                    <span className="text-xs font-mono font-black text-black bg-[#ffdc8b] px-2 py-0.5 rounded border border-black mt-1 inline-block">
                                        ID: {inspectedTeam.teamId || inspectedTeam.id}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setInspectedTeam(null)}
                                    className="p-2 text-black hover:bg-neutral-100 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 text-xs">
                                {/* Captain info */}
                                <div className="p-3.5 rounded-lg bg-white border-2 border-black space-y-1 shadow-[2px_2px_0px_#000]">
                                    <span className="text-[10px] font-black uppercase text-neutral-600 block">Team Lead / Captain</span>
                                    <div className="text-sm font-black text-black">{inspectedTeam.captain || 'Unassigned'}</div>
                                    {inspectedTeam.captainMobile && (
                                        <div className="text-neutral-800 font-mono text-xs font-bold">{inspectedTeam.captainMobile}</div>
                                    )}
                                    {inspectedTeam.college && (
                                        <div className="text-neutral-700 font-semibold">{inspectedTeam.college}</div>
                                    )}
                                </div>

                                {/* Room / Location */}
                                {(inspectedTeam.room || inspectedTeam.track) && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {inspectedTeam.room && (
                                            <div className="p-3 rounded-lg bg-[#ffdc8b] border-2 border-black shadow-[2px_2px_0px_#000]">
                                                <span className="text-[9px] font-black uppercase text-neutral-700 block">Assigned Room</span>
                                                <span className="text-xs font-black text-black">{inspectedTeam.room}</span>
                                            </div>
                                        )}
                                        {inspectedTeam.track && (
                                            <div className="p-3 rounded-lg bg-[#c0f7fe] border-2 border-black shadow-[2px_2px_0px_#000]">
                                                <span className="text-[9px] font-black uppercase text-black block">Track</span>
                                                <span className="text-xs font-black text-black">{inspectedTeam.track}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Roster */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase text-neutral-600 block">
                                        Team Members ({inspectedTeam.members?.length || 0})
                                    </span>
                                    {inspectedTeam.members?.map((member, idx) => {
                                        const name = typeof member === 'string' ? member : member.fullName;
                                        const email = typeof member === 'string' ? '' : member.email;
                                        return (
                                            <div key={idx} className="p-2.5 rounded-lg bg-white border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_#000]">
                                                <div>
                                                    <span className="font-black text-black block">{name}</span>
                                                    {email && <span className="text-[10px] text-neutral-700 font-semibold">{email}</span>}
                                                </div>
                                                <span className="text-[10px] font-mono font-black text-black bg-[#ffdc8b] px-1.5 py-0.5 rounded border border-black">#{idx + 1}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Check in action in modal */}
                            <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between gap-3">
                                {!inspectedTeam.isCheckedIn ? (
                                    <button
                                        onClick={async () => {
                                            await confirmInspectionCheckIn(inspectedTeam.id, inspectedTeam.team || inspectedTeam.name);
                                            setInspectedTeam(null);
                                        }}
                                        className="w-full py-3 rounded-lg bg-[#99e885] hover:bg-[#86efac] text-black font-black uppercase text-xs tracking-wider border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                    >
                                        Check In Team Now
                                    </button>
                                ) : (
                                    <div className="w-full py-2.5 rounded-lg bg-[#99e885] border-2 border-black text-black font-black uppercase text-xs text-center shadow-[2px_2px_0px_#000]">
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
