"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, Save, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";

const MAX_CONTRIBUTION_LENGTH = 2000;

export default function TeamContributionsPage() {
    const { user } = useAuth();
    const { projects, isSubmissionLocked } = useHackathon();
    const team = useMemo(
        () => projects.find((project) => project.teamId === user?.teamId || project.id === user?.teamId) || null,
        [projects, user]
    );
    const [contributions, setContributions] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setContributions(team?.members.map((_, index) => team.memberContributions?.[index] || "") || []);
    }, [team?.members, team?.memberContributions]);

    const updateContribution = (index: number, value: string) => {
        setContributions((current) => current.map((contribution, currentIndex) =>
            currentIndex === index ? value : contribution
        ));
    };

    const saveContributions = async () => {
        if (!team) return;
        if (contributions.some((contribution) => contribution.length > MAX_CONTRIBUTION_LENGTH)) {
            toast.error(`Each contribution must be ${MAX_CONTRIBUTION_LENGTH} characters or fewer.`);
            return;
        }

        setSaving(true);
        try {
            const response = await fetch("/api/teams", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: team.id, memberContributions: contributions }),
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || "Could not save team contributions.");
            }
            toast.success("Team contributions saved.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save team contributions.");
        } finally {
            setSaving(false);
        }
    };

    const members = team?.members || [];

    return (
        <DashboardLayout
            type="team"
            title="Team Contributions"
            subtitle="Describe what each team member contributed to the project."
        >
            <div className="mx-auto max-w-4xl space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                    <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                            <UsersRound size={20} />
                        </span>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">What did each member work on?</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                Enter each teammate&apos;s individual contribution to building the project. Be specific
                                about features, design, research, integrations, testing, or pitching.
                            </p>
                        </div>
                    </div>

                    {members.length ? (
                        <div className="mt-2 divide-y divide-slate-100">
                            {members.map((member, index) => {
                                const name = typeof member === "string" ? member : member.fullName || "Team member";
                                return (
                                    <div key={`${name}-${index}`} className="py-5">
                                        <label
                                            htmlFor={`contribution-${index}`}
                                            className="mb-2 block text-sm font-semibold text-slate-800"
                                        >
                                            {name}
                                        </label>
                                        <textarea
                                            id={`contribution-${index}`}
                                            value={contributions[index] || ""}
                                            onChange={(event) => updateContribution(index, event.target.value)}
                                            maxLength={MAX_CONTRIBUTION_LENGTH}
                                            rows={3}
                                            placeholder={`Describe ${name}'s contribution to the project…`}
                                            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                        />
                                        <p className="mt-1 text-right text-xs text-slate-400">
                                            {(contributions[index] || "").length}/{MAX_CONTRIBUTION_LENGTH}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-sm text-slate-500">
                            Team member details are not available yet.
                        </p>
                    )}

                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">Your entries are saved with your team project.</p>
                        <button
                            type="button"
                            onClick={() => void saveContributions()}
                            disabled={!team || !members.length || saving || isSubmissionLocked}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            {saving ? <Save size={16} className="animate-pulse" /> : <Check size={16} />}
                            {saving ? "Saving…" : "Save contributions"}
                        </button>
                    </div>
                </section>

                <aside className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <CircleAlert size={18} className="mt-0.5 shrink-0" />
                    <p className="text-sm leading-6">
                        Write an accurate summary for every teammate. Each entry can be up to {MAX_CONTRIBUTION_LENGTH} characters.
                    </p>
                </aside>
            </div>
        </DashboardLayout>
    );
}
