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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] text-black">
            <section className="rounded-xl border-2 border-black bg-white p-5 md:p-6 shadow-[4px_4px_0px_#000]">
                <div className="flex flex-col gap-3 border-b-2 border-black pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <span className="inline-block rounded-md border-2 border-black bg-[#f7cb46] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_#000]">
                            DELIVERABLES
                        </span>
                        <h2 className="mt-2 text-xl font-black text-black">Submit your project links</h2>
                        <p className="mt-1 text-xs font-semibold text-neutral-700">Save each item as it becomes ready. You can return and update it before final review.</p>
                    </div>
                    {locked && <span className="inline-flex items-center gap-1.5 self-start rounded-md border-2 border-black bg-[#ffdc8b] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000]"><Lock size={13} /> Locked until Oct 11th</span>}
                </div>
                <div className="mt-5 rounded-lg border-2 border-black bg-[#ede8f5] p-4 text-xs font-semibold leading-relaxed text-black shadow-[2px_2px_0px_#000]">
                    <p className="font-black text-sm mb-1">Upload your project as a ZIP file to Google Drive</p>
                    <p>Keep the ZIP at or below 10 MB. Exclude dependency folders and generated/library files such as <code>node_modules</code>, build outputs, and virtual environments. Set Drive sharing to anyone with the link can view, then paste the link below.</p>
                </div>
                <div className="mt-4 divide-y-2 divide-black">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const ready = Boolean(values[item.key]);
                        return (
                            <div key={item.key} className="grid gap-3 py-4 md:grid-cols-[200px_minmax(0,1fr)_auto] md:items-center">
                                <div className="flex items-center gap-3">
                                    <span className={`grid h-9 w-9 place-items-center rounded-lg border-2 border-black ${ready ? "bg-[#99e885] text-black shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black shadow-[1.5px_1.5px_0px_#000]"}`}>
                                        {ready ? <Check size={16} /> : <Icon size={16} />}
                                    </span>
                                    <div>
                                        <p className="text-xs font-black text-black">{item.label}{item.required && <span className="ml-1 text-rose-600">*</span>}</p>
                                        <p className="text-[11px] font-semibold text-neutral-600">{item.help}</p>
                                    </div>
                                </div>
                                <input
                                    disabled={locked}
                                    type="url"
                                    value={values[item.key]}
                                    onChange={(event) => setValues({ ...values, [item.key]: event.target.value })}
                                    placeholder={item.placeholder}
                                    aria-label={`${item.label} URL`}
                                    className="h-10 w-full rounded-lg border-2 border-black bg-white px-3 text-xs font-semibold text-black outline-none focus:shadow-[3px_3px_0px_#000] shadow-[2px_2px_0px_#000] disabled:bg-neutral-100"
                                />
                                <button
                                    type="button"
                                    disabled={locked || saving === item.key}
                                    onClick={() => void save(item.key)}
                                    className="h-10 rounded-lg bg-[#f7cb46] hover:bg-[#ffd24d] border-2 border-black px-4 text-xs font-black text-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-transform"
                                >
                                    {saving === item.key ? "Saving…" : ready ? "Update" : "Save"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>
            <aside className="space-y-4">
                <section className="rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000]">
                    <span className="inline-block rounded border-2 border-black bg-[#f7cb46] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_#000]">
                        CHECKLIST
                    </span>
                    <h3 className="mt-2 text-sm font-black text-black">SUBMISSION STATUS</h3>
                    <div className="mt-4 space-y-2.5">
                        {items.map((item) => (
                            <div key={item.key} className="flex items-center gap-2.5 text-xs font-bold text-black">
                                <span className={`grid h-5 w-5 place-items-center rounded-md border-2 border-black ${values[item.key] ? "bg-[#99e885] text-black" : "bg-neutral-100 text-neutral-400"}`}>
                                    {values[item.key] && <Check size={12} />}
                                </span>
                                <span>
                                    {item.label}{!item.required && <span className="ml-1 text-[10px] text-neutral-500 font-bold">(optional)</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-xl border-2 border-black bg-[#c0f7fe] p-5 shadow-[4px_4px_0px_#000] text-black">
                    <CircleAlert size={20} className="text-black" />
                    <p className="mt-2 text-sm font-black text-black">Before you submit</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-neutral-800">Make sure links are accessible to anyone with the link. Judges cannot access private files.</p>
                </section>
            </aside>
        </div>
    </DashboardLayout>;
}
