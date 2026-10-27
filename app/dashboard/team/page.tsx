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
            <div className="max-w-3xl mx-auto rounded-xl border-2 border-black bg-white p-8 shadow-[6px_6px_0px_#000] mt-8 text-black">
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-[#ffdc58] border-2 border-black text-black mb-4 shadow-[3px_3px_0px_#000]">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-black">Confirm Your Final Track</h2>
                    <p className="text-neutral-700 mt-2 text-sm font-semibold">You must lock in your track and problem statement before proceeding to your workspace.</p>
                </div>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-xs font-black text-neutral-800 mb-3 uppercase tracking-wider">1. Select Your Track</h3>
                        <div className="grid gap-3">
                            {availableTracks.map((track: string) => (
                                <button
                                    key={track}
                                    onClick={() => { setSelectedTrack(track); setSelectedPS(null); }}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 border-black text-left transition-transform shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] ${selectedTrack === track ? 'bg-[#ffdc58] text-black font-black' : 'bg-white hover:bg-neutral-50 text-neutral-900 font-bold'}`}
                                >
                                    <span className="text-sm">{track}</span>
                                    {selectedTrack === track && <CheckCircle2 className="text-black" size={20} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedTrack && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            {isCustomProblemTrack ? (
                                <div>
                                    <h3 className="text-xs font-black text-neutral-800 mb-2 uppercase tracking-wider">2. Enter Your Problem Statement</h3>
                                    <p className="mb-3 text-xs text-neutral-700 font-medium">Describe the problem in 5–10 words. Keep it under {MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS} characters.</p>
                                    <textarea
                                        value={problemText}
                                        onChange={(event) => setSelectedPS(event.target.value)}
                                        maxLength={MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS}
                                        rows={3}
                                        placeholder="Enter a concise problem statement"
                                        className="w-full resize-none rounded-lg border-2 border-black bg-white p-4 text-sm font-semibold text-black outline-none transition focus:shadow-[4px_4px_0px_#000] placeholder:text-neutral-400 shadow-[2px_2px_0px_#000]"
                                    />
                                    <p className={`mt-1 text-right text-xs font-bold ${problemText.length >= MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS ? "text-rose-600" : "text-neutral-600"}`}>
                                        {problemWordCount} words · {problemText.length}/{MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS} characters
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xs font-black text-neutral-800 mb-3 uppercase tracking-wider">
                                        2. Select Problem Statement
                                        {isLoadingAvailability && <span className="ml-2 text-xs font-normal text-neutral-600 lowercase">(checking availability...)</span>}
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
                                                    className={`flex items-start gap-3 p-4 rounded-xl border-2 border-black text-left transition-transform shadow-[3px_3px_0px_#000] 
                                                        ${isFull ? 'opacity-50 cursor-not-allowed bg-neutral-100' : 'hover:translate-x-[1px] hover:translate-y-[1px]'}
                                                        ${selectedPS === ps ? 'bg-[#ffdc58] text-black font-black' : (!isFull ? 'bg-white hover:bg-neutral-50 text-neutral-900 font-semibold' : '')}`}
                                                >
                                                    <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-full border-2 border-black flex items-center justify-center ${selectedPS === ps ? 'bg-black text-white' : 'bg-white'}`}>
                                                        {selectedPS === ps && <div className="h-2 w-2 rounded-full bg-white" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className={`text-sm leading-relaxed block ${selectedPS === ps ? 'font-black text-black' : 'font-semibold text-neutral-900'} ${isFull ? 'line-through text-neutral-400' : ''}`}>{ps}</span>
                                                        {mvp && <p className="mt-2 text-xs text-neutral-700 leading-relaxed border-t-2 border-black pt-2 font-medium"><span className="font-black text-black">MVP Scope:</span> {mvp}</p>}
                                                    </div>
                                                    {avail && (
                                                        <div className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-md border-2 border-black shadow-[1.5px_1.5px_0px_#000] ${isFull ? 'bg-[#fda4af] text-black' : 'bg-[#bef264] text-black'}`}>
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

                    <div className="pt-6 border-t-2 border-black">
                        <button
                            onClick={handleLock}
                            disabled={!selectedTrack || !selectedPS || isLocking}
                            className="btn-primary w-full h-12 rounded-xl text-sm justify-center border-2 border-black shadow-[4px_4px_0px_#000] font-black uppercase tracking-wider"
                        >
                            {isLocking ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" /> : "LOCK IN SELECTION"}
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
            <div className={`animate-in fade-in zoom-in-95 max-w-md w-full bg-white shadow-[6px_6px_0px_#000] rounded-xl pointer-events-auto flex flex-col border-2 border-black overflow-hidden duration-200 text-black`}>
                <div className="p-5">
                    <h3 className="text-base font-black text-black">Confirm Submission</h3>
                    <p className="mt-2 text-sm text-neutral-700 font-semibold leading-relaxed">Are you sure? Once submitted, this section will be locked and cannot be edited again.</p>
                </div>
                <div className="flex border-t-2 border-black bg-[#faf8f5]">
                    <button
                        onClick={() => toast.dismiss(id)}
                        className="flex-1 px-4 py-3 text-sm font-black text-neutral-800 hover:bg-neutral-200 transition-colors border-r-2 border-black"
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

    const memberAvatarColors = ["bg-[#f7cb46]", "bg-[#99e885]", "bg-[#fe90e8]", "bg-[#c0f7fe]"];
    const techCategoryStyles: Record<string, { badgeBg: string; pillBg: string }> = {
        Frontend: { badgeBg: "bg-[#c0f7fe]", pillBg: "bg-[#c0f7fe]" },
        Backend: { badgeBg: "bg-[#99e885]", pillBg: "bg-[#99e885]" },
        Database: { badgeBg: "bg-[#ffdc8b]", pillBg: "bg-[#ffdc8b]" },
        Auth: { badgeBg: "bg-[#fe90e8]", pillBg: "bg-[#fe90e8]" },
    };

    return (
        <DashboardLayout type="team" title="Project overview">
            <div className="flex flex-col gap-6 text-black">
                {/* 1. Hero Team Pass / VIP Hacker Credential */}
                <section className="relative overflow-hidden rounded-2xl border-3 border-black bg-white shadow-[7px_7px_0px_#000]">
                    {/* Top Credential Strip */}
                    <div className="flex items-center justify-between border-b-2 border-black bg-black px-4 py-1.5 text-white">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="text-[#f7cb46]">✦</span>
                            <span>TEAM WORKSPACE</span>
                            <span className="text-neutral-500">•</span>
                            <span className="font-mono text-[#c0f7fe]">#{team.teamId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-neutral-300">
                            <span className="h-2 w-2 rounded-full bg-[#99e885] animate-pulse" />
                            <span>{submitted ? "SUBMISSION LOCKED" : "WORKSPACE ACTIVE"}</span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-black">
                        {/* Team Identity */}
                        <div className="flex-1 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                    <div className="grid h-18 w-18 place-items-center rounded-2xl bg-[#f7cb46] border-3 border-black text-3xl font-black text-black shadow-[4px_4px_0px_#000]">
                                        {team.team.charAt(0)}
                                    </div>
                                    <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-[#fe90e8] border-2 border-black text-xs font-black shadow-[1.5px_1.5px_0px_#000]">
                                        ✦
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">{team.team}</h2>
                                        <span className="rounded-lg bg-[#99e885] border-2 border-black px-2.5 py-0.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] rotate-[-2deg]">
                                            ● {submitted ? "Submitted" : effectiveSubmissionLocked ? "Locked" : "Active"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                                        <span className="rounded-md border-2 border-black bg-[#ede8f5] px-2 py-0.5 font-mono font-black text-black shadow-[1px_1px_0px_#000]">
                                            ID: {team.teamId}
                                        </span>
                                        <span className="font-bold text-slate-800">
                                            {actualTrack}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                                <Link 
                                    href="/dashboard/team/submissions" 
                                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#f7cb46] hover:bg-[#ffdc8b] px-4 py-2.5 text-xs font-black text-black transition shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
                                >
                                    <ArrowUpRight size={16} /> Submit Project
                                </Link>
                                <Link 
                                    href="/dashboard/team/certificate" 
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#c0f7fe] hover:bg-[#a5f3fd] px-4 py-2.5 text-xs font-black text-black transition shadow-[3px_3px_0px_#000] border-2 border-black hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
                                >
                                    <Award size={16} /> Certificates
                                </Link>
                            </div>
                        </div>

                        {/* Status Blocks */}
                        <div className="lg:w-[380px] grid grid-cols-2 divide-x-2 divide-black bg-[#ede8f5]/50">
                            <div className="p-5 flex flex-col justify-center">
                                <span className="inline-block w-fit rounded border-2 border-black bg-[#c0f7fe] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_#000] mb-1.5">
                                    TRACK THEME
                                </span>
                                <p className="text-sm font-black text-black truncate">{actualTrack || "Not selected"}</p>
                                <p className="text-[10px] font-bold text-slate-600 mt-0.5">Evaluation Domain</p>
                            </div>
                            <div className="p-5 flex flex-col justify-center">
                                <span className="inline-block w-fit rounded border-2 border-black bg-[#99e885] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_#000] mb-1.5">
                                    CURRENT STAGE
                                </span>
                                <p className="text-sm font-black text-black truncate flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#99e885] border border-black animate-ping" />
                                    {submitted ? "Submitted" : effectiveSubmissionLocked ? "Locked" : "In Progress"}
                                </p>
                                <p className="text-[10px] font-bold text-slate-600 mt-0.5">Sprint Milestone</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Three-Column Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column (4 cols): Problem Statement & Tech Stack */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        
                        {/* Problem Statement Card */}
                        <section className="rounded-2xl border-3 border-black bg-white p-5 shadow-[6px_6px_0px_#000] overflow-hidden">
                            <div className="bg-[#c0f7fe] p-3.5 -m-5 mb-4 border-b-2 border-black flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="grid h-6 w-6 place-items-center rounded bg-black text-white font-black text-xs">🎯</span>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-black">Problem Statement</h3>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-black bg-[#99e885] border-2 border-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-[1.5px_1.5px_0px_#000] rotate-[1deg]">
                                    <CheckCircle2 size={11} className="text-black"/> Locked
                                </span>
                            </div>

                            <div className="rounded-xl bg-[#ede8f5]/70 p-4 text-xs font-bold leading-relaxed text-black border-2 border-black shadow-[2px_2px_0px_#000] relative">
                                <span className="text-lg font-black text-slate-400 mr-1">&ldquo;</span>
                                {actualPS || "Not selected yet"}
                                <span className="text-lg font-black text-slate-400 ml-1">&rdquo;</span>
                                <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-700 mt-3 pt-2.5 border-t border-black/20 flex items-center justify-between">
                                    <span>✦ TRACK: {actualTrack}</span>
                                    <span className="bg-[#99e885] px-1.5 py-0.2 rounded border border-black font-black text-black">VERIFIED</span>
                                </div>
                            </div>
                        </section>

                        {/* Tech Stack & Tools Card */}
                        <section className="rounded-2xl border-3 border-black bg-white p-5 shadow-[6px_6px_0px_#000] overflow-hidden">
                            <div className="bg-[#fe90e8] p-3.5 -m-5 mb-4 border-b-2 border-black flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="grid h-6 w-6 place-items-center rounded bg-black text-white font-black text-xs">⚡</span>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-black">Tech Stack & Tools</h3>
                                </div>
                                {!effectiveSubmissionLocked && !effectiveTSLocked && (
                                    <button 
                                        onClick={() => editingTS ? saveTechStack() : setEditingTS(true)} 
                                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] ${editingTS ? "bg-[#f7cb46] text-black" : "bg-white text-black hover:bg-[#ffdc8b]"}`}
                                    >
                                        {editingTS ? <Save size={12} /> : <Edit3 size={12} />} {editingTS ? "Save" : "Edit"}
                                    </button>
                                )}
                                {effectiveTSLocked && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-black bg-[#99e885] border-2 border-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-[1.5px_1.5px_0px_#000]">
                                        <CheckCircle2 size={11} className="text-black"/> Locked
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3.5">
                                {Object.entries(TECH_CATEGORIES).map(([category, techs]) => {
                                    const style = techCategoryStyles[category] || { badgeBg: "bg-[#ede8f5]", pillBg: "bg-[#ede8f5]" };
                                    return (
                                        <div key={category} className="rounded-xl border-2 border-black bg-[#fafafa] p-3 shadow-[2.5px_2.5px_0px_#000]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`rounded-md border-2 border-black ${style.badgeBg} px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_#000]`}>
                                                    {category}
                                                </span>
                                            </div>
                                            {editingTS ? (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {techs.map(tech => {
                                                        const current = techStack[category] || [];
                                                        const isSelected = current.includes(tech);
                                                        return (
                                                            <label key={tech} className={`cursor-pointer inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border-2 border-black shadow-[1.5px_1.5px_0px_#000] transition-transform ${isSelected ? "bg-[#f7cb46] text-black" : "bg-white text-neutral-800 hover:bg-neutral-100"}`}>
                                                                <input type="checkbox" className="hidden" checked={isSelected} onChange={(e) => {
                                                                    setTechStack({ ...techStack, [category]: e.target.checked ? [...current, tech] : current.filter(t => t !== tech) });
                                                                }} />
                                                                {tech}
                                                            </label>
                                                        );
                                                    })}
                                                    <label className={`cursor-pointer inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border-2 border-black shadow-[1.5px_1.5px_0px_#000] transition-transform ${otherTechEnabled[category] ? "bg-[#f7cb46] text-black" : "bg-white text-neutral-800 hover:bg-neutral-100"}`}>
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
                                                            placeholder={`Enter other ${category.toLowerCase()} tech`}
                                                            className="mt-2 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-semibold text-black outline-none placeholder:text-neutral-500 shadow-[2px_2px_0px_#000]"
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {techStack[category] && techStack[category].length > 0 ? techStack[category].map(tech => (
                                                        <span key={tech} className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${style.pillBg} text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 transition-transform`}>
                                                            {tech}
                                                        </span>
                                                    )) : <span className="text-xs text-neutral-500 font-bold italic">Not defined yet</span>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* Middle Column (5 cols): Proposed Solution & Innovation Dossier */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <section className="rounded-2xl border-3 border-black bg-white p-5 flex flex-col shadow-[6px_6px_0px_#000] overflow-hidden">
                            {/* Header */}
                            <div className="bg-[#ffdc8b] p-3.5 -m-5 mb-4 border-b-2 border-black flex items-center justify-between shrink-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="grid h-6 w-6 place-items-center rounded bg-black text-white font-black text-xs">💡</span>
                                        <h3 className="text-xs font-black uppercase tracking-wider text-black">Proposed Solution</h3>
                                    </div>
                                    <p className="text-[10px] text-neutral-800 font-bold mt-0.5">Visible to jury & mentors during evaluation</p>
                                </div>
                                {!effectiveSubmissionLocked && !effectivePILocked && (
                                    <button 
                                        onClick={() => editingPI ? saveField('proposedIdea', proposedIdea, setEditingPI) : setEditingPI(true)} 
                                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] ${editingPI ? "bg-[#f7cb46] text-black" : "bg-white text-black hover:bg-neutral-100"}`}
                                    >
                                        {editingPI ? <Save size={12} /> : <Edit3 size={12} />} {editingPI ? "Save" : "Edit"}
                                    </button>
                                )}
                                {effectivePILocked && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-black bg-[#99e885] border-2 border-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-[1.5px_1.5px_0px_#000]">
                                        <CheckCircle2 size={11} className="text-black"/> Locked
                                    </span>
                                )}
                            </div>

                            {/* Solution Text Content */}
                            {editingPI ? (
                                <>
                                    <textarea
                                        value={proposedIdea}
                                        onChange={(e) => setProposedIdea(e.target.value)}
                                        maxLength={MAX_PROPOSED_IDEA_CHARACTERS}
                                        className="w-full min-h-[220px] resize-none rounded-xl border-2 border-black bg-white p-4 text-sm font-semibold leading-relaxed text-black outline-none focus:shadow-[4px_4px_0px_#000] placeholder:text-neutral-500 shadow-[2px_2px_0px_#000]"
                                        placeholder="Explain your technical and product approach in detail..."
                                    />
                                    <p className={`mt-1.5 text-right text-xs font-bold ${proposedIdea.length >= MAX_PROPOSED_IDEA_CHARACTERS ? "text-rose-600" : "text-neutral-600"}`}>
                                        {proposedIdea.length}/{MAX_PROPOSED_IDEA_CHARACTERS} characters
                                    </p>
                                </>
                            ) : (
                                <div className="rounded-xl bg-[#fafafa] p-5 text-sm font-semibold leading-relaxed text-black border-2 border-black shadow-[3px_3px_0px_#000] whitespace-pre-wrap">
                                    <div className="text-neutral-900 leading-relaxed font-sans">{proposedIdea || "No solution submitted yet. Click Edit to draft your technical proposal."}</div>
                                    <div className="pt-3 mt-4 border-t border-black/15 flex items-center justify-between text-[10px] font-mono font-bold text-slate-500">
                                        <span>// SOLUTION BLUEPRINT</span>
                                        <span className="bg-[#ede8f5] px-2 py-0.5 rounded border border-black text-black font-black">CONFIDENTIAL</span>
                                    </div>
                                </div>
                            )}

                            {/* Dynamic Readiness Checklist */}
                            {(() => {
                                const hasTrack = Boolean(actualTrack);
                                const hasPS = Boolean(actualPS);
                                const hasStack = Object.values(techStack).some((arr: any) => arr && arr.length > 0);
                                const isReadyForDemo = submitted;
                                const readyCount = [hasTrack, hasPS, hasStack, isReadyForDemo].filter(Boolean).length;

                                return (
                                    <div className="mt-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-black bg-[#c0f7fe] border-2 border-black px-2.5 py-0.5 rounded-md shadow-[1.5px_1.5px_0px_#000]">
                                                ✦ Workspace Checklist
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-slate-600">{readyCount} of 4 Complete</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                                            <div className={`flex items-center gap-2 rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] ${hasTrack ? "bg-[#99e885]/25" : "bg-neutral-100"}`}>
                                                <span className={`grid h-5 w-5 place-items-center rounded border border-black text-[10px] font-black ${hasTrack ? "bg-[#99e885]" : "bg-white"}`}>
                                                    {hasTrack ? "✓" : "○"}
                                                </span>
                                                <span className="font-bold text-black text-[11px]">Track Locked</span>
                                            </div>
                                            <div className={`flex items-center gap-2 rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] ${hasPS ? "bg-[#99e885]/25" : "bg-neutral-100"}`}>
                                                <span className={`grid h-5 w-5 place-items-center rounded border border-black text-[10px] font-black ${hasPS ? "bg-[#99e885]" : "bg-white"}`}>
                                                    {hasPS ? "✓" : "○"}
                                                </span>
                                                <span className="font-bold text-black text-[11px]">Problem Assigned</span>
                                            </div>
                                            <div className={`flex items-center gap-2 rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] ${hasStack ? "bg-[#99e885]/25" : "bg-neutral-100"}`}>
                                                <span className={`grid h-5 w-5 place-items-center rounded border border-black text-[10px] font-black ${hasStack ? "bg-[#99e885]" : "bg-white"}`}>
                                                    {hasStack ? "✓" : "○"}
                                                </span>
                                                <span className="font-bold text-black text-[11px]">Stack Selected</span>
                                            </div>
                                            <div className={`flex items-center gap-2 rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000] ${isReadyForDemo ? "bg-[#99e885]/25" : "bg-[#f7cb46]/30"}`}>
                                                <span className={`grid h-5 w-5 place-items-center rounded border border-black text-[10px] font-black ${isReadyForDemo ? "bg-[#99e885]" : "bg-[#f7cb46]"}`}>
                                                    {isReadyForDemo ? "✓" : "⏳"}
                                                </span>
                                                <span className="font-bold text-black text-[11px]">{isReadyForDemo ? "Demo Submitted" : "Submission Due"}</span>
                                            </div>
                                        </div>

                                        {/* Evaluation Focus Callout */}
                                        <div className="rounded-xl border-2 border-black bg-[#c0f7fe]/40 p-3.5 shadow-[3px_3px_0px_#000] flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-black text-black">Project Deliverables</p>
                                                <p className="text-[10px] font-bold text-slate-700 mt-0.5">Submit your repository link, demo URL, and pitch deck.</p>
                                            </div>
                                            <Link 
                                                href="/dashboard/team/submissions"
                                                className="shrink-0 rounded-lg border-2 border-black bg-[#f7cb46] hover:bg-[#ffdc8b] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                                            >
                                                Deliverables →
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })()}
                        </section>
                    </div>

                    {/* Right Column (3 cols): Team Members + Venue Passes */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        
                        {/* Team Roster */}
                        <section className="rounded-2xl border-3 border-black bg-white p-5 shadow-[6px_6px_0px_#000] overflow-hidden">
                            <div className="bg-[#fe90e8] p-3.5 -m-5 mb-4 border-b-2 border-black flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="grid h-6 w-6 place-items-center rounded bg-black text-white font-black text-xs">👥</span>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-black">Team Roster</h3>
                                </div>
                                <span className="bg-white border-2 border-black px-2 py-0.5 rounded text-[10px] font-black text-black shadow-[1.5px_1.5px_0px_#000]">
                                    {members.length} Members
                                </span>
                            </div>
                            <div className="space-y-2.5">
                                {members.map((member, index) => {
                                    const avatarColor = memberAvatarColors[index % memberAvatarColors.length];
                                    const isLead = index === 0;
                                    return (
                                        <div 
                                            key={`${member.name}-${index}`} 
                                            className="flex items-center justify-between gap-2.5 rounded-xl p-3 bg-white border-2 border-black shadow-[2.5px_2.5px_0px_#000] hover:bg-[#ffdc8b]/20 hover:-translate-y-0.5 transition-all"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${avatarColor} text-sm font-black text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000]`}>
                                                    {member.name?.charAt(0) || "M"}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="truncate text-xs font-black text-black">{member.name}</p>
                                                        {isLead && (
                                                            <span className="rounded bg-[#f7cb46] border border-black px-1.5 py-0.2 text-[8px] font-black uppercase text-black rotate-[-2deg]">
                                                                👑 LEAD
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-neutral-600 font-bold truncate mt-0.5">{member.role} · {member.detail}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Venue Pass & Wi-Fi Widgets */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Allocated Space (Boarding Gate Pass Aesthetic) */}
                            <section className="rounded-2xl border-3 border-black bg-white p-3.5 shadow-[5px_5px_0px_#000] overflow-hidden">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[9px] font-black uppercase tracking-wider text-black">Desk Pass</h3>
                                    <span className="grid h-5 w-5 place-items-center rounded bg-[#f7cb46] border border-black text-black shadow-[1px_1px_0px_#000]"><MapPin size={10} /></span>
                                </div>
                                <div className="rounded-xl bg-[#ffdc8b] p-3 border-2 border-black shadow-[2px_2px_0px_#000] flex flex-col items-center justify-center text-center">
                                    <span className="rounded border border-black bg-white px-1.5 py-0.2 text-[8px] font-black uppercase tracking-widest text-black mb-1">
                                        DESK CODE
                                    </span>
                                    <p className="text-sm font-black text-black uppercase leading-tight font-mono">{team.room || 'B-2-201'}</p>
                                    <div className="text-[8px] font-mono tracking-widest text-slate-700 mt-1">|||| | |||</div>
                                </div>
                            </section>

                            {/* Wi-Fi Access (High-Tech Voucher) */}
                            <section className="rounded-2xl border-3 border-black bg-white p-3.5 shadow-[5px_5px_0px_#000] overflow-hidden">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[9px] font-black uppercase tracking-wider text-black">Wi-Fi Pass</h3>
                                    <span className="grid h-5 w-5 place-items-center rounded bg-[#c0f7fe] border border-black text-black shadow-[1px_1px_0px_#000]"><Wifi size={10} /></span>
                                </div>
                                <div className="rounded-xl bg-[#c0f7fe] p-3 border-2 border-black shadow-[2px_2px_0px_#000] flex flex-col items-center justify-center text-center">
                                    <div 
                                        className="bg-white border-2 border-black rounded-lg px-2.5 py-1 flex items-center justify-center cursor-pointer shadow-[1.5px_1.5px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform active:shadow-none" 
                                        onClick={() => {
                                            navigator.clipboard.writeText('kitsw#123');
                                            toast.success('Wi-Fi password copied to clipboard!');
                                        }}
                                        title="Click to copy password"
                                    >
                                        <p className="text-xs font-black text-black tracking-wider font-mono">kitsw#123</p>
                                    </div>
                                    <span className="mt-1 rounded bg-[#99e885] border border-black px-1.5 py-0.2 text-[8px] text-black font-black uppercase tracking-wider shadow-[1px_1px_0px_#000]">
                                        CLICK TO COPY
                                    </span>
                                </div>
                            </section>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-50 text-slate-500"><Icon size={16} /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-700">{value}</p></div></div>;
}
