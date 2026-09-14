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


export default function TeamDashboard() {
    const { projects, isLoading, isSubmissionLocked, isCertificatesEnabled } = useHackathon();
    const { user } = useAuth();
    const [brief, setBrief] = useState("");
    const [editing, setEditing] = useState(false);
    const [generatingCert, setGeneratingCert] = useState<string | null>(null);
    const team = useMemo(() => projects.find((project) => project.teamId === user?.teamId || project.id === user?.teamId) || (user?.teamId === DEMO_TEAM_ID ? DEMO_PROJECT : null), [projects, user]);

    useEffect(() => { if (team) setBrief(team.problemStatement || "Add a concise project brief to keep your team aligned."); }, [team]);
    const saveBrief = async () => {
        if (editing && team?.id) await fetch("/api/teams", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: team.id, problemStatement: brief }) });
        setEditing(!editing);
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
                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-slate-400">PROJECT BRIEF</p><h2 className="mt-1 text-lg font-semibold text-slate-900">What are you building?</h2></div>{!isSubmissionLocked && <button onClick={saveBrief} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${editing ? "bg-[#df6d59] text-white" : "bg-slate-100 text-slate-700"}`}>{editing ? <Save size={14} /> : <Edit3 size={14} />}{editing ? "Save brief" : "Edit"}</button>}</div>{editing ? <textarea value={brief} onChange={(event) => setBrief(event.target.value)} className="mt-5 min-h-40 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-[#df6d59]" /> : <p className="mt-5 min-h-40 rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">{brief}</p>}<div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400"><Presentation size={15} /> Keep this clear—the brief is visible to your judges.</div></section>
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
