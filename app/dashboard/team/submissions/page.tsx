"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, Github, Globe2, Lock, Presentation, Video } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";

type SubmissionKey = "repo" | "video" | "presentation" | "demo";

export default function TeamSubmissions() {
    const { user } = useAuth();
    const { projects, isSubmissionLocked } = useHackathon();
    const team = useMemo(() => projects.find((project) => project.teamId === user?.teamId || project.id === user?.teamId) || null, [projects, user]);
    const [values, setValues] = useState<Record<SubmissionKey, string>>({ repo: "", video: "", presentation: "", demo: "" });
    const [saving, setSaving] = useState<SubmissionKey | null>(null);

    useEffect(() => { 
        setValues({ 
            repo: team?.submission?.github || "", 
            video: team?.submission?.demo || "", 
            presentation: team?.submission?.presentation || "", 
            demo: team?.submission?.deployment || "" 
        }); 
    }, [team?.submission?.github, team?.submission?.demo, team?.submission?.presentation, team?.submission?.deployment]);

    const save = async (key: SubmissionKey) => {
        if (!team) return;
        const field = { repo: "github", video: "demo", presentation: "presentation", demo: "deployment" }[key];
        setSaving(key);
        try { const result = await fetch("/api/teams", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: team.id, submission: { [field]: values[key] } }) }); if (!result.ok) throw new Error(); toast.success("Saved successfully"); } catch { toast.error("Could not save this link. Please try again."); } finally { setSaving(null); }
    };
    const locked = isSubmissionLocked;
    const items = [
        { key: "repo" as const, label: "Source code", help: "GitHub repository URL", placeholder: "https://github.com/your-team/project", icon: Github, required: true },
        { key: "presentation" as const, label: "Presentation", help: "Google Slides, Canva, or PDF link", placeholder: "https://…", icon: Presentation, required: true },
        { key: "video" as const, label: "Demo video", help: "YouTube, Loom, or Drive URL", placeholder: "https://…", icon: Video, required: true },
        { key: "demo" as const, label: "Live product", help: "Optional deployment URL", placeholder: "https://your-project.com", icon: Globe2, required: false },
    ];

    return <DashboardLayout type="team" title="Project submission">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold text-slate-400">DELIVERABLES</p><h2 className="mt-1 text-lg font-semibold">Submit your project links</h2><p className="mt-1 text-sm text-slate-500">Save each item as it becomes ready. You can return and update it before final review.</p></div>{locked && <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"><Lock size={13} /> Submission closed</span>}</div>
                <div className="mt-3 divide-y divide-slate-100">{items.map((item) => { const Icon = item.icon; const ready = Boolean(values[item.key]); return <div key={item.key} className="grid gap-3 py-4 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl ${ready ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{ready ? <Check size={16} /> : <Icon size={16} />}</span><div><p className="text-sm font-semibold text-slate-700">{item.label}{item.required && <span className="ml-1 text-rose-500">*</span>}</p><p className="text-xs text-slate-400">{item.help}</p></div></div><input disabled={locked} value={values[item.key]} onChange={(event) => setValues({ ...values, [item.key]: event.target.value })} placeholder={item.placeholder} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#df6d59] disabled:bg-slate-50" /><button disabled={locked || saving === item.key} onClick={() => save(item.key)} className="h-10 rounded-lg bg-teal-600 px-3 text-xs font-semibold text-white disabled:bg-slate-200">{saving === item.key ? "Saving…" : ready ? "Update" : "Save"}</button></div>; })}</div>
            </section>
            <aside className="space-y-4"><section className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-slate-400">SUBMISSION CHECKLIST</p><div className="mt-4 space-y-3">{items.filter((item) => item.required).map((item) => <div key={item.key} className="flex items-center gap-2 text-sm"><span className={`grid h-5 w-5 place-items-center rounded-full ${values[item.key] ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>{values[item.key] && <Check size={12} />}</span><span className={values[item.key] ? "text-slate-700" : "text-slate-400"}>{item.label}</span></div>)}</div></section><section className="rounded-2xl border border-[#f3d8d1] bg-[#fdf1ed] p-5"><CircleAlert size={18} className="text-[#c85847]" /><p className="mt-3 text-sm font-semibold text-slate-800">Before you submit</p><p className="mt-1 text-xs leading-5 text-slate-500">Make sure links are accessible to anyone with the link. Judges cannot access private files.</p></section></aside>
        </div>
    </DashboardLayout>;
}
