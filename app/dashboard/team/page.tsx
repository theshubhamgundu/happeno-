"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Edit3, Save, Users, FolderKanban, Presentation, Headphones, Send, X, Key, MapPin, Wifi, Award } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import {
    TRACKS,
    PROBLEM_STATEMENTS,
    EXTENDED_PROBLEM_STATEMENTS,
    getProblemStatementsForTrack,
    isOpenInnovationTrack,
    MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS,
    MAX_PROPOSED_IDEA_CHARACTERS
} from "@/lib/constants";
import { toast } from "sonner";


// TODO: Replace with the actual problem statements provided by the external team
const DOMAIN_PROBLEM_STATEMENTS = [
    "Design a real-time civic issue reporting system for urban areas",
    "Build an AI-powered platform to detect and prevent financial fraud",
    "Create a decentralized supply chain transparency solution using blockchain",
    "Develop a smart campus navigation and resource booking system",
    "Build a mental health support chatbot for students and young adults",
    "Design a platform to connect rural farmers with buyers and logistics providers",
    "Create an accessible e-learning platform for students with disabilities",
    "Build a waste management and recycling incentive system using IoT",
    "Develop a skill-matching platform for freelancers and small businesses",
    "Design an emergency response coordination system for disaster management",
];

const TECH_CATEGORIES = {
    Frontend: ["React", "Next.js", "Vue", "Svelte", "HTML/CSS/JS"],
    Backend: ["Node.js", "Express", "Python", "Flask", "Django"],
    Database: ["PostgreSQL", "MongoDB", "MySQL", "Firebase DB", "Supabase DB"],
    Auth: ["Firebase Auth", "Supabase Auth", "Auth0", "NextAuth"]
};

function LockInFlow({ team, onLocked }: { team: any, onLocked: (track: string, ps: string) => void }) {
    const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
    const [selectedPS, setSelectedPS] = useState<string | null>(null);
    const [isLocking, setIsLocking] = useState(false);
    const [availability, setAvailability] = useState<Record<string, {used: number, total: number, isFull: boolean}>>({});
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

    useEffect(() => {
        if (selectedTrack && !isOpenInnovationTrack(selectedTrack)) {
            setIsLoadingAvailability(true);
            fetch(`/api/team/available-ps?track=${encodeURIComponent(selectedTrack)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.availability) {
                        setAvailability(data.availability);
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoadingAvailability(false));
        } else {
            setAvailability({});
        }
    }, [selectedTrack]);

    // trackPreferences comes from the teams API (sourced from raw_data.track_preferences in DB)
    const preferences: string[] = team.trackPreferences || [];
    
    // If external team hasn't set track preferences yet, show all available tracks
    const availableTracks = preferences.length > 0 ? preferences : TRACKS;
    const isCustomProblemTrack = isOpenInnovationTrack(selectedTrack);
    const problemText = selectedPS ?? "";
    const problemWordCount = problemText.trim() ? problemText.trim().split(/\s+/).length : 0;

    const handleLock = async () => {
        if (!selectedTrack || !selectedPS) {
            toast.error("Please select a track and enter a problem statement.");
            return;
        }
        if (isOpenInnovationTrack(selectedTrack) && selectedPS.length > MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS) {
            toast.error(`Your problem statement must be ${MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS} characters or fewer.`);
            return;
        }

        setIsLocking(true);
        try {
            const res = await fetch("/api/team/lock-track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId: team.teamId, track: selectedTrack, problemStatement: selectedPS })
            });
            
            const data = await res.json().catch(() => ({}));
            
            if (res.ok || res.status === 409 || data.success) {
                const finalTrack = data.track || selectedTrack || team.track;
                const finalPS = data.problemStatement || selectedPS || team.problemStatement;
                toast.success("Track and problem statement locked successfully!");
                onLocked(finalTrack, finalPS);
            } else {
                toast.error(data.message || "Failed to lock track. Please try again.");
            }
        } catch (error) {
            toast.error("Network error occurred.");
        } finally {
            setIsLocking(false);
        }
    };

    return (
        <DashboardLayout type="team" title="Lock Your Track">
            <div className="max-w-3xl mx-auto rounded-2xl border border-zinc-800/80 bg-[#0c0c10] p-8 shadow-xl mt-8">
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/25 text-orange-400 mb-4 shadow-[0_0_20px_rgba(234,88,12,0.2)]">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Confirm Your Final Track</h2>
                    <p className="text-zinc-400 mt-2 text-sm">You must lock in your track and problem statement before proceeding to your workspace.</p>
                </div>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">1. Select Your Track</h3>
                        <div className="grid gap-3">
                            {availableTracks.map((track: string) => (
                                <button
                                    key={track}
                                    onClick={() => { setSelectedTrack(track); setSelectedPS(null); }}
                                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${selectedTrack === track ? 'border-orange-500/50 bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/40' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300'}`}
                                >
                                    <span className="font-semibold text-sm">{track}</span>
                                    {selectedTrack === track && <CheckCircle2 className="text-orange-400" size={20} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedTrack && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            {isCustomProblemTrack ? (
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">2. Enter Your Problem Statement</h3>
                                    <p className="mb-3 text-xs text-zinc-400">Describe the problem in 5–10 words. Keep it under {MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS} characters.</p>
                                    <textarea
                                        value={problemText}
                                        onChange={(event) => setSelectedPS(event.target.value)}
                                        maxLength={MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS}
                                        rows={3}
                                        placeholder="Enter a concise problem statement"
                                        className="w-full resize-none rounded-xl border border-zinc-800 bg-black/60 p-4 text-sm text-white outline-none transition focus:border-orange-500/60 placeholder:text-zinc-600"
                                    />
                                    <p className={`mt-1 text-right text-xs ${problemText.length >= MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS ? "text-amber-500" : "text-zinc-500"}`}>
                                        {problemWordCount} words · {problemText.length}/{MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS} characters
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">
                                        2. Select Problem Statement
                                        {isLoadingAvailability && <span className="ml-2 text-xs font-normal text-zinc-500 lowercase">(checking availability...)</span>}
                                    </h3>
                                    <div className="grid gap-3">
                                        {getProblemStatementsForTrack(selectedTrack).map((ps: string, idx: number) => {
                                            const avail = availability[ps];
                                            const isFull = avail?.isFull;
                                            const extData = EXTENDED_PROBLEM_STATEMENTS[selectedTrack]?.find(e => e.statement === ps);
                                            const mvp = extData?.mvp;

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => !isFull && setSelectedPS(ps)}
                                                    disabled={isFull}
                                                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all 
                                                        ${isFull ? 'opacity-50 cursor-not-allowed bg-zinc-900/30 border-zinc-800' : ''}
                                                        ${selectedPS === ps ? 'border-orange-500/50 bg-orange-500/10 ring-1 ring-orange-500/40 text-orange-300' : (!isFull ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300' : '')}`}
                                                >
                                                    <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-full border flex items-center justify-center ${selectedPS === ps ? 'border-orange-500 bg-orange-500' : 'border-zinc-700'}`}>
                                                        {selectedPS === ps && <div className="h-2 w-2 rounded-full bg-white" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className={`font-medium text-sm leading-relaxed block ${selectedPS === ps ? 'text-orange-200' : 'text-zinc-200'} ${isFull ? 'line-through text-zinc-500' : ''}`}>{ps}</span>
                                                        {mvp && <p className="mt-2 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800 pt-2"><span className="font-semibold text-zinc-300">MVP Scope:</span> {mvp}</p>}
                                                    </div>
                                                    {avail && (
                                                        <div className={`shrink-0 text-xs font-bold px-2 py-1 rounded-md ${isFull ? 'bg-rose-950/60 text-rose-400 border border-rose-900' : 'bg-zinc-800 text-zinc-300'}`}>
                                                            {isFull ? 'FULL' : `${Math.max(0, avail.total - avail.used)} slots left`}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="pt-6 border-t border-zinc-800">
                        <button
                            onClick={handleLock}
                            disabled={!selectedTrack || !selectedPS || isLocking}
                            className="btn-primary w-full h-12 rounded-xl text-sm justify-center"
                        >
                            {isLocking ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "LOCK IN SELECTION"}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function TeamDashboard() {
    const { projects, isLoading, isSubmissionLocked, refreshTeams } = useHackathon();

    const { user } = useAuth();
    
    const [proposedIdea, setProposedIdea] = useState("");
    const [techStack, setTechStack] = useState<Record<string, string[]>>({ Frontend: [], Backend: [], Database: [], Auth: [] });
    const [otherTechEnabled, setOtherTechEnabled] = useState<Record<string, boolean>>({});
    const [otherTechInput, setOtherTechInput] = useState<Record<string, string>>({});
    
    // Local state for values being edited before the database confirms them.
    const [localTrack, setLocalTrack] = useState<string | null>(null);
    const [localPS, setLocalPS] = useState<string | null>(null);
    
    const [editingPI, setEditingPI] = useState(false);
    const [editingTS, setEditingTS] = useState(false);

    const team = useMemo(() => projects.find((project) => project.teamId === user?.teamId || project.id === user?.teamId) || null, [projects, user]);

    // Lock state comes from the DB via the API — not guessed from data presence
    const isPSLocked = Boolean(team?.isPSLocked);
    const isPILocked = Boolean(team?.isPILocked);
    const isTSLocked = Boolean(team?.isTSLocked);

    useEffect(() => { 
        if (team) {
            if (!editingPI) setProposedIdea(team.proposedIdea || "Add a concise proposed idea to keep your team aligned.");
            if (!editingTS) {
                const savedTechStack = team.techStack || { Frontend: [], Backend: [], Database: [], Auth: [] };
                setTechStack(savedTechStack);
                const customEntries = Object.fromEntries(Object.entries(TECH_CATEGORIES).map(([category, availableTechs]) => {
                    const selectedTechs = savedTechStack[category] || [];
                    const customTechs = selectedTechs.filter(tech => tech !== "Other" && !availableTechs.includes(tech));
                    return [category, customTechs.join(", ")];
                }));
                setOtherTechInput(customEntries);
                setOtherTechEnabled(Object.fromEntries(Object.entries(TECH_CATEGORIES).map(([category]) => [
                    category,
                    Boolean(customEntries[category]) || savedTechStack[category]?.includes("Other") || false
                ])));
            }
        }
    }, [team, editingPI, editingTS]);

    const saveTechStack = () => {
        const updatedTechStack = Object.fromEntries(Object.entries(TECH_CATEGORIES).map(([category, availableTechs]) => {
            const selectedBuiltIns = (techStack[category] || []).filter(tech => availableTechs.includes(tech));
            const customTechs = otherTechEnabled[category]
                ? (otherTechInput[category] || "").split(",").map(tech => tech.trim()).filter(Boolean)
                : [];
            return [category, Array.from(new Set([...selectedBuiltIns, ...customTechs]))];
        }));
        setTechStack(updatedTechStack);
        saveField('techStack', updatedTechStack, setEditingTS);
    };

    const saveField = (field: string, value: any, setEditingState: (val: boolean) => void) => {
        if (field === 'proposedIdea' && typeof value === 'string' && value.length > MAX_PROPOSED_IDEA_CHARACTERS) {
            toast.error(`Proposed idea must be ${MAX_PROPOSED_IDEA_CHARACTERS} characters or fewer.`);
            return;
        }

        toast.custom((id) => (
            <div className={`animate-in fade-in zoom-in-95 max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex flex-col ring-1 ring-black/5 overflow-hidden duration-200`}>
                <div className="p-5">
                    <h3 className="text-base font-semibold text-slate-900">Confirm Submission</h3>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">Are you sure? Once submitted, this section will be locked and cannot be edited again.</p>
                </div>
                <div className="flex border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={() => toast.dismiss(id)}
                        className="flex-1 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border-r border-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(id);
                            if (team?.id) {
                                const loadingToast = toast.loading("Submitting...");
                                try {
                                    const res = await fetch("/api/teams", { 
                                        method: "PATCH", 
                                        headers: { "Content-Type": "application/json" }, 
                                        body: JSON.stringify({ id: team.id, [field]: value }) 
                                    });
                                    if (!res.ok) throw new Error("Failed to save");
                                    toast.success("Submitted successfully!", { id: loadingToast });
                                    setEditingState(false);
                                    setTimeout(() => window.location.reload(), 1000); // Refresh to lock UI
                                } catch (error) {
                                    toast.error("Error submitting", { id: loadingToast });
                                }
                            }
                        }}
                        className="flex-1 px-4 py-3 text-sm font-bold text-[#df6d59] hover:bg-teal-600/10 transition-colors"
                    >
                        Confirm & Lock
                    </button>
                </div>
            </div>
        ), { duration: Infinity, position: 'top-center' });
    };


    if (isLoading) return <DashboardLayout type="team" title="Your project"><div className="grid min-h-[420px] place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#df6d59] border-t-transparent" /></div></DashboardLayout>;
    if (!team) return <DashboardLayout type="team" title="Your project"><div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="text-lg font-semibold">No team is linked to this account</h2><p className="mt-2 text-sm text-slate-500">Please complete registration or contact the event team.</p></div></DashboardLayout>;

    // Remove early time locks so teams can ideate immediately
    const effectiveSubmissionLocked = isSubmissionLocked;
    const effectivePILocked = team?.isPILocked;
    const effectiveTSLocked = team?.isTSLocked;

    const members = team.members.map((member: any, index: number) => ({ name: typeof member === "string" ? member : member.fullName, role: index === 0 ? "Team lead" : "Member", detail: typeof member === "string" ? "Participant" : member.department || "Participant" }));
    const submitted = Boolean(team.submission?.isFinal);

    const isLockedInDB = Boolean(team.isPSLocked || (team.track && team.problemStatement));
    const actualTrack = localTrack || team.track || (team.trackPreferences && team.trackPreferences.length > 0 ? team.trackPreferences.join(", ") : "");
    const actualPS = localPS || team.problemStatement;

    // If already locked in DB, proceed directly to workspace. Otherwise force Lock-In Flow.
    if (!isLockedInDB && (!actualTrack || !actualPS)) {
        return (
            <LockInFlow
                team={team}
                onLocked={(track, ps) => {
                    setLocalTrack(track);
                    setLocalPS(ps);
                    if (refreshTeams) refreshTeams();
                }}
            />
        );
    }

    return <DashboardLayout type="team" title="Project overview">
        <div className="flex flex-col gap-4">
            {/* 1. Header Section */}
            <section className="flex flex-col lg:flex-row gap-4 overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#0c0c10] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <div className="flex-1 p-5 flex items-center justify-between border-b lg:border-b-0 lg:border-r border-zinc-800/80">
                    <div className="flex items-center gap-3.5">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 shadow-[0_0_16px_rgba(234,88,12,0.35)] border border-orange-400/40 text-lg font-bold text-white shrink-0">
                            {team.team.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-white tracking-tight">{team.team}</h2>
                                <span className="rounded-full bg-orange-500/10 border border-orange-500/25 px-2 py-0.5 text-[10px] font-semibold text-orange-400">Active</span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5 font-medium">{team.teamId} · {actualTrack}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Link href="/dashboard/team/submissions" className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/80 hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:text-white transition shadow-sm">
                            <ArrowUpRight size={14} /> Submission
                        </Link>
                        <Link href="/dashboard/team/certificate" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 px-3.5 py-2 text-xs font-semibold text-white transition shadow-[0_0_14px_rgba(234,88,12,0.3)] border border-orange-400/30">
                            <Award size={14} /> Certificates
                        </Link>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-2 divide-x divide-zinc-800/80">
                    <div className="p-5 flex flex-col justify-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5"><FolderKanban size={13} className="text-orange-400"/> Track</p>
                        <p className="text-sm font-semibold text-white truncate">{actualTrack || "Not selected"}</p>
                    </div>
                    <div className="p-5 flex flex-col justify-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5"><CheckCircle2 size={13} className="text-orange-400"/> Status</p>
                        <p className="text-sm font-semibold text-white truncate">{submitted ? "Submitted" : effectiveSubmissionLocked ? "Locked" : "In progress"}</p>
                    </div>
                </div>
            </section>

            {/* 2. Three-Column Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Column 1 (Left): Problem Statement & Tech Stack */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    {/* Problem Statement Card */}
                    <section className="rounded-2xl border border-zinc-800/80 bg-[#0c0c10] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-white">Problem Statement</h3>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <CheckCircle2 size={11} className="text-orange-400"/> Locked
                            </span>
                        </div>
                        <div className="rounded-xl bg-black/60 p-3.5 text-xs leading-relaxed text-zinc-300 border border-zinc-800/70">
                            {actualPS || "Not selected yet"}
                        </div>
                    </section>

                    {/* Tech Stack Card */}
                    <section className="rounded-2xl border border-zinc-800/80 bg-[#0c0c10] p-5 flex-1 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white">Tech Stack</h3>
                            {!effectiveSubmissionLocked && !effectiveTSLocked && (
                                <button onClick={() => editingTS ? saveTechStack() : setEditingTS(true)} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${editingTS ? "bg-orange-500/20 border border-orange-500/40 text-orange-300" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"}`}>
                                    {editingTS ? <Save size={12} /> : <Edit3 size={12} />} {editingTS ? "Save" : "Edit"}
                                </button>
                            )}
                            {effectiveTSLocked && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider"><CheckCircle2 size={11} className="text-orange-400"/> Locked</span>}
                        </div>
                        <div className="space-y-4">
                            {Object.entries(TECH_CATEGORIES).map(([category, techs]) => (
                                <div key={category}>
                                    <p className="text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-wider">{category}</p>
                                    {editingTS ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {techs.map(tech => {
                                                const current = techStack[category] || [];
                                                const isSelected = current.includes(tech);
                                                return (
                                                    <label key={tech} className={`cursor-pointer inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${isSelected ? "bg-orange-500/15 text-orange-300 border-orange-500/40" : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"}`}>
                                                        <input type="checkbox" className="hidden" checked={isSelected} onChange={(e) => {
                                                            setTechStack({ ...techStack, [category]: e.target.checked ? [...current, tech] : current.filter(t => t !== tech) });
                                                        }} />
                                                        {tech}
                                                    </label>
                                                );
                                            })}
                                            <label className={`cursor-pointer inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${otherTechEnabled[category] ? "bg-orange-500/15 text-orange-300 border-orange-500/40" : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"}`}>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={Boolean(otherTechEnabled[category])}
                                                    onChange={(event) => setOtherTechEnabled({ ...otherTechEnabled, [category]: event.target.checked })}
                                                />
                                                Other
                                            </label>
                                            {otherTechEnabled[category] && (
                                                <input
                                                    type="text"
                                                    value={otherTechInput[category] || ""}
                                                    onChange={(event) => setOtherTechInput({ ...otherTechInput, [category]: event.target.value })}
                                                    placeholder={`Enter other ${category.toLowerCase()} technology`}
                                                    className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-orange-500/60"
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {techStack[category] && techStack[category].length > 0 ? techStack[category].map(tech => (
                                                <span key={tech} className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-900/90 text-zinc-200 border border-zinc-800/80">
                                                    {tech}
                                                </span>
                                            )) : <span className="text-[11px] text-zinc-500 italic">None</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Column 2 (Middle): Proposed Idea */}
                <div className="lg:col-span-5 h-full">
                    <section className="rounded-2xl border border-zinc-800/80 bg-[#0c0c10] p-5 h-full flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <div>
                                <h3 className="text-sm font-bold text-white">Proposed Idea</h3>
                                <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5"><Presentation size={12} className="text-orange-400"/>Visible to your judges</p>
                            </div>
                            {!effectiveSubmissionLocked && !effectivePILocked && (
                                <button onClick={() => editingPI ? saveField('proposedIdea', proposedIdea, setEditingPI) : setEditingPI(true)} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${editingPI ? "bg-orange-500/20 border border-orange-500/40 text-orange-300" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"}`}>
                                    {editingPI ? <Save size={12} /> : <Edit3 size={12} />} {editingPI ? "Save" : "Edit"}
                                </button>
                            )}
                            {effectivePILocked && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider"><CheckCircle2 size={11} className="text-orange-400"/> Locked</span>}
                        </div>
                        {editingPI ? (
                            <>
                                <textarea
                                    value={proposedIdea}
                                    onChange={(e) => setProposedIdea(e.target.value)}
                                    maxLength={MAX_PROPOSED_IDEA_CHARACTERS}
                                    className="flex-1 w-full min-h-[320px] resize-none rounded-xl border border-zinc-800 bg-black/60 p-4 text-sm leading-relaxed text-zinc-200 outline-none focus:border-orange-500/60 placeholder:text-zinc-600"
                                    placeholder="Explain your approach in detail..."
                                />
                                <p className={`mt-1.5 text-right text-xs ${proposedIdea.length >= MAX_PROPOSED_IDEA_CHARACTERS ? "text-amber-500" : "text-zinc-500"}`}>
                                    {proposedIdea.length}/{MAX_PROPOSED_IDEA_CHARACTERS} characters
                                </p>
                            </>
                        ) : (
                            <div className="flex-1 rounded-xl bg-black/60 p-5 text-sm leading-relaxed text-zinc-200 border border-zinc-800/70 whitespace-pre-wrap overflow-y-auto min-h-[320px]">
                                {proposedIdea}
                            </div>
                        )}
                    </section>
                </div>

                {/* Column 3 (Right): Team roster + Help Request */}
                <div className="lg:col-span-3 flex flex-col gap-5">
                    {/* Team Members */}
                    <section className="rounded-2xl border border-zinc-800/80 bg-[#0c0c10] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white">Team Members</h3>
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400"><Users size={14} /></span>
                        </div>
                        <div className="space-y-2">
                            {members.map((member, index) => (
                                <div key={`${member.name}-${index}`} className="flex items-center justify-between gap-2.5 rounded-xl p-2 hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800 transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 border border-zinc-700/60">
                                            {member.name?.charAt(0) || "M"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-white">{member.name}</p>
                                            <p className="text-[10px] text-zinc-400 truncate">{member.role} · {member.detail}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Compact Side-by-Side Widgets */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Allocated Space */}
                        <section className="rounded-2xl border border-zinc-800/80 bg-[#0c0c10] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-between mb-2.5">
                                <h3 className="text-xs font-bold text-white">Allocated Space</h3>
                                <span className="grid h-6 w-6 place-items-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400"><MapPin size={12} /></span>
                            </div>
                            <div className="rounded-xl bg-black/60 p-3 border border-zinc-800/70 flex flex-col items-center justify-center text-center h-24">
                                <MapPin className="text-orange-400 mb-1 opacity-90" size={18} />
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.1em] mb-0.5">Your Area</p>
                                <p className="text-xs font-bold text-white uppercase leading-snug line-clamp-2">{team.room || 'Pending Allocation'}</p>
                            </div>
                        </section>

                        {/* Wi-Fi Access */}
                        <section className="rounded-2xl border border-zinc-800/80 bg-[#0c0c10] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-between mb-2.5">
                                <h3 className="text-xs font-bold text-white">Wi-Fi Access</h3>
                                <span className="grid h-6 w-6 place-items-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400"><Wifi size={12} /></span>
                            </div>
                            <div className="rounded-xl bg-black/60 p-3 border border-zinc-800/70 flex flex-col items-center justify-center text-center h-24">
                                <Wifi className="text-orange-400 mb-1 opacity-90" size={18} />
                                <div className="bg-zinc-900 border border-zinc-700/80 hover:border-orange-500/50 rounded-lg px-2.5 py-1 flex items-center justify-center cursor-pointer transition-colors" onClick={() => {
                                    navigator.clipboard.writeText('kitsw#123');
                                    toast.success('Wi-Fi password copied!');
                                }}>
                                    <p className="text-xs font-bold text-zinc-200 tracking-wider font-mono">kitsw#123</p>
                                </div>
                                <p className="text-[8px] text-zinc-400 mt-1 font-medium uppercase tracking-wider">Click to copy</p>
                            </div>
                        </section>
                    </div>
                </div>

            </div>
        </div>

        </DashboardLayout>;
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-50 text-slate-500"><Icon size={16} /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-700">{value}</p></div></div>;
}
