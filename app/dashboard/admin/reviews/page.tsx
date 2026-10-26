"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useHackathon, Project } from "@/context/HackathonContext";
import {
    Search, Download, ExternalLink, Github, Video, Presentation,
    Globe, HardDrive, CheckCircle2, Clock, AlertCircle, Edit3,
    X, Eye, RefreshCw, Award, Copy, Check, ChevronLeft, ChevronRight,
    Filter, FileSpreadsheet, Layers, Sparkles, User, Phone, HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { JudgingRound } from "@/lib/judging-rounds";

const maxScore = (round: JudgingRound) => (round.criteria?.length || 10) * 10 * 2;

function getScoreSummary(project: Project, rounds: JudgingRound[]) {
    const roundPercents: Record<string, number | null> = {};
    const roundScores: Record<string, number | null> = {};
    const evaluations: Record<string, number> = {};
    let totalScore = project.preScore || 0;
    let completedCount = 0;

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

        // Each round is evaluated out of 200 points
        const avgScore = scores.reduce((total, score) => total + score, 0) / scores.length;
        const rounded = Number(avgScore.toFixed(1));
        roundScores[round.id] = rounded;
        roundPercents[round.id] = Number(((rounded / 200) * 100).toFixed(1));
        totalScore += rounded;
        completedCount++;
    });

    return {
        completedRounds: completedCount,
        overallScore: (completedCount > 0 || (project.preScore && project.preScore > 0)) ? Number(totalScore.toFixed(1)) : null,
        roundScores,
        roundPercents,
        evaluations,
        rabbitRace: project.preScore ?? 0
    };
}

export default function AdminReviewsPage() {
    const { projects, roundConfigs, refreshTeams } = useHackathon();
    const [search, setSearch] = useState("");
    const [trackFilter, setTrackFilter] = useState("all");
    const [submissionFilter, setSubmissionFilter] = useState<"all" | "submitted" | "finalized" | "missing">("all");
    const [scoringFilter, setScoringFilter] = useState<"all" | "missing_r1" | "missing_r2" | "missing_rabbit" | "complete">("all");
    const [sortBy, setSortBy] = useState<"total" | "r1" | "r2" | "rabbit" | "teamId" | "name">("total");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Pagination
    const [pageSize, setPageSize] = useState<number>(25);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Modals
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [editingScoreTeam, setEditingScoreTeam] = useState<Project | null>(null);
    const [copiedLink, setCopiedLink] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Edit score modal state
    const [r1Input, setR1Input] = useState<string>("");
    const [r2Input, setR2Input] = useState<string>("");
    const [rabbitInput, setRabbitInput] = useState<string>("");
    const [savingScore, setSavingScore] = useState(false);

    // Tracks list
    const tracks = useMemo(() => {
        return Array.from(new Set(projects.map(p => p.track).filter(Boolean))).sort();
    }, [projects]);

    // Compute summaries
    const projectRows = useMemo(() => {
        return projects.map(project => {
            const scores = getScoreSummary(project, roundConfigs);
            const sub = project.submission || { github: "", presentation: "", demo: "", deployment: "", projectZip: "", isFinal: false };
            const hasAnySubmission = Boolean(sub.github || sub.presentation || sub.demo || sub.deployment || sub.projectZip);
            return {
                project,
                scores,
                submission: sub,
                hasAnySubmission
            };
        });
    }, [projects, roundConfigs]);

    // Statistics
    const stats = useMemo(() => {
        const total = projectRows.length;
        const submitted = projectRows.filter(r => r.hasAnySubmission).length;
        const finalized = projectRows.filter(r => r.submission.isFinal).length;
        const missing = total - submitted;
        const r1Count = projectRows.filter(r => r.scores.roundPercents['round1'] !== null).length;
        const r2Count = projectRows.filter(r => r.scores.roundPercents['round2'] !== null).length;
        const rabbitCount = projectRows.filter(r => r.scores.rabbitRace > 0).length;

        return { total, submitted, finalized, missing, r1Count, r2Count, rabbitCount };
    }, [projectRows]);

    // Filtered & Sorted Rows
    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();

        return projectRows.filter(row => {
            const { project, scores, submission, hasAnySubmission } = row;

            // Search query
            if (q) {
                const searchPool = [
                    project.team,
                    project.teamId,
                    project.captain,
                    project.captainMobile,
                    project.track,
                    project.college,
                    project.problemStatement,
                    project.proposedIdea
                ].filter(Boolean).map(s => String(s).toLowerCase());

                if (!searchPool.some(s => s.includes(q))) return false;
            }

            // Track filter
            if (trackFilter !== "all" && project.track !== trackFilter) return false;

            // Submission filter
            if (submissionFilter === "submitted" && !hasAnySubmission) return false;
            if (submissionFilter === "finalized" && !submission.isFinal) return false;
            if (submissionFilter === "missing" && hasAnySubmission) return false;

            // Scoring filter
            if (scoringFilter === "missing_r1" && scores.roundPercents['round1'] !== null) return false;
            if (scoringFilter === "missing_r2" && scores.roundPercents['round2'] !== null) return false;
            if (scoringFilter === "missing_rabbit" && scores.rabbitRace > 0) return false;
            if (scoringFilter === "complete") {
                const hasR1 = scores.roundPercents['round1'] !== null;
                const hasR2 = scores.roundPercents['round2'] !== null;
                if (!hasR1 || !hasR2) return false;
            }

            return true;
        }).sort((a, b) => {
            let valA: any = 0;
            let valB: any = 0;

            if (sortBy === "total") {
                valA = a.scores.overallScore ?? -1;
                valB = b.scores.overallScore ?? -1;
            } else if (sortBy === "r1") {
                valA = a.scores.roundPercents['round1'] ?? -1;
                valB = b.scores.roundPercents['round1'] ?? -1;
            } else if (sortBy === "r2") {
                valA = a.scores.roundPercents['round2'] ?? -1;
                valB = b.scores.roundPercents['round2'] ?? -1;
            } else if (sortBy === "rabbit") {
                valA = a.scores.rabbitRace;
                valB = b.scores.rabbitRace;
            } else if (sortBy === "teamId") {
                valA = a.project.teamId || "";
                valB = b.project.teamId || "";
                return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else if (sortBy === "name") {
                valA = a.project.team || "";
                valB = b.project.team || "";
                return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            return sortOrder === "asc" ? valA - valB : valB - valA;
        });
    }, [projectRows, search, trackFilter, submissionFilter, scoringFilter, sortBy, sortOrder]);

    // Paginated Rows
    const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
    const paginatedRows = useMemo(() => {
        if (pageSize === -1) return filteredRows;
        const start = (currentPage - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, currentPage, pageSize]);

    // Manual Refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshTeams();
            toast.success("Submissions and scores refreshed!");
        } catch (err) {
            toast.error("Failed to refresh");
        } finally {
            setIsRefreshing(false);
        }
    };

    // Open Edit Score Modal
    const openScoreEditor = (project: Project) => {
        setEditingScoreTeam(project);
        const scores = getScoreSummary(project, roundConfigs);
        setR1Input(scores.roundScores['round1'] !== null ? String(scores.roundScores['round1']) : "");
        setR2Input(scores.roundScores['round2'] !== null ? String(scores.roundScores['round2']) : "");
        setRabbitInput(scores.rabbitRace > 0 ? String(scores.rabbitRace) : "");
    };

    // Save All Scores
    const handleSaveScores = async () => {
        if (!editingScoreTeam) return;
        setSavingScore(true);

        try {
            const teamId = editingScoreTeam.teamId || editingScoreTeam.id;

            // 1. Round 1 (0 to 200 pts)
            const r1Val = r1Input.trim() === "" ? null : Number(r1Input);
            if (r1Input.trim() !== "" && (isNaN(Number(r1Input)) || Number(r1Input) < 0 || Number(r1Input) > 200)) {
                toast.error("Round 1 score must be between 0 and 200 pts");
                setSavingScore(false);
                return;
            }

            // 2. Round 2 (0 to 200 pts)
            const r2Val = r2Input.trim() === "" ? null : Number(r2Input);
            if (r2Input.trim() !== "" && (isNaN(Number(r2Input)) || Number(r2Input) < 0 || Number(r2Input) > 200)) {
                toast.error("Round 2 score must be between 0 and 200 pts");
                setSavingScore(false);
                return;
            }

            // 3. Rabbit Race (0 to 100 pts)
            const rabbitVal = rabbitInput.trim() === "" ? null : Number(rabbitInput);
            if (rabbitInput.trim() !== "" && (isNaN(Number(rabbitInput)) || Number(rabbitInput) < 0 || Number(rabbitInput) > 100)) {
                toast.error("Rabbit Race score must be between 0 and 100 pts");
                setSavingScore(false);
                return;
            }

            // Execute parallel updates
            const requests = [
                fetch('/api/admin/scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teamId, roundId: 'round1', score: r1Val })
                }),
                fetch('/api/admin/scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teamId, roundId: 'round2', score: r2Val })
                }),
                fetch('/api/admin/scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teamId, roundId: 'rabbit_race', score: rabbitVal })
                })
            ];

            const results = await Promise.all(requests);
            const allSuccess = results.every(res => res.ok);

            if (allSuccess) {
                toast.success(`Scores updated for ${editingScoreTeam.team || teamId}`);
                await refreshTeams();
                setEditingScoreTeam(null);
            } else {
                toast.error("Some scores could not be saved. Please check connection.");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to update scores");
        } finally {
            setSavingScore(false);
        }
    };

    // Copy to clipboard helper
    const copyToClipboard = (text: string | undefined, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedLink(label);
        toast.success(`Copied ${label} link!`);
        setTimeout(() => setCopiedLink(null), 2000);
    };

    // Export CSV with full submission links & all scores
    const exportSubmissionsCSV = () => {
        const headers = [
            "Team ID",
            "Team Name",
            "Track",
            "Captain Name",
            "Captain Mobile",
            "College",
            "Submission Status",
            "GitHub URL",
            "Demo Video URL",
            "Presentation URL",
            "Deployment URL",
            "Drive Zip URL",
            "Round 1 Score (/200)",
            "Round 2 Score (/200)",
            "Rabbit Race Score (/100)",
            "Total Score (/500)",
            "Problem Statement",
            "Proposed Idea"
        ];

        const rows = filteredRows.map(row => {
            const { project, scores, submission } = row;
            const r1 = scores.roundScores['round1'] !== null ? `${scores.roundScores['round1']} (${scores.roundPercents['round1']}%)` : "";
            const r2 = scores.roundScores['round2'] !== null ? `${scores.roundScores['round2']} (${scores.roundPercents['round2']}%)` : "";
            const rabbit = scores.rabbitRace > 0 ? scores.rabbitRace : "";
            const total = scores.overallScore !== null ? scores.overallScore : "";
            const subStatus = submission.isFinal ? "Finalized" : (row.hasAnySubmission ? "In Progress" : "Not Submitted");

            return [
                project.teamId || "",
                project.team || "",
                project.track || "",
                project.captain || "",
                project.captainMobile || "",
                project.college || "",
                subStatus,
                submission.github || "",
                submission.demo || "",
                submission.presentation || "",
                submission.deployment || "",
                submission.projectZip || "",
                r1,
                r2,
                rabbit,
                total,
                (project.problemStatement || "").replace(/[\r\n]+/g, " "),
                (project.proposedIdea || "").replace(/[\r\n]+/g, " ")
            ].map(val => `"${String(val ?? "").replaceAll('"', '""')}"`).join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Happeno-submissions-reviews-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${filteredRows.length} team submissions to CSV!`);
    };

    return (
        <DashboardLayout type="admin" title="Submissions & Reviews">
            <main className="mx-auto max-w-[1700px] space-y-6 pb-16 px-2 sm:px-4">

                {/* ── HEADER BANNER ── */}
                <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 h-44 w-44 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-700 border border-teal-200/60">
                                    <Sparkles size={13} className="text-teal-600" /> Live Submissions Console
                                </span>
                                <span className="text-xs font-semibold text-slate-400">· Final Round Evaluations</span>
                            </div>
                            <h1 className="mt-2 text-2xl font-black italic tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                                Project Submissions & Score Reviews
                            </h1>
                            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-500">
                                Inspect project links side-by-side (GitHub, Demo, PPT, Live Site), review R1 + R2 + Rabbit Race scores, directly add or adjust round marks, and export verified CSV records.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
                            >
                                <RefreshCw size={15} className={isRefreshing ? "animate-spin text-teal-600" : ""} />
                                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                            </button>

                            <button
                                onClick={exportSubmissionsCSV}
                                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700 hover:shadow-lg"
                            >
                                <Download size={16} />
                                <span>Export Full CSV ({filteredRows.length})</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── STATS SUMMARY CARDS ── */}
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                    <StatCard label="Total Teams" value={stats.total} />
                    <StatCard label="Links Submitted" value={stats.submitted} accent="text-teal-700" sub={`${Math.round((stats.submitted / (stats.total || 1)) * 100)}%`} />
                    <StatCard label="Finalized" value={stats.finalized} accent="text-emerald-700" />
                    <StatCard label="Missing Links" value={stats.missing} accent="text-rose-600" />
                    <StatCard label="R1 Evaluated" value={stats.r1Count} accent="text-orange-600" />
                    <StatCard label="R2 Evaluated" value={stats.r2Count} accent="text-pink-600" />
                    <StatCard label="Rabbit Scored" value={stats.rabbitCount} accent="text-amber-600" />
                </section>

                {/* ── FILTER & SEARCH CONTROLS ── */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        {/* Search input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                placeholder="Search by team name, ID (e.g. TRI26194), captain, track, or idea..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* Track filter */}
                        <select
                            value={trackFilter}
                            onChange={e => { setTrackFilter(e.target.value); setCurrentPage(1); }}
                            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                        >
                            <option value="all">All Tracks ({tracks.length})</option>
                            {tracks.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        {/* Submission status filter */}
                        <select
                            value={submissionFilter}
                            onChange={e => { setSubmissionFilter(e.target.value as any); setCurrentPage(1); }}
                            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                        >
                            <option value="all">All Submissions</option>
                            <option value="submitted">Has Any Submission</option>
                            <option value="finalized">Finalized Only</option>
                            <option value="missing">Missing Submissions</option>
                        </select>

                        {/* Scoring filter */}
                        <select
                            value={scoringFilter}
                            onChange={e => { setScoringFilter(e.target.value as any); setCurrentPage(1); }}
                            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                        >
                            <option value="all">All Scoring States</option>
                            <option value="missing_r1">Needs Round 1 Score</option>
                            <option value="missing_r2">Needs Round 2 Score</option>
                            <option value="missing_rabbit">Needs Rabbit Race Score</option>
                            <option value="complete">Fully Scored (R1+R2)</option>
                        </select>

                        {/* Sort by */}
                        <select
                            value={`${sortBy}_${sortOrder}`}
                            onChange={e => {
                                const [field, order] = e.target.value.split("_");
                                setSortBy(field as any);
                                setSortOrder(order as any);
                            }}
                            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                        >
                            <option value="total_desc">Total Score (High → Low)</option>
                            <option value="total_asc">Total Score (Low → High)</option>
                            <option value="r1_desc">Round 1 (High → Low)</option>
                            <option value="r2_desc">Round 2 (High → Low)</option>
                            <option value="rabbit_desc">Rabbit Race (High → Low)</option>
                            <option value="teamId_asc">Team ID (Ascending)</option>
                            <option value="name_asc">Team Name (A → Z)</option>
                        </select>
                    </div>

                    {/* Active filter count & pagination size */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <span>Showing <b>{filteredRows.length}</b> of {projects.length} teams</span>
                            {(search || trackFilter !== "all" || submissionFilter !== "all" || scoringFilter !== "all") && (
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setTrackFilter("all");
                                        setSubmissionFilter("all");
                                        setScoringFilter("all");
                                        setCurrentPage(1);
                                    }}
                                    className="text-teal-600 hover:underline font-bold text-[11px]"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-400">Rows per page:</span>
                            {[25, 50, 100, -1].map(size => (
                                <button
                                    key={size}
                                    onClick={() => { setPageSize(size); setCurrentPage(1); }}
                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${pageSize === size ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                >
                                    {size === -1 ? "All" : size}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── MAIN SUBMISSIONS TABLE ── */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full min-w-[1300px] text-left border-collapse">
                            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black uppercase tracking-[.14em] text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 w-12 text-center">#</th>
                                    <th className="px-5 py-4 min-w-[220px]">Team & Track</th>
                                    <th className="px-5 py-4 min-w-[340px]">Submissions (Side-by-Side Links)</th>
                                    <th className="px-4 py-4 text-center min-w-[110px]">Round 1 (/200)</th>
                                    <th className="px-4 py-4 text-center min-w-[110px]">Round 2 (/200)</th>
                                    <th className="px-4 py-4 text-center min-w-[110px]">Rabbit Race (/100)</th>
                                    <th className="px-4 py-4 text-center min-w-[120px]">Total Score (/500)</th>
                                    <th className="px-5 py-4 text-right min-w-[140px]">Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {paginatedRows.map((row, index) => {
                                    const { project, scores, submission, hasAnySubmission } = row;
                                    const globalIndex = pageSize === -1 ? index + 1 : (currentPage - 1) * pageSize + index + 1;
                                    const r1Score = scores.roundPercents['round1'];
                                    const r2Score = scores.roundPercents['round2'];
                                    const rabbitScore = scores.rabbitRace;
                                    const totalScore = scores.overallScore;

                                    return (
                                        <tr key={project.id || project.teamId} className="transition-colors hover:bg-slate-50/70 group">
                                            {/* S.No / Rank */}
                                            <td className="px-5 py-3.5 text-center font-bold text-slate-400">
                                                {globalIndex}
                                            </td>

                                            {/* Team & Track & Captain */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-[11px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                                                {project.teamId || "N/A"}
                                                            </span>
                                                            <p className="font-bold text-slate-900 group-hover:text-teal-700 transition">
                                                                {project.team || "Untitled Team"}
                                                            </p>
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                                            <span className="font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100/80">
                                                                {project.track || "Unassigned"}
                                                            </span>
                                                            {project.captain && (
                                                                <span className="text-slate-400 flex items-center gap-1">
                                                                    · {project.captain} {project.captainMobile ? `(${project.captainMobile})` : ""}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Side-by-Side Submissions */}
                                            <td className="px-5 py-3.5">
                                                <div className="space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {/* GitHub Link */}
                                                        <SubmissionPill
                                                            label="GitHub"
                                                            url={submission.github}
                                                            icon={Github}
                                                            color="slate"
                                                            onCopy={() => copyToClipboard(submission.github, "GitHub")}
                                                        />

                                                        {/* Presentation / PPT Link */}
                                                        <SubmissionPill
                                                            label="PPT"
                                                            url={submission.presentation}
                                                            icon={Presentation}
                                                            color="amber"
                                                            onCopy={() => copyToClipboard(submission.presentation, "Presentation")}
                                                        />

                                                        {/* Demo Video Link */}
                                                        <SubmissionPill
                                                            label="Demo"
                                                            url={submission.demo}
                                                            icon={Video}
                                                            color="rose"
                                                            onCopy={() => copyToClipboard(submission.demo, "Demo Video")}
                                                        />

                                                        {/* Live Deployment Link */}
                                                        <SubmissionPill
                                                            label="Live App"
                                                            url={submission.deployment}
                                                            icon={Globe}
                                                            color="orange"
                                                            onCopy={() => copyToClipboard(submission.deployment, "Deployment")}
                                                        />

                                                        {/* Drive / Zip Link */}
                                                        {submission.projectZip && (
                                                            <SubmissionPill
                                                                label="Drive Zip"
                                                                url={submission.projectZip}
                                                                icon={HardDrive}
                                                                color="purple"
                                                                onCopy={() => copyToClipboard(submission.projectZip, "Drive Zip")}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Status indicator tag */}
                                                    <div className="flex items-center gap-2">
                                                        {submission.isFinal ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                <CheckCircle2 size={11} /> Final Submission Locked
                                                            </span>
                                                        ) : hasAnySubmission ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                                <Clock size={11} /> Draft / In Progress
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                <AlertCircle size={11} /> No Links Submitted Yet
                                                            </span>
                                                        )}

                                                        {project.problemStatement && (
                                                            <button
                                                                onClick={() => setSelectedProject(project)}
                                                                className="text-[10px] font-medium text-slate-400 hover:text-teal-600 underline truncate max-w-[150px]"
                                                                title={project.problemStatement}
                                                            >
                                                                {project.problemStatement.slice(0, 30)}...
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Round 1 Score */}
                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    onClick={() => openScoreEditor(project)}
                                                    className="group/score inline-flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-teal-50 transition w-full"
                                                    title="Click to add or edit Round 1 score (out of 200)"
                                                >
                                                    {scores.roundScores['round1'] !== null ? (
                                                        <div>
                                                            <span className="font-mono text-sm font-black text-orange-600">
                                                                {scores.roundScores['round1'].toFixed(1)}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold ml-0.5">/ 200</span>
                                                            <div className="text-[9px] font-bold text-slate-400">
                                                                ({scores.roundPercents['round1']}%)
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-300 italic group-hover/score:text-teal-600">
                                                            + Add R1 (/200)
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] font-semibold text-slate-400 opacity-0 group-hover/score:opacity-100 transition flex items-center gap-0.5 mt-0.5">
                                                        <Edit3 size={9} /> Edit
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Round 2 Score */}
                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    onClick={() => openScoreEditor(project)}
                                                    className="group/score inline-flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-pink-50 transition w-full"
                                                    title="Click to add or edit Round 2 score (out of 200)"
                                                >
                                                    {scores.roundScores['round2'] !== null ? (
                                                        <div>
                                                            <span className="font-mono text-sm font-black text-pink-700">
                                                                {scores.roundScores['round2'].toFixed(1)}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold ml-0.5">/ 200</span>
                                                            <div className="text-[9px] font-bold text-slate-400">
                                                                ({scores.roundPercents['round2']}%)
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-300 italic group-hover/score:text-pink-600">
                                                            + Add R2 (/200)
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] font-semibold text-slate-400 opacity-0 group-hover/score:opacity-100 transition flex items-center gap-0.5 mt-0.5">
                                                        <Edit3 size={9} /> Edit
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Rabbit Race Score */}
                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    onClick={() => openScoreEditor(project)}
                                                    className="group/score inline-flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-amber-50 transition w-full"
                                                    title="Click to add or edit Rabbit Race score (out of 100)"
                                                >
                                                    {rabbitScore > 0 ? (
                                                        <div>
                                                            <span className="font-mono text-sm font-black text-amber-700">
                                                                {rabbitScore.toFixed(1)}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold ml-0.5">/ 100</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-300 italic group-hover/score:text-amber-600">
                                                            + Add Race (/100)
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] font-semibold text-slate-400 opacity-0 group-hover/score:opacity-100 transition flex items-center gap-0.5 mt-0.5">
                                                        <Edit3 size={9} /> Edit
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Total Score (R1 + R2 + Rabbit Race) */}
                                            <td className="px-4 py-3.5 text-center">
                                                {totalScore !== null ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                            {totalScore.toFixed(1)}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                            out of 500
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 font-bold">—</span>
                                                )}
                                            </td>

                                            {/* Quick Actions */}
                                            <td className="px-5 py-3.5 text-right space-x-1.5">
                                                <button
                                                    onClick={() => openScoreEditor(project)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700"
                                                    title="Edit Round & Rabbit Race Scores"
                                                >
                                                    <Award size={13} />
                                                    <span>Scores</span>
                                                </button>

                                                <button
                                                    onClick={() => setSelectedProject(project)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                                                    title="View Full Team & Submission Details"
                                                >
                                                    <Eye size={13} />
                                                    <span>View</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {paginatedRows.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Search size={32} className="text-slate-300" />
                                                <p className="text-sm font-bold text-slate-700">No teams match your current filters</p>
                                                <p className="text-xs text-slate-400">Try adjusting your search query or reset the filter dropdowns.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {pageSize !== -1 && totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3 text-xs text-slate-600">
                            <div>
                                Page <b>{currentPage}</b> of <b>{totalPages}</b> ({filteredRows.length} total entries)
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold transition hover:bg-slate-50 disabled:opacity-40"
                                >
                                    <ChevronLeft size={14} /> Previous
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = i + 1;
                                    if (totalPages > 5 && currentPage > 3) {
                                        pageNum = currentPage - 3 + i;
                                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`h-8 w-8 rounded-lg text-xs font-bold transition ${currentPage === pageNum ? "bg-teal-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold transition hover:bg-slate-50 disabled:opacity-40"
                                >
                                    Next <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {/* ── MODAL: EDIT SCORES (R1, R2, RABBIT RACE) ── */}
            {editingScoreTeam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">Manual Evaluation Override</span>
                                <h3 className="text-lg font-black text-slate-900">{editingScoreTeam.team}</h3>
                                <p className="text-xs text-slate-500">{editingScoreTeam.teamId} · {editingScoreTeam.track}</p>
                            </div>
                            <button
                                onClick={() => setEditingScoreTeam(null)}
                                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Round 1 Score */}
                            <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 space-y-1.5">
                                <label className="flex items-center justify-between text-xs font-bold text-orange-950">
                                    <span>Round 1 Score (/200)</span>
                                    <span className="text-[10px] text-orange-600 font-medium">0 - 200 pts</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="200"
                                        step="0.5"
                                        placeholder="e.g. 175.0 (leave blank to clear)"
                                        value={r1Input}
                                        onChange={e => setR1Input(e.target.value)}
                                        className="h-10 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-orange-500"
                                    />
                                    {r1Input && (
                                        <button
                                            type="button"
                                            onClick={() => setR1Input("")}
                                            className="text-[11px] font-bold text-rose-500 hover:underline px-2"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Round 2 Score */}
                            <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4 space-y-1.5">
                                <label className="flex items-center justify-between text-xs font-bold text-pink-950">
                                    <span>Round 2 Score (/200)</span>
                                    <span className="text-[10px] text-pink-700 font-medium">0 - 200 pts</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="200"
                                        step="0.5"
                                        placeholder="e.g. 182.0 (leave blank to clear)"
                                        value={r2Input}
                                        onChange={e => setR2Input(e.target.value)}
                                        className="h-10 w-full rounded-xl border border-pink-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-pink-500"
                                    />
                                    {r2Input && (
                                        <button
                                            type="button"
                                            onClick={() => setR2Input("")}
                                            className="text-[11px] font-bold text-rose-500 hover:underline px-2"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Rabbit Race Score */}
                            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 space-y-1.5">
                                <label className="flex items-center justify-between text-xs font-bold text-amber-950">
                                    <span>Rabbit Race Score (/100)</span>
                                    <span className="text-[10px] text-amber-700 font-medium">Agency marks out of 100</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        placeholder="e.g. 98 (leave blank to set 0)"
                                        value={rabbitInput}
                                        onChange={e => setRabbitInput(e.target.value)}
                                        className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-amber-500"
                                    />
                                    {rabbitInput && (
                                        <button
                                            type="button"
                                            onClick={() => setRabbitInput("")}
                                            className="text-[11px] font-bold text-rose-500 hover:underline px-2"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Live calculation preview */}
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-600">Calculated Total (R1 + R2 + Rabbit):</span>
                                <span className="font-mono font-black text-sm text-slate-900">
                                    {(
                                        (Number(r1Input) || 0) +
                                        (Number(r2Input) || 0) +
                                        (Number(rabbitInput) || 0)
                                    ).toFixed(1)} / 500
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setEditingScoreTeam(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveScores}
                                disabled={savingScore}
                                className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-teal-700 shadow-md transition disabled:opacity-50"
                            >
                                {savingScore ? "Saving..." : "Save Scores"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: VIEW FULL PROJECT & SUBMISSION DETAILS ── */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 custom-scrollbar">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">Team Details & Links</span>
                                <h2 className="text-2xl font-black text-slate-900">{selectedProject.team}</h2>
                                <p className="text-xs text-slate-500">{selectedProject.teamId} · {selectedProject.track || "No track"}</p>
                            </div>
                            <button
                                onClick={() => setSelectedProject(null)}
                                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Submission Links Banner */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">All Submitted Project Links</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <FullLinkCard label="GitHub Repository" url={selectedProject.submission?.github} icon={Github} />
                                <FullLinkCard label="Demo Video" url={selectedProject.submission?.demo} icon={Video} />
                                <FullLinkCard label="Presentation PPT" url={selectedProject.submission?.presentation} icon={Presentation} />
                                <FullLinkCard label="Live Website" url={selectedProject.submission?.deployment} icon={Globe} />
                                <FullLinkCard label="Drive Zip Archive" url={selectedProject.submission?.projectZip} icon={HardDrive} />
                            </div>
                        </div>

                        {/* Problem Statement & Proposed Idea */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Project Description</h4>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                                <p className="text-[11px] font-bold text-slate-500 uppercase">Problem Statement</p>
                                <p className="text-xs font-medium text-slate-800">{selectedProject.problemStatement || "Not specified."}</p>
                            </div>

                            {selectedProject.proposedIdea && (
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase">Proposed Idea / Solution</p>
                                    <p className="text-xs font-medium text-slate-800 whitespace-pre-wrap">{selectedProject.proposedIdea}</p>
                                </div>
                            )}
                        </div>

                        {/* Team Roster */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Participants ({selectedProject.members?.length || 0})</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(selectedProject.members || []).map((m: any, idx) => {
                                    const name = typeof m === 'string' ? m : m?.fullName || "Member";
                                    const email = typeof m === 'object' ? m?.email : "";
                                    const phone = typeof m === 'object' ? m?.phone : "";
                                    const college = typeof m === 'object' ? m?.college : selectedProject.college;

                                    return (
                                        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                                            <p className="font-bold text-slate-900">{name} {idx === 0 && <span className="text-[10px] text-teal-600 bg-teal-50 px-1 py-0.5 rounded">Captain</span>}</p>
                                            {email && <p className="text-[11px] text-slate-500">{email}</p>}
                                            {phone && <p className="text-[11px] text-slate-400">{phone}</p>}
                                            {college && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{college}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Evaluator Comments */}
                        {selectedProject.roundComments && Object.keys(selectedProject.roundComments).length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Evaluator Feedbacks</h4>
                                <div className="space-y-2">
                                    {Object.entries(selectedProject.roundComments).map(([roundId, judgesMap]) => (
                                        <div key={roundId} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                                            <p className="text-[11px] font-bold uppercase text-teal-700">{roundId}</p>
                                            {Object.entries(judgesMap || {}).map(([judgeId, comment]) => (
                                                <p key={judgeId} className="text-xs text-slate-700 italic">
                                                    "{comment || "No feedback provided."}"
                                                </p>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    const team = selectedProject;
                                    setSelectedProject(null);
                                    openScoreEditor(team);
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-teal-700"
                            >
                                <Edit3 size={15} /> Edit Scores For This Team
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

// ── SUBCOMPONENTS ──

function StatCard({ label, value, accent = "text-slate-900", sub }: { label: string; value: number; accent?: string; sub?: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400 truncate">{label}</p>
            <div className="mt-1 flex items-baseline gap-1.5">
                <p className={`text-xl font-black ${accent}`}>{value}</p>
                {sub && <span className="text-[10px] font-bold text-slate-400">{sub}</span>}
            </div>
        </div>
    );
}

function SubmissionPill({
    label,
    url,
    icon: Icon,
    color,
    onCopy
}: {
    label: string;
    url?: string;
    icon: any;
    color: "slate" | "amber" | "rose" | "orange" | "purple";
    onCopy: () => void;
}) {
    if (!url) {
        return (
            <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-2 py-1 text-[10px] font-bold text-slate-400">
                <Icon size={11} className="opacity-40" />
                <span>{label}</span>
            </span>
        );
    }

    const colorClasses = {
        slate: "border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100",
        amber: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
        rose: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
        orange: "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100",
        purple: "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100",
    }[color];

    return (
        <div className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold shadow-2xs transition ${colorClasses}`}>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
                title={`Open ${label}: ${url}`}
            >
                <Icon size={12} />
                <span>{label}</span>
                <ExternalLink size={10} className="opacity-60" />
            </a>
            <button
                type="button"
                onClick={onCopy}
                className="ml-0.5 text-slate-400 hover:text-slate-700"
                title={`Copy ${label} URL`}
            >
                <Copy size={10} />
            </button>
        </div>
    );
}

function FullLinkCard({ label, url, icon: Icon }: { label: string; url?: string; icon: any }) {
    if (!url) {
        return (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-slate-400">
                <Icon size={16} className="opacity-50" />
                <div className="truncate">
                    <p className="text-[10px] font-bold uppercase">{label}</p>
                    <p className="text-xs font-semibold italic text-slate-300">Not provided</p>
                </div>
            </div>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-sm transition hover:border-teal-400 hover:bg-teal-50/30 group"
        >
            <div className="flex items-center gap-2.5 truncate">
                <Icon size={16} className="text-teal-600" />
                <div className="truncate">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 truncate">{url}</p>
                </div>
            </div>
            <ExternalLink size={14} className="text-slate-400 group-hover:text-teal-600 shrink-0" />
        </a>
    );
}
