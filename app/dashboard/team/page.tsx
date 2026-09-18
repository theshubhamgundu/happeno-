"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Edit3, MapPin, Save, Users, Wifi, FolderKanban, Presentation, Download } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import { DEMO_PROJECT, DEMO_TEAM_ID } from "@/lib/demo-data";
import { TRACKS, PROBLEM_STATEMENTS } from "@/lib/constants";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
            // Bypass API for demo team
            if (team.teamId === DEMO_TEAM_ID) {
                setTimeout(() => {
                    toast.success("Track locked successfully! (Demo Mode)");
                    onLocked(selectedTrack, selectedPS);
                }, 800);
                return;
            }

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
    const { projects, isLoading, isSubmissionLocked, isCertificatesEnabled } = useHackathon();
    const { user } = useAuth();
    
    const [proposedIdea, setProposedIdea] = useState("");
    const [techStack, setTechStack] = useState<Record<string, string[]>>({ Frontend: [], Backend: [], Database: [], Auth: [] });
    
    // Local state for locked track/ps to avoid reload breaking demo state
    const [localTrack, setLocalTrack] = useState<string | null>(null);
    const [localPS, setLocalPS] = useState<string | null>(null);
    
    const [editingPI, setEditingPI] = useState(false);
    const [editingTS, setEditingTS] = useState(false);
    
    const [generatingCert, setGeneratingCert] = useState<string | null>(null);
    const team = useMemo(() => projects.find((project) => project.teamId === user?.teamId || project.id === user?.teamId) || (user?.teamId === DEMO_TEAM_ID ? DEMO_PROJECT : null), [projects, user]);

    // Lock state comes from the DB via the API — not guessed from data presence
    const isPSLocked = Boolean(team?.isPSLocked);
    const isPILocked = Boolean(team?.isPILocked);
    const isTSLocked = Boolean(team?.isTSLocked);

    useEffect(() => { 
        if (team) {
            if (!editingPI) setProposedIdea(team.proposedIdea || "Add a concise proposed idea to keep your team aligned.");
            if (!editingTS) setTechStack(team.techStack || { Frontend: [], Backend: [], Database: [], Auth: [] });
        }
    }, [team, editingPI, editingTS]);

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

    const downloadCertificate = async (member: { name: string, role: string, detail: string }) => {
        setGeneratingCert(member.name);
        try {
            const certElement = document.getElementById("certificate-template");
            if (!certElement) return;
            
            const nameElement = document.getElementById("cert-name");
            if (nameElement) nameElement.innerText = member.name;
            
            const canvas = await html2canvas(certElement, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "px",
                format: [canvas.width, canvas.height]
            });
            
            pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
            pdf.save(`Certificate_${member.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Failed to generate certificate", error);
        } finally {
            setGeneratingCert(null);
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
                <div className="flex-1 grid grid-cols-3 divide-x divide-slate-100">
                    <div className="p-4 flex flex-col justify-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1"><FolderKanban size={12}/> Track</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{actualTrack || "Not selected"}</p>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1"><MapPin size={12}/> Workspace</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{team.room || "Pending"}</p>
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
                                <button onClick={() => editingTS ? saveField('techStack', techStack, setEditingTS) : setEditingTS(true)} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${editingTS ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
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

                {/* Column 3 (Right): Team & Venue Network */}
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
                                    {isCertificatesEnabled && (
                                        <button onClick={() => downloadCertificate(member)} disabled={generatingCert === member.name} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors disabled:opacity-50" title="Download Certificate">
                                            {generatingCert === member.name ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> : <Download size={14} />}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Venue Network */}
                    <section className="rounded-2xl border border-teal-100 bg-teal-50 p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-teal-600"><Wifi size={48}/></div>
                        <div className="relative z-10 flex items-start gap-3">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm text-teal-600"><Wifi size={14} /></span>
                            <div>
                                <p className="text-xs font-bold text-teal-900 mb-0.5">Venue Network</p>
                                <p className="text-[10px] leading-relaxed text-teal-700 max-w-[140px]">
                                    {team.roomWifiSSID ? `Connect to ${team.roomWifiSSID}` : "Network credentials will appear when your workspace is assigned."}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

            </div>
        </div>

        {/* Hidden Certificate Template */}
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
            <div id="certificate-template" className="w-[1123px] h-[794px] bg-white relative overflow-hidden flex flex-col items-center justify-center font-sans border-[12px] border-double border-[#df6d59] p-16">
                <div className="absolute top-0 left-0 w-64 h-64 bg-teal-600 opacity-10 rounded-br-full"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-900 opacity-10 rounded-tl-full"></div>
                
                <h1 className="text-6xl font-black tracking-widest text-slate-900 mb-4 uppercase">Certificate of Participation</h1>
                <div className="w-32 h-1 bg-teal-600 mb-12"></div>
                
                <p className="text-2xl text-slate-500 font-medium tracking-wide mb-6">This is to certify that</p>
                <h2 id="cert-name" className="text-5xl font-bold text-[#df6d59] mb-6 border-b-2 border-slate-200 pb-2 px-12 italic">Participant Name</h2>
                
                <p className="text-xl text-slate-600 max-w-2xl text-center leading-relaxed mb-12">
                    has successfully participated in the <span className="font-bold text-slate-800">Tricity AI Hackathon</span> as a part of team <span className="font-bold text-[#df6d59]">{team.team}</span>{team.track && <span> in the <span className="font-bold text-slate-800">{team.track}</span> track</span>}.
                </p>
                
                <div className="flex w-full justify-between mt-16 px-32">
                    <div className="flex flex-col items-center">
                        <div className="w-48 border-b border-slate-400 mb-2"></div>
                        <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Event Organizer</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-48 border-b border-slate-400 mb-2"></div>
                        <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Technical Director</p>
                    </div>
                </div>
                
                <div className="absolute bottom-12 text-sm text-slate-400 font-medium tracking-widest">
                    TRICITY AI HACKATHON · 2024
                </div>
            </div>
        </div>
    </DashboardLayout>;
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-50 text-slate-500"><Icon size={16} /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-700">{value}</p></div></div>;
}
