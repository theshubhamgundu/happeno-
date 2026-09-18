"use client";

import { Download, FileText, MessageSquare, Search, Trophy, X } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useHackathon, Project } from "@/context/HackathonContext";
import { STATIC_ROUNDS_CONFIG } from "@/lib/constants";
import { useMemo, useState } from "react";

type ScoreSummary = {
    completedRounds: number;
    overallPercent: number | null;
    roundPercents: Record<string, number | null>;
    evaluations: Record<string, number>;
};

const maxScore = (roundId: string) =>
    (STATIC_ROUNDS_CONFIG.find(round => round.id === roundId)?.criteria.length ?? 0) * 5;

function getScoreSummary(project: Project): ScoreSummary {
    const roundPercents: Record<string, number | null> = {};
    const evaluations: Record<string, number> = {};
    const completed: number[] = [];

    STATIC_ROUNDS_CONFIG.forEach(round => {
        const scores = Object.values(project.roundScores?.[round.id] ?? {})
            .map(Number)
            .filter(score => Number.isFinite(score));
        evaluations[round.id] = scores.length;

        if (!scores.length) {
            roundPercents[round.id] = null;
            return;
        }

        const percentage = (scores.reduce((total, score) => total + score, 0) / scores.length / maxScore(round.id)) * 100;
        const rounded = Number(percentage.toFixed(1));
        roundPercents[round.id] = rounded;
        completed.push(rounded);
    });

    return {
        completedRounds: completed.length,
        overallPercent: completed.length ? Number((completed.reduce((total, score) => total + score, 0) / completed.length).toFixed(1)) : null,
        roundPercents,
        evaluations,
    };
}

export default function AdminResults() {
    const { projects, judges } = useHackathon();
    const [search, setSearch] = useState("");
    const [track, setTrack] = useState("all");
    const [view, setView] = useState<"ranked" | "all" | "pending">("ranked");
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const tracks = useMemo(() => Array.from(new Set(projects.map(project => project.track).filter(Boolean))).sort(), [projects]);
    const projectRows = useMemo(() => projects.map(project => ({ project, score: getScoreSummary(project) })), [projects]);

    const displayedRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return projectRows
            .filter(({ project, score }) => {
                const matchesSearch = !query || [project.team, project.name, project.teamId, project.captain]
                    .filter(Boolean)
                    .some(value => String(value).toLowerCase().includes(query));
                const matchesTrack = track === "all" || project.track === track;
                const matchesView = view === "all" || (view === "ranked" ? score.overallPercent !== null : score.overallPercent === null);
                return matchesSearch && matchesTrack && matchesView;
            })
            .sort((a, b) => (b.score.overallPercent ?? -1) - (a.score.overallPercent ?? -1));
    }, [projectRows, search, track, view]);

    const totals = useMemo(() => ({
        total: projects.length,
        ranked: projectRows.filter(row => row.score.overallPercent !== null).length,
        pending: projectRows.filter(row => row.score.overallPercent === null).length,
        complete: projectRows.filter(row => row.score.completedRounds === STATIC_ROUNDS_CONFIG.length).length,
    }), [projectRows, projects.length]);

    const exportLeaderboard = () => {
        const headers = ["Rank", "Team", "Team ID", "Captain", "Track", ...STATIC_ROUNDS_CONFIG.map(round => `${round.title} (%)`), "Overall (%)", "Evaluated rounds"];
        const lines = displayedRows.map((row, index) => [
            row.score.overallPercent === null ? "—" : String(index + 1), row.project.team, row.project.teamId, row.project.captain,
            row.project.track, ...STATIC_ROUNDS_CONFIG.map(round => row.score.roundPercents[round.id] ?? "—"),
            row.score.overallPercent ?? "—", `${row.score.completedRounds}/${STATIC_ROUNDS_CONFIG.length}`,
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
                <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(120deg,rgba(91,34,135,.5),rgba(10,8,22,.92))] p-6 md:p-8">
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div>
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[.24em] text-[#FFEE00]">Evaluation results</p>
                            <h1 className="font-kanit text-3xl font-black italic uppercase text-white md:text-5xl">Leaderboard</h1>
                            <p className="mt-2 max-w-2xl text-sm text-white/55">Rankings use each team’s average percentage across completed evaluation rounds. Teams with no evaluation are kept separate, never ranked as zero.</p>
                        </div>
                        <button onClick={exportLeaderboard} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFEE00] px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white">
                            <Download size={16} /> Export current view
                        </button>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Stat label="Registered teams" value={totals.total} />
                    <Stat label="Ranked teams" value={totals.ranked} accent="text-[#FFEE00]" />
                    <Stat label="Awaiting evaluation" value={totals.pending} accent="text-slate-900" />
                    <Stat label="All rounds complete" value={totals.complete} accent="text-emerald-300" />
                </section>

                <section className="rounded-[1.5rem] border border-white/10 bg-[#10091c]/75 p-4 md:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search team, ID, captain, or project" className="h-12 w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#FFEE00]/60" />
                        </div>
                        <select value={track} onChange={event => setTrack(event.target.value)} className="h-12 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#FFEE00]/60">
                            <option value="all">All tracks</option>
                            {tracks.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                        <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
                            {([['ranked', 'Ranked'], ['all', 'All'], ['pending', 'Pending']] as const).map(([id, label]) => (
                                <button key={id} onClick={() => setView(id)} className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${view === id ? "bg-[#FFEE00] text-black" : "text-white/45 hover:text-white"}`}>{label}</button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0713]/70">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full min-w-[900px] text-left">
                            <thead className="bg-white/[.045] text-[10px] font-black uppercase tracking-[.16em] text-white/40">
                                <tr><th className="px-5 py-4">Rank</th><th className="px-5 py-4">Team</th>{STATIC_ROUNDS_CONFIG.map(round => <th key={round.id} className="px-4 py-4 text-center">{round.title}</th>)}<th className="px-4 py-4 text-center">Overall</th><th className="px-5 py-4 text-right">Details</th></tr>
                            </thead>
                            <tbody>
                                {displayedRows.map((row, index) => <LeaderboardRow key={row.project.id} row={row} rank={row.score.overallPercent === null ? null : index + 1} onSelect={() => setSelectedProject(row.project)} />)}
                                {!displayedRows.length && <tr><td colSpan={STATIC_ROUNDS_CONFIG.length + 4} className="px-5 py-20 text-center text-sm text-white/35">No teams match this view.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {selectedProject && <ProjectDetails project={selectedProject} judges={judges} onClose={() => setSelectedProject(null)} />}
        </DashboardLayout>
    );
}

function Stat({ label, value, accent = "text-white" }: { label: string; value: number; accent?: string }) {
    return <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-white/45">{label}</p><p className={`mt-2 text-2xl font-black ${accent}`}>{value}</p></div>;
}

function LeaderboardRow({ row, rank, onSelect }: { row: { project: Project; score: ScoreSummary }; rank: number | null; onSelect: () => void }) {
    return <tr className="border-t border-white/5 text-sm transition hover:bg-white/[.035]">
        <td className="px-5 py-4"><span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg text-xs font-black ${rank && rank <= 3 ? "bg-[#FFEE00] text-black" : "bg-white/5 text-white/55"}`}>{rank ? `#${rank}` : "—"}</span></td>
        <td className="px-5 py-4"><p className="font-black uppercase text-white">{row.project.team || "Untitled team"}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/35">{row.project.teamId} · {row.project.track || "No track"}</p></td>
        {STATIC_ROUNDS_CONFIG.map(round => <td key={round.id} className="px-4 py-4 text-center"><ScoreCell value={row.score.roundPercents[round.id]} evaluations={row.score.evaluations[round.id]} /></td>)}
        <td className="px-4 py-4 text-center"><ScoreCell value={row.score.overallPercent} evaluations={row.score.completedRounds} bold /></td>
        <td className="px-5 py-4 text-right"><button onClick={onSelect} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/65 transition hover:border-[#FFEE00]/50 hover:text-[#FFEE00]"><MessageSquare size={14} /> Review</button></td>
    </tr>;
}

function ScoreCell({ value, evaluations, bold = false }: { value: number | null; evaluations: number; bold?: boolean }) {
    if (value === null) return <span className="text-xs text-white/25">Not evaluated</span>;
    return <div><span className={`${bold ? "text-lg" : "text-sm"} font-black text-white`}>{value.toFixed(1)}%</span><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/35">{evaluations} review{evaluations === 1 ? "" : "s"}</p></div>;
}

function ProjectDetails({ project, judges, onClose }: { project: Project; judges: { generatedId: string; name: string }[]; onClose: () => void }) {
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"><div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0b0713] p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FFEE00]">Evaluation record</p><h2 className="mt-2 text-2xl font-black uppercase italic text-white">{project.team}</h2><p className="mt-1 text-xs text-white/45">{project.teamId} · {project.name || "Project title not submitted"}</p></div><button onClick={onClose} className="rounded-xl border border-white/10 p-3 text-white/50 hover:bg-white/10 hover:text-white"><X size={18} /></button></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{STATIC_ROUNDS_CONFIG.map(round => { const entries = Object.entries(project.roundScores?.[round.id] ?? {}); return <section key={round.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="font-black text-white">{round.title}</h3><p className="text-xs text-white/40">{round.subtitle}</p></div><span className="text-[10px] font-bold text-white/40">{entries.length} reviews</span></div>{entries.length ? <div className="space-y-3">{entries.map(([judgeId, score]) => <div key={judgeId} className="rounded-xl bg-black/20 p-3"><div className="flex justify-between gap-3"><span className="text-xs font-bold text-white/75">{judges.find(judge => judge.generatedId === judgeId)?.name ?? judgeId}</span><span className="text-xs font-black text-[#FFEE00]">{Number(score).toFixed(1)} / {maxScore(round.id)}</span></div>{project.roundComments?.[round.id]?.[judgeId] && <p className="mt-2 text-xs leading-relaxed text-white/50">{project.roundComments[round.id][judgeId]}</p>}</div>)}</div> : <p className="text-sm text-white/30">No evaluation submitted.</p>}</section>; })}</div>
    </div></div>;
}
