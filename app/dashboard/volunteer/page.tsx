"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    CheckCircle2,
    X,
    QrCode,
    AlertTriangle
} from "lucide-react";

import { useHackathon, Project } from "@/context/HackathonContext";
import { useState, useMemo } from "react";
import { QRScanner } from "@/components/QRScanner";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { EVENT_MEALS } from "@/lib/meals";

export default function VolunteerDashboard() {
    const { user } = useAuth();
    const { projects, checkInTeam, claimMemberMeal, isLoading, volunteers, enabledMeals } = useHackathon();
    const [showScanner, setShowScanner] = useState(false);
    const [scannedTeam, setScannedTeam] = useState<Project | null>(null);
    const [scanResult, setScanResult] = useState<{ 
        type: 'checkin' | 'meal';
        status: 'PERMITTED' | 'ALREADY_CLAIMED' | 'NOT_INCLUDED' | 'ALREADY_CHECKED_IN' | 'REJECTED' | 'ALL_MEALS_CLAIMED' | 'NEEDS_CHECKIN'; 
        message?: string;
        claimedAt?: string; 
        claimedBy?: string;
        mealName?: string;
        memberId?: string;
    } | null>(null);
    const currentVolunteer = useMemo(() => {
        return volunteers.find(v => v.id === user?.id || v.generatedId === user?.id);
    }, [volunteers, user]);

    const handleScan = (data: string) => {
        // Start async processing but return synchronously
        processScan(data);
        return true; // Always return true to indicate scan was received
    };

    const processScan = async (data: string) => {
        let identifier = data.trim();
        let passType = 'legacy';
        let memberId = '';

        try {
            const parsed = JSON.parse(data);
            identifier = String(parsed.registrationId || parsed.teamId || identifier).trim();
            passType = parsed.passType || 'legacy';
            memberId = parsed.memberId || '';
        } catch (e) { }

        const normalizedIdentifier = identifier.trim().toUpperCase();
        const team = projects.find(project =>
            String(project.teamId || "").trim().toUpperCase() === normalizedIdentifier ||
            String(project.id || "").trim().toUpperCase() === normalizedIdentifier
        );

        if (team) {
            setScannedTeam(team);
            setShowScanner(false);
            
            if (passType === 'leader' || passType === 'legacy') {
                if (team.checkedInAt || team.isCheckedIn) {
                    setScanResult({ type: 'checkin', status: 'ALREADY_CHECKED_IN', message: 'Team already checked in' });
                } else {
                    await checkInTeam(team.id);
                    setScanResult({ type: 'checkin', status: 'PERMITTED', message: 'Check-in successful' });
                    toast.success(`${team.name} verified!`);
                }
            } else if (passType === 'member') {
                if (!team.checkedInAt && !team.isCheckedIn) {
                    setScanResult({ type: 'checkin', status: 'REJECTED', message: 'Team check-in not completed. Scan Team Leader pass first.' });
                } else {
                    await handleMemberMeal(team, memberId);
                }
            }
        } else {
            toast.error("Invalid QR Pass: Team not found");
        }
    };

    const handleMemberMeal = async (team: Project, memberId: string) => {
        if (!enabledMeals || enabledMeals.length === 0) {
            setScanResult({ type: 'meal', status: 'NOT_INCLUDED', message: 'No meals are currently enabled for this event.' });
            return;
        }

        const memberSlots = team.memberMealState?.[memberId] || {};
        
        // Find next expected meal
        let nextMealKey: string | null = null;
        for (const mealKey of enabledMeals) {
            if (!memberSlots[mealKey]?.claimedAt) {
                nextMealKey = mealKey;
                break;
            }
        }

        if (!nextMealKey) {
            setScanResult({ type: 'meal', status: 'ALL_MEALS_CLAIMED', message: 'All meals claimed' });
            return;
        }

        const result = await claimMemberMeal(team.id, memberId, nextMealKey, currentVolunteer?.id);
        const mealConfig = EVENT_MEALS.find(m => m.key === nextMealKey);
        const mealLabel = mealConfig ? `${mealConfig.dayLabel} ${mealConfig.mealLabel}` : nextMealKey;

        if (result.status === 'PERMITTED') {
            setScanResult({ type: 'meal', status: 'PERMITTED', message: `${mealLabel} Claimed`, mealName: mealLabel, memberId, claimedAt: result.claimedAt });
            toast.success("Meal claimed successfully!");
        } else if (result.status === 'ALREADY_CLAIMED') {
            setScanResult({ type: 'meal', status: 'ALREADY_CLAIMED', message: `${mealLabel} already claimed`, mealName: mealLabel, memberId, claimedAt: result.claimedAt });
            toast.error("Meal already claimed!");
        } else {
            setScanResult({ type: 'meal', status: result.status, message: 'Scan rejected' });
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
            <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-700">
                            <QrCode size={28} />
                        </div>
                        <h2 className="mt-3 text-base font-semibold text-slate-800">Pass Scanner</h2>
                        <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                            Scan any pass — the system automatically detects whether it&apos;s a <strong>Team Leader</strong> (check-in) or <strong>Member</strong> (meal) pass.
                        </p>
                        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready to scan
                        </p>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="mt-5 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 active:scale-[0.98]"
                        >
                            Open Scanner
                        </button>
            </div>

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
                                const isYellow = scanResult.status === 'ALREADY_CHECKED_IN' || scanResult.status === 'ALREADY_CLAIMED' || scanResult.status === 'ALL_MEALS_CLAIMED';
                                const isRed = scanResult.status === 'REJECTED' || scanResult.status === 'NOT_INCLUDED' || scanResult.status === 'NEEDS_CHECKIN';

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
            <AnimatePresence>
                {showScanner && (
                    <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </DashboardLayout>
    );
}
