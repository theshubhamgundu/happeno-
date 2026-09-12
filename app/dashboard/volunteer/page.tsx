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
    AlertTriangle
} from "lucide-react";

import { useHackathon, Project } from "@/context/HackathonContext";
import { useState, useMemo } from "react";
import { QRScanner } from "@/components/QRScanner";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function VolunteerDashboard() {
    const { user } = useAuth();
    const { projects, checkInTeam, isLoading, volunteers, emergencyContact } = useHackathon();
    const [activeTab, setActiveTab] = useState<'roster' | 'checkin'>('roster');
    const [showScanner, setShowScanner] = useState(false);
    const [scannedTeam, setScannedTeam] = useState<Project | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const currentVolunteer = useMemo(() => {
        return volunteers.find(v => v.id === user?.id || v.generatedId === user?.id);
    }, [volunteers, user]);

    const assignedTeams = useMemo(() => {
        if (!currentVolunteer) return [];
        return projects.filter(p =>
            p.coordinator?.name === currentVolunteer.name &&
            (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.teamId?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [projects, searchQuery, currentVolunteer]);

    const handleScan = (data: string) => {
        let identifier = data.trim();
        try {
            const parsed = JSON.parse(data);
            identifier = parsed.transactionId || parsed.teamId || identifier;
        } catch (e) { }

        const team = projects.find(p =>
            p.teamId?.toLowerCase() === identifier.toLowerCase() ||
            p.id?.toString().toLowerCase() === identifier.toLowerCase() ||
            (p as any).transaction_id?.toLowerCase() === identifier.toLowerCase()
        );

        if (team) {
            setScannedTeam(team);
            setShowScanner(false);
            // We stay on the current tab but the result modal will pop up
            return true;
        }
        return false;
    };

    const handleCheckIn = async () => {
        if (scannedTeam) {
            const result = await checkInTeam(scannedTeam.id);
            setScannedTeam(prev => prev ? { ...prev, isCheckedIn: true } : null);
            toast.success(`${scannedTeam.name} verified!`);
            // Brief delay then close
            setTimeout(() => setScannedTeam(null), 1500);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout type="volunteer" title="Ops Command">
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-black italic text-purple-400 text-sm flex-shrink-0">
                        {currentVolunteer.name?.[0]?.toUpperCase() ?? "V"}
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.25em]">Logged in as</p>
                        <p className="text-sm font-black italic uppercase tracking-tight text-white leading-none">
                            {currentVolunteer.name}
                            <span className="ml-2 text-[9px] font-bold normal-case not-italic text-purple-400/70 tracking-widest">
                                {currentVolunteer.generatedId}
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* Mobile Tab Navigation - Sticky/High Viz */}
            <div className="sticky top-0 z-30 pt-2 pb-6 bg-[#06000D]">
                <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('roster')}
                        className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] tracking-widest transition-all ${activeTab === 'roster' ? 'bg-[#FFEE00] text-black shadow-lg shadow-[#FFEE00]/20' : 'text-white/30'}`}
                    >
                        Squads
                    </button>
                    <button
                        onClick={() => setActiveTab('checkin')}
                        className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] tracking-widest transition-all ${activeTab === 'checkin' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/30'}`}
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
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
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
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white text-xs font-bold focus:outline-none focus:border-purple-500/50"
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
                                                <span className="text-[9px] font-black text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded uppercase tracking-tighter">ID: {team.teamId}</span>
                                                {team.isCheckedIn && (
                                                    <span className="text-[8px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                                                        <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" /> Verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 border border-purple-500/20 font-black italic">
                                            {team.name[0]}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3.5 rounded-2xl border border-white/10 shadow-inner">
                                            <span className="text-[7px] md:text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1.5">Ops Location</span>
                                            <div className="flex items-center gap-2 text-white/90 font-black italic text-xs">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
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
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 pt-10">
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-purple-600 to-purple-800 rounded-[3rem] flex items-center justify-center shadow-[0_0_50px_rgba(147,51,234,0.3)] relative z-10 transition-transform group-hover:scale-105 duration-500">
                            <QrCode size={56} className="text-white" />
                        </div>
                        <div className="absolute inset-0 bg-purple-600/30 blur-[60px] animate-pulse rounded-full" />
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Scanner Hub</h2>
                        <div className="flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em]">Operational Readiness Status: Green</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowScanner(true)}
                        className="w-full py-6 bg-[#FFEE00] text-black font-black uppercase italic rounded-2xl shadow-[0_15px_40px_rgba(255,238,0,0.15)] hover:shadow-none hover:translate-y-1 text-sm tracking-widest transition-all"
                    >
                        Initialize Tactical Scanner
                    </button>

                    <div className="pt-8 flex items-center gap-4 w-full opacity-30">
                        <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent to-white" />
                        <span className="text-[8px] font-black text-white uppercase tracking-[0.5em]">Command & Control</span>
                        <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent to-white" />
                    </div>
                </div>
            )}

            {/* Verification Result Modal - THE BIG CHANGE */}
            <AnimatePresence>
                {scannedTeam && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setScannedTeam(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="relative w-full max-w-lg bg-[#0D0219] border-t-2 sm:border-2 border-purple-500/30 rounded-t-[2.5rem] sm:rounded-[3rem] p-8 pb-10 sm:p-10 shadow-2xl z-[210] overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400 font-black italic border border-purple-500/20">
                                        {scannedTeam.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{scannedTeam.name}</h3>
                                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest mt-1 block">ID: {scannedTeam.teamId}</span>
                                    </div>
                                </div>
                                <button onClick={() => setScannedTeam(null)} className="p-2 text-white/20">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Roster Check</span>
                                    <div className="grid grid-cols-1 gap-2">
                                        {scannedTeam.members.map((m: any, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                                <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-[8px] font-black text-purple-400">
                                                    {i + 1}
                                                </div>
                                                <span className="font-bold text-white uppercase italic text-xs truncate">
                                                    {typeof m === 'string' ? m : m.fullName}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <div className={`p-5 rounded-2xl flex items-center gap-4 ${scannedTeam.isCheckedIn ? 'bg-green-500/10 border border-green-500/20' : 'bg-purple-500/5 border border-purple-500/20'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scannedTeam.isCheckedIn ? 'bg-green-500 text-white' : 'bg-purple-600 text-white'}`}>
                                            {scannedTeam.isCheckedIn ? <CheckCircle2 size={24} /> : <Activity size={24} />}
                                        </div>
                                        <div>
                                            <span className="text-sm font-black uppercase italic text-white block">Status</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${scannedTeam.isCheckedIn ? 'text-green-500' : 'text-purple-400'}`}>
                                                {scannedTeam.isCheckedIn ? 'Access Granted' : 'Awaiting Entry'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setScannedTeam(null)}
                                            className="flex-1 py-4 rounded-xl border border-white/10 text-white/40 font-black uppercase italic text-[10px] tracking-widest"
                                        >
                                            Discard
                                        </button>
                                        <button
                                            onClick={handleCheckIn}
                                            disabled={scannedTeam.isCheckedIn}
                                            className={`flex-[2] py-4 rounded-xl font-black uppercase italic text-[10px] tracking-widest shadow-xl transition-all ${scannedTeam.isCheckedIn ? 'bg-green-600 text-white opacity-50 cursor-not-allowed' : 'bg-[#FFEE00] text-black active:scale-95'}`}
                                        >
                                            {scannedTeam.isCheckedIn ? 'ALREADY VERIFIED' : 'CONFIRM ENTRY'}
                                        </button>
                                    </div>
                                </div>
                            </div>
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
