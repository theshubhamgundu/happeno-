"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, Github, Globe2, Lock, Presentation, Video, Archive } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";

type SubmissionKey = "repo" | "video" | "presentation" | "demo" | "projectZip";

export default function TeamSubmissions() {
    const { user } = useAuth();
    const { projects, isSubmissionLocked } = useHackathon();
    const team = useMemo(() => projects.find((project) => project.teamId === user?.teamId || project.id === user?.teamId) || null, [projects, user]);
    const [values, setValues] = useState<Record<SubmissionKey, string>>({ repo: "", video: "", presentation: "", demo: "", projectZip: "" });
    const [saving, setSaving] = useState<SubmissionKey | null>(null);

    useEffect(() => {
        setValues({
            repo: team?.submission?.github || "",
            video: team?.submission?.demo || "",
            presentation: team?.submission?.presentation || "",
            demo: team?.submission?.deployment || "",
            projectZip: team?.submission?.projectZip || "",
        });
    }, [team?.submission?.github, team?.submission?.demo, team?.submission?.presentation, team?.submission?.deployment, team?.submission?.projectZip]);

    const save = async (key: SubmissionKey) => {
        if (!team) return;
        const field = { repo: "github", video: "demo", presentation: "presentation", demo: "deployment", projectZip: "projectZip" }[key];
        if (key === "projectZip" && values.projectZip) {
            try {
                const url = new URL(values.projectZip);
                if (url.protocol !== "https:" || url.hostname !== "drive.google.com") {
                    toast.error("Please enter an HTTPS Google Drive sharing link.");
                    return;
                }
            } catch {
                toast.error("Please enter a valid Google Drive sharing link.");
                return;
            }
        }

        setSaving(key);
        try {
            const result = await fetch("/api/teams", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: team.id, submission: { [field]: values[key].trim() } }),
            });
            if (!result.ok) {
                const error = await result.json().catch(() => ({}));
                throw new Error(error.error || "Could not save this link. Please try again.");
            }
            toast.success("Saved successfully");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save this link. Please try again.");
        } finally {
            setSaving(null);
        }
    };
    const IS_SUBMISSION_WINDOW_OPEN = new Date() >= new Date('2026-10-11T00:01:00+05:30');
    const locked = isSubmissionLocked || !IS_SUBMISSION_WINDOW_OPEN;

    const items = [
        { key: "repo" as const, label: "Source code", help: "GitHub repository URL", placeholder: "https://github.com/your-team/project", icon: Github, required: true },
        { key: "projectZip" as const, label: "Project ZIP", help: "Google Drive link to your .zip file", placeholder: "https://drive.google.com/…", icon: Archive, required: true },
        { key: "presentation" as const, label: "Presentation", help: "Google Slides, Canva, or PDF link", placeholder: "https://…", icon: Presentation, required: true },
        { key: "video" as const, label: "2-minute demo video", help: "Explain your project in a 2-minute video (YouTube, Loom, or Drive link)", placeholder: "https://…", icon: Video, required: true },
        { key: "demo" as const, label: "Live product", help: "Optional deployment URL", placeholder: "https://your-project.com", icon: Globe2, required: false },
    ];

    return <DashboardLayout type="team" title="Project submission">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400">DELIVERABLES</p>
                        <h2 className="mt-1 text-lg font-semibold">Submit your project links</h2>
                        <p className="mt-1 text-sm text-slate-500">Save each item as it becomes ready. You can return and update it before final review.</p>
                    </div>
                    {locked && <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"><Lock size={13} /> Locked until Oct 11th</span>}
                </div>
                <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-950">
                    <p className="font-semibold">Upload your project as a ZIP file to Google Drive</p>
                    <p className="mt-1 text-xs">Keep the ZIP at or below 10 MB. Exclude dependency folders and generated/library files such as <code>node_modules</code>, build outputs, and virtual environments. Set Drive sharing to anyone with the link can view, then paste the link below.</p>
                </div>
                <div className="mt-3 divide-y divide-slate-100">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const ready = Boolean(values[item.key]);
                        return (
                            <div key={item.key} className="grid gap-3 py-4 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center">
                                <div className="flex items-center gap-3">
                                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${ready ? "bg-black text-white border border-zinc-800" : "bg-zinc-900 text-white"}`}>
                                        {ready ? <Check size={16} className="text-orange-500" /> : <Icon size={16} />}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{item.label}{item.required && <span className="ml-1 text-orange-500">*</span>}</p>
                                        <p className="text-xs text-white">{item.help}</p>
                                    </div>
                                </div>
                                <input
                                    disabled={locked}
                                    type="url"
                                    value={values[item.key]}
                                    onChange={(event) => setValues({ ...values, [item.key]: event.target.value })}
                                    placeholder={item.placeholder}
                                    aria-label={`${item.label} URL`}
                                    className="h-10 w-full rounded-lg border border-zinc-800 bg-black px-3 text-sm text-white outline-none focus:border-orange-500 disabled:bg-zinc-950"
                                />
                                <button
                                    type="button"
                                    disabled={locked || saving === item.key}
                                    onClick={() => void save(item.key)}
                                    className="h-10 rounded-lg bg-black border border-zinc-700 px-3 text-xs font-semibold text-white hover:bg-zinc-900 disabled:opacity-50"
                                >
                                    {saving === item.key ? "Saving…" : ready ? "Update" : "Save"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>
            <aside className="space-y-4">
                <section className="rounded-2xl border border-zinc-800 bg-[#0d0d12] p-5">
                    <p className="text-xs font-semibold text-white">SUBMISSION CHECKLIST</p>
                    <div className="mt-4 space-y-3">
                        {items.map((item) => (
                            <div key={item.key} className="flex items-center gap-2 text-sm">
                                <span className={`grid h-5 w-5 place-items-center rounded-full ${values[item.key] ? "bg-black text-white border border-zinc-700" : "bg-zinc-900 text-white"}`}>
                                    {values[item.key] && <Check size={12} className="text-orange-500" />}
                                </span>
                                <span className="text-white">
                                    {item.label}{!item.required && <span className="ml-1 text-xs text-white/80">(optional)</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-2xl border border-zinc-800 bg-[#0d0d12] p-5">
                    <CircleAlert size={18} className="text-orange-500" />
                    <p className="mt-3 text-sm font-semibold text-white">Before you submit</p>
                    <p className="mt-1 text-xs leading-5 text-white">Make sure links are accessible to anyone with the link. Judges cannot access private files.</p>
                </section>
            </aside>
        </div>
    </DashboardLayout>;
}
