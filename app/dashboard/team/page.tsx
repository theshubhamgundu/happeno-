"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Edit3, Save, Users, FolderKanban, Presentation, Headphones, Send, Clock, X } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import { TRACKS, PROBLEM_STATEMENTS } from "@/lib/constants";
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

    // trackPreferences comes from the teams API (sourced from raw_data.track_preferences in DB)
    const preferences: string[] = team.trackPreferences || [];
    
    // If external team hasn't set track preferences yet, show all available tracks
    const availableTracks = preferences.length > 0 ? preferences : TRACKS;

    const handleLock = async () => {
        if (!selectedTrack || !selectedPS) {
            toast.error("Please select a track and problem statement.");
            return;
        }

        setIsLocking(true);
        try {
            const res = await fetch("/api/team/lock-track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId: team.teamId, track: selectedTrack, problemStatement: selectedPS })
            });
            
            if (res.ok) {
                toast.success("Track and problem statement locked successfully!");
                onLocked(selectedTrack, selectedPS);
            } else {
                toast.error("Failed to lock track. Please try again.");
            }
        } catch (error) {
            toast.error("Network error occurred.");
        } finally {
            setIsLocking(false);
        }
    };

    return (
        <DashboardLayout type="team" title="Lock Your Track">
            <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm mt-8">
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Confirm Your Final Track</h2>
                    <p className="text-slate-500 mt-2">You must lock in your track and problem statement before proceeding to your workspace.</p>
                </div>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">1. Select Your Track</h3>
                        <div className="grid gap-3">
                            {availableTracks.map((track: string) => (
                                <button
                                    key={track}
                                    onClick={() => { setSelectedTrack(track); setSelectedPS(null); }}
                                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${selectedTrack === track ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                >
                                    <span className={`font-medium ${selectedTrack === track ? 'text-teal-900' : 'text-slate-700'}`}>{track}</span>
                                    {selectedTrack === track && <CheckCircle2 className="text-teal-500" size={20} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedTrack && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">2. Select Problem Statement</h3>
                            <div className="grid gap-3">
                                {(PROBLEM_STATEMENTS[selectedTrack] || []).map((ps: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedPS(ps)}
                                        className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${selectedPS === ps ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                    >
                                        <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-full border flex items-center justify-center ${selectedPS === ps ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}>
                                            {selectedPS === ps && <div className="h-2 w-2 rounded-full bg-white" />}
                                        </div>
                                        <span className={`font-medium text-sm leading-relaxed ${selectedPS === ps ? 'text-teal-900' : 'text-slate-700'}`}>{ps}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-slate-100">
                        <button
                            onClick={handleLock}
                            disabled={!selectedTrack || !selectedPS || isLocking}
                            className="w-full flex items-center justify-center h-12 rounded-xl bg-teal-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors"
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
    const { projects, isLoading, isSubmissionLocked } = useHackathon();
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

    // Help request state
    const [showHelpForm, setShowHelpForm] = useState(false);
    const [helpCategory, setHelpCategory] = useState("Technical");
    const [helpDescription, setHelpDescription] = useState("");
    const [helpTable, setHelpTable] = useState("");
    const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);
    const [myTickets, setMyTickets] = useState<any[]>([]);
    const [isCancellingTicketId, setIsCancellingTicketId] = useState<string | null>(null);
    
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

    const fetchMyTickets = useCallback(async () => {
        try {
            const res = await fetch('/api/help-tickets');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMyTickets(data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch team tickets:', error);
        }
    }, []);

    useEffect(() => {
        fetchMyTickets();
        const timer = setInterval(() => {
            fetchMyTickets();
        }, 8000);
        return () => clearInterval(timer);
    }, [fetchMyTickets]);

    const handleCancelHelp = async (ticketId: string) => {
        setIsCancellingTicketId(ticketId);
        try {
            const res = await fetch('/api/help-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel', ticketId })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Help request cancelled.');
                setMyTickets(data.tickets || []);
            } else {
                toast.error(data.error || 'Failed to cancel ticket.');
            }
        } catch {
            toast.error('Could not cancel help request.');
        } finally {
            setIsCancellingTicketId(null);
        }
    };

    const handleSubmitHelp = async () => {
        if (!helpDescription.trim()) {
            toast.error('Please describe your issue.');
            return;
        }
        setIsSubmittingHelp(true);
        try {
            const res = await fetch('/api/help-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: helpCategory,
                    description: helpDescription,
                    tableNumber: helpTable,
                    teamName: team?.team || 'Unknown Team'
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Help request sent! A volunteer will be with you shortly.');
                setShowHelpForm(false);
                setHelpDescription('');
                setHelpTable('');
                if (data.tickets) {
                    setMyTickets(data.tickets);
                } else {
                    fetchMyTickets();
                }
            } else {
                toast.error(data.error || 'Failed to submit help request.');
            }
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setIsSubmittingHelp(false);
        }
    };

    if (isLoading) return <DashboardLayout type="team" title="Your project"><div className="grid min-h-[420px] place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#df6d59] border-t-transparent" /></div></DashboardLayout>;
    if (!team) return <DashboardLayout type="team" title="Your project"><div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="text-lg font-semibold">No team is linked to this account</h2><p className="mt-2 text-sm text-slate-500">Please complete registration or contact the event team.</p></div></DashboardLayout>;

    const members = team.members.map((member: any, index: number) => ({ name: typeof member === "string" ? member : member.fullName, role: index === 0 ? "Team lead" : "Member", detail: typeof member === "string" ? "Participant" : member.department || "Participant" }));
    const submitted = Boolean(team.submission?.isFinal);

    const actualTrack = localTrack || team.track;
    const actualPS = localPS || team.problemStatement;

    // If track or problem statement is not set, force the Lock-In Flow
    if (!actualTrack || !actualPS) {
        return <LockInFlow team={team} onLocked={(track, ps) => { setLocalTrack(track); setLocalPS(ps); }} />;
    }

    return <DashboardLayout type="team" title="Project overview">
        <div className="flex flex-col gap-4">
            {/* 1. Compact Header Section */}
            <section className="flex flex-col lg:flex-row gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex-1 p-4 flex items-center justify-between border-b lg:border-b-0 lg:border-r border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-600 text-lg font-bold text-white">{team.team.charAt(0)}</div>
                        <div>
                            <div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-slate-900">{team.team}</h2><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Active</span></div>
                            <p className="text-xs text-slate-500">{team.teamId} · {actualTrack}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dashboard/team/submissions" className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"><ArrowUpRight size={14} /> Submission</Link>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-2 divide-x divide-slate-100">
                    <div className="p-4 flex flex-col justify-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1"><FolderKanban size={12}/> Track</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{actualTrack || "Not selected"}</p>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> Status</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{submitted ? "Submitted" : isSubmissionLocked ? "Locked" : "In progress"}</p>
                    </div>
                </div>
            </section>

            {/* 2. Three-Column Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                
                {/* Column 1 (Left): Problem Statement & Tech Stack */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* Problem Statement Card */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-800">Problem Statement</h3>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider"><CheckCircle2 size={12}/> Locked</span>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 border border-slate-100">
                            {actualPS || "Not selected yet"}
                        </div>
                    </section>

                    {/* Tech Stack Card */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-800">Tech Stack</h3>
                            {!isSubmissionLocked && !isTSLocked && (
                                <button onClick={() => editingTS ? saveTechStack() : setEditingTS(true)} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${editingTS ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                    {editingTS ? <Save size={12} /> : <Edit3 size={12} />} {editingTS ? "Save" : "Edit"}
                                </button>
                            )}
                            {isTSLocked && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider"><CheckCircle2 size={12}/> Locked</span>}
                        </div>
                        <div className="space-y-4">
                            {Object.entries(TECH_CATEGORIES).map(([category, techs]) => (
                                <div key={category}>
                                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{category}</p>
                                    {editingTS ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {techs.map(tech => {
                                                const isSelected = techStack[category]?.includes(tech);
                                                return (
                                                    <label key={tech} className={`cursor-pointer inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium border transition-colors ${isSelected ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-500"}`}>
                                                        <input type="checkbox" className="hidden" checked={isSelected} onChange={(e) => {
                                                            const current = techStack[category] || [];
                                                            setTechStack({ ...techStack, [category]: e.target.checked ? [...current, tech] : current.filter(t => t !== tech) });
                                                        }} />
                                                        {tech}
                                                    </label>
                                                );
                                            })}
                                            <label className={`cursor-pointer inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium border transition-colors ${otherTechEnabled[category] ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-500"}`}>
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
                                                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-500"
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {techStack[category] && techStack[category].length > 0 ? techStack[category].map(tech => (
                                                <span key={tech} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                                    {tech}
                                                </span>
                                            )) : <span className="text-[10px] text-slate-400 italic">None</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Column 2 (Middle): Proposed Idea */}
                <div className="lg:col-span-5 h-full">
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Proposed Idea</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5"><Presentation size={10} className="inline mr-1 mb-0.5"/>Visible to your judges</p>
                            </div>
                            {!isSubmissionLocked && !isPILocked && (
                                <button onClick={() => editingPI ? saveField('proposedIdea', proposedIdea, setEditingPI) : setEditingPI(true)} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${editingPI ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                    {editingPI ? <Save size={12} /> : <Edit3 size={12} />} {editingPI ? "Save" : "Edit"}
                                </button>
                            )}
                            {isPILocked && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider"><CheckCircle2 size={12}/> Locked</span>}
                        </div>
                        {editingPI ? (
                            <textarea 
                                value={proposedIdea} 
                                onChange={(e) => setProposedIdea(e.target.value)} 
                                className="flex-1 w-full min-h-[300px] resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 outline-none focus:border-teal-500" 
                                placeholder="Explain your approach in detail..."
                            />
                        ) : (
                            <div className="flex-1 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 border border-slate-100 whitespace-pre-wrap overflow-y-auto min-h-[300px]">
                                {proposedIdea}
                            </div>
                        )}
                    </section>
                </div>

                {/* Column 3 (Right): Team roster + Help Request */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    {/* Team Members */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-800">Team Roster</h3>
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-50 text-teal-600"><Users size={14} /></span>
                        </div>
                        <div className="space-y-1.5">
                            {members.map((member, index) => (
                                <div key={`${member.name}-${index}`} className="flex items-center justify-between gap-2 rounded-xl p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{member.name?.charAt(0) || "M"}</div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-slate-700">{member.name}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{member.role} · {member.detail}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Request Help Card */}
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-amber-900">Need Help?</h3>
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-100 text-amber-600"><Headphones size={14} /></span>
                        </div>

                        {/* Active Tickets List */}
                        {myTickets.length > 0 && (
                            <div className="space-y-2.5 mb-4">
                                {myTickets.map(ticket => {
                                    const isCancelling = isCancellingTicketId === ticket.id;
                                    return (
                                        <div key={ticket.id} className="rounded-xl border border-amber-200/80 bg-white p-3 shadow-xs">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                                            {ticket.category}
                                                        </span>
                                                        {ticket.tableNumber && (
                                                            <span className="text-[10px] font-medium text-slate-500">
                                                                · Table {ticket.tableNumber}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-800 mt-1 line-clamp-2">
                                                        {ticket.description}
                                                    </p>
                                                </div>

                                                {ticket.status === 'open' && (
                                                    <button
                                                        onClick={() => handleCancelHelp(ticket.id)}
                                                        disabled={isCancelling}
                                                        title="Cancel request"
                                                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors disabled:opacity-50"
                                                    >
                                                        {isCancelling ? (
                                                            <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <X size={14} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Live Status Indicator */}
                                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                                {ticket.status === 'open' && (
                                                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-600">
                                                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                                                        Waiting for volunteer...
                                                    </span>
                                                )}
                                                {ticket.status === 'accepted' && (
                                                    <span className="inline-flex items-center gap-1.5 font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                                                        <CheckCircle2 size={13} className="text-teal-600" />
                                                        {ticket.acceptedBy ? `${ticket.acceptedBy} is on the way!` : 'Volunteer is on the way!'}
                                                    </span>
                                                )}
                                                {ticket.status === 'resolved' && (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                                        <CheckCircle2 size={13} />
                                                        Resolved
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {!showHelpForm ? (
                            <div>
                                {myTickets.filter(t => t.status !== 'resolved').length === 0 && (
                                    <p className="text-xs text-amber-700 mb-3">Stuck on something? Request a mentor or report an issue and a volunteer will come to your table.</p>
                                )}
                                {myTickets.filter(t => t.status !== 'resolved').length < 3 ? (
                                    <button
                                        onClick={() => setShowHelpForm(true)}
                                        className="w-full py-2.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 shadow-xs"
                                    >
                                        <Headphones size={14} />
                                        {myTickets.filter(t => t.status !== 'resolved').length > 0 ? "+ Request Another Help" : "Request Help / Mentor"}
                                    </button>
                                ) : (
                                    <p className="text-xs text-amber-800/80 font-medium text-center">
                                        You have 3 active requests in queue.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1 block">Category</label>
                                    <select
                                        value={helpCategory}
                                        onChange={e => setHelpCategory(e.target.value)}
                                        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-400"
                                    >
                                        <option value="Technical">Technical (Code/Bug)</option>
                                        <option value="Mentor">Need a Mentor</option>
                                        <option value="WiFi/Infra">WiFi / Infrastructure</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1 block">Describe your issue</label>
                                    <textarea
                                        value={helpDescription}
                                        onChange={e => setHelpDescription(e.target.value)}
                                        placeholder="e.g. Our backend API is returning 500 errors..."
                                        rows={3}
                                        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-400 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1 block">Table / Location (optional)</label>
                                    <input
                                        value={helpTable}
                                        onChange={e => setHelpTable(e.target.value)}
                                        placeholder="e.g. Table 12, Room B"
                                        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowHelpForm(false)}
                                        className="flex-1 py-2 rounded-lg border border-amber-200 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitHelp}
                                        disabled={isSubmittingHelp || !helpDescription.trim()}
                                        className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmittingHelp ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Send size={12} />
                                        )}
                                        Send Request
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                </div>

            </div>
        </div>

    </DashboardLayout>;
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-50 text-slate-500"><Icon size={16} /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-700">{value}</p></div></div>;
}
