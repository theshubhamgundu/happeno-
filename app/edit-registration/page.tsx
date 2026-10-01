"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    ArrowLeft, Search, Save, Users, User, Edit3, CheckCircle2,
    AlertCircle, Loader2, KeyRound, ShieldCheck, Clock, Copy,
    GitMerge, UserPlus, HelpCircle, Send, Check, X, Sparkles, ChevronRight, Phone, Mail,
    Lock, Plus, Trash2, AlertTriangle
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
    trackPreferences?: string[];
    captain: string;
    captainMobile: string;
    college: string;
    email: string;
    members: MemberData[];
    status: string;
    problemStatement?: string;
    createdAt?: string;
    isRosterLocked?: boolean;
    rosterLockedAt?: string | null;
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
    const [helpCategory, setHelpCategory] = useState('Team Details Query');
    const [helpTeamId, setHelpTeamId] = useState('');
    const [helpContactName, setHelpContactName] = useState('');
    const [helpContactPhone, setHelpContactPhone] = useState('');
    const [helpContactEmail, setHelpContactEmail] = useState('');
    const [helpText, setHelpText] = useState('');
    const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);

    const openHelpModal = () => {
        if (team) {
            setHelpTeamId(team.teamId || '');
            setHelpContactName(team.captain || '');
            setHelpContactPhone(team.captainMobile || '');
            setHelpContactEmail(team.email || '');
        } else {
            setHelpTeamId(teamIdInput.trim());
        }
        setShowHelpModal(true);
    };

    // 1-Time Edit Lock Confirmation State
    const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);

    // Add Teammate Modal State (for Solo -> Duo or 3 -> Quad)
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMemberForm, setNewMemberForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        college: '',
        department: '',
        year: ''
    });

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

    const toggleTrackPreference = (trackName: string) => {
        if (!editedTeam) return;
        const currentPrefs: string[] = editedTeam.trackPreferences || (editedTeam.track ? [editedTeam.track] : []);
        
        if (currentPrefs.includes(trackName)) {
            const updated = currentPrefs.filter(t => t !== trackName);
            setEditedTeam({
                ...editedTeam,
                trackPreferences: updated,
                track: updated[0] || ''
            });
        } else {
            if (currentPrefs.length >= 3) {
                toast.error('You can select up to 3 track preferences. Deselect one first to change.');
                return;
            }
            const updated = [...currentPrefs, trackName];
            setEditedTeam({
                ...editedTeam,
                trackPreferences: updated,
                track: updated[0] || trackName
            });
        }
    };

    const handlePreSubmitValidation = () => {
        if (!editedTeam) return;
        if (team?.isRosterLocked || editedTeam?.isRosterLocked) {
            toast.info('Your registration is already finalized and locked.');
            return;
        }

        // External Agency Rule: Solo (1), Duo (2), or Quad (4) ONLY
        if (editedTeam.members.length === 3) {
            toast.error('External agency rules strictly require Solo (1), Duo (2), or Quad (4) teams. 3-member teams (Tri) are not allowed. Please add a 4th teammate to form a Quad, or remove a member to form a Duo before finalizing.');
            return;
        }

        if (editedTeam.members.length === 0 || editedTeam.members.length > 4) {
            toast.error('Invalid team size. Teams must have 1, 2, or 4 members.');
            return;
        }

        // Validate member details
        for (let i = 0; i < editedTeam.members.length; i++) {
            const m = editedTeam.members[i];
            if (!m.fullName?.trim() || !m.email?.trim()) {
                toast.error(`Please provide the name and email address for Member #${i + 1}.`);
                return;
            }
        }

        // Validate track selection
        const prefs = editedTeam.trackPreferences || (editedTeam.track ? [editedTeam.track] : []);
        if (prefs.length === 0) {
            toast.error('Please select at least 1 Innovation Track preference.');
            return;
        }

        setShowLockConfirmModal(true);
    };

    const handleFinalizeAndLock = async () => {
        if (!editedTeam) return;
        setIsSaving(true);
        try {
            const selectedPrefs = editedTeam.trackPreferences || (editedTeam.track ? [editedTeam.track] : []);
            const res = await fetch('/api/team/roster-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_details',
                    finalizeAndLock: true,
                    teamName: editedTeam.teamName,
                    track: selectedPrefs[0] || editedTeam.track,
                    trackPreferences: selectedPrefs,
                    college: editedTeam.college,
                    members: editedTeam.members
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Your registration has been finalized and permanently locked!');
                const updatedTeam = {
                    ...editedTeam,
                    track: selectedPrefs[0] || editedTeam.track,
                    trackPreferences: selectedPrefs,
                    isRosterLocked: true,
                    rosterLockedAt: new Date().toISOString()
                };
                setEditedTeam(updatedTeam);
                setTeam(JSON.parse(JSON.stringify(updatedTeam)));
                setShowLockConfirmModal(false);
            } else {
                toast.error(data.error || 'Failed to finalize registration.');
            }
        } catch {
            toast.error('Network error finalizing registration.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTeammate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editedTeam) return;
        if (editedTeam.members.length >= 4) {
            toast.error('Maximum team limit of 4 members reached.');
            return;
        }
        if (!newMemberForm.fullName.trim() || !newMemberForm.email.trim()) {
            toast.error('Please provide a full name and email address.');
            return;
        }

        const newMember: MemberData = {
            fullName: newMemberForm.fullName.trim(),
            email: newMemberForm.email.trim(),
            phone: newMemberForm.phone.trim(),
            college: newMemberForm.college.trim() || editedTeam.college || '',
            department: newMemberForm.department.trim(),
            year: newMemberForm.year.trim()
        };

        const updatedMembers = [...editedTeam.members, newMember];
        setEditedTeam({ ...editedTeam, members: updatedMembers });
        setShowAddMemberModal(false);
        setNewMemberForm({ fullName: '', email: '', phone: '', college: '', department: '', year: '' });
        toast.success(`Added ${newMember.fullName}! Team now has ${updatedMembers.length} members.`);
    };

    const handleRemoveTeammate = (indexToRemove: number) => {
        if (!editedTeam || indexToRemove === 0) return;
        const memberName = editedTeam.members[indexToRemove]?.fullName || `Member #${indexToRemove + 1}`;
        const updated = editedTeam.members.filter((_, idx) => idx !== indexToRemove);
        setEditedTeam({ ...editedTeam, members: updated });
        toast.info(`Removed ${memberName}. Team now has ${updated.length} members.`);
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
        if (editedTeam && editedTeam.members.length === 3) {
            toast.error('Cannot merge: Solo (1) + Duo (2) = 3 members is prohibited. Agency rules allow Solo (1), Duo (2), or Quad (4) teams only. If a Solo and Duo want to merge, a 4th teammate must be added to reach a full Quad (4).');
            return;
        }
        if (editedTeam && editedTeam.members.length >= 4) {
            toast.error('Your team is already at full Quad capacity (4 members). Merging is not allowed.');
            return;
        }
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
        if (editedTeam && editedTeam.members.length === 3) {
            toast.error('Cannot merge: Solo (1) + Duo (2) = 3 members is prohibited. Agency rules allow Solo (1), Duo (2), or Quad (4) teams only. If a Solo and Duo want to merge, a 4th teammate must be added to reach a full Quad (4).');
            return;
        }
        if (editedTeam && editedTeam.members.length >= 4) {
            toast.error('Your team is already at full Quad capacity (4 members). Merging is not allowed.');
            return;
        }
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
        if (!helpText.trim()) {
            toast.error('Please describe your issue.');
            return;
        }
        if (!helpContactPhone.trim()) {
            toast.error('Please enter a phone number so coordinators can contact you.');
            return;
        }

        setIsSubmittingHelp(true);
        try {
            const explicitTeamId = helpTeamId.trim() || team?.teamId || teamIdInput.trim() || '';
            const res = await fetch('/api/help-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: helpCategory,
                    description: helpText.trim(),
                    contactName: helpContactName.trim() || team?.captain || 'Participant',
                    contactPhone: helpContactPhone.trim(),
                    contactEmail: helpContactEmail.trim() || team?.email || '',
                    teamId: explicitTeamId || 'NO_TEAM_ID',
                    teamName: team?.teamName || (team?.captain ? `Team ${team.captain}` : helpContactName.trim() ? `Team ${helpContactName.trim()}` : (explicitTeamId ? `Team ${explicitTeamId}` : 'Visitor / Team')),
                    source: 'edit_registration'
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Your support request has been logged! Our coordinators will contact you shortly.');
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
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
            {/* Top Navigation Bar */}
            <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
                            TC
                        </div>
                        <span className="font-kanit font-black italic tracking-wider text-slate-900 text-lg group-hover:text-teal-600 transition">
                            TRI-CITY 2026
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={openHelpModal}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                        >
                            <HelpCircle size={14} className="text-teal-600" />
                            Coordinator Support
                        </button>
                        {team && (
                            <button
                                type="button"
                                onClick={() => { setTeam(null); setEditedTeam(null); }}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer hover:bg-slate-50"
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
                            className="p-8 rounded-[2rem] border border-slate-200 bg-white shadow-sm relative overflow-hidden"
                        >
                            <div className="text-center mb-6">
                                <div className="inline-flex w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 items-center justify-center mb-3">
                                    <ShieldCheck size={28} />
                                </div>
                                <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900">
                                    Team Correction Portal
                                </h1>
                                <p className="text-xs text-slate-500 mt-1.5 font-medium">
                                    Active for external registrations: October 5–6, 2026
                                </p>
                            </div>

                            {/* 48-Hour Live Window Banner */}
                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-6 flex items-start gap-2.5">
                                <Clock size={16} className="shrink-0 text-amber-600 mt-0.5" />
                                <div className="leading-relaxed">
                                    <p className="font-bold text-amber-900">48-Hour Team Details Edit Window Active</p>
                                    <p className="text-amber-800 text-[11px] mt-0.5">
                                        Team leads can check names, replace absent members, or merge teams. All team details permanently lock on October 6 at 11:59 PM.
                                    </p>
                                </div>
                            </div>

                            {authError && (
                                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-5 flex items-center gap-2.5">
                                    <AlertCircle size={16} className="shrink-0 text-rose-500" />
                                    <span>{authError}</span>
                                </div>
                            )}

                            <form onSubmit={handleManualLogin} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                                        Assigned Team ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. TC-1042"
                                        value={teamIdInput}
                                        onChange={e => setTeamIdInput(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono uppercase tracking-wider outline-none focus:border-teal-500 focus:bg-white transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                                        Registered Captain Email or Phone
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Lead email or 10-digit mobile"
                                        value={captainContactInput}
                                        onChange={e => setCaptainContactInput(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Must match the details submitted during agency registration.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-wider text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm mt-2"
                                >
                                    {isVerifying ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Verifying Team...
                                        </>
                                    ) : (
                                        <>
                                            View & Edit Team Details <ChevronRight size={14} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                                <button
                                    type="button"
                                    onClick={() => setShowLookupModal(true)}
                                    className="text-xs text-teal-600 hover:underline font-bold"
                                >
                                    Forgot your Team ID? Search by Email / Phone
                                </button>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* ══════════════ VIEW 2: AUTHENTICATED TEAM CORRECTION HUB ══════════════ */
                    <div className="space-y-6">
                        {/* Top Banner: Either Roster Finalized & Locked OR 48-Hour Correction Window */}
                        {team.isRosterLocked || editedTeam?.isRosterLocked ? (
                            <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0">
                                        <Lock size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="font-kanit font-extrabold uppercase text-lg text-slate-900">
                                                Team Details Finalized & Permanently Locked
                                            </h2>
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold uppercase tracking-wider">
                                                1-Time Edit Submitted
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            Your team registration was successfully finalized and locked. No further modifications can be made. Digital check-in QR codes unlock on <strong>October 10 at 08:00 AM</strong>.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0 shadow-sm">
                                    <ShieldCheck size={16} className="text-emerald-600" />
                                    <span>Read-Only Mode</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 rounded-3xl bg-teal-50/80 border border-teal-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="font-kanit font-extrabold uppercase text-lg text-slate-900">
                                                Team Edit Window Active
                                            </h2>
                                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                                                ⚠️ 1-Time Submission Only
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            You can modify your team details, track preferences, or members <strong>once</strong>. Once submitted, your registration is permanently locked.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handlePreSubmitValidation}
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-wider text-xs transition cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
                                >
                                    <Lock size={15} />
                                    Finalize & Lock Team Details
                                </button>
                            </div>
                        )}

                        {/* Agency Rule Alert: 3-Member Teams Prohibited */}
                        {editedTeam && editedTeam.members.length === 3 && !(team.isRosterLocked || editedTeam.isRosterLocked) && (
                            <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-4 shadow-sm">
                                <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <AlertTriangle size={22} />
                                </div>
                                <div className="leading-relaxed">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold uppercase tracking-tight text-amber-950 text-sm">
                                            Action Required: 3-Member Teams (Tri) Are Not Permitted
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-bold uppercase border border-rose-200">
                                            Agency Rule
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-900 mt-1">
                                        External agency rules strictly require teams to be <strong>Solo (1)</strong>, <strong>Duo (2)</strong>, or <strong>Quad (4)</strong>. Teams cannot compete or be locked with 3 members.
                                    </p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewMemberForm({
                                                    fullName: '',
                                                    email: '',
                                                    phone: '',
                                                    college: editedTeam?.college || '',
                                                    department: '',
                                                    year: ''
                                                });
                                                setShowAddMemberModal(true);
                                            }}
                                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                                        >
                                            <Plus size={14} /> Add 4th Teammate (Form Quad)
                                        </button>
                                        <span className="text-xs text-amber-800 font-medium">
                                            or remove an inactive member to participate as a Duo (2)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pending Merge Alert Banner (If Another Team Requested Merge) */}
                        {pendingMerge && (
                            <div className="p-5 rounded-3xl bg-purple-50 border-2 border-purple-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                        <GitMerge size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">
                                            Incoming Merge Request from &quot;{pendingMerge.targetTeamName}&quot;
                                        </h3>
                                        <p className="text-xs text-purple-900/80 mt-0.5">
                                            Team Lead <strong>{pendingMerge.targetCaptain}</strong> entered your merge code. Combined team will have <strong>{pendingMerge.sourceMemberCount + pendingMerge.targetMemberCount} / 4 members</strong>.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        disabled={isRespondingMerge}
                                        onClick={() => void handleRespondMerge('APPROVE')}
                                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase text-xs tracking-wider transition cursor-pointer disabled:opacity-50 shadow-sm"
                                    >
                                        {isRespondingMerge ? 'Processing...' : 'Approve & Merge'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isRespondingMerge}
                                        onClick={() => void handleRespondMerge('REJECT')}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
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
                                <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black border border-teal-100">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">
                                                    Team Information
                                                </h3>
                                                <span className="font-mono text-xs text-teal-700 font-bold">
                                                    ID: {team.teamId}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {editedTeam?.members.length === 1 && (
                                                <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold uppercase tracking-wider">
                                                    Solo (1 Member)
                                                </span>
                                            )}
                                            {editedTeam?.members.length === 2 && (
                                                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                                                    Duo (2 Members)
                                                </span>
                                            )}
                                            {editedTeam?.members.length === 4 && (
                                                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                                                    Quad (4 Members)
                                                </span>
                                            )}
                                            {editedTeam?.members.length === 3 && (
                                                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                                    3 Members (Invalid Size)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                                                Team Name
                                            </label>
                                            <input
                                                type="text"
                                                disabled={Boolean(team.isRosterLocked || editedTeam?.isRosterLocked)}
                                                value={editedTeam?.teamName || ''}
                                                onChange={e => editedTeam && setEditedTeam({ ...editedTeam, teamName: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold outline-none focus:border-teal-500 focus:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                                                College / Institution
                                            </label>
                                            <input
                                                type="text"
                                                disabled={Boolean(team.isRosterLocked || editedTeam?.isRosterLocked)}
                                                value={editedTeam?.college || ''}
                                                onChange={e => editedTeam && setEditedTeam({ ...editedTeam, college: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Multi-Track Selection (Up to 3) */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                                                Innovation Track Preferences (Select up to 3)
                                            </label>
                                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                                                {(editedTeam?.trackPreferences || (editedTeam?.track ? [editedTeam.track] : [])).length} / 3 Selected
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mb-2.5">
                                            Click to pick up to 3 tracks in order of preference. Your 1st choice is your primary track.
                                        </p>

                                        {/* Selected Track Badges */}
                                        {(editedTeam?.trackPreferences || (editedTeam?.track ? [editedTeam.track] : [])).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                                {(editedTeam?.trackPreferences || (editedTeam?.track ? [editedTeam.track] : [])).map((tr, rankIdx) => (
                                                    <div
                                                        key={tr}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold shadow-sm"
                                                    >
                                                        <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-mono">
                                                            {rankIdx + 1}
                                                        </span>
                                                        <span>{tr}</span>
                                                        {!(team.isRosterLocked || editedTeam?.isRosterLocked) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleTrackPreference(tr)}
                                                                className="hover:bg-white/20 rounded p-0.5 transition cursor-pointer"
                                                                title="Remove preference"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Track Choices Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {TRACKS.map(t => {
                                                const currentPrefs: string[] = editedTeam?.trackPreferences || (editedTeam?.track ? [editedTeam.track] : []);
                                                const rank = currentPrefs.indexOf(t);
                                                const isSelected = rank !== -1;
                                                const isRosterLocked = Boolean(team.isRosterLocked || editedTeam?.isRosterLocked);

                                                return (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        disabled={isRosterLocked}
                                                        onClick={() => toggleTrackPreference(t)}
                                                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition text-xs font-semibold ${
                                                            isSelected
                                                                ? 'border-teal-500 bg-teal-50 text-teal-900 ring-1 ring-teal-500 shadow-sm'
                                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                        } ${isRosterLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        <span className="truncate pr-2">{t}</span>
                                                        {isSelected ? (
                                                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold">
                                                                #{rank + 1}
                                                            </span>
                                                        ) : (
                                                            <span className="shrink-0 text-slate-400 font-bold text-sm">+</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Member Cards List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <div>
                                            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                                <User size={16} className="text-teal-600" />
                                                Registered Team Members
                                            </h3>
                                            <span className="text-[11px] text-slate-500">
                                                {team.isRosterLocked || editedTeam?.isRosterLocked
                                                    ? 'Team details are permanently locked.'
                                                    : 'Review and update your team member information below.'}
                                            </span>
                                        </div>

                                        {!(team.isRosterLocked || editedTeam?.isRosterLocked) && (editedTeam?.members.length || 0) < 4 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewMemberForm({
                                                        fullName: '',
                                                        email: '',
                                                        phone: '',
                                                        college: editedTeam?.college || '',
                                                        department: '',
                                                        year: ''
                                                    });
                                                    setShowAddMemberModal(true);
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                                            >
                                                <Plus size={14} /> Add Teammate
                                            </button>
                                        )}
                                    </div>

                                    {editedTeam?.members.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-sm transition space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <h4 className="font-bold text-sm text-slate-900">
                                                        {idx === 0 ? `${m.fullName || 'Lead'} (Team Captain)` : m.fullName || `Member ${idx + 1}`}
                                                    </h4>
                                                    {m.replacedAt && (
                                                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 text-[9px] font-bold uppercase">
                                                            Replaced
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                                <div>
                                                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        id={`member-name-${idx}`}
                                                        type="text"
                                                        placeholder="Full Name"
                                                        disabled={Boolean(team.isRosterLocked || editedTeam?.isRosterLocked)}
                                                        value={m.fullName || ''}
                                                        onChange={e => {
                                                            const copy = [...editedTeam.members];
                                                            copy[idx].fullName = e.target.value;
                                                            setEditedTeam({ ...editedTeam, members: copy });
                                                        }}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        id={`member-email-${idx}`}
                                                        type="email"
                                                        placeholder="Email Address"
                                                        disabled={Boolean(team.isRosterLocked || editedTeam?.isRosterLocked)}
                                                        value={m.email || ''}
                                                        onChange={e => {
                                                            const copy = [...editedTeam.members];
                                                            copy[idx].email = e.target.value;
                                                            setEditedTeam({ ...editedTeam, members: copy });
                                                        }}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                                        Mobile Number
                                                    </label>
                                                    <input
                                                        id={`member-phone-${idx}`}
                                                        type="text"
                                                        placeholder="Mobile Number"
                                                        disabled={Boolean(team.isRosterLocked || editedTeam?.isRosterLocked)}
                                                        value={m.phone || ''}
                                                        onChange={e => {
                                                            const copy = [...editedTeam.members];
                                                            copy[idx].phone = e.target.value;
                                                            setEditedTeam({ ...editedTeam, members: copy });
                                                        }}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-teal-500 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
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
                                <div className="p-6 rounded-3xl border border-purple-200 bg-purple-50/50 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center">
                                            <GitMerge size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                                                Merge Teams
                                            </h3>
                                        </div>
                                    </div>

                                    {team.isRosterLocked || editedTeam?.isRosterLocked ? (
                                        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs shadow-sm space-y-2">
                                            <div className="flex items-center gap-2 font-bold text-slate-800">
                                                <Lock size={15} className="text-teal-600" />
                                                <span>Team Merging Locked</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                                Your team registration has been finalized and permanently locked. Merges are disabled for finalized registrations.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Sub-Feature A: Generate Code */}
                                            <div className="p-4 rounded-2xl bg-white border border-purple-100 space-y-2.5 shadow-sm">
                                                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                                                    Option 1: Invite Another Team
                                                </span>
                                                {generatedCode ? (
                                                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                                                        <div>
                                                            <span className="text-[10px] text-slate-500 block font-bold">Your Merge Code:</span>
                                                            <span className="font-mono text-xl font-black text-teal-700 tracking-widest">
                                                                {generatedCode}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                void navigator.clipboard.writeText(generatedCode);
                                                                toast.success('Merge code copied to clipboard!');
                                                            }}
                                                            className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer hover:bg-teal-700"
                                                        >
                                                            <Copy size={12} /> Copy
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={isGeneratingCode}
                                                        onClick={handleGenerateMergeCode}
                                                        className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                                                    >
                                                        {isGeneratingCode ? 'Creating Code...' : 'Generate 30-Min Merge Code'}
                                                    </button>
                                                )}
                                                <p className="text-[10px] text-slate-500">
                                                    Share this code with the other Team Lead. Once they enter it, you will receive an approval prompt.
                                                </p>
                                            </div>

                                            {/* Sub-Feature B: Enter Code */}
                                            <form onSubmit={handleSubmitMergeCode} className="p-4 rounded-2xl bg-white border border-purple-100 space-y-2.5 shadow-sm">
                                                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                                                    Option 2: Enter Their Merge Code
                                                </span>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. MG-8492"
                                                        value={inputMergeCode}
                                                        onChange={e => setInputMergeCode(e.target.value)}
                                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 uppercase outline-none focus:border-purple-500 focus:bg-white"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmittingMerge || !inputMergeCode.trim()}
                                                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase transition cursor-pointer disabled:opacity-50 shadow-sm"
                                                    >
                                                        {isSubmittingMerge ? '...' : 'Request'}
                                                    </button>
                                                </div>
                                            </form>
                                        </>
                                    )}
                                </div>

                                {/* Coordinator Support Widget */}
                                <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 text-xs font-bold uppercase text-slate-700 tracking-wider">
                                        <HelpCircle size={16} className="text-teal-600" />
                                        <span>Coordinator Support</span>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                            <p className="font-bold text-slate-900 mb-1">Need assistance?</p>
                                            <p className="text-slate-600 text-[11px] leading-relaxed mb-3">
                                                Submit an in-app ticket below and our coordinators will contact you directly to assist with your request.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={openHelpModal}
                                                className="w-full py-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold text-[11px] transition cursor-pointer"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xl overflow-hidden text-slate-900"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                                        <UserPlus size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold uppercase tracking-tight text-slate-900 text-base">
                                            Replace Member #{replacingSlotIndex + 1}
                                        </h3>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                                            Anti-Fraud Substitution
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReplacingSlotIndex(null)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                                Enter the new teammate’s details below. An automated security notice will be emailed to the previous participant.
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        New Member Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={replacementForm.fullName}
                                        onChange={e => setReplacementForm({ ...replacementForm, fullName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        New Member Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="student@college.edu"
                                        value={replacementForm.email}
                                        onChange={e => setReplacementForm({ ...replacementForm, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                            Mobile Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="10-digit number"
                                            value={replacementForm.phone}
                                            onChange={e => setReplacementForm({ ...replacementForm, phone: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                            College
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="College Name"
                                            value={replacementForm.college}
                                            onChange={e => setReplacementForm({ ...replacementForm, college: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setReplacingSlotIndex(null)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isReplacing || !replacementForm.fullName || !replacementForm.email}
                                        onClick={handleExecuteMemberReplacement}
                                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase text-xs tracking-wider transition cursor-pointer disabled:opacity-50 shadow-sm"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xl text-slate-900"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                                        <Search size={18} />
                                    </div>
                                    <h3 className="font-bold uppercase tracking-tight text-slate-900 text-base">
                                        Find Your Team ID
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowLookupModal(false)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleLookupTeam} className="space-y-3 mb-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        Enter Registered Email or Mobile Number
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="e.g. captain@college.edu or 9876543210"
                                            value={lookupQuery}
                                            onChange={e => setLookupQuery(e.target.value)}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={lookupLoading}
                                            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase"
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
                                            className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 transition cursor-pointer flex items-center justify-between"
                                        >
                                            <div>
                                                <span className="font-bold text-sm text-slate-900 block">{r.teamName}</span>
                                                <span className="text-[11px] text-slate-500">{r.captainName} • {r.maskedEmail}</span>
                                            </div>
                                            <span className="font-mono text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
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
                            className="w-full max-w-md bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xl text-slate-900"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                        <HelpCircle size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold uppercase tracking-tight text-slate-900 text-base">
                                            Coordinator Support Desk
                                        </h3>
                                        <p className="text-[10px] text-teal-700 font-bold uppercase tracking-widest">
                                            Our coordinators will contact you to assist
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowHelpModal(false)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitSupportTicket} className="space-y-3.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                            Issue Category
                                        </label>
                                        <select
                                            value={helpCategory}
                                            onChange={e => setHelpCategory(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition"
                                        >
                                            <option value="Team Details Query">Team Members & Member Changes</option>
                                            <option value="Team Merge">Team Merge Question</option>
                                            <option value="Pass & QR">Digital Pass / Event Dates</option>
                                            <option value="Other">General Hackathon Question</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                            Team ID <span className="text-slate-400 font-normal lowercase">(leave blank if unknown)</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. TRI26221"
                                            value={helpTeamId}
                                            onChange={e => setHelpTeamId(e.target.value.toUpperCase())}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition"
                                        />
                                    </div>
                                </div>

                                {/* POC Contact Information */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                            Your Name / POC <span className="text-teal-600 font-bold">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Rahul Sharma"
                                            value={helpContactName}
                                            onChange={e => setHelpContactName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                            Mobile / WhatsApp <span className="text-teal-600 font-bold">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="e.g. +91 9876543210"
                                            value={helpContactPhone}
                                            onChange={e => setHelpContactPhone(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="e.g. captain@gmail.com"
                                        value={helpContactEmail}
                                        onChange={e => setHelpContactEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        Describe your issue <span className="text-teal-600 font-bold">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Please provide details (e.g. My teammate dropped out and I need to add X)..."
                                        value={helpText}
                                        onChange={e => setHelpText(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition leading-relaxed"
                                        required
                                    />
                                </div>

                                <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/60 text-teal-800 text-[11px] flex items-center gap-2">
                                    <Phone size={13} className="shrink-0 text-teal-600" />
                                    <span>Coordinators will connect with you directly via WhatsApp or phone call.</span>
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowHelpModal(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs uppercase hover:bg-slate-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingHelp || !helpText.trim() || !helpContactPhone.trim()}
                                        className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase text-xs tracking-wider transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
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

            {/* ══════════════ MODAL 4: 1-TIME LOCK CONFIRMATION MODAL ══════════════ */}
            <AnimatePresence>
                {showLockConfirmModal && editedTeam && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-7 shadow-2xl text-slate-900"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold uppercase tracking-tight text-slate-900 text-base">
                                            Finalize & Lock Registration
                                        </h3>
                                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                                            ⚠️ Permanent 1-Time Submission
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowLockConfirmModal(false)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                    <p className="leading-relaxed">
                                        Please review your details carefully. <strong>You can only submit this form once.</strong> After locking, all team edits, substitutions, and merges will be closed permanently.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Team Name</span>
                                        <span className="font-bold text-slate-900">{editedTeam.teamName}</span>
                                    </div>

                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Structure</span>
                                        <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                            {editedTeam.members.length === 1 ? 'Solo Team (1 Member)' : editedTeam.members.length === 2 ? 'Duo Team (2 Members)' : 'Quad Team (4 Members)'}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-slate-500 font-bold uppercase text-[10px] block mb-1">Team Members ({editedTeam.members.length})</span>
                                        <div className="space-y-1">
                                            {editedTeam.members.map((m, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                                                    <span className="font-semibold">
                                                        {idx + 1}. {m.fullName} {idx === 0 && '(Lead)'}
                                                    </span>
                                                    <span className="text-slate-500 font-mono text-[10px]">{m.email}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-1">
                                        <span className="text-slate-500 font-bold uppercase text-[10px] block mb-1">Track Preferences</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(editedTeam.trackPreferences || (editedTeam.track ? [editedTeam.track] : [])).map((t, idx) => (
                                                <span key={t} className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">
                                                    #{idx + 1} {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => setShowLockConfirmModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs uppercase hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        Review Details
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={handleFinalizeAndLock}
                                        className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase text-xs tracking-wider transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Lock size={14} className={isSaving ? 'animate-spin' : ''} />
                                        {isSaving ? 'Locking...' : 'Confirm & Lock Team Details'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════ MODAL 5: ADD TEAMMATE MODAL ══════════════ */}
            <AnimatePresence>
                {showAddMemberModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xl text-slate-900"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                                        <UserPlus size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold uppercase tracking-tight text-slate-900 text-base">
                                            Add Teammate
                                        </h3>
                                        <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                                            Enter Member Details
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAddMemberModal(false)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddTeammate} className="space-y-3.5">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Teammate's full name"
                                        value={newMemberForm.fullName}
                                        onChange={e => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="teammate@college.edu"
                                        value={newMemberForm.email}
                                        onChange={e => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        Mobile Number *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="10-digit mobile number"
                                        value={newMemberForm.phone}
                                        onChange={e => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-teal-500 focus:bg-white"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                            Department
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. CSE / IT"
                                            value={newMemberForm.department}
                                            onChange={e => setNewMemberForm({ ...newMemberForm, department: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                            Year
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 3rd Year"
                                            value={newMemberForm.year}
                                            onChange={e => setNewMemberForm({ ...newMemberForm, year: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddMemberModal(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs uppercase hover:bg-slate-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        <Plus size={14} /> Add Teammate
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
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <EditRegistrationInner />
        </Suspense>
    );
}
