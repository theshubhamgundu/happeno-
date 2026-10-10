"use client";

import { Download, MessageSquare, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useHackathon, Project } from "@/context/HackathonContext";
import type { JudgingRound } from "@/lib/judging-rounds";
import { useMemo, useState } from "react";

type ScoreSummary = {
    completedRounds: number;
    overallScore: number | null;
    roundScores: Record<string, number | null>;
    roundPercents: Record<string, number | null>;
    evaluations: Record<string, number>;
};

const maxScore = (round: JudgingRound) => (round.criteria?.length || 10) * 10 * 2;

function getScoreSummary(project: Project, rounds: JudgingRound[]): ScoreSummary {
    const roundScores: Record<string, number | null> = {};
    const roundPercents: Record<string, number | null> = {};
    const evaluations: Record<string, number> = {};
    const completed: number[] = [];
    
    // Start with the Rabbit Race preScore (out of 100) if it exists
    let totalScore = project.preScore || 0;

    rounds.forEach(round => {
        const scores = Object.values(project.roundScores?.[round.id] ?? {})
            .map(Number)
            .filter(score => Number.isFinite(score));
        evaluations[round.id] = scores.length;

        if (!scores.length) {
            roundScores[round.id] = null;
            roundPercents[round.id] = null;
            return;
        }

        // Each round is evaluated out of 200
        const avgScore = scores.reduce((total, score) => total + score, 0) / scores.length;
        const rounded = Number(avgScore.toFixed(1));
        const percentage = Number(((rounded / 200) * 100).toFixed(1));

        roundScores[round.id] = rounded;
        roundPercents[round.id] = percentage;
        completed.push(rounded);
        
        // Add round score out of 200 to total score
        totalScore += rounded;
    });

    return {
        completedRounds: completed.length,
        overallScore: (completed.length > 0 || (project.preScore && project.preScore > 0)) ? Number(totalScore.toFixed(1)) : null,
        roundScores,
        roundPercents,
        evaluations,
    };
}

export default function AdminResults() {
    const { projects, judges, roundConfigs } = useHackathon();
    const [search, setSearch] = useState("");
    const [track, setTrack] = useState("all");
    const [view, setView] = useState<"ranked" | "all" | "pending">("ranked");
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const tracks = useMemo(() => Array.from(new Set(projects.map(project => project.track).filter(Boolean))).sort(), [projects]);
    const projectRows = useMemo(() => projects.map(project => ({ project, score: getScoreSummary(project, roundConfigs) })), [projects, roundConfigs]);

    const displayedRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return projectRows
            .filter(({ project, score }) => {
                const matchesSearch = !query || [project.team, project.name, project.teamId, project.captain]
                    .filter(Boolean)
                    .some(value => String(value).toLowerCase().includes(query));
                const matchesTrack = track === "all" || project.track === track;
                const matchesView = view === "all" || (view === "ranked" ? score.overallScore !== null : score.overallScore === null);
                return matchesSearch && matchesTrack && matchesView;
            })
            .sort((a, b) => (b.score.overallScore ?? -1) - (a.score.overallScore ?? -1));
    }, [projectRows, search, track, view]);

    const totals = useMemo(() => ({
        total: projects.length,
        ranked: projectRows.filter(row => row.score.overallScore !== null).length,
        pending: projectRows.filter(row => row.score.overallScore === null).length,
        complete: projectRows.filter(row => row.score.completedRounds === roundConfigs.length).length,
    }), [projectRows, projects.length, roundConfigs.length]);

    const exportLeaderboard = () => {
        const headers = ["Rank", "Team", "Team ID", "Captain", "Track", ...roundConfigs.map(round => `${round.title} (/200)`), "Rabbit Race (/100)", "Overall Score (/500)", "Evaluated rounds"];
        const lines = displayedRows.map((row, index) => [
            row.score.overallScore === null ? "—" : String(index + 1), row.project.team, row.project.teamId, row.project.captain,
            row.project.track, ...roundConfigs.map(round => row.score.roundScores[round.id] !== null ? `${row.score.roundScores[round.id]} (${row.score.roundPercents[round.id]}%)` : "—"),
            row.project.preScore ? `${row.project.preScore} / 100` : "—", row.score.overallScore ? `${row.score.overallScore} / 500` : "—", `${row.score.completedRounds}/${roundConfigs.length}`,
        ].map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","));
        const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "tricity-ai-hackathon-leaderboard.csv";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout type="admin" title="Leaderboard">
            <main className="mx-auto max-w-[1500px] space-y-6 pb-10">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div>
                            <p className="mb-1 text-[10px] font-black uppercase tracking-[.2em] text-teal-600">Evaluation results</p>
                            <h1 className="text-2xl font-black italic uppercase text-slate-900 md:text-4xl tracking-tight">Leaderboard</h1>
                            <p className="mt-2 max-w-2xl text-xs text-slate-500">Rankings use each team’s average percentage across completed evaluation rounds. Teams with no evaluation are kept separate, never ranked as zero.</p>
                        </div>
                        <button onClick={exportLeaderboard} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-teal-700 shadow-sm">
                            <Download size={16} /> Export current view
                        </button>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Stat label="Registered teams" value={totals.total} />
                    <Stat label="Ranked teams" value={totals.ranked} accent="text-teal-700" />
                    <Stat label="Awaiting evaluation" value={totals.pending} accent="text-amber-600" />
                    <Stat label="All rounds complete" value={totals.complete} accent="text-emerald-700" />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search team, ID, captain, or project" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:bg-white transition" />
                        </div>
                        <select value={track} onChange={event => setTrack(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500">
                            <option value="all">All tracks</option>
                            {tracks.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                            {([['ranked', 'Ranked'], ['all', 'All'], ['pending', 'Pending']] as const).map(([id, label]) => (
                                <button key={id} onClick={() => setView(id)} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${view === id ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{label}</button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full min-w-[900px] text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
                                <tr><th className="px-5 py-4">Rank</th><th className="px-5 py-4">Team</th>{roundConfigs.map(round => <th key={round.id} className="px-4 py-4 text-center">{round.title} (/200)</th>)}<th className="px-4 py-4 text-center text-teal-600">Rabbit Race (/100)</th><th className="px-4 py-4 text-center">Overall (/500)</th><th className="px-5 py-4 text-right">Details</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedRows.map((row, index) => <LeaderboardRow key={row.project.id} row={row} rounds={roundConfigs} rank={row.score.overallScore === null ? null : index + 1} onSelect={() => setSelectedProject(row.project)} />)}
                                {!displayedRows.length && <tr><td colSpan={roundConfigs.length + 4} className="px-5 py-16 text-center text-xs text-slate-400 font-semibold">No teams match this view.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {selectedProject && <ProjectDetails project={selectedProject} judges={judges} rounds={roundConfigs} onClose={() => setSelectedProject(null)} />}
        </DashboardLayout>
    );
}

function Stat({ label, value, accent = "text-slate-900" }: { label: string; value: number; accent?: string }) {
    return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p><p className={`mt-1.5 text-2xl font-black ${accent}`}>{value}</p></div>;
}

function LeaderboardRow({ row, rounds, rank, onSelect }: { row: { project: Project; score: ScoreSummary }; rounds: JudgingRound[]; rank: number | null; onSelect: () => void }) {
    return <tr className="text-sm transition hover:bg-slate-50/80">
        <td className="px-5 py-4"><span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg text-xs font-bold ${rank && rank <= 3 ? "bg-teal-50 text-teal-800 border border-teal-200" : "bg-slate-100 text-slate-600"}`}>{rank ? `#${rank}` : "—"}</span></td>
        <td className="px-5 py-4"><p className="font-bold text-slate-900">{row.project.team || "Untitled team"}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{row.project.teamId} · {row.project.track || "No track"}</p></td>
        {rounds.map(round => <td key={round.id} className="px-4 py-4 text-center"><ScoreCell value={row.score.roundScores[round.id]} evaluations={row.score.evaluations[round.id]} max={200} percent={row.score.roundPercents[round.id]} /></td>)}
        <td className="px-4 py-4 text-center font-black text-sm text-teal-600">{row.project.preScore ? `${row.project.preScore.toFixed(1)} / 100` : "—"}</td>
        <td className="px-4 py-4 text-center"><ScoreCell value={row.score.overallScore} evaluations={row.score.completedRounds} bold max={500} /></td>
        <td className="px-5 py-4 text-right"><button onClick={onSelect} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 shadow-sm"><MessageSquare size={13} /> Review</button></td>
    </tr>;
}

function ScoreCell({ value, evaluations, bold = false, max, percent }: { value: number | null; evaluations: number; bold?: boolean; max?: number; percent?: number | null }) {
    if (value === null) return <span className="text-xs text-slate-300 font-medium">Not evaluated</span>;
    return (
        <div>
            <span className={`${bold ? "text-base text-teal-800" : "text-sm text-slate-900"} font-black`}>
                {value.toFixed(1)}{max ? ` / ${max}` : ''}
            </span>
            {percent !== undefined && percent !== null && (
                <span className="ml-1 text-[10px] font-bold text-slate-400">
                    ({percent.toFixed(0)}%)
                </span>
            )}
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                {evaluations} review{evaluations === 1 ? "" : "s"}
            </p>
        </div>
    );
}

function ProjectDetails({ project, judges, rounds, onClose }: { project: Project; judges: { generatedId: string; name: string }[]; rounds: JudgingRound[]; onClose: () => void }) {
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"><div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-teal-600">Evaluation record</p><h2 className="mt-1 text-2xl font-black uppercase italic text-slate-900">{project.team}</h2><p className="mt-1 text-xs text-slate-500">{project.teamId} · {project.name || "Project title not submitted"}</p></div><button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"><X size={18} /></button></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{rounds.map(round => { const entries = Object.entries(project.roundScores?.[round.id] ?? {}); return <section key={round.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{round.title}</h3><p className="text-xs text-slate-400">{round.subtitle}</p></div><span className="text-[10px] font-bold text-slate-500">{entries.length} evaluation{entries.length === 1 ? '' : 's'}</span></div>{entries.length ? <div className="space-y-3">{entries.map(([judgeId, score]) => <div key={judgeId} className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm"><div className="flex justify-between gap-3"><span className="text-xs font-bold text-slate-700">{judges.find(judge => judge.generatedId === judgeId)?.name ?? judgeId}</span><span className="text-xs font-black text-teal-700">{Number(score).toFixed(1)} / {maxScore(round)}</span></div>{project.roundComments?.[round.id]?.[judgeId] && <p className="mt-2 text-xs leading-relaxed text-slate-600">{project.roundComments[round.id][judgeId]}</p>}</div>)}</div> : <p className="text-xs text-slate-400">No evaluation submitted.</p>}</section>; })}</div>
    </div></div>;
}
