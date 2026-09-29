"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    ArrowLeft, Search, Save, Users, User, Edit3, CheckCircle2,
    AlertCircle, Eye, EyeOff, Loader2, KeyRound, ShieldCheck
} from "lucide-react";

const AVAILABLE_TRACKS = [
    "SaaSum AI",
    "Maceco",
    "Tobofu",
    "Promtal",
    "Skill Tank",
    "Vriddhi",
    "Open Innovation"
];

interface MemberData {
    fullName: string;
    email: string;
    phone: string;
    college: string;
    year: string;
    department: string;
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
    problemStatement: string;
    createdAt: string;
}

function EditRegistrationContent() {
    // Auth state
    const [teamIdInput, setTeamIdInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [authError, setAuthError] = useState("");

    // Team data state
    const [team, setTeam] = useState<TeamData | null>(null);
    const [editedTeam, setEditedTeam] = useState<TeamData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleLookup = async () => {
        const id = teamIdInput.trim();
        const pass = passwordInput.trim();

        if (!id) {
            setAuthError("Please enter your Team ID");
            return;
        }
        if (!pass) {
            setAuthError("Please enter your password");
            return;
        }

        setIsSearching(true);
        setAuthError("");

        try {
            const authRes = await fetch('/api/auth/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: id, password: pass })
            });
            const authData = await authRes.json();
            if (!authRes.ok) {
                setAuthError(authData.error || 'Invalid team credentials.');
                return;
            }

            const res = await fetch('/api/participant-update', { cache: 'no-store' });
            const data = await res.json();

            if (res.ok && data.success) {
                setTeam(data.team);
                setEditedTeam(JSON.parse(JSON.stringify(data.team)));
                toast.success(`Welcome! Found team "${data.team.teamName}"`);
            } else {
                setAuthError(data.error || "Team not found. Check your credentials.");
            }
        } catch (err) {
            setAuthError("Network error. Please try again.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleMemberChange = (index: number, field: keyof MemberData, value: string) => {
        if (!editedTeam) return;
        const newMembers = [...editedTeam.members];
        newMembers[index] = { ...newMembers[index], [field]: value };
        setEditedTeam({ ...editedTeam, members: newMembers });
    };

    const handleTrackToggle = (trackName: string) => {
        if (!editedTeam) return;
        const currentTracks = editedTeam.track ? editedTeam.track.split(',').map(t => t.trim()).filter(Boolean) : [];
        
        if (currentTracks.includes(trackName)) {
            setEditedTeam({
                ...editedTeam,
                track: currentTracks.filter(t => t !== trackName).join(', ')
            });
        } else {
            if (currentTracks.length < 3) {
                setEditedTeam({
                    ...editedTeam,
                    track: [...currentTracks, trackName].join(', ')
                });
            } else {
                toast.error("You can select a maximum of 3 tracks.");
            }
        }
    };

    const handleSave = async () => {
        if (!editedTeam || !team) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/participant-update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamId: team.teamId,
                    teamName: editedTeam.teamName,
                    track: editedTeam.track,
                    captain: editedTeam.members[0]?.fullName || editedTeam.captain,
                    captainMobile: editedTeam.members[0]?.phone || editedTeam.captainMobile,
                    college: editedTeam.members[0]?.college || editedTeam.college,
                    email: editedTeam.members[0]?.email || editedTeam.email,
                    members: editedTeam.members,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success("Details updated successfully!");
                setTeam(JSON.parse(JSON.stringify(editedTeam)));
                setIsEditing(false);
            } else {
                toast.error(data.error || "Failed to save changes.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        void fetch('/api/auth/logout', { method: 'POST' });
        setTeam(null);
        setEditedTeam(null);
        setTeamIdInput("");
        setPasswordInput("");
        setIsEditing(false);
        setAuthError("");
    };

    const hasChanges = JSON.stringify(team) !== JSON.stringify(editedTeam);

    // ─── AUTH SCREEN ───
    if (!team) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-[#F8F9FA] via-white to-white flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
                {/* Background grid */}
                <div
                    className="absolute inset-0 opacity-[0.035] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-100/10 blur-[160px] rounded-full" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-100/10 blur-[160px] rounded-full" />
                </div>

                <div className="relative z-10 w-full max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f766e] to-[#0d9488] mb-5 shadow-lg shadow-teal-500/20">
                            <Edit3 size={28} className="text-white" />
                        </div>
                        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-[#0f172a] mb-2">
                            Edit Registration
                        </h1>
                        <p className="font-body text-gray-500 text-sm md:text-base">
                            Enter your Team ID & password to update your details
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <div className="pro-card rounded-xl p-6 md:p-8 bg-white border border-gray-200 shadow-sm">
                            <div className="space-y-5">
                                {/* Team ID */}
                                <div className="space-y-2">
                                    <label className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                                        <KeyRound size={12} />
                                        Team ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. TRI26002"
                                        value={teamIdInput}
                                        onChange={(e) => { setTeamIdInput(e.target.value); setAuthError(""); }}
                                        onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-base font-body text-[#0f172a] placeholder:text-gray-400 focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-teal-500/20 transition-all uppercase"
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                                        <ShieldCheck size={12} />
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your team password"
                                            value={passwordInput}
                                            onChange={(e) => { setPasswordInput(e.target.value); setAuthError(""); }}
                                            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-base font-body text-[#0f172a] placeholder:text-gray-400 focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-teal-500/20 transition-all pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Error */}
                                <AnimatePresence>
                                    {authError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
                                        >
                                            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                            <p className="text-red-700 text-xs font-body font-semibold">{authError}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Submit */}
                                <button
                                    onClick={handleLookup}
                                    disabled={isSearching}
                                    className="btn-primary w-full"
                                >
                                    {isSearching ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Looking up...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Search size={16} />
                                            <span>Find My Registration</span>
                                        </>
                                    )}
                                </button>

                                <div className="pt-3 border-t border-gray-100 text-center">
                                    <p className="font-body text-xs text-gray-400">
                                        Use the same Team ID and password you received during registration
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-6 text-center"
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-[#0f172a] hover:border-gray-300 transition-all font-display font-semibold text-xs uppercase tracking-wider group"
                        >
                            <ArrowLeft size={14} />
                            Back to Home
                        </Link>
                    </motion.div>
                </div>
            </main>
        );
    }

    // ─── EDIT SCREEN ───
    return (
        <main className="min-h-screen bg-gradient-to-b from-[#F8F9FA] via-white to-white relative overflow-hidden">
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
                {/* Top bar */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0f172a] transition-colors group font-display font-semibold text-xs uppercase tracking-wider"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Sign Out
                    </button>

                    <div className="flex items-center gap-3">
                        {isEditing && hasChanges && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={handleSave}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f766e] text-white text-xs font-display font-bold uppercase tracking-wider hover:bg-[#0d6b63] transition-all shadow-sm shadow-teal-500/20 disabled:opacity-60"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {isSaving ? "Saving..." : "Save Changes"}
                            </motion.button>
                        )}
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f172a] text-white text-xs font-display font-bold uppercase tracking-wider hover:bg-[#1e293b] transition-all shadow-sm"
                            >
                                <Edit3 size={14} />
                                Edit Details
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedTeam(JSON.parse(JSON.stringify(team)));
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-600 text-xs font-display font-bold uppercase tracking-wider hover:bg-gray-50 transition-all border border-gray-200"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Team Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="pro-card rounded-xl p-6 bg-white border border-gray-200 mb-6"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0f766e] to-[#0d9488] flex items-center justify-center text-2xl font-display font-bold text-white shadow-md shadow-teal-500/20">
                                {(editedTeam?.teamName || "T").charAt(0).toUpperCase()}
                            </div>
                            <div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedTeam?.teamName || ""}
                                        onChange={(e) => editedTeam && setEditedTeam({ ...editedTeam, teamName: e.target.value })}
                                        className="text-xl font-display font-bold text-[#0f172a] bg-transparent border-b-2 border-teal-500 focus:outline-none pb-0.5"
                                    />
                                ) : (
                                    <h2 className="text-xl font-display font-bold text-[#0f172a]">{team.teamName}</h2>
                                )}
                                <p className="text-sm font-mono text-gray-500 mt-0.5">{team.teamId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider ${
                                team.status === 'REGISTERED' || team.status === 'CONFIRMED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : team.status === 'PENDING'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                            }`}>
                                <CheckCircle2 size={12} />
                                {team.status}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Tracks Section */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="pro-card rounded-xl p-6 bg-white border border-gray-200 mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-lg text-[#0f172a]">Selected Tracks</h3>
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Max 3</span>
                        </div>
                    </div>
                    
                    {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TRACKS.map(track => {
                                const currentTracks = editedTeam?.track ? editedTeam.track.split(',').map(t => t.trim()).filter(Boolean) : [];
                                const isSelected = currentTracks.includes(track);
                                return (
                                    <button
                                        key={track}
                                        onClick={() => handleTrackToggle(track)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider border transition-all ${
                                            isSelected
                                                ? 'bg-teal-50 text-teal-700 border-teal-500'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300'
                                        }`}
                                    >
                                        {track}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {(team.track ? team.track.split(',').map(t => t.trim()).filter(Boolean) : []).length > 0 ? (
                                (team.track ? team.track.split(',').map(t => t.trim()).filter(Boolean) : []).map(track => (
                                    <span key={track} className="px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-display font-bold uppercase tracking-wider border border-teal-200">
                                        {track}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm font-body text-gray-400 italic">No tracks selected</span>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Members */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={18} className="text-[#0f766e]" />
                        <h3 className="font-display font-bold text-lg text-[#0f172a]">Team Members</h3>
                        {isEditing && (
                            <span className="ml-auto text-xs font-mono text-teal-600 bg-teal-50 px-2 py-1 rounded-md border border-teal-200">
                                Editing Mode
                            </span>
                        )}
                    </div>

                    {(editedTeam?.members || []).map((member, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 + idx * 0.05 }}
                            className="pro-card rounded-xl p-5 md:p-6 bg-white border border-gray-200 relative overflow-hidden"
                        >
                            {/* Role tag */}
                            <div className="absolute top-0 right-0">
                                <div className={`px-3 py-1 text-[10px] font-display font-bold uppercase tracking-wider rounded-bl-lg ${
                                    idx === 0
                                        ? 'bg-[#0f766e] text-white'
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    <span className="flex items-center gap-1">
                                        <User size={10} />
                                        {idx === 0 ? "Team Lead" : `Member ${idx + 1}`}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                <FieldGroup
                                    label="Full Name"
                                    value={member.fullName || ""}
                                    editing={isEditing}
                                    onChange={(val) => handleMemberChange(idx, "fullName", val)}
                                    placeholder="Full legal name"
                                />
                                <FieldGroup
                                    label="Email"
                                    value={member.email || ""}
                                    editing={isEditing}
                                    onChange={(val) => handleMemberChange(idx, "email", val)}
                                    placeholder="email@example.com"
                                    type="email"
                                />
                                <FieldGroup
                                    label="Phone"
                                    value={member.phone || ""}
                                    editing={isEditing}
                                    onChange={(val) => handleMemberChange(idx, "phone", val)}
                                    placeholder="+91 00000 00000"
                                />
                                <FieldGroup
                                    label="College"
                                    value={member.college || ""}
                                    editing={isEditing}
                                    onChange={(val) => handleMemberChange(idx, "college", val)}
                                    placeholder="College Name"
                                />
                                <FieldGroup
                                    label="Year"
                                    value={member.year || ""}
                                    editing={isEditing}
                                    onChange={(val) => handleMemberChange(idx, "year", val)}
                                    placeholder="e.g. 3rd Year"
                                    selectOptions={["1st Year", "2nd Year", "3rd Year", "4th Year"]}
                                />
                                <FieldGroup
                                    label="Department"
                                    value={member.department || ""}
                                    editing={isEditing}
                                    onChange={(val) => handleMemberChange(idx, "department", val)}
                                    placeholder="e.g. CSE"
                                />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Bottom save bar (mobile sticky) */}
                {isEditing && hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-0 left-0 right-0 md:relative md:mt-6 bg-white/90 backdrop-blur-md border-t md:border border-gray-200 md:rounded-xl p-4 flex items-center justify-between gap-4 z-50"
                    >
                        <p className="text-xs font-body text-gray-500">
                            You have unsaved changes
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedTeam(JSON.parse(JSON.stringify(team)));
                                }}
                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-display font-bold uppercase tracking-wider hover:bg-gray-200 transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0f766e] text-white text-xs font-display font-bold uppercase tracking-wider hover:bg-[#0d6b63] transition-all shadow-sm shadow-teal-500/20 disabled:opacity-60"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}

// ─── Field Component ─────────────────────────────────────────────────
function FieldGroup({
    label,
    value,
    editing,
    onChange,
    placeholder,
    type = "text",
    selectOptions,
}: {
    label: string;
    value: string;
    editing: boolean;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: string;
    selectOptions?: string[];
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-400">
                {label}
            </label>
            {editing ? (
                selectOptions ? (
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body text-[#0f172a] focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-teal-500/20 transition-all"
                    >
                        <option value="" disabled>Select</option>
                        {selectOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body text-[#0f172a] placeholder:text-gray-300 focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-teal-500/20 transition-all"
                    />
                )
            ) : (
                <p className="text-sm font-body text-[#0f172a] py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-100 min-h-[40px]">
                    {value || <span className="text-gray-300 italic">Not provided</span>}
                </p>
            )}
        </div>
    );
}

// ─── Export ──────────────────────────────────────────────────────────
export default function EditRegistrationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-[#0f766e] rounded-full animate-spin" />
            </div>
        }>
            <EditRegistrationContent />
        </Suspense>
    );
}
