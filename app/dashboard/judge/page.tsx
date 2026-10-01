"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    ClipboardCheck,
    MessageSquare,
    Users,
    Info,
    Target,
    ArrowLeft,
    UserCircle2,
    CheckCircle2
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useHackathon, type Project } from "@/context/HackathonContext";
import { useAuth } from "@/context/AuthContext";
import type { JudgingRound } from "@/lib/judging-rounds";

function safeHttpUrl(value: unknown): string | null {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
    } catch {
        return null;
    }
}

interface JudgeEvaluationRecord {
    id: string;
    teamId: string;
    teamName: string;
    roundId: string;
    roundTitle: string;
    totalScore: number | null;
    status: string;
    submittedAt: string | null;
    feedback: string;
}

export default function JudgeDashboard() {
    const { isLoading } = useHackathon();
    const { user } = useAuth();
    const [teamIdInput, setTeamIdInput] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [evaluationRound, setEvaluationRound] = useState<JudgingRound | null>(null);
    const [evaluationId, setEvaluationId] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [currentScores, setCurrentScores] = useState<Record<string, number>>({});
    const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myEvaluations, setMyEvaluations] = useState<JudgeEvaluationRecord[]>([]);
    const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
    const [alreadyEvaluatedInfo, setAlreadyEvaluatedInfo] = useState<{ teamId: string; teamName: string; roundTitle: string; score: number | null } | null>(null);

    const currentJudge = user?.role === 'judge' && user.id
        ? { id: user.id, generatedId: user.id, name: user.name || user.id }
        : null;

    const draftStorageKey = (tId: string, rId: string) => `tricity_judge_draft_${tId}_${rId}`;

    // Load judge's evaluation history
    const fetchJudgeEvaluations = async () => {
        if (!currentJudge) return;
        setIsLoadingEvaluations(true);
        try {
            const res = await fetch('/api/judging/evaluations');
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.evaluations)) {
                    setMyEvaluations(data.evaluations);
                }
            }
        } catch (err) {
            console.warn('Failed to load judge evaluations:', err);
        } finally {
            setIsLoadingEvaluations(false);
        }
    };

    useEffect(() => {
        if (currentJudge) {
            void fetchJudgeEvaluations();
        }
    }, [currentJudge?.id]);

    const returnToTeamLookup = () => {
        setActiveProject(null);
        setEvaluationRound(null);
        setEvaluationId(null);
        setDraftStatus('idle');
        setCurrentScores({});
        setComment('');
        void fetchJudgeEvaluations();
    };

    const handleScoreChange = (criterionId: string, value: number) => {
        setCurrentScores(previous => ({ ...previous, [criterionId]: value }));
    };

    const handleStartEvaluation = async () => {
        if (!currentJudge) {
            toast.error('Judge profile not found. Sign in again and retry.');
            return;
        }
        if (!teamIdInput.trim()) {
            toast.error('Enter a team ID.');
            return;
        }

        setAlreadyEvaluatedInfo(null);
        setIsStarting(true);
        try {
            const response = await fetch('/api/judging/evaluations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: teamIdInput.trim() })
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (result.allSubmitted) {
                    setAlreadyEvaluatedInfo({
                        teamId: result.teamId,
                        teamName: result.teamName,
                        roundTitle: result.roundTitle,
                        score: result.totalScore
                    });
                    toast.info(`Team ${result.teamId} is already fully evaluated.`);
                    return;
                }
                throw new Error(result.error || 'Could not start evaluation.');
            }

            setEvaluationId(result.evaluation.id);
            setEvaluationRound(result.round);
            setActiveProject({
                id: result.team.teamId,
                teamId: result.team.teamId,
                name: result.team.teamName,
                team: result.team.teamName,
                track: result.team.track,
                problemStatement: result.team.problemStatement,
                proposedIdea: result.team.proposedIdea,
                techStack: result.team.techStack,
                members: result.team.members,
                captain: result.team.captain,
                captainMobile: '',
                college: '',
                roundScores: {},
                submission: { ...result.team.submission, isFinal: result.team.isFinalSubmission }
            });

            // Restore from server or local device draft
            let initialScores = result.evaluation.criteriaScores || {};
            let initialComment = result.evaluation.feedback || '';
            if (typeof window !== 'undefined') {
                try {
                    const localRaw = localStorage.getItem(draftStorageKey(result.team.teamId, result.round.id));
                    if (localRaw) {
                        const localDraft = JSON.parse(localRaw);
                        if (Object.keys(initialScores).length === 0 && localDraft.scores && Object.keys(localDraft.scores).length > 0) {
                            initialScores = localDraft.scores;
                            toast.info('Restored saved scoring draft from this device.');
                        }
                        if (!initialComment.trim() && localDraft.comment) {
                            initialComment = localDraft.comment;
                        }
                    }
                } catch (e) {
                    console.warn('Local draft restore error:', e);
                }
            }

            setCurrentScores(initialScores);
            setComment(initialComment);
            setDraftStatus('saved');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Could not start evaluation.');
        } finally {
            setIsStarting(false);
        }
    };

    // Auto-save draft to both server and localStorage
    useEffect(() => {
        if (!evaluationId || !evaluationRound || !activeProject) return;

        // Save immediately to local device storage
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(draftStorageKey(activeProject.teamId, evaluationRound.id), JSON.stringify({
                    scores: currentScores,
                    comment,
                    updatedAt: Date.now()
                }));
            } catch (e) {
                console.warn('LocalStorage save error:', e);
            }
        }

        let active = true;
        const saveDraft = async () => {
            if (active) setDraftStatus('saving');
            try {
                const response = await fetch('/api/judging/evaluations', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ evaluationId, criteriaScores: currentScores, feedback: comment })
                });
                if (!response.ok) throw new Error('Draft save failed.');
                if (active) setDraftStatus('saved');
            } catch {
                if (active) setDraftStatus('error');
            }
        };
        const saveTimer = setTimeout(() => void saveDraft(), 600);
        const heartbeat = setInterval(() => void saveDraft(), 3 * 60 * 1000);
        return () => {
            active = false;
            clearTimeout(saveTimer);
            clearInterval(heartbeat);
        };
    }, [evaluationId, evaluationRound, activeProject, currentScores, comment]);

    const handleScoreSubmit = async () => {
        if (!activeProject || !evaluationRound || !evaluationId || !currentJudge) return;
        const values = evaluationRound.criteria.map(criterion => currentScores[criterion.id]);
        if (values.some(value => typeof value !== 'number' || value < 1 || value > 10) || !comment.trim()) {
            toast.error("Score every criterion from 1 to 10 and add feedback before submitting.");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/judging/evaluations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evaluationId, criteriaScores: currentScores, feedback: comment })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Evaluation was not saved.');

            // Clear local draft upon confirmed server save
            if (typeof window !== 'undefined') {
                try {
                    localStorage.removeItem(draftStorageKey(activeProject.teamId, evaluationRound.id));
                } catch (e) {
                    console.warn('Failed to clear local draft:', e);
                }
            }

            toast.success(`Evaluation submitted successfully: ${activeProject.name}`);
            setActiveProject(null);
            setEvaluationRound(null);
            setEvaluationId(null);
            setCurrentScores({});
            setComment("");
            setDraftStatus('idle');
            setTeamIdInput('');
            void fetchJudgeEvaluations();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Evaluation was not saved. Your draft remains safely backed up on this device.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const dashboardTitle = activeProject
        ? "Project Evaluation"
        : currentJudge ? `Judge: ${currentJudge.name}` : "Judge Dashboard";

    if (isLoading) {
        return (
            <DashboardLayout type="judge" title="Loading judging pool">
                <div className="grid min-h-[320px] place-items-center">
                    <div className="text-center">
                        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#FFEE00] border-t-transparent" />
                        <p className="mt-4 text-xs font-semibold text-white/50">Loading all teams and evaluation data</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="judge" title={dashboardTitle}>
            <AnimatePresence mode="wait">
                {!activeProject || !evaluationRound ? (
                    <motion.div
                        key="team-lookup"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mx-auto max-w-3xl space-y-6"
                    >
                        {currentJudge && <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white">{currentJudge.name}</div>}

                        {/* Already Evaluated Notice Banner */}
                        {alreadyEvaluatedInfo && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-5 backdrop-blur-md"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                                                Team Already Evaluated & Recorded
                                            </h3>
                                            <p className="mt-1 text-xs text-emerald-200/80">
                                                <span className="font-mono font-bold text-white">{alreadyEvaluatedInfo.teamId}</span> ({alreadyEvaluatedInfo.teamName}) has already been evaluated for <span className="font-bold text-white">{alreadyEvaluatedInfo.roundTitle}</span>.
                                            </p>
                                            {alreadyEvaluatedInfo.score !== null && (
                                                <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-mono font-black text-emerald-200">
                                                    Submitted Score: {alreadyEvaluatedInfo.score} pts
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAlreadyEvaluatedInfo(null)}
                                        className="text-emerald-400/60 hover:text-emerald-300 text-xs font-bold uppercase"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        <form onSubmit={event => { event.preventDefault(); void handleStartEvaluation(); }} className="rounded-2xl border border-white/10 bg-white/[.045] p-6 md:p-8">
                            <h2 className="text-xl font-black uppercase italic text-white">Start evaluation</h2>
                            <p className="mt-1 text-xs text-white/50">Enter the assigned Team ID to open the scoring rubric and project details.</p>
                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                <input
                                    autoComplete="off"
                                    value={teamIdInput}
                                    onChange={event => setTeamIdInput(event.target.value.toUpperCase())}
                                    placeholder="Enter team ID (e.g. TC-101)"
                                    aria-label="Team ID"
                                    className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 font-mono text-sm font-bold uppercase text-white outline-none focus:border-[#FFEE00]"
                                />
                                <button type="submit" disabled={isStarting || !teamIdInput.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FFEE00] px-6 text-xs font-black uppercase tracking-wider text-black disabled:cursor-wait disabled:opacity-50 hover:bg-[#e6d600] transition-colors">
                                    <ClipboardCheck size={16} /> {isStarting ? 'Checking...' : 'Start scoring'}
                                </button>
                            </div>
                        </form>

                        {/* Submitted Evaluations List */}
                        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Your Submitted Evaluations</h3>
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white/70">
                                        {myEvaluations.filter(e => e.status === 'submitted').length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => void fetchJudgeEvaluations()}
                                    disabled={isLoadingEvaluations}
                                    className="text-[11px] font-bold text-white/40 hover:text-white transition-colors"
                                >
                                    {isLoadingEvaluations ? 'Refreshing...' : 'Refresh'}
                                </button>
                            </div>

                            {myEvaluations.filter(e => e.status === 'submitted').length === 0 ? (
                                <p className="text-xs text-white/40 italic py-4 text-center">
                                    No evaluations submitted yet. Enter a team ID above to evaluate a team.
                                </p>
                            ) : (
                                <div className="grid gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                                    {myEvaluations.filter(e => e.status === 'submitted').map(ev => (
                                        <div
                                            key={ev.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[.02] p-3.5 hover:bg-white/[.05] transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-black text-[#FFEE00] bg-[#FFEE00]/10 px-1.5 py-0.5 rounded border border-[#FFEE00]/20">
                                                        {ev.teamId}
                                                    </span>
                                                    <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                                                        {ev.teamName}
                                                    </span>
                                                    <span className="text-[10px] text-white/40 font-medium hidden sm:inline">
                                                        • {ev.roundTitle}
                                                    </span>
                                                </div>
                                                {ev.feedback && (
                                                    <p className="mt-1 text-[11px] text-white/50 italic line-clamp-1">
                                                        &ldquo;{ev.feedback}&rdquo;
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                                <div className="text-right">
                                                    <div className="text-xs font-mono font-black text-emerald-400">
                                                        {ev.totalScore !== null ? `${ev.totalScore} pts` : 'Submitted'}
                                                    </div>
                                                    {ev.submittedAt && (
                                                        <div className="text-[9px] text-white/30 font-medium">
                                                            {new Date(ev.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                                    <CheckCircle2 size={12} />
                                                    <span>Recorded</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="evaluate"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        {/* Header & Navigation */}
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                            <button
                                onClick={returnToTeamLookup}
                                className="flex items-center gap-2 self-start text-white/40 hover:text-white transition-colors group"
                            >
                                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-widest">Back to Projects</span>
                            </button>
                            <div className="flex max-w-full flex-wrap items-center gap-2 px-3 py-2 bg-slate-900/10 border border-slate-800/20 rounded-xl">
                                <Target size={16} className="text-slate-900" />
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                    {evaluationRound.title} Evaluation Active
                                </span>
                            </div>
                        </div>

                        {/* Project Information Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[3rem] p-4 sm:p-6 md:p-12 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFEE00]/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />

                            <div className="relative z-10 space-y-8 md:space-y-10">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#FFEE00] to-[#FFB800] p-[2px] shrink-0">
                                        <div className="w-full h-full bg-black rounded-[calc(1.5rem-2px)] flex items-center justify-center text-2xl md:text-3xl font-black italic text-[#FFEE00]">
                                            {activeProject.name[0]}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-tight break-words">
                                            {activeProject.name}
                                        </h2>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                            <span className="text-[9px] md:text-xs font-bold text-[#FFEE00] uppercase tracking-widest bg-[#FFEE00]/10 px-2 py-0.5 rounded border border-[#FFEE00]/20">ID: {activeProject.teamId}</span>
                                            {activeProject.track && <span className="text-[9px] md:text-xs font-bold text-white/45 uppercase tracking-widest">{activeProject.track}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users size={16} className="text-slate-900" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Participants</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
                                            {activeProject.members?.map((member, i) => {
                                                const displayName = typeof member === 'string' ? member : member.fullName;
                                                const isCaptain = displayName === activeProject.captain;

                                                return (
                                                    <div key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                                                        <UserCircle2 size={12} className="text-white/20 shrink-0" />
                                                        <span className="text-[10px] md:text-xs font-bold text-white/80 truncate">{displayName}</span>
                                                        {isCaptain && (
                                                            <span className="text-[7px] font-black bg-[#FFEE00] text-black px-1 rounded shrink-0">C</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Info size={16} className="text-blue-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Project Title</span>
                                        </div>
                                        <p className="text-xl text-white/90 leading-relaxed italic font-medium">
                                            &ldquo;{activeProject.problemStatement}&rdquo;
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 border-t border-white/10 pt-6 lg:grid-cols-2">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Proposed idea</h3>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/75">{activeProject.proposedIdea || 'No proposed idea submitted.'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Technology stack</h3>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {Object.entries(activeProject.techStack || {}).flatMap(([category, items]) =>
                                                (items || []).map(item => <span key={`${category}-${item}`} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/70">{category}: {item}</span>)
                                            )}
                                            {!Object.values(activeProject.techStack || {}).some(items => items?.length) && <span className="text-sm text-white/35">No technology stack submitted.</span>}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Project links</h3>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {[
                                                ['Source code', activeProject.submission?.github],
                                                ['Presentation', activeProject.submission?.presentation],
                                                ['Demo', activeProject.submission?.demo],
                                                ['Live product', activeProject.submission?.deployment]
                                            ].map(([label, value]) => {
                                                const href = safeHttpUrl(value);
                                                return href ? <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#FFEE00] hover:bg-white/10">{label}</a> : null;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Evaluation Form */}
                        <div className="bg-[#0B0114] border border-white/10 rounded-2xl md:rounded-[3.5rem] p-4 sm:p-5 md:p-14 space-y-8 md:space-y-16 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800/10 to-transparent -translate-y-1/2" />

                            <div className="relative z-10 space-y-8 md:space-y-12">
                                {evaluationRound.criteria.map((criterion, i) => (
                                    <div key={criterion.id} className="group">
                                        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                                            {/* Number badge */}
                                            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-base md:text-2xl font-black text-white/20 group-hover:text-slate-900/40 group-hover:border-slate-800/20 transition-all shrink-0">
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-3">
                                                    <div>
                                                        <h4 className="text-lg md:text-2xl font-black italic uppercase tracking-tight text-white mb-1">{criterion.label}</h4>
                                                        <p className="text-white/40 text-xs md:text-sm leading-relaxed">{criterion.desc}</p>
                                                    </div>
                                                    {/* Score Picker — ten scores in a compact, touch-friendly grid */}
                                                    <div className="grid w-full grid-cols-5 gap-1.5">
                                                        {Array.from({ length: 10 }, (_, index) => index + 1).map(v => {
                                                            const selected = currentScores[criterion.id] === v;
                                                            const selectedColor = v <= 3
                                                                ? "bg-slate-900/20 border-slate-800 text-slate-900"
                                                                : v <= 6
                                                                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                                                                    : v <= 8
                                                                        ? "bg-blue-500/20 border-blue-500 text-blue-300"
                                                                        : "bg-green-500/20 border-green-500 text-green-300";
                                                            const hoverColor = v <= 3
                                                                ? "hover:bg-slate-800/20 hover:border-slate-800/40 hover:text-slate-900"
                                                                : v <= 6
                                                                    ? "hover:bg-yellow-500/20 hover:border-yellow-500/40 hover:text-yellow-300"
                                                                    : v <= 8
                                                                        ? "hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-300"
                                                                        : "hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-300";
                                                            const label = v === 1 ? "Poor" : v === 5 ? "Fair" : v === 8 ? "Good" : v === 10 ? "Best" : "";
                                                            return (
                                                                <button
                                                                    key={v}
                                                                    type="button"
                                                                    aria-label={`Score ${v} out of 10${label ? `, ${label}` : ""}`}
                                                                    aria-pressed={selected}
                                                                    onClick={() => handleScoreChange(criterion.id, v)}
                                                                    className={`flex min-h-12 flex-col items-center justify-center rounded-xl border-2 px-1 py-2 transition-all active:scale-95 ${selected
                                                                        ? selectedColor
                                                                        : `bg-white/5 border-white/10 text-white/30 ${hoverColor}`
                                                                        }`}
                                                                >
                                                                    <span className="text-base md:text-xl font-black leading-none">{v}</span>
                                                                    {label && <span className="mt-0.5 text-[7px] font-bold uppercase leading-none tracking-wide">{label}</span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {i < evaluationRound.criteria.length - 1 && (
                                            <div className="mt-6 md:mt-12 h-[1px] w-full bg-white/5" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Feedback Area */}
                            <div className="pt-8 md:pt-16 border-t border-white/10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 rounded-xl bg-slate-900/10 border border-slate-800/20">
                                        <MessageSquare size={20} className="text-slate-900" />
                                    </div>
                                    <h4 className="text-xl sm:text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Additional Feedback <span className="text-slate-900 text-xs sm:text-sm normal-case font-bold ml-1 sm:ml-2">(Required)</span></h4>
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add constructive comments here..."
                                    className="w-full h-32 md:h-48 bg-white/5 border-2 border-white/10 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 text-sm md:text-xl font-medium text-white placeholder:text-white/10 focus:outline-none focus:border-slate-800/50 transition-all resize-none shadow-inner"
                                />
                                <p aria-live="polite" className={`mt-3 text-xs ${draftStatus === 'error' ? 'text-rose-300' : 'text-white/45'}`}>
                                    {draftStatus === 'saving' ? 'Saving draft…' : draftStatus === 'saved' ? 'Draft saved' : draftStatus === 'error' ? 'Draft save failed. Keep this page open and retry before submitting.' : ''}
                                </p>
                            </div>

                            {/* Action Console */}
                            <div className="pt-6 md:pt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 md:gap-8">
                                <button
                                    onClick={returnToTeamLookup}
                                    className="w-full sm:w-auto h-12 md:h-16 px-6 sm:px-10 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleScoreSubmit}
                                    disabled={isSubmitting || evaluationRound.criteria.some(criterion => !currentScores[criterion.id]) || !comment.trim()}
                                    className="w-full sm:w-auto h-12 md:h-16 px-6 sm:px-12 md:px-16 bg-[#FFEE00] hover:bg-[#E6D600] text-black font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] rounded-xl md:rounded-2xl transition-all shadow-[0_4px_0_#9333ea] md:shadow-[0_6px_0_#9333ea] active:shadow-none active:translate-y-1 disabled:opacity-30 disabled:grayscale disabled:pointer-events-none group"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {isSubmitting ? 'Submitting…' : 'Submit Evaluation'} <CheckCircle2 size={18} />
                                    </span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout >
    );
}
