"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    Users,
    MapPin,
    Target,
    CheckCircle2,
    Search,
    Phone,
    X,
    QrCode,
    Activity,
    AlertTriangle,
    Coffee
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
    const { projects, checkInTeam, claimMemberMeal, isLoading, volunteers, emergencyContact, enabledMeals } = useHackathon();
    const [activeTab, setActiveTab] = useState<'roster' | 'scanner'>('roster');
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
    const [searchQuery, setSearchQuery] = useState("");

    const currentVolunteer = useMemo(() => {
        return volunteers.find(v => v.id === user?.id || v.generatedId === user?.id);
    }, [volunteers, user]);

    const assignedTeams = useMemo(() => {
        return projects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.teamId?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

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
            identifier = parsed.transactionId || parsed.teamId || identifier;
            passType = parsed.passType || 'legacy';
            memberId = parsed.memberId || '';
        } catch (e) { }

        const team = projects.find(p =>
            p.teamId?.toLowerCase() === identifier.toLowerCase() ||
            p.id?.toString().toLowerCase() === identifier.toLowerCase() ||
            (p as any).transaction_id?.toLowerCase() === identifier.toLowerCase()
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
            <DashboardLayout type="volunteer" title="Ops Command">
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/20 font-black uppercase italic text-[10px] tracking-widest text-center">Syncing Hub...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="volunteer" title="Ops Command">

            {/* Volunteer identity — mobile only (desktop shows name in navbar) */}
            {currentVolunteer && (
                <div className="flex items-center gap-3 mb-4 lg:hidden">
                    <div className="w-9 h-9 rounded-xl bg-slate-900/20 border border-slate-800/30 flex items-center justify-center font-black italic text-slate-900 text-sm flex-shrink-0">
                        {currentVolunteer.name?.[0]?.toUpperCase() ?? "V"}
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.25em]">Logged in as</p>
                        <p className="text-sm font-black italic uppercase tracking-tight text-white leading-none">
                            {currentVolunteer.name}
                            <span className="ml-2 text-[9px] font-bold normal-case not-italic text-slate-900/70 tracking-widest">
                                {currentVolunteer.generatedId}
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* Mobile Tab Navigation - Sticky/High Viz */}
            <div className="mb-4">
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
                    <button
                        onClick={() => setActiveTab('roster')}
                        className={`flex-1 rounded-md py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'roster' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500'}`}
                    >
                        Squads
                    </button>
                    <button
                        onClick={() => setActiveTab('scanner')}
                        className={`flex-1 rounded-md py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'scanner' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500'}`}
                    >
                        Scanner
                    </button>
                </div>
            </div>

            {activeTab === 'roster' ? (
                <div className="space-y-4">

                    {/* Emergency Contact — Compact */}
                    {emergencyContact?.name && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-center gap-3 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl"
                        >
                            {/* Pulse dot */}
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-60" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900" />
                            </span>

                            {/* Label + contact */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.2em]">Emergency Contact</p>
                                <p className="text-white font-black italic uppercase tracking-tight text-sm leading-tight truncate">
                                    {emergencyContact.name}
                                    <span className="text-white/30 font-bold normal-case not-italic tracking-normal text-[10px] ml-2">
                                        {emergencyContact.phone}
                                    </span>
                                </p>
                            </div>

                            {/* Call button */}
                            <a
                                href={`tel:${emergencyContact.phone}`}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFEE00] text-black font-black uppercase italic text-[9px] tracking-widest active:scale-95 transition-all"
                            >
                                <Phone size={11} /> Call
                            </a>
                        </motion.div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input
                            type="text"
                            placeholder="Find a squad..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white text-xs font-bold focus:outline-none focus:border-slate-800/50"
                        />
                    </div>

                    <div className="space-y-3 pb-20">
                        {assignedTeams.length > 0 ? (
                            assignedTeams.map((team: Project) => (
                                <div key={team.id} className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden active:scale-[0.98] transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black italic uppercase tracking-tight text-white leading-none">{team.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-slate-900 bg-slate-900/10 px-2 py-0.5 rounded uppercase tracking-tighter">ID: {team.teamId}</span>
                                                {team.isCheckedIn && (
                                                    <span className="text-[8px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                                                        <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" /> Verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-slate-900/20 flex items-center justify-center text-slate-900 border border-slate-800/20 font-black italic">
                                            {team.name[0]}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3.5 rounded-2xl border border-white/10 shadow-inner">
                                            <span className="text-[7px] md:text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1.5">Ops Location</span>
                                            <div className="flex items-center gap-2 text-white/90 font-black italic text-xs">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                                {team.room || "TBD"}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3.5 rounded-2xl border border-white/10 shadow-inner">
                                            <span className="text-[7px] md:text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1.5">Squad Lead</span>
                                            <div className="flex items-center gap-2 text-white/90 font-black italic text-xs truncate">
                                                <Users size={11} className="text-blue-500 shrink-0" />
                                                {team.captain}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Call Lead Button — subtle but accessible */}
                                    <a href={`tel:${team.captainMobile}`} className="flex items-center justify-center gap-2 w-full py-3.5 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all">
                                        <Phone size={11} /> Secure Comms: {team.captainMobile}
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                <Target size={32} className="mx-auto text-white/10 mb-4" />
                                <p className="text-white/20 font-black uppercase tracking-widest text-[10px]">No Assigned Squads</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* === UNIFIED SCANNER TAB === */
                <div className="space-y-5">
                    {/* Stats Strip */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.2em]">Checked In</p>
                            <p className="text-2xl font-black text-white mt-1">
                                {projects.filter(p => p.isCheckedIn || p.checkedInAt).length}
                                <span className="text-white/20 text-sm">/{projects.length}</span>
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.2em]">Meals Claimed</p>
                            <p className="text-2xl font-black text-white mt-1">
                                {projects.reduce((sum, p) => {
                                    const mms = p.memberMealState || {};
                                    return sum + Object.values(mms).reduce((ms, slots) => ms + Object.values(slots).filter(s => s.claimedAt).length, 0);
                                }, 0)}
                            </p>
                        </div>
                    </div>

                    {/* Scanner Launch Card */}
                    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-700">
                            <QrCode size={28} />
                        </div>
                        <h2 className="mt-3 text-base font-semibold text-slate-800">Unified Pass Scanner</h2>
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

                    {/* Enabled meals info */}
                    {enabledMeals.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.2em] mb-2">Active Meals</p>
                            <div className="flex flex-wrap gap-2">
                                {enabledMeals.map(key => {
                                    const config = EVENT_MEALS.find(m => m.key === key);
                                    return (
                                        <span key={key} className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                            {config ? config.shortLabel : key}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

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
