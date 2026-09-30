"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    CheckCircle2,
    X,
    AlertTriangle
} from "lucide-react";

import { useHackathon, Project } from "@/context/HackathonContext";
import { useState } from "react";
import { QRScanner } from "@/components/QRScanner";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EVENT_MEALS } from "@/lib/meals";

export default function VolunteerDashboard() {
    const { isLoading } = useHackathon();
    const [scannedTeam, setScannedTeam] = useState<Project | null>(null);
    const [scanResult, setScanResult] = useState<{ 
        type: 'checkin' | 'meal';
        status: 'PERMITTED' | 'ALREADY_CLAIMED' | 'NOT_INCLUDED' | 'ALREADY_CHECKED_IN' | 'REJECTED' | 'ALL_MEALS_CLAIMED' | 'NEEDS_CHECKIN' | 'DUPLICATE_SCAN';
        message?: string;
        claimedAt?: string; 
        claimedBy?: string;
        mealName?: string;
        memberId?: string;
    } | null>(null);
    const processScan = async (data: string): Promise<boolean> => {
        setScanResult(null);
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
            toast.error('Invalid QR pass.');
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
                toast.error(payload.error || 'Scan could not be verified. Try again.');
                return false;
            }

            const result = payload.result as Record<string, unknown>;
            const teamName = String(result.teamName || 'Team');
            const canonicalTeamId = String(result.teamId || teamId).toUpperCase();
            const mealKey = typeof result.mealKey === 'string' ? result.mealKey : '';
            const mealConfig = EVENT_MEALS.find(meal => meal.key === mealKey);
            const mealLabel = mealConfig ? `${mealConfig.dayLabel} ${mealConfig.mealLabel}` : mealKey;
            setScannedTeam({
                id: canonicalTeamId,
                teamId: canonicalTeamId,
                name: teamName,
                team: teamName,
                track: '',
                problemStatement: '',
                members: [],
                captain: '',
                captainMobile: '',
                college: '',
                roundScores: {}
            });

            if (result.status === 'PERMITTED' && passType !== 'member') {
                setScanResult({ type: 'checkin', status: 'PERMITTED', message: 'Check-in successful' });
                toast.success(`${teamName} checked in.`);
            } else if (result.status === 'ALREADY_CHECKED_IN') {
                setScanResult({ type: 'checkin', status: 'ALREADY_CHECKED_IN', message: 'Team already checked in' });
            } else if (result.status === 'PERMITTED') {
                setScanResult({ type: 'meal', status: 'PERMITTED', message: `${mealLabel} claimed`, mealName: mealLabel, memberId, claimedAt: String(result.claimedAt || '') });
                toast.success(`${mealLabel} claimed.`);
            } else if (result.status === 'DUPLICATE_SCAN') {
                setScanResult({ type: 'meal', status: 'DUPLICATE_SCAN', message: 'This pass was just scanned. Wait a few seconds and try again if needed.' });
            } else if (result.status === 'ALL_MEALS_CLAIMED') {
                setScanResult({ type: 'meal', status: 'ALL_MEALS_CLAIMED', message: 'All included meals have been claimed.' });
            } else if (result.status === 'NEEDS_CHECKIN') {
                setScanResult({ type: 'meal', status: 'NEEDS_CHECKIN', message: 'Scan the team leader pass before claiming meals.' });
            } else {
                setScanResult({ type: 'meal', status: 'NOT_INCLUDED', message: 'No unclaimed meal is assigned to this participant.' });
            }
            return true;
        } catch (error) {
            console.error('Volunteer scan request failed:', error);
            toast.error('Scanner could not reach the server. Retry the scan.');
            return false;
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout type="volunteer" title="Volunteer Scanner">
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/20 font-black uppercase italic text-[10px] tracking-widest text-center">Syncing Hub...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="volunteer" title="Volunteer Scanner">
            {!scannedTeam && <QRScanner onScan={processScan} onClose={() => undefined} showCloseButton={false} />}

            {/* ====== UNIFIED RESULT MODAL ====== */}
            <AnimatePresence>
                {scannedTeam && scanResult && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setScannedTeam(null); setScanResult(null); }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="relative w-full max-w-lg bg-[#0D0219] border-t-2 sm:border-2 border-slate-800/30 rounded-t-[2.5rem] sm:rounded-[3rem] p-8 pb-10 sm:p-10 shadow-2xl z-[210] overflow-hidden"
                        >
                            {/* Team Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900/20 flex items-center justify-center text-slate-900 font-black italic border border-slate-800/20">
                                        {scannedTeam.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{scannedTeam.name}</h3>
                                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest mt-1 block">ID: {scannedTeam.teamId}</span>
                                    </div>
                                </div>
                                <button onClick={() => { setScannedTeam(null); setScanResult(null); }} className="p-2 text-white/20">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Result Status Card */}
                            {(() => {
                                const isGreen = scanResult.status === 'PERMITTED';
                                const isYellow = scanResult.status === 'ALREADY_CHECKED_IN' || scanResult.status === 'ALREADY_CLAIMED' || scanResult.status === 'ALL_MEALS_CLAIMED' || scanResult.status === 'DUPLICATE_SCAN';
                                const bgColor = isGreen ? 'bg-green-500/10 border-green-500/20' : isYellow ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
                                const iconBg = isGreen ? 'bg-green-500' : isYellow ? 'bg-amber-500' : 'bg-red-500';
                                const textColor = isGreen ? 'text-green-400' : isYellow ? 'text-amber-400' : 'text-red-400';
                                const Icon = isGreen ? CheckCircle2 : isYellow ? AlertTriangle : X;

                                return (
                                    <div className="space-y-5">
                                        <div className={`p-5 rounded-2xl flex items-center gap-4 border ${bgColor}`}>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} text-white shrink-0`}>
                                                <Icon size={26} />
                                            </div>
                                            <div>
                                                <span className={`text-lg font-black uppercase italic block ${textColor}`}>
                                                    {scanResult.type === 'checkin' ? (
                                                        isGreen ? 'Check-in Valid' : isYellow ? 'Already Checked In' : 'Rejected'
                                                    ) : (
                                                        isGreen ? 'Meal Granted' : isYellow ? (scanResult.status === 'ALL_MEALS_CLAIMED' ? 'All Done' : 'Already Claimed') : 'Rejected'
                                                    )}
                                                </span>
                                                <span className="text-[10px] font-bold text-white/50 block mt-0.5">
                                                    {scanResult.message}
                                                </span>
                                                {scanResult.mealName && (
                                                    <span className="text-[10px] font-black text-white/70 block mt-1">
                                                        Meal: {scanResult.mealName}
                                                    </span>
                                                )}
                                                {scanResult.claimedAt && (
                                                    <span className="text-[9px] font-bold text-white/40 block mt-0.5">
                                                        at {new Date(scanResult.claimedAt).toLocaleTimeString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dismiss */}
                                        <button
                                            onClick={() => { setScannedTeam(null); setScanResult(null); }}
                                            className="w-full py-4 rounded-xl border border-white/10 text-white font-black uppercase italic text-[10px] tracking-widest bg-white/5 hover:bg-white/10 transition-all"
                                        >
                                            Scan Next
                                        </button>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Scanner UI */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </DashboardLayout>
    );
}
