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
            <div className="mx-auto max-w-4xl space-y-6 text-black">
                <section className="rounded-2xl border-3 border-black bg-white p-6 shadow-[6px_6px_0px_#000] md:p-8">
                    <div className="flex items-start gap-4 border-b-2 border-black pb-5">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#f7cb46] text-black border-2 border-black shadow-[2px_2px_0px_#000]">
                            <UsersRound size={24} />
                        </span>
                        <div>
                            <span className="inline-block rounded-md border-2 border-black bg-[#c0f7fe] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_#000] mb-1">
                                INDIVIDUAL BREAKDOWN
                            </span>
                            <h2 className="text-xl font-black text-black">What did each member work on?</h2>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-neutral-700">
                                Enter each teammate&apos;s individual contribution to building the project. Be specific
                                about features, design, research, integrations, testing, or pitching.
                            </p>
                        </div>
                    </div>

                    {members.length ? (
                        <div className="mt-4 divide-y-2 divide-black">
                            {members.map((member, index) => {
                                const name = typeof member === "string" ? member : member.fullName || "Team member";
                                return (
                                    <div key={`${name}-${index}`} className="py-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <label
                                                htmlFor={`contribution-${index}`}
                                                className="block text-sm font-black text-black"
                                            >
                                                {name}
                                            </label>
                                            <span className="rounded bg-[#ede8f5] border border-black px-2 py-0.5 text-[10px] font-mono font-bold text-black">
                                                {(contributions[index] || "").length}/{MAX_CONTRIBUTION_LENGTH}
                                            </span>
                                        </div>
                                        <textarea
                                            id={`contribution-${index}`}
                                            value={contributions[index] || ""}
                                            onChange={(event) => updateContribution(index, event.target.value)}
                                            maxLength={MAX_CONTRIBUTION_LENGTH}
                                            rows={3}
                                            placeholder={`Describe ${name}'s contribution to the project…`}
                                            className="w-full resize-y rounded-xl border-2 border-black bg-white p-3 text-sm font-medium leading-6 text-black outline-none transition placeholder:text-neutral-400 focus:shadow-[3px_3px_0px_#000] shadow-[1.5px_1.5px_0px_#000]"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-sm font-bold text-neutral-600">
                            Team member details are not available yet.
                        </p>
                    )}

                    <div className="flex flex-col gap-3 border-t-2 border-black pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-bold text-neutral-700">✦ Entries are saved directly with your team project record.</p>
                        <button
                            type="button"
                            onClick={() => void saveContributions()}
                            disabled={!team || !members.length || saving || isSubmissionLocked}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f7cb46] hover:bg-[#ffdc8b] px-5 text-xs font-black uppercase tracking-wider text-black transition border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:shadow-none"
                        >
                            {saving ? <Save size={16} className="animate-pulse" /> : <Check size={16} />}
                            {saving ? "Saving…" : "Save contributions"}
                        </button>
                    </div>
                </section>

                <aside className="flex items-start gap-3 rounded-xl border-2 border-black bg-[#ffdc8b] p-4 text-black shadow-[3px_3px_0px_#000]">
                    <CircleAlert size={20} className="mt-0.5 shrink-0 text-black" />
                    <p className="text-xs font-bold leading-relaxed">
                        Write an accurate summary for every teammate. Each entry can be up to {MAX_CONTRIBUTION_LENGTH} characters and is evaluated by the jury during peer review.
                    </p>
                </aside>
            </div>
        </DashboardLayout>
    );
}
