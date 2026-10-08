import { DashboardLayout } from "@/components/DashboardLayout";
import { CheckCircle2, Target } from "lucide-react";

const criteria = [
    {
        weight: 30,
        title: "Working MVP",
        description: "The core flow must work live.",
        color: "bg-teal-500",
        textColor: "text-teal-700",
        background: "bg-teal-50",
    },
    {
        weight: 20,
        title: "AI/SaaS Relevance",
        description: "AI must meaningfully improve the solution.",
        color: "bg-indigo-500",
        textColor: "text-indigo-700",
        background: "bg-indigo-50",
    },
    {
        weight: 15,
        title: "UI/UX",
        description: "The product should be clear and demo-friendly.",
        color: "bg-violet-500",
        textColor: "text-violet-700",
        background: "bg-violet-50",
    },
    {
        weight: 15,
        title: "Market Potential",
        description: "Clear target user and business value.",
        color: "bg-amber-500",
        textColor: "text-amber-700",
        background: "bg-amber-50",
    },
    {
        weight: 10,
        title: "Innovation",
        description: "Fresh thinking or strong execution.",
        color: "bg-rose-500",
        textColor: "text-rose-700",
        background: "bg-rose-50",
    },
    {
        weight: 10,
        title: "Demo & Pitch",
        description: "Clear explanation of problem, solution and future scope.",
        color: "bg-sky-500",
        textColor: "text-sky-700",
        background: "bg-sky-50",
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
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex items-start gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                            <Target size={24} />
                        </span>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Judging rubric</p>
                            <h2 className="mt-1 text-2xl font-bold text-slate-900">Evaluation Criteria</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Your project will be evaluated across six areas. Use these criteria to focus your build
                                and prepare a clear, working demonstration.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Criteria weighting</span>
                        <span className="text-slate-700">100% total</span>
                    </div>
                    <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-100" aria-label="All evaluation criteria total 100%">
                        {criteria.map((criterion) => (
                            <div
                                key={criterion.title}
                                className={criterion.color}
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
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${criterion.background} ${criterion.textColor}`}>
                                        <CheckCircle2 size={19} />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Criterion {String(index + 1).padStart(2, "0")}
                                        </p>
                                        <h3 className="mt-1 text-base font-bold text-slate-900">{criterion.title}</h3>
                                    </div>
                                </div>
                                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-extrabold ${criterion.background} ${criterion.textColor}`}>
                                    {criterion.weight}%
                                </span>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-600">{criterion.description}</p>
                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full ${criterion.color}`} style={{ width: `${criterion.weight / 30 * 100}%` }} />
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </DashboardLayout>
    );
}
