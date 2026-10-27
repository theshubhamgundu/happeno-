import { DashboardLayout } from "@/components/DashboardLayout";
import { CheckCircle2, Target } from "lucide-react";

const criteria = [
    {
        weight: 30,
        title: "Working MVP",
        description: "The core flow must work live.",
        badgeBg: "bg-[#f7cb46]",
        iconBg: "bg-[#f7cb46]",
        barBg: "bg-[#f7cb46]",
    },
    {
        weight: 20,
        title: "AI/SaaS Relevance",
        description: "AI must meaningfully improve the solution.",
        badgeBg: "bg-[#99e885]",
        iconBg: "bg-[#99e885]",
        barBg: "bg-[#99e885]",
    },
    {
        weight: 15,
        title: "UI/UX",
        description: "The product should be clear and demo-friendly.",
        badgeBg: "bg-[#fe90e8]",
        iconBg: "bg-[#fe90e8]",
        barBg: "bg-[#fe90e8]",
    },
    {
        weight: 15,
        title: "Market Potential",
        description: "Clear target user and business value.",
        badgeBg: "bg-[#c0f7fe]",
        iconBg: "bg-[#c0f7fe]",
        barBg: "bg-[#c0f7fe]",
    },
    {
        weight: 10,
        title: "Innovation",
        description: "Fresh thinking or strong execution.",
        badgeBg: "bg-[#ffdc8b]",
        iconBg: "bg-[#ffdc8b]",
        barBg: "bg-[#ffdc8b]",
    },
    {
        weight: 10,
        title: "Demo & Pitch",
        description: "Clear explanation of problem, solution and future scope.",
        badgeBg: "bg-[#99e885]",
        iconBg: "bg-[#99e885]",
        barBg: "bg-[#99e885]",
    },
];

export default function EvaluationCriteriaPage() {
    return (
        <DashboardLayout
            type="team"
            title="Evaluation Criteria"
            subtitle="Understand how judges will assess your project."
        >
            <div className="mx-auto max-w-5xl space-y-6">
                <section className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000] md:p-8">
                    <div className="flex items-start gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-black bg-[#f7cb46] text-black shadow-[2px_2px_0px_#000]">
                            <Target size={24} />
                        </span>
                        <div>
                            <span className="inline-block rounded-md border border-black bg-[#ffdc8b] px-2 py-0.5 text-xs font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_#000]">
                                Judging rubric
                            </span>
                            <h2 className="mt-1.5 text-2xl font-black text-black">Evaluation Criteria</h2>
                            <p className="mt-1.5 max-w-2xl text-sm leading-6 font-medium text-slate-700">
                                Your project will be evaluated across six areas. Use these criteria to focus your build
                                and prepare a clear, working demonstration.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-xs font-black text-black">
                        <span>Criteria weighting</span>
                        <span className="text-black font-extrabold">100% total</span>
                    </div>
                    <div className="mt-2 flex h-3.5 overflow-hidden rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_#000]" aria-label="All evaluation criteria total 100%">
                        {criteria.map((criterion) => (
                            <div
                                key={criterion.title}
                                className={`${criterion.barBg} border-r border-black last:border-r-0`}
                                style={{ width: `${criterion.weight}%` }}
                                title={`${criterion.title}: ${criterion.weight}%`}
                            />
                        ))}
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                    {criteria.map((criterion, index) => (
                        <article
                            key={criterion.title}
                            className="rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-black ${criterion.iconBg} text-black shadow-[2px_2px_0px_#000]`}>
                                        <CheckCircle2 size={19} />
                                    </span>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                                            Criterion {String(index + 1).padStart(2, "0")}
                                        </p>
                                        <h3 className="mt-0.5 text-base font-black text-black">{criterion.title}</h3>
                                    </div>
                                </div>
                                <span className={`shrink-0 rounded-lg border-2 border-black px-2.5 py-1 text-sm font-black text-black shadow-[2px_2px_0px_#000] ${criterion.badgeBg}`}>
                                    {criterion.weight}%
                                </span>
                            </div>
                            <p className="mt-4 text-sm leading-6 font-medium text-slate-700">{criterion.description}</p>
                            <div className="mt-4 h-2.5 overflow-hidden rounded-full border-2 border-black bg-[#ede8f5]">
                                <div className={`h-full ${criterion.barBg}`} style={{ width: `${criterion.weight / 30 * 100}%` }} />
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </DashboardLayout>
    );
}
