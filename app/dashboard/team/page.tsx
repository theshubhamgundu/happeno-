"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Edit3, MapPin, Save, Users, Wifi, FolderKanban, Presentation, Download } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import { DEMO_PROJECT, DEMO_TEAM_ID } from "@/lib/demo-data";
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

export default function TeamDashboard() {
    const { projects, isLoading, isSubmissionLocked, isCertificatesEnabled } = useHackathon();
    const { user } = useAuth();
    
    const [problemStatement, setProblemStatement] = useState("");
    const [proposedIdea, setProposedIdea] = useState("");
    const [techStack, setTechStack] = useState<Record<string, string[]>>({ Frontend: [], Backend: [], Database: [], Auth: [] });
    
    const [editingPS, setEditingPS] = useState(false);
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
            if (!editingPS) setProblemStatement(team.problemStatement || "");
            if (!editingPI) setProposedIdea(team.proposedIdea || "Add a concise proposed idea to keep your team aligned.");
            if (!editingTS) setTechStack(team.techStack || { Frontend: [], Backend: [], Database: [], Auth: [] });
        }
    }, [team, editingPS, editingPI, editingTS]);

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
                        className="flex-1 px-4 py-3 text-sm font-bold text-[#df6d59] hover:bg-[#df6d59]/10 transition-colors"
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

    return <DashboardLayout type="team" title="Project overview">
        <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
                    <div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#df6d59] text-xl font-bold text-white">{team.team.charAt(0)}</div><div><div className="flex items-center gap-2"><h2 className="text-xl font-semibold text-slate-900">{team.team}</h2><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Active</span></div><p className="mt-1 text-sm text-slate-500">{team.teamId} · {team.track}</p></div></div>
                    <div className="flex gap-2"><Link href="/dashboard/team/submissions" className="inline-flex items-center gap-2 rounded-xl bg-[#df6d59] px-4 py-2.5 text-sm font-semibold text-white">Open submission <ArrowUpRight size={16} /></Link><Link href="/dashboard/team/ticket" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Event pass</Link></div>
                </div>
                <div className="grid border-t border-slate-100 sm:grid-cols-3"><Info icon={FolderKanban} label="Project track" value={team.track || "Not selected"} /><Info icon={MapPin} label="Your workspace" value={team.room || "To be assigned"} /><Info icon={CheckCircle2} label="Submission status" value={submitted ? "Submitted" : isSubmissionLocked ? "Locked" : "In progress"} /></div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-8">
                    <div>
                        <p className="text-xs font-semibold text-slate-400">PROJECT DETAILS</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">What are you building?</h2>
                    </div>

                    <div className="space-y-8">
                        {/* Problem Statement */}
                        <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <label className="block text-sm font-semibold text-slate-700">Problem Statement</label>
                                {!isSubmissionLocked && !isPSLocked && (
                                    <button 
                                        onClick={() => editingPS ? saveField('problemStatement', problemStatement, setEditingPS) : setEditingPS(true)} 
                                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${editingPS ? "bg-[#df6d59] text-white" : "bg-slate-200 text-slate-700"}`}
                                    >
                                        {editingPS ? <Save size={14} /> : <Edit3 size={14} />}
                                        {editingPS ? "Submit & Lock" : "Edit"}
                                    </button>
                                )}
                                {isPSLocked && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><CheckCircle2 size={14}/> Submitted</span>}
                            </div>
                            {editingPS ? (
                                <select 
                                    value={problemStatement} 
                                    onChange={(e) => setProblemStatement(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#df6d59]"
                                >
                                    <option value="">Select a problem statement...</option>
                                    {DOMAIN_PROBLEM_STATEMENTS.map(ps => (
                                        <option key={ps} value={ps}>{ps}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="rounded-xl bg-white p-3 text-sm text-slate-600 border border-slate-200">
                                    {problemStatement || "Not selected yet"}
                                </div>
                            )}
                        </div>

                        {/* Proposed Idea */}
                        <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <label className="block text-sm font-semibold text-slate-700">Proposed Idea</label>
                                {!isSubmissionLocked && !isPILocked && (
                                    <button 
                                        onClick={() => editingPI ? saveField('proposedIdea', proposedIdea, setEditingPI) : setEditingPI(true)} 
                                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${editingPI ? "bg-[#df6d59] text-white" : "bg-slate-200 text-slate-700"}`}
                                    >
                                        {editingPI ? <Save size={14} /> : <Edit3 size={14} />}
                                        {editingPI ? "Submit & Lock" : "Edit"}
                                    </button>
                                )}
                                {isPILocked && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><CheckCircle2 size={14}/> Submitted</span>}
                            </div>
                            {editingPI ? (
                                <textarea 
                                    value={proposedIdea} 
                                    onChange={(event) => setProposedIdea(event.target.value)} 
                                    className="min-h-32 w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none focus:border-[#df6d59]" 
                                    placeholder="Explain your approach..."
                                />
                            ) : (
                                <p className="min-h-32 rounded-xl bg-white p-5 text-sm leading-7 text-slate-600 border border-slate-200 whitespace-pre-wrap">
                                    {proposedIdea}
                                </p>
                            )}
                        </div>

                        {/* Tech Stack */}
                        <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <label className="block text-sm font-semibold text-slate-700">Tech Stack</label>
                                {!isSubmissionLocked && !isTSLocked && (
                                    <button 
                                        onClick={() => editingTS ? saveField('techStack', techStack, setEditingTS) : setEditingTS(true)} 
                                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${editingTS ? "bg-[#df6d59] text-white" : "bg-slate-200 text-slate-700"}`}
                                    >
                                        {editingTS ? <Save size={14} /> : <Edit3 size={14} />}
                                        {editingTS ? "Submit & Lock" : "Edit"}
                                    </button>
                                )}
                                {isTSLocked && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><CheckCircle2 size={14}/> Submitted</span>}
                            </div>
                            
                            <div className="space-y-4">
                                {Object.entries(TECH_CATEGORIES).map(([category, techs]) => (
                                    <div key={category}>
                                        <p className="text-xs font-semibold text-slate-500 mb-2">{category.toUpperCase()}</p>
                                        {editingTS ? (
                                            <div className="flex flex-wrap gap-2">
                                                {techs.map(tech => {
                                                    const isSelected = techStack[category]?.includes(tech);
                                                    return (
                                                        <label key={tech} className={`cursor-pointer inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isSelected ? "bg-[#df6d59] text-white border-[#df6d59]" : "bg-white text-slate-600 border-slate-200 hover:border-[#df6d59]"}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                className="hidden" 
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    const currentCatStack = techStack[category] || [];
                                                                    if (e.target.checked) {
                                                                        setTechStack({ ...techStack, [category]: [...currentCatStack, tech] });
                                                                    } else {
                                                                        setTechStack({ ...techStack, [category]: currentCatStack.filter(t => t !== tech) });
                                                                    }
                                                                }}
                                                            />
                                                            {tech}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {techStack[category] && techStack[category].length > 0 ? techStack[category].map(tech => (
                                                    <span key={tech} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 shadow-sm">
                                                        {tech}
                                                    </span>
                                                )) : <span className="text-xs text-slate-400 italic">None selected</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
                        <Presentation size={15} /> Keep this clear—these details are visible to your judges.
                    </div>
                </section>
                <div className="space-y-4"><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400">TEAM</p><h2 className="mt-1 text-lg font-semibold">People on this project</h2></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fbe5df] text-[#c85847]"><Users size={17} /></span></div><div className="mt-4 space-y-2">{members.map((member, index) => <div key={`${member.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-slate-50"><div className="flex items-center gap-3 min-w-0"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{member.name?.charAt(0) || "M"}</div><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-700">{member.name}</p><p className="text-xs text-slate-400">{member.role} · {member.detail}</p></div></div>{isCertificatesEnabled && <button onClick={() => downloadCertificate(member)} disabled={generatingCert === member.name} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors disabled:opacity-50" title="Download Certificate">{generatingCert === member.name ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> : <Download size={16} />}</button>}</div>)}</div></section><section className="rounded-2xl border border-[#f3d8d1] bg-[#fdf1ed] p-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#c85847]"><Wifi size={17} /></span><div><p className="text-sm font-semibold text-slate-800">Venue network</p><p className="mt-1 text-xs leading-5 text-slate-500">{team.roomWifiSSID ? `Connect to ${team.roomWifiSSID}` : "Network credentials will appear once your workspace is assigned."}</p></div></div></section></div>
            </div>
        </div>

        {/* Hidden Certificate Template */}
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
            <div id="certificate-template" className="w-[1123px] h-[794px] bg-white relative overflow-hidden flex flex-col items-center justify-center font-sans border-[12px] border-double border-[#df6d59] p-16">
                <div className="absolute top-0 left-0 w-64 h-64 bg-[#df6d59] opacity-10 rounded-br-full"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 opacity-10 rounded-tl-full"></div>
                
                <h1 className="text-6xl font-black tracking-widest text-slate-900 mb-4 uppercase">Certificate of Participation</h1>
                <div className="w-32 h-1 bg-[#df6d59] mb-12"></div>
                
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
