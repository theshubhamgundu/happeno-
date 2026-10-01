"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    CheckCircle2,
    X,
    AlertTriangle,
    QrCode,
    Search,
    Utensils,
    History,
    Volume2,
    VolumeX,
    Users,
    Zap,
    ExternalLink,
    Clock,
    Phone,
    Building2,
    ShieldAlert
} from "lucide-react";

import { useHackathon, Project } from "@/context/HackathonContext";
import { useState, useMemo, useCallback } from "react";
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
    const { projects, isLoading, checkInTeam, enabledMeals } = useHackathon();
    
    // UI Navigation & Mode state
    const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'meals' | 'audit'>('scan');
    const [isRapidMode, setIsRapidMode] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Inspection Modal state
    const [inspectedTeam, setInspectedTeam] = useState<Project | null>(null);

    // Live Scan Feedback
    const [lastScanEntry, setLastScanEntry] = useState<ScanAuditEntry | null>(null);
    const [auditLog, setAuditLog] = useState<ScanAuditEntry[]>([]);
    const [sessionScanCount, setSessionScanCount] = useState(0);

    // Manual Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'checked_in'>('all');
    const [processingTeamId, setProcessingTeamId] = useState<string | null>(null);

    // Meal Station state
    const [selectedMealKey, setSelectedMealKey] = useState<string>(() => enabledMeals[0] || "day1_lunch");

    // Real-time Check-in statistics
    const stats = useMemo(() => {
        const total = projects.length;
        const checkedIn = projects.filter(p => p.isCheckedIn).length;
        const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
        
        let totalMealsClaimed = 0;
        let totalMealsIncluded = 0;
        projects.forEach(p => {
            if (p.memberMealState) {
                Object.values(p.memberMealState).forEach(memberSlots => {
                    Object.values(memberSlots).forEach(slot => {
                        totalMealsIncluded++;
                        if (slot.claimedAt) totalMealsClaimed++;
                    });
                });
            }
        });

        return { total, checkedIn, percentage, totalMealsClaimed, totalMealsIncluded };
    }, [projects]);

    // Filtered teams for Manual Check-In
    const filteredTeams = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return projects.filter(team => {
            // Status filter
            if (statusFilter === 'pending' && team.isCheckedIn) return false;
            if (statusFilter === 'checked_in' && !team.isCheckedIn) return false;

            if (!q) return true;

            const name = (team.team || team.name || "").toLowerCase();
            const id = (team.teamId || String(team.id) || "").toLowerCase();
            const captain = (team.captain || "").toLowerCase();
            const phone = (team.captainMobile || "").toLowerCase();
            const college = (team.college || "").toLowerCase();

            return name.includes(q) || id.includes(q) || captain.includes(q) || phone.includes(q) || college.includes(q);
        });
    }, [projects, searchQuery, statusFilter]);

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
                setAuditLog(prev => [failedEntry, ...prev.slice(0, 49)]);
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
                msg = 'Check-in validated! Gate entry authorized.';
                isSuccess = true;
                toast.success(`${teamName} checked in.`);
                // Sync context state
                const targetProject = projects.find(p => String(p.teamId).toUpperCase() === canonicalTeamId || String(p.id).toUpperCase() === canonicalTeamId);
                if (targetProject) {
                    targetProject.isCheckedIn = true;
                    targetProject.checkedInAt = new Date().toISOString();
                }
            } else if (status === 'ALREADY_CHECKED_IN') {
                msg = 'Team has already checked in previously.';
                isSuccess = true; // still a valid pass, just warning
                toast.warning(`${teamName} was already checked in.`);
            } else if (status === 'PERMITTED') {
                msg = `${mealLabel} granted. Token logged.`;
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
                msg = 'Must scan team leader pass before claiming meals.';
                isSuccess = false;
                toast.error('Team must check in at gate first!');
            } else {
                msg = 'Participant does not have this meal allocated.';
                isSuccess = false;
                toast.error('Meal not included in plan.');
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
            setAuditLog(prev => [newEntry, ...prev.slice(0, 49)]);
            setSessionScanCount(prev => prev + 1);

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

    // Handle Manual Check-in
    const handleManualCheckIn = async (projectId: string | number, teamName: string) => {
        setProcessingTeamId(String(projectId));
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
                    message: 'Manual check-in override confirmed by volunteer.'
                };
                setLastScanEntry(entry);
                setAuditLog(prev => [entry, ...prev.slice(0, 49)]);
                setSessionScanCount(prev => prev + 1);
            }
        } finally {
            setProcessingTeamId(null);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout type="volunteer" title="Operations & Check-In">
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="w-10 h-10 border-4 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/40 font-black uppercase italic text-xs tracking-widest text-center">Syncing Volunteer Hub...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="volunteer" title="Operations & Check-In">
            <div className="space-y-6">

                {/* ═══════════ TOP METRICS & PROGRESS BAR ═══════════ */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Check-In Progress Card */}
                    <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[#0B0114]/80 p-5 backdrop-blur-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#14b8a6] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Gate Check-in Progress</span>
                            </div>
                            <span className="text-sm font-black italic text-[#14b8a6]">{stats.percentage}% Completed</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-3xl sm:text-4xl font-black italic text-white tracking-tight">{stats.checkedIn}</span>
                            <span className="text-sm font-bold text-white/40">/ {stats.total} teams arrived</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.percentage}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full rounded-full bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                            />
                        </div>
                    </div>

                    {/* Session Scans Card */}
                    <div className="rounded-2xl border border-white/10 bg-[#0B0114]/80 p-5 backdrop-blur-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Session Scans</span>
                            <Zap size={16} className="text-amber-400" />
                        </div>
                        <div className="my-1">
                            <span className="text-3xl font-black italic text-white">{sessionScanCount}</span>
                            <p className="text-[10px] font-bold text-white/40 mt-1">Processed this shift</p>
                        </div>
                    </div>

                    {/* Meals Claimed Card */}
                    <div className="rounded-2xl border border-white/10 bg-[#0B0114]/80 p-5 backdrop-blur-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Meals Claimed</span>
                            <Utensils size={16} className="text-[#a855f7]" />
                        </div>
                        <div className="my-1">
                            <span className="text-3xl font-black italic text-white">{stats.totalMealsClaimed}</span>
                            <p className="text-[10px] font-bold text-white/40 mt-1">out of {stats.totalMealsIncluded} assigned</p>
                        </div>
                    </div>
                </div>

                {/* ═══════════ NAVIGATION TABS & CONTROLS ═══════════ */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                        <button
                            onClick={() => setActiveTab('scan')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all shrink-0 ${
                                activeTab === 'scan'
                                    ? 'bg-[#14b8a6] text-black shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <QrCode size={15} /> Rapid Scanner
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all shrink-0 ${
                                activeTab === 'manual'
                                    ? 'bg-[#14b8a6] text-black shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <Search size={15} /> Manual Check-In ({stats.total - stats.checkedIn} pending)
                        </button>
                        <button
                            onClick={() => setActiveTab('meals')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all shrink-0 ${
                                activeTab === 'meals'
                                    ? 'bg-[#14b8a6] text-black shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <Utensils size={15} /> Meal Stations
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all shrink-0 ${
                                activeTab === 'audit'
                                    ? 'bg-[#14b8a6] text-black shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <History size={15} /> Audit Log ({auditLog.length})
                        </button>
                    </div>

                    {/* Operational Toggles */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {/* Rapid Mode Toggle */}
                        {activeTab === 'scan' && (
                            <button
                                onClick={() => setIsRapidMode(v => !v)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                                    isRapidMode
                                        ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                                        : 'bg-white/5 border-white/10 text-white/50'
                                }`}
                                title="In Rapid Mode, the scanner resets automatically without opening a modal"
                            >
                                <Zap size={12} className={isRapidMode ? "text-amber-400" : "text-white/40"} />
                                {isRapidMode ? "Rapid Continuous ON" : "Inspect Mode"}
                            </button>
                        )}
                        {/* Audio Toggle */}
                        <button
                            onClick={() => setSoundEnabled(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                                soundEnabled
                                    ? 'bg-[#14b8a6]/10 border-[#14b8a6]/40 text-[#14b8a6]'
                                    : 'bg-white/5 border-white/10 text-white/40'
                            }`}
                        >
                            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                            {soundEnabled ? "Audio On" : "Muted"}
                        </button>
                    </div>
                </div>

                {/* ═══════════ TAB 1: RAPID SCANNER ═══════════ */}
                {activeTab === 'scan' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Embedded Scanner Viewport (7 Cols) */}
                        <div className="lg:col-span-7">
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

                        {/* Recent Activity & Floating Status Feed (5 Cols) */}
                        <div className="lg:col-span-5 space-y-4">
                            {/* Live Target Card (Last Scanned) */}
                            {lastScanEntry ? (
                                <motion.div
                                    key={lastScanEntry.id}
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`rounded-2xl border p-5 relative overflow-hidden backdrop-blur-xl ${
                                        lastScanEntry.status === 'PERMITTED'
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : lastScanEntry.status === 'ALREADY_CHECKED_IN' || lastScanEntry.status === 'DUPLICATE_SCAN'
                                                ? 'bg-amber-500/10 border-amber-500/30'
                                                : 'bg-red-500/10 border-red-500/30'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                                                lastScanEntry.status === 'PERMITTED'
                                                    ? 'bg-green-500 text-black'
                                                    : lastScanEntry.status === 'ALREADY_CHECKED_IN' || lastScanEntry.status === 'DUPLICATE_SCAN'
                                                        ? 'bg-amber-500 text-black'
                                                        : 'bg-red-500 text-white'
                                            }`}>
                                                {lastScanEntry.status === 'PERMITTED' ? <CheckCircle2 size={20} /> :
                                                    lastScanEntry.status === 'ALREADY_CHECKED_IN' ? <Clock size={20} /> :
                                                        <ShieldAlert size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black italic uppercase tracking-tight text-white leading-tight">
                                                    {lastScanEntry.teamName}
                                                </h4>
                                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                                    ID: {lastScanEntry.teamId} • {lastScanEntry.timestamp}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                            lastScanEntry.status === 'PERMITTED'
                                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                : lastScanEntry.status === 'ALREADY_CHECKED_IN'
                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                        }`}>
                                            {lastScanEntry.passType === 'member' ? 'Meal Token' : 'Gate Pass'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-white/70 mt-3 pt-3 border-t border-white/10">
                                        {lastScanEntry.message}
                                    </p>
                                    {lastScanEntry.mealLabel && (
                                        <div className="mt-2 text-[10px] font-black text-[#14b8a6]">
                                            Meal Slot: {lastScanEntry.mealLabel}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="rounded-2xl border border-white/10 bg-[#0B0114]/60 p-6 text-center">
                                    <QrCode size={36} className="text-white/20 mx-auto mb-2" />
                                    <h4 className="text-sm font-bold text-white/60 uppercase tracking-wider">Awaiting Scan</h4>
                                    <p className="text-xs text-white/30 mt-1">Point the camera above at participant badges</p>
                                </div>
                            )}

                            {/* Recent Scan Feed Header */}
                            <div className="rounded-2xl border border-white/10 bg-[#0B0114]/60 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-black uppercase italic tracking-wider text-white">Recent Gate Feed</span>
                                    <span className="text-[10px] font-bold text-white/40">{auditLog.length} recorded</span>
                                </div>
                                <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                                    {auditLog.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-white/30 font-medium">
                                            No scans in this session yet
                                        </div>
                                    ) : (
                                        auditLog.map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black italic text-white truncate">{entry.teamName}</span>
                                                        <span className="text-[9px] font-mono text-white/40">{entry.teamId}</span>
                                                    </div>
                                                    <div className="text-[10px] text-white/40 truncate">
                                                        {entry.passType === 'member' ? `Meal: ${entry.mealLabel || 'Token'}` : 'Gate Arrival'} • {entry.timestamp}
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                                                    entry.status === 'PERMITTED'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : entry.status === 'ALREADY_CHECKED_IN'
                                                            ? 'bg-amber-500/20 text-amber-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {entry.status === 'PERMITTED' ? 'Valid' : entry.status === 'ALREADY_CHECKED_IN' ? 'Duplicate' : 'Declined'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════ TAB 2: MANUAL SEARCH & CHECK-IN ═══════════ */}
                {activeTab === 'manual' && (
                    <div className="space-y-4">
                        {/* Search and Filter Bar */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                            <div className="relative flex-grow">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by Team ID (e.g. TRI26002), Team Name, Captain Name, Phone, or College..."
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#14b8a6] transition-all font-medium"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-1"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Status Filter Chips */}
                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        statusFilter === 'all' ? 'bg-[#14b8a6] text-black font-black' : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    All ({projects.length})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('pending')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        statusFilter === 'pending' ? 'bg-amber-400 text-black font-black' : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    Pending ({stats.total - stats.checkedIn})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('checked_in')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        statusFilter === 'checked_in' ? 'bg-green-500 text-black font-black' : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    Checked In ({stats.checkedIn})
                                </button>
                            </div>
                        </div>

                        {/* Results Count */}
                        <div className="text-xs text-white/40 font-bold px-1">
                            Showing {filteredTeams.length} teams
                        </div>

                        {/* Teams Directory Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTeams.length === 0 ? (
                                <div className="col-span-full py-16 text-center rounded-2xl border border-white/10 bg-white/[0.02]">
                                    <Users size={40} className="text-white/20 mx-auto mb-3" />
                                    <h4 className="text-base font-bold text-white">No teams match your search</h4>
                                    <p className="text-xs text-white/40 mt-1">Try searching by partial team name, ID, or captain name</p>
                                </div>
                            ) : (
                                filteredTeams.map((team) => {
                                    const isChecked = Boolean(team.isCheckedIn);
                                    const isProcessing = processingTeamId === String(team.id);

                                    return (
                                        <div
                                            key={team.id}
                                            className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                                                isChecked
                                                    ? 'bg-green-500/[0.03] border-green-500/20 hover:border-green-500/40'
                                                    : 'bg-[#0B0114]/80 border-white/10 hover:border-white/25'
                                            }`}
                                        >
                                            <div>
                                                {/* Header row */}
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div>
                                                        <h4 className="text-base font-black italic uppercase tracking-tight text-white leading-tight">
                                                            {team.team || team.name}
                                                        </h4>
                                                        <span className="text-[10px] font-mono font-bold text-[#14b8a6] mt-0.5 block">
                                                            {team.teamId || `ID: ${team.id}`}
                                                        </span>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                                        isChecked
                                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                            : 'bg-white/10 text-white/60 border border-white/10'
                                                    }`}>
                                                        {isChecked ? 'Checked In ✓' : 'Awaiting'}
                                                    </span>
                                                </div>

                                                {/* Details list */}
                                                <div className="space-y-1.5 text-xs text-white/60 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Users size={13} className="text-white/30 shrink-0" />
                                                        <span className="font-semibold text-white/80">{team.captain || 'Captain unassigned'}</span>
                                                        <span className="text-[10px] text-white/40">({team.members?.length || 1} members)</span>
                                                    </div>
                                                    {team.captainMobile && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone size={13} className="text-white/30 shrink-0" />
                                                            <span className="font-mono text-white/70">{team.captainMobile}</span>
                                                        </div>
                                                    )}
                                                    {team.college && (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 size={13} className="text-white/30 shrink-0" />
                                                            <span className="truncate text-white/50">{team.college}</span>
                                                        </div>
                                                    )}
                                                    {team.checkedInAt && (
                                                        <div className="flex items-center gap-2 text-[10px] text-green-400/80 font-mono pt-1">
                                                            <Clock size={12} />
                                                            <span>Arrived at {new Date(team.checkedInAt).toLocaleTimeString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                                                <button
                                                    onClick={() => setInspectedTeam(team)}
                                                    className="flex-1 py-2 px-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <ExternalLink size={13} /> View
                                                </button>
                                                {!isChecked ? (
                                                    <button
                                                        onClick={() => handleManualCheckIn(team.id, team.team || team.name)}
                                                        disabled={isProcessing}
                                                        className="flex-1 py-2 px-3 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] active:scale-95 text-black text-xs font-black uppercase italic tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                                                    >
                                                        {isProcessing ? 'Saving...' : 'Check In'}
                                                    </button>
                                                ) : (
                                                    <span className="flex-1 py-2 text-center text-xs font-bold text-green-400/60 uppercase">
                                                        Done ✓
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════ TAB 3: MEAL STATIONS ═══════════ */}
                {activeTab === 'meals' && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-[#0B0114]/80 p-6 backdrop-blur-xl">
                            <h3 className="text-lg font-black italic uppercase tracking-tight text-white mb-2">Active Meal Service</h3>
                            <p className="text-xs text-white/50 mb-5">Select the meal slot currently being distributed to monitor participant token claims.</p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                {EVENT_MEALS.map((meal) => {
                                    const isEnabled = enabledMeals.includes(meal.key);
                                    const isSelected = selectedMealKey === meal.key;

                                    return (
                                        <button
                                            key={meal.key}
                                            onClick={() => setSelectedMealKey(meal.key)}
                                            className={`p-3.5 rounded-xl border text-left transition-all relative ${
                                                isSelected
                                                    ? 'bg-[#14b8a6]/20 border-[#14b8a6] text-white shadow-[0_0_20px_rgba(20,184,166,0.2)]'
                                                    : isEnabled
                                                        ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                                                        : 'bg-white/[0.02] border-white/5 text-white/30'
                                            }`}
                                        >
                                            <span className="text-[10px] font-bold block uppercase text-white/40">{meal.dayLabel}</span>
                                            <span className="text-sm font-black italic block mt-0.5">{meal.mealLabel}</span>
                                            <div className="mt-2 flex items-center gap-1.5">
                                                <span className={`h-1.5 w-1.5 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-white/20'}`} />
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">
                                                    {isEnabled ? 'Enabled' : 'Locked'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Meal Analytics */}
                        {(() => {
                            const config = EVENT_MEALS.find(m => m.key === selectedMealKey);
                            let claimedCount = 0;
                            let totalEligible = 0;

                            projects.forEach(p => {
                                if (p.memberMealState) {
                                    Object.values(p.memberMealState).forEach(slots => {
                                        if (slots[selectedMealKey]) {
                                            totalEligible++;
                                            if (slots[selectedMealKey].claimedAt) claimedCount++;
                                        }
                                    });
                                }
                            });

                            const pct = totalEligible > 0 ? Math.round((claimedCount / totalEligible) * 100) : 0;

                            return (
                                <div className="rounded-2xl border border-white/10 bg-[#0B0114]/80 p-6 backdrop-blur-xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h4 className="text-xl font-black italic uppercase tracking-tight text-white">
                                                {config?.dayLabel} {config?.mealLabel} Status
                                            </h4>
                                            <p className="text-xs text-white/40 mt-0.5">Live participant token redemption overview</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
                                                <span className="text-[10px] font-bold uppercase text-white/40 block">Claimed</span>
                                                <span className="text-lg font-black italic text-[#14b8a6]">{claimedCount} / {totalEligible}</span>
                                            </div>
                                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
                                                <span className="text-[10px] font-bold uppercase text-white/40 block">Turnout</span>
                                                <span className="text-lg font-black italic text-amber-400">{pct}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden mb-6">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#14b8a6] to-[#a855f7] transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>

                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 flex items-center justify-between">
                                        <span>Use the <strong>Rapid Scanner</strong> tab to scan participant member passes. The system will automatically validate the token and record the redemption timestamp.</span>
                                        <button
                                            onClick={() => setActiveTab('scan')}
                                            className="px-4 py-2 rounded-lg bg-[#14b8a6] text-black font-black uppercase text-xs hover:bg-[#0d9488] transition-all shrink-0 ml-4"
                                        >
                                            Switch to Scanner
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* ═══════════ TAB 4: AUDIT LOG ═══════════ */}
                {activeTab === 'audit' && (
                    <div className="rounded-2xl border border-white/10 bg-[#0B0114]/80 p-6 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-black italic uppercase tracking-tight text-white">Gate & Meal Audit Stream</h3>
                                <p className="text-xs text-white/40 mt-0.5">Chronological record of all actions performed during this volunteer session</p>
                            </div>
                            {auditLog.length > 0 && (
                                <button
                                    onClick={() => setAuditLog([])}
                                    className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/40 hover:text-white text-xs font-bold transition-all"
                                >
                                    Clear History
                                </button>
                            )}
                        </div>

                        {auditLog.length === 0 ? (
                            <div className="py-16 text-center text-white/30 text-xs font-medium">
                                No activity recorded yet. Scans from the Rapid Scanner or Manual Check-in will appear here.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {auditLog.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex items-start sm:items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                                entry.status === 'PERMITTED' ? 'bg-green-500/20 text-green-400' :
                                                    entry.status === 'ALREADY_CHECKED_IN' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-red-500/20 text-red-400'
                                            }`}>
                                                {entry.status === 'PERMITTED' ? '✓' : '!'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black italic text-white text-sm">{entry.teamName}</span>
                                                    <span className="text-[10px] font-mono text-white/40">({entry.teamId})</span>
                                                </div>
                                                <p className="text-white/60 text-[11px] mt-0.5">{entry.message}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 sm:self-center self-end shrink-0">
                                            <span className="text-[10px] font-mono text-white/40">{entry.timestamp}</span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                                entry.status === 'PERMITTED' ? 'bg-green-500/20 text-green-300' :
                                                    entry.status === 'ALREADY_CHECKED_IN' ? 'bg-amber-500/20 text-amber-300' :
                                                        'bg-red-500/20 text-red-300'
                                            }`}>
                                                {entry.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-[#0D0219] border-2 border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-[260] overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                                        {inspectedTeam.team || inspectedTeam.name}
                                    </h3>
                                    <span className="text-xs font-mono font-bold text-[#14b8a6] mt-0.5 block">
                                        ID: {inspectedTeam.teamId || inspectedTeam.id}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setInspectedTeam(null)}
                                    className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 text-xs">
                                {/* Captain info */}
                                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                                    <span className="text-[10px] font-black uppercase text-white/40 block">Team Lead / Captain</span>
                                    <div className="text-sm font-bold text-white">{inspectedTeam.captain || 'Unassigned'}</div>
                                    {inspectedTeam.captainMobile && (
                                        <div className="text-white/70 font-mono">{inspectedTeam.captainMobile}</div>
                                    )}
                                    {inspectedTeam.college && (
                                        <div className="text-white/50">{inspectedTeam.college}</div>
                                    )}
                                </div>

                                {/* Room / Location */}
                                {(inspectedTeam.room || inspectedTeam.track) && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {inspectedTeam.room && (
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                                <span className="text-[9px] font-black uppercase text-white/40 block">Assigned Room</span>
                                                <span className="text-xs font-black text-white">{inspectedTeam.room}</span>
                                            </div>
                                        )}
                                        {inspectedTeam.track && (
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                                <span className="text-[9px] font-black uppercase text-white/40 block">Track</span>
                                                <span className="text-xs font-black text-[#14b8a6]">{inspectedTeam.track}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Roster */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase text-white/40 block">
                                        Team Members ({inspectedTeam.members?.length || 0})
                                    </span>
                                    {inspectedTeam.members?.map((member, idx) => {
                                        const name = typeof member === 'string' ? member : member.fullName;
                                        const email = typeof member === 'string' ? '' : member.email;
                                        return (
                                            <div key={idx} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-white block">{name}</span>
                                                    {email && <span className="text-[10px] text-white/40">{email}</span>}
                                                </div>
                                                <span className="text-[9px] font-mono text-white/30">#{idx + 1}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Check in action in modal */}
                            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                                {!inspectedTeam.isCheckedIn ? (
                                    <button
                                        onClick={async () => {
                                            await handleManualCheckIn(inspectedTeam.id, inspectedTeam.team || inspectedTeam.name);
                                            setInspectedTeam(null);
                                        }}
                                        className="w-full py-3 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] active:scale-95 text-black font-black uppercase italic text-xs tracking-wider transition-all"
                                    >
                                        Check In Team Now
                                    </button>
                                ) : (
                                    <div className="w-full py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-black italic uppercase text-xs text-center">
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
