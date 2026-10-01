"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    ArrowLeft, Search, Save, Users, User, Edit3, CheckCircle2,
    AlertCircle, Loader2, KeyRound, ShieldCheck, Clock, Copy,
    GitMerge, UserPlus, HelpCircle, Send, Check, X, Sparkles, ChevronRight, Phone, Mail
} from "lucide-react";
import { TRACKS } from "@/lib/constants";

interface MemberData {
    fullName: string;
    email: string;
    phone: string;
    college: string;
    year?: string;
    department?: string;
    replacedAt?: string;
}

interface TeamData {
    teamId: string;
    teamName: string;
    track: string;
    captain: string;
    captainMobile: string;
    college: string;
    email: string;
    members: MemberData[];
    status: string;
    problemStatement?: string;
    createdAt?: string;
}

interface PendingMerge {
    code: string;
    sourceTeamId: string;
    sourceTeamName: string;
    sourceCaptain: string;
    sourceMemberCount: number;
    targetTeamId: string;
    targetTeamName: string;
    targetCaptain: string;
    targetMemberCount: number;
    status: string;
}

function EditRegistrationInner() {
    const searchParams = useSearchParams();
    const urlTeamId = searchParams.get('teamId') || '';
    const urlToken = searchParams.get('token') || '';

    // Auth State
    const [teamIdInput, setTeamIdInput] = useState(urlTeamId);
    const [captainContactInput, setCaptainContactInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [authError, setAuthError] = useState('');

    // Team Data
    const [team, setTeam] = useState<TeamData | null>(null);
    const [editedTeam, setEditedTeam] = useState<TeamData | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Merge Feature State
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [inputMergeCode, setInputMergeCode] = useState('');
    const [isSubmittingMerge, setIsSubmittingMerge] = useState(false);
    const [pendingMerge, setPendingMerge] = useState<PendingMerge | null>(null);
    const [isRespondingMerge, setIsRespondingMerge] = useState(false);

    // Member Replacement State
    const [replacingSlotIndex, setReplacingSlotIndex] = useState<number | null>(null);
    const [replacementForm, setReplacementForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        college: '',
        department: '',
        year: ''
    });
    const [isReplacing, setIsReplacing] = useState(false);

    // Self-Help Lookup Modal State
    const [showLookupModal, setShowLookupModal] = useState(false);
    const [lookupQuery, setLookupQuery] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupResults, setLookupResults] = useState<any[]>([]);

    // Support Ticket State
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpCategory, setHelpCategory] = useState('Roster Query');
    const [helpText, setHelpText] = useState('');
    const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);

    // Auto-login if arriving via official magic link
    useEffect(() => {
        if (urlTeamId && urlToken) {
            void verifyAndLoadTeam(urlTeamId, urlToken, '');
        }
    }, [urlTeamId, urlToken]);

    const verifyAndLoadTeam = async (id: string, token: string, contact: string) => {
        setIsVerifying(true);
        setAuthError('');
        try {
            const res = await fetch('/api/team/verify-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: id.trim().toUpperCase(),
                    token: token.trim() || undefined,
                    captainContact: contact.trim() || undefined
                })
            });

            const data = await res.json();
            if (data.success && data.team) {
                setTeam(data.team);
                setEditedTeam(JSON.parse(JSON.stringify(data.team)));
                if (data.pendingMerge) setPendingMerge(data.pendingMerge);
                toast.success(`Welcome Team "${data.team.teamName}"!`);
            } else {
                setAuthError(data.error || 'Verification failed. Please check your Team ID and contact.');
            }
        } catch {
            setAuthError('Network error. Could not verify team.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleManualLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamIdInput.trim()) {
            setAuthError('Please enter your Team ID');
            return;
        }
        if (!captainContactInput.trim()) {
            setAuthError('Please enter the registered Team Captain email or mobile number');
            return;
        }
        void verifyAndLoadTeam(teamIdInput, '', captainContactInput);
    };

    const handleLookupTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lookupQuery.trim()) return;
        setLookupLoading(true);
        try {
            const res = await fetch('/api/team/verify-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'lookup_team',
                    query: lookupQuery.trim(),
                    sendMagicLink: true
                })
            });
            const data = await res.json();
            if (data.success) {
                setLookupResults(data.results || []);
                toast.success(data.message || 'Found matching registration!');
            } else {
                toast.error(data.error || 'No team found with those details.');
            }
        } catch {
            toast.error('Search error. Please try again.');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleSaveRosterEdits = async () => {
        if (!editedTeam) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/team/roster-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_details',
                    teamName: editedTeam.teamName,
                    track: editedTeam.track,
                    college: editedTeam.college,
                    members: editedTeam.members
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Roster details updated and saved successfully!');
                setTeam(JSON.parse(JSON.stringify(editedTeam)));
            } else {
                toast.error(data.error || 'Failed to update roster.');
            }
        } catch {
            toast.error('Network error saving changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExecuteMemberReplacement = async () => {
        if (replacingSlotIndex === null || !replacementForm.fullName || !replacementForm.email) {
            toast.error('Please enter the new member’s name and email address.');
            return;
        }

        setIsReplacing(true);
        try {
            const res = await fetch('/api/team/roster-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'replace_member',
                    memberIndex: replacingSlotIndex,
                    newMember: replacementForm
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'Member successfully replaced!');
                if (editedTeam) {
                    const updated = [...editedTeam.members];
                    updated[replacingSlotIndex] = {
                        fullName: replacementForm.fullName,
                        email: replacementForm.email,
                        phone: replacementForm.phone,
                        college: replacementForm.college,
                        department: replacementForm.department,
                        year: replacementForm.year,
                        replacedAt: new Date().toISOString()
                    };
                    setEditedTeam({ ...editedTeam, members: updated });
                    setTeam({ ...editedTeam, members: updated });
                }
                setReplacingSlotIndex(null);
                setReplacementForm({ fullName: '', email: '', phone: '', college: '', department: '', year: '' });
            } else {
                toast.error(data.error || 'Replacement failed.');
            }
        } catch {
            toast.error('Network error executing replacement.');
        } finally {
            setIsReplacing(false);
        }
    };

    const handleGenerateMergeCode = async () => {
        setIsGeneratingCode(true);
        try {
            const res = await fetch('/api/team/roster-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_merge_code' })
            });
            const data = await res.json();
            if (data.success) {
                setGeneratedCode(data.code);
                toast.success(`Merge code created: ${data.code}`);
            } else {
                toast.error(data.error || 'Failed to create code.');
            }
        } catch {
            toast.error('Error generating merge code.');
        } finally {
            setIsGeneratingCode(false);
        }
    };

    const handleSubmitMergeCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMergeCode.trim()) return;
        setIsSubmittingMerge(true);
        try {
            const res = await fetch('/api/team/roster-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submit_merge_code',
                    code: inputMergeCode.trim().toUpperCase()
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setInputMergeCode('');
            } else {
                toast.error(data.error || 'Failed to submit merge code.');
            }
        } catch {
            toast.error('Network error during merge request.');
        } finally {
            setIsSubmittingMerge(false);
        }
    };

    const handleRespondMerge = async (decision: 'APPROVE' | 'REJECT') => {
        if (!pendingMerge) return;
        setIsRespondingMerge(true);
        try {
            const res = await fetch('/api/team/roster-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'respond_merge',
                    code: pendingMerge.code,
                    decision
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setPendingMerge(null);
                // Refresh team data
                if (team) {
                    void verifyAndLoadTeam(team.teamId, '', team.captainMobile || team.email);
                }
            } else {
                toast.error(data.error || 'Failed to respond to merge.');
            }
        } catch {
            toast.error('Network error during merge response.');
        } finally {
            setIsRespondingMerge(false);
        }
    };

    const handleSubmitSupportTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!helpText.trim()) return;
        setIsSubmittingHelp(true);
        try {
            const res = await fetch('/api/admin/inbound-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_ticket',
                    fromEmail: team?.email || 'participant@portal',
                    fromName: team?.captain || 'Participant',
                    subject: `[Roster Query] ${helpCategory} - ${team?.teamName || 'Team'}`,
                    snippet: helpText.trim(),
                    teamId: team?.teamId || 'GUEST',
                    teamName: team?.teamName || 'Unknown Team'
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Your support request has been logged! Our team will respond shortly.');
                setHelpText('');
                setShowHelpModal(false);
            } else {
                toast.error(data.error || 'Failed to submit query.');
            }
        } catch {
            toast.error('Error contacting help desk.');
        } finally {
            setIsSubmittingHelp(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#06000F] text-slate-100 font-sans selection:bg-[#14b8a6] selection:text-black">
            {/* Top Navigation Bar */}
            <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#14b8a6] to-purple-600 flex items-center justify-center font-black text-black text-sm">
                            TC
                        </div>
                        <span className="font-kanit font-black italic tracking-wider text-white text-lg group-hover:text-[#14b8a6] transition">
                            TRI-CITY 2026
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowHelpModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white/80 transition cursor-pointer"
                        >
                            <HelpCircle size={14} className="text-[#14b8a6]" />
                            First-Timer FAQs
                        </button>
                        {team && (
                            <button
                                type="button"
                                onClick={() => { setTeam(null); setEditedTeam(null); }}
                                className="px-3 py-1.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-xs font-bold transition cursor-pointer"
                            >
                                Log out
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* ══════════════ VIEW 1: AUTHENTICATION / ACCESS GATE ══════════════ */}
                {!team ? (
                    <div className="max-w-md mx-auto pt-8">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#14b8a6]/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="text-center mb-6">
                                <div className="inline-flex w-14 h-14 rounded-2xl bg-[#14b8a6]/15 border border-[#14b8a6]/30 text-[#14b8a6] items-center justify-center mb-3">
                                    <ShieldCheck size={28} />
                                </div>
                                <h1 className="text-2xl font-black italic uppercase tracking-tight text-white">
                                    Team Correction Portal
                                </h1>
                                <p className="text-xs text-white/50 mt-1.5">
                                    Active for external registrations: October 5–6, 2026
                                </p>
                            </div>

                            {/* 48-Hour Live Window Banner */}
                            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-6 flex items-start gap-2.5">
                                <Clock size={16} className="shrink-0 text-amber-400 mt-0.5" />
                                <div className="leading-relaxed">
                                    <p className="font-bold">48-Hour Roster Window Active</p>
                                    <p className="text-white/70 text-[11px] mt-0.5">
                                        Team leads can cross-check names, replace absent members, or merge solo/duo teams. Rosters permanently lock on October 6 at 11:59 PM.
                                    </p>
                                </div>
                            </div>

                            {authError && (
                                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs mb-5 flex items-center gap-2.5">
                                    <AlertCircle size={16} className="shrink-0 text-red-400" />
                                    <span>{authError}</span>
                                </div>
                            )}

                            <form onSubmit={handleManualLogin} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">
                                        Assigned Team ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. TC-1042"
                                        value={teamIdInput}
                                        onChange={e => setTeamIdInput(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono uppercase tracking-wider outline-none focus:border-[#14b8a6] transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">
                                        Registered Captain Email or Phone
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Lead email or 10-digit mobile"
                                        value={captainContactInput}
                                        onChange={e => setCaptainContactInput(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#14b8a6] transition"
                                        required
                                    />
                                    <p className="text-[10px] text-white/40 mt-1">
                                        Must match the details submitted during agency registration.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="w-full py-3.5 rounded-xl bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black font-black uppercase tracking-wider text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.3)] mt-2"
                                >
                                    {isVerifying ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Verifying Team...
                                        </>
                                    ) : (
                                        <>
                                            Access Roster Hub <ChevronRight size={14} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-5 border-t border-white/10 text-center">
                                <button
                                    type="button"
                                    onClick={() => setShowLookupModal(true)}
                                    className="text-xs text-[#14b8a6] hover:underline font-bold"
                                >
                                    Forgot your Team ID? Search by Email / Phone
                                </button>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* ══════════════ VIEW 2: AUTHENTICATED TEAM CORRECTION HUB ══════════════ */
                    <div className="space-y-6">
                        {/* Countdown / Window Banner */}
                        <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-500/15 to-purple-600/15 border border-[#14b8a6]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-[#14b8a6]/20 border border-[#14b8a6]/40 text-[#14b8a6] flex items-center justify-center shrink-0">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="font-kanit font-black italic uppercase text-lg text-white">
                                            Roster Correction Window Active
                                        </h2>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                                            Open until Oct 6, 11:59 PM
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/60 mt-0.5">
                                        Review team spelling, replace inactive members, or merge teams. Full digital QR passes unlock on <strong>October 10 at 08:00 AM</strong>.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSaveRosterEdits}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black font-black uppercase italic tracking-wider text-xs transition cursor-pointer disabled:opacity-50 shrink-0 shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                            >
                                <Save size={15} className={isSaving ? 'animate-spin' : ''} />
                                {isSaving ? 'Saving Changes...' : 'Save All Changes'}
                            </button>
                        </div>

                        {/* Pending Merge Alert Banner (If Another Team Requested Merge) */}
                        {pendingMerge && (
                            <div className="p-5 rounded-3xl bg-purple-500/20 border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                                        <GitMerge size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">
                                            Incoming Merge Request from &quot;{pendingMerge.targetTeamName}&quot;
                                        </h3>
                                        <p className="text-xs text-purple-200/70 mt-0.5">
                                            Team Lead <strong>{pendingMerge.targetCaptain}</strong> entered your merge code. Combined team will have <strong>{pendingMerge.sourceMemberCount + pendingMerge.targetMemberCount} / 4 members</strong>.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        disabled={isRespondingMerge}
                                        onClick={() => void handleRespondMerge('APPROVE')}
                                        className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black uppercase italic text-xs tracking-wider transition cursor-pointer disabled:opacity-50"
                                    >
                                        {isRespondingMerge ? 'Processing...' : 'Approve & Merge'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isRespondingMerge}
                                        onClick={() => void handleRespondMerge('REJECT')}
                                        className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold transition cursor-pointer"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Column 1 & 2: Team Roster & Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Team Info Card */}
                                <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03] space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-[#14b8a6] flex items-center justify-center font-black">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black uppercase italic tracking-tight text-white">
                                                    Team Information
                                                </h3>
                                                <span className="font-mono text-xs text-[#14b8a6] font-bold">
                                                    ID: {team.teamId}
                                                </span>
                                            </div>
                                        </div>

                                        <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-[10px] font-black uppercase">
                                            {team.members.length} / 4 Members
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">
                                                Team Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editedTeam?.teamName || ''}
                                                onChange={e => editedTeam && setEditedTeam({ ...editedTeam, teamName: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:border-[#14b8a6] transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">
                                                Innovation Track
                                            </label>
                                            <select
                                                value={editedTeam?.track || ''}
                                                onChange={e => editedTeam && setEditedTeam({ ...editedTeam, track: e.target.value })}
                                                className="w-full bg-[#0D0219] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:border-[#14b8a6] transition"
                                            >
                                                {TRACKS.map(t => (
                                                    <option key={t} value={t} className="bg-[#0D0219] text-white">
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">
                                            College / Institution
                                        </label>
                                        <input
                                            type="text"
                                            value={editedTeam?.college || ''}
                                            onChange={e => editedTeam && setEditedTeam({ ...editedTeam, college: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#14b8a6] transition"
                                        />
                                    </div>
                                </div>

                                {/* Member Cards List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-sm font-black uppercase italic tracking-wider text-white flex items-center gap-2">
                                            <User size={16} className="text-[#14b8a6]" />
                                            Registered Team Members
                                        </h3>
                                        <span className="text-[11px] text-white/40">
                                            Max 2 member replacements allowed per team
                                        </span>
                                    </div>

                                    {editedTeam?.members.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-6 h-6 rounded-lg bg-white/10 text-white/70 font-mono text-xs flex items-center justify-center font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <h4 className="font-bold text-sm text-white">
                                                        {idx === 0 ? `${m.fullName || 'Lead'} (Team Captain)` : m.fullName || `Member ${idx + 1}`}
                                                    </h4>
                                                    {m.replacedAt && (
                                                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-black uppercase">
                                                            Replaced
                                                        </span>
                                                    )}
                                                </div>

                                                {idx > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setReplacingSlotIndex(idx);
                                                            setReplacementForm({
                                                                fullName: '',
                                                                email: '',
                                                                phone: '',
                                                                college: editedTeam.college || '',
                                                                department: '',
                                                                year: ''
                                                            });
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition cursor-pointer"
                                                    >
                                                        <UserPlus size={13} /> Replace Member
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={m.fullName || ''}
                                                        onChange={e => {
                                                            const copy = [...editedTeam.members];
                                                            copy[idx].fullName = e.target.value;
                                                            setEditedTeam({ ...editedTeam, members: copy });
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#14b8a6]"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={m.email || ''}
                                                        onChange={e => {
                                                            const copy = [...editedTeam.members];
                                                            copy[idx].email = e.target.value;
                                                            setEditedTeam({ ...editedTeam, members: copy });
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#14b8a6]"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                                        Mobile Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={m.phone || ''}
                                                        onChange={e => {
                                                            const copy = [...editedTeam.members];
                                                            copy[idx].phone = e.target.value;
                                                            setEditedTeam({ ...editedTeam, members: copy });
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#14b8a6]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Column 3: Team Merge Hub & Anti-Spam FAQ */}
                            <div className="space-y-6">
                                {/* Peer-to-Peer Merge Tool */}
                                <div className="p-6 rounded-3xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-md space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                                            <GitMerge size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black uppercase italic tracking-tight text-white">
                                                Merge Teams
                                            </h3>
                                            <p className="text-[11px] text-purple-300/70">
                                                Combine with another solo or duo team
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sub-Feature A: Generate Code */}
                                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-wider block">
                                            Option 1: Invite Another Team
                                        </span>
                                        {generatedCode ? (
                                            <div className="p-3 rounded-xl bg-[#14b8a6]/10 border border-[#14b8a6]/40 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-white/40 block font-bold">Your Merge Code:</span>
                                                    <span className="font-mono text-xl font-black text-[#14b8a6] tracking-widest">
                                                        {generatedCode}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void navigator.clipboard.writeText(generatedCode);
                                                        toast.success('Merge code copied to clipboard!');
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg bg-[#14b8a6] text-black font-black text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Copy size={12} /> Copy
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={isGeneratingCode}
                                                onClick={handleGenerateMergeCode}
                                                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition cursor-pointer"
                                            >
                                                {isGeneratingCode ? 'Creating Code...' : 'Generate 30-Min Merge Code'}
                                            </button>
                                        )}
                                        <p className="text-[10px] text-white/40">
                                            Share this code with the other Team Lead. Once they enter it, you will get an approval prompt.
                                        </p>
                                    </div>

                                    {/* Sub-Feature B: Enter Code */}
                                    <form onSubmit={handleSubmitMergeCode} className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-wider block">
                                            Option 2: Enter Their Merge Code
                                        </span>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="e.g. MG-8492"
                                                value={inputMergeCode}
                                                onChange={e => setInputMergeCode(e.target.value)}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white uppercase outline-none focus:border-purple-400"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isSubmittingMerge || !inputMergeCode.trim()}
                                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase transition cursor-pointer disabled:opacity-50"
                                            >
                                                {isSubmittingMerge ? '...' : 'Request'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* First-Timer FAQ Shield Widget */}
                                <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03] space-y-4">
                                    <div className="flex items-center gap-2.5 text-xs font-black uppercase text-white/60 tracking-wider">
                                        <HelpCircle size={16} className="text-[#14b8a6]" />
                                        <span>First-Timer Guide</span>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            <p className="font-bold text-white mb-1">When do we get our Digital Passes?</p>
                                            <p className="text-white/60 text-[11px] leading-relaxed">
                                                On October 7, after all rosters are locked. QR badges and meal passes will be emailed to your lead.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            <p className="font-bold text-white mb-1">Can our team have 3 members?</p>
                                            <p className="text-white/60 text-[11px] leading-relaxed">
                                                Yes! Teams can have anywhere between 2 and 4 members. You do not have to find a 4th if you already have 3.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            <p className="font-bold text-white mb-1">Need special assistance?</p>
                                            <p className="text-white/60 text-[11px] leading-relaxed mb-2">
                                                Please submit an in-app ticket below instead of calling organizer phone numbers.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setShowHelpModal(true)}
                                                className="w-full py-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-[#14b8a6] font-bold text-[11px] transition cursor-pointer"
                                            >
                                                Open Help Desk Ticket
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ══════════════ MODAL 1: REPLACE MEMBER MODAL ══════════════ */}
            <AnimatePresence>
                {replacingSlotIndex !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-[#0D0219] border-2 border-amber-500/40 rounded-[2rem] p-6 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                                        <UserPlus size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase italic tracking-tight text-white text-base">
                                            Replace Member #{replacingSlotIndex + 1}
                                        </h3>
                                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                            Anti-Fraud Substitution
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReplacingSlotIndex(null)}
                                    className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-white/60 mb-4 leading-relaxed">
                                Enter the new teammate’s details below. An automated security notice will be emailed to the previous participant.
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                        New Member Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={replacementForm.fullName}
                                        onChange={e => setReplacementForm({ ...replacementForm, fullName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                        New Member Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="student@college.edu"
                                        value={replacementForm.email}
                                        onChange={e => setReplacementForm({ ...replacementForm, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                            Mobile Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="10-digit number"
                                            value={replacementForm.phone}
                                            onChange={e => setReplacementForm({ ...replacementForm, phone: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                            College
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="College Name"
                                            value={replacementForm.college}
                                            onChange={e => setReplacementForm({ ...replacementForm, college: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setReplacingSlotIndex(null)}
                                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isReplacing || !replacementForm.fullName || !replacementForm.email}
                                        onClick={handleExecuteMemberReplacement}
                                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black uppercase italic text-xs tracking-wider transition cursor-pointer disabled:opacity-50"
                                    >
                                        {isReplacing ? 'Updating...' : 'Confirm Replacement'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════ MODAL 2: FORGOT TEAM ID LOOKUP TOOL ══════════════ */}
            <AnimatePresence>
                {showLookupModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-[#0D0219] border border-white/10 rounded-[2rem] p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-[#14b8a6]/20 text-[#14b8a6] flex items-center justify-center">
                                        <Search size={18} />
                                    </div>
                                    <h3 className="font-black uppercase italic tracking-tight text-white text-base">
                                        Find Your Team ID
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowLookupModal(false)}
                                    className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleLookupTeam} className="space-y-3 mb-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                        Enter Registered Email or Mobile Number
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="e.g. captain@college.edu or 9876543210"
                                            value={lookupQuery}
                                            onChange={e => setLookupQuery(e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#14b8a6]"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={lookupLoading}
                                            className="px-4 py-2 rounded-xl bg-[#14b8a6] text-black font-black text-xs uppercase"
                                        >
                                            {lookupLoading ? '...' : 'Search'}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {lookupResults.length > 0 && (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {lookupResults.map(r => (
                                        <div
                                            key={r.teamId}
                                            onClick={() => {
                                                setTeamIdInput(r.teamId);
                                                setShowLookupModal(false);
                                                toast.success(`Selected Team ID ${r.teamId}`);
                                            }}
                                            className="p-3 rounded-xl bg-white/5 hover:bg-[#14b8a6]/10 border border-white/10 hover:border-[#14b8a6]/40 transition cursor-pointer flex items-center justify-between"
                                        >
                                            <div>
                                                <span className="font-bold text-sm text-white block">{r.teamName}</span>
                                                <span className="text-[11px] text-white/50">{r.captainName} • {r.maskedEmail}</span>
                                            </div>
                                            <span className="font-mono text-xs font-black text-[#14b8a6] bg-[#14b8a6]/20 px-2 py-0.5 rounded">
                                                {r.teamId}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════ MODAL 3: IN-APP SUPPORT TICKET MODAL ══════════════ */}
            <AnimatePresence>
                {showHelpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-[#0D0219] border border-white/10 rounded-[2rem] p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                        <HelpCircle size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase italic tracking-tight text-white text-base">
                                            First-Timer Support Desk
                                        </h3>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                                            Fast Response from Organizers
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowHelpModal(false)}
                                    className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitSupportTicket} className="space-y-3.5">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                        Issue Category
                                    </label>
                                    <select
                                        value={helpCategory}
                                        onChange={e => setHelpCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-400"
                                    >
                                        <option value="Roster Query" className="bg-[#0D0219]">Roster & Teammate Change</option>
                                        <option value="Team Merge" className="bg-[#0D0219]">Team Merge Question</option>
                                        <option value="Pass & QR" className="bg-[#0D0219]">Digital Pass / Event Dates</option>
                                        <option value="Other" className="bg-[#0D0219]">General Hackathon Question</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                        Describe your issue
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Please provide details (e.g. My teammate dropped out and I need to add X)..."
                                        value={helpText}
                                        onChange={e => setHelpText(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-400"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowHelpModal(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingHelp || !helpText.trim()}
                                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic text-xs tracking-wider transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Send size={13} className={isSubmittingHelp ? 'animate-spin' : ''} />
                                        {isSubmittingHelp ? 'Sending...' : 'Submit Query'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function EditRegistrationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#06000F] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <EditRegistrationInner />
        </Suspense>
    );
}
