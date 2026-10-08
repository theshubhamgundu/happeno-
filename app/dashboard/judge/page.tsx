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
    CheckCircle2,
    Wifi,
    WifiOff,
    RefreshCw,
    CloudUpload,
    ExternalLink
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Project } from "@/context/HackathonContext";
import { useAuth } from "@/context/AuthContext";
import type { JudgingRound } from "@/lib/judging-rounds";

interface OfflineQueueItem {
    id: string; // evaluationId
    teamId: string;
    teamName: string;
    roundId: string;
    roundTitle: string;
    criteriaScores: Record<string, number>;
    feedback: string;
    totalScore: number;
    queuedAt: number;
}

export default function JudgeDashboard() {
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
    const [alreadyEvaluatedInfo, setAlreadyEvaluatedInfo] = useState<{ teamId: string; teamName: string; roundTitle: string; score: number | null } | null>(null);

    // Offline resilience & mobile sync state
    const [isOnline, setIsOnline] = useState(true);
    const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
    const [isSyncingQueue, setIsSyncingQueue] = useState(false);
    const [offlineSubmitNotice, setOfflineSubmitNotice] = useState<{
        teamId: string;
        teamName: string;
        totalScore: number;
        message: string;
    } | null>(null);

    const currentJudge = user?.role === 'judge' && user.id
        ? { id: user.id, generatedId: user.id, name: user.name || user.id }
        : null;

    const draftStorageKey = useCallback((tId: string, rId: string) => `tricity_judge_draft_${tId}_${rId}`, []);

    const loadOfflineQueue = useCallback(() => {
        if (typeof window === 'undefined') return [];
        try {
            const raw = localStorage.getItem('tricity_judge_offline_queue');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setOfflineQueue(parsed);
                    return parsed as OfflineQueueItem[];
                }
            }
        } catch (e) {
            console.warn('Failed to parse offline queue:', e);
        }
        return [];
    }, []);

    const addQueueItem = useCallback((item: OfflineQueueItem) => {
        setOfflineQueue(prev => {
            const updated = [...prev.filter(q => q.id !== item.id), item];
            if (typeof window !== 'undefined') {
                localStorage.setItem('tricity_judge_offline_queue', JSON.stringify(updated));
            }
            return updated;
        });
    }, []);

    const removeQueueItem = useCallback((evalId: string) => {
        setOfflineQueue(prev => {
            const updated = prev.filter(q => q.id !== evalId);
            if (typeof window !== 'undefined') {
                localStorage.setItem('tricity_judge_offline_queue', JSON.stringify(updated));
            }
            return updated;
        });
    }, []);

    // Load judge's evaluation history
    // Background Queue Synchronizer: drains offline submissions when network is restored
    const processOfflineQueue = useCallback(async () => {
        if (typeof window === 'undefined') return;
        const currentQueue = loadOfflineQueue();
        if (!currentQueue || currentQueue.length === 0) return;

        setIsSyncingQueue(true);
        let remaining = [...currentQueue];
        let syncedCount = 0;

        for (const item of currentQueue) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                const response = await fetch('/api/judging/evaluations', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        evaluationId: item.id,
                        criteriaScores: item.criteriaScores,
                        feedback: item.feedback
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const result = await response.json();
                if (response.ok && (result.success || result.alreadySubmitted)) {
                    remaining = remaining.filter(q => q.id !== item.id);
                    localStorage.setItem('tricity_judge_offline_queue', JSON.stringify(remaining));
                    localStorage.removeItem(draftStorageKey(item.teamId, item.roundId));
                    syncedCount++;
                }
            } catch (err) {
                console.warn(`Background sync failed for ${item.teamId}:`, err);
            }
        }

        setOfflineQueue(remaining);
        setIsSyncingQueue(false);

        if (syncedCount > 0) {
            toast.success(`Synced ${syncedCount} evaluation${syncedCount === 1 ? '' : 's'} from your phone to the server!`);
        }
    }, [loadOfflineQueue, draftStorageKey]);

    // Network connection listener & auto-sync heartbeat
    useEffect(() => {
        if (typeof window === 'undefined') return;
        setIsOnline(navigator.onLine);
        loadOfflineQueue();

        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Internet reconnected. Syncing saved evaluations...');
            void processOfflineQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('Internet connection lost. Offline protection active on your phone.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Auto-sync polling every 20 seconds if items are queued
        const syncInterval = setInterval(() => {
            if (navigator.onLine) {
                void processOfflineQueue();
            }
        }, 20000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(syncInterval);
        };
    }, [loadOfflineQueue, processOfflineQueue]);

    const returnToTeamLookup = () => {
        setActiveProject(null);
        setEvaluationRound(null);
        setEvaluationId(null);
        setDraftStatus('idle');
        setCurrentScores({});
        setComment('');
        setOfflineSubmitNotice(null);
    };

    const handleScoreChange = (criterionId: string, value: number) => {
        setCurrentScores(previous => ({ ...previous, [criterionId]: value }));
    };

    const handleStartEvaluation = async (targetTeamId?: string) => {
        const rawInput = (targetTeamId || teamIdInput).trim();
        const selectedId = targetTeamId ? targetTeamId : (rawInput.toUpperCase().startsWith('TRI') ? rawInput : `TRI${rawInput}`);
        if (targetTeamId) setTeamIdInput(targetTeamId.replace(/^TRI/i, ''));

        if (!currentJudge) {
            toast.error('Evaluator profile not found. Sign in again and retry.');
            return;
        }
        if (!selectedId) {
            toast.error('Please enter a team ID.');
            return;
        }

        setAlreadyEvaluatedInfo(null);
        setIsStarting(true);
        try {
            const response = await fetch('/api/judging/evaluations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: selectedId })
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
        if (!evaluationId || !evaluationRound || !activeProject || !activeProject.teamId) return;

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
        if (!activeProject || !activeProject.teamId || !evaluationRound || !evaluationId || !currentJudge) return;
        const values = evaluationRound.criteria.map(criterion => currentScores[criterion.id]);
        if (values.some(value => typeof value !== 'number' || value < 1 || value > 10) || !comment.trim()) {
            toast.error("Score every criterion from 1 to 10 and add feedback before submitting.");
            return;
        }

        const totalScore = evaluationRound.criteria.reduce((total, criterion) => total + Number(currentScores[criterion.id]), 0);
        setIsSubmitting(true);
        setOfflineSubmitNotice(null);

        // Pre-save into offline queue item in case of network drop or mobile browser crash
        const queueItem: OfflineQueueItem = {
            id: evaluationId,
            teamId: activeProject.teamId,
            teamName: activeProject.name,
            roundId: evaluationRound.id,
            roundTitle: evaluationRound.title,
            criteriaScores: currentScores,
            feedback: comment,
            totalScore,
            queuedAt: Date.now()
        };

        try {
            // 12-second timeout to prevent mobile browsers from hanging indefinitely in dead zones
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const response = await fetch('/api/judging/evaluations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evaluationId, criteriaScores: currentScores, feedback: comment }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Evaluation was not saved.');

            // Success: clear local draft and remove from queue
            if (typeof window !== 'undefined') {
                localStorage.removeItem(draftStorageKey(activeProject.teamId, evaluationRound.id));
                removeQueueItem(evaluationId);
            }

            toast.success(`Evaluation submitted successfully: ${activeProject.name}`);
            setActiveProject(null);
            setEvaluationRound(null);
            setEvaluationId(null);
            setCurrentScores({});
            setComment("");
            setDraftStatus('idle');
            setTeamIdInput('');
        } catch (error: unknown) {
            console.warn('Evaluation submit encountered network failure:', error);
            // Securely store in phone's persistent offline queue
            addQueueItem(queueItem);

            const isOfflineOrTimeout = typeof navigator !== 'undefined' && (!navigator.onLine || (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('fetch'))));
            if (isOfflineOrTimeout) {
                setOfflineSubmitNotice({
                    teamId: activeProject.teamId,
                    teamName: activeProject.name,
                    totalScore,
                    message: 'Internet connection is weak or offline. Your scores and feedback are safely locked on this phone!'
                });
                toast.warning(`Network weak/offline: Scores for ${activeProject.name} are safely saved on your phone.`);
            } else {
                toast.error(error instanceof Error ? error.message : 'Submission failed. Your draft remains safely backed up on this device.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const dashboardTitle = activeProject
        ? "Project Evaluation"
        : "Evaluator Workspace";

    return (
        <DashboardLayout type="judge" title={dashboardTitle}>
            <AnimatePresence mode="wait">
                {!activeProject || !evaluationRound ? (
                    <motion.div
                        key="team-lookup"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mx-auto max-w-xl space-y-6 pt-4 sm:pt-6"
                    >
                        {/* Status bar: Evaluator name & sync status */}
                        <div className="flex items-center justify-between gap-3 px-1">
                            {currentJudge && (
                                <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <UserCircle2 size={16} className="text-teal-600" />
                                    <span>Evaluator: <strong className="text-slate-800">{currentJudge.name}</strong></span>
                                </div>
                            )}
                            <div className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                                !isOnline
                                    ? "border-amber-300 bg-amber-50 text-amber-800"
                                    : offlineQueue.length > 0
                                    ? "border-amber-300 bg-amber-50 text-amber-800"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                            }`}>
                                {!isOnline ? (
                                    <>
                                        <WifiOff size={13} className="animate-pulse" />
                                        <span>Offline Mode</span>
                                    </>
                                ) : offlineQueue.length > 0 ? (
                                    <>
                                        <CloudUpload size={13} className="animate-bounce" />
                                        <span>{offlineQueue.length} Queued to Sync</span>
                                    </>
                                ) : (
                                    <>
                                        <Wifi size={13} />
                                        <span>Online & Synced</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Offline Queue Pending Sync Banner */}
                        {offlineQueue.length > 0 && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                                        <CloudUpload size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                            {offlineQueue.length} Evaluation{offlineQueue.length === 1 ? '' : 's'} Stored Locally on this Phone
                                        </h4>
                                        <p className="text-[11px] text-amber-800/80">
                                            Saved safely during poor connection. They will auto-upload the instant network stabilizes.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => void processOfflineQueue()}
                                    disabled={isSyncingQueue || !isOnline}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-amber-300 disabled:opacity-50 transition-colors shrink-0 shadow-sm"
                                >
                                    <RefreshCw size={13} className={isSyncingQueue ? "animate-spin" : ""} />
                                    {isSyncingQueue ? "Syncing..." : "Sync Now"}
                                </button>
                            </div>
                        )}

                        {/* Already Evaluated Notice Banner */}
                        {alreadyEvaluatedInfo && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900">
                                                Team Already Evaluated & Recorded
                                            </h3>
                                            <p className="mt-1 text-xs text-emerald-800">
                                                <span className="font-mono font-bold text-slate-900">{alreadyEvaluatedInfo.teamId}</span> ({alreadyEvaluatedInfo.teamName}) has already been evaluated for <span className="font-bold text-slate-900">{alreadyEvaluatedInfo.roundTitle}</span>.
                                            </p>
                                            {alreadyEvaluatedInfo.score !== null && (
                                                <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1 text-xs font-mono font-bold text-emerald-900">
                                                    Submitted Score: {alreadyEvaluatedInfo.score} pts
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAlreadyEvaluatedInfo(null)}
                                        className="text-emerald-700 hover:text-emerald-900 text-xs font-bold uppercase"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Direct Team ID Input Form */}
                        <form
                            onSubmit={event => { event.preventDefault(); void handleStartEvaluation(); }}
                            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6"
                        >
                            <div className="space-y-1.5">
                                <h2 className="text-2xl sm:text-3xl font-black uppercase italic text-slate-900 tracking-tight">
                                    Start Evaluation
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                                    Enter the assigned Team ID to open the scoring rubric and project details.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex h-14 w-full items-center rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/10 transition-all overflow-hidden shadow-inner">
                                    <div className="flex h-full items-center bg-slate-200/60 px-5 border-r border-slate-200 text-slate-700 font-mono text-lg sm:text-xl font-black tracking-widest">
                                        TRI
                                    </div>
                                    <input
                                        autoFocus
                                        autoComplete="off"
                                        value={teamIdInput.replace(/^TRI/i, '')}
                                        onChange={event => {
                                            const val = event.target.value.toUpperCase().replace(/^TRI/i, '');
                                            setTeamIdInput(val);
                                        }}
                                        placeholder="26058"
                                        aria-label="Team ID"
                                        className="h-full w-full bg-transparent px-4 font-mono text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-900 placeholder:text-slate-300 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isStarting || !teamIdInput.trim()}
                                    className="h-14 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 text-sm font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-teal-700 active:scale-[0.99] transition-all shadow-sm"
                                >
                                    <ClipboardCheck size={18} />
                                    {isStarting ? 'Loading Project Details...' : 'Start Evaluation'}
                                </button>
                            </div>
                        </form>
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
                                className="flex items-center gap-2 self-start text-slate-500 hover:text-slate-900 transition-colors group"
                            >
                                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs font-bold uppercase tracking-wider">Back to Projects</span>
                            </button>
                            <div className="flex max-w-full flex-wrap items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl">
                                <Target size={15} className="text-teal-700" />
                                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                                    {evaluationRound.title} Evaluation Active
                                </span>
                            </div>
                        </div>

                        {/* Project Information Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-sm">
                            <div className="relative z-10 space-y-6 md:space-y-8">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-5 text-center md:text-left">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl font-black text-teal-700 shrink-0 shadow-sm">
                                        {activeProject.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black italic uppercase tracking-tight text-slate-900 leading-tight break-words">
                                            {activeProject.name}
                                        </h2>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                            <span className="text-[10px] md:text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">ID: {activeProject.teamId}</span>
                                            {activeProject.track && <span className="text-[10px] md:text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">{activeProject.track}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Users size={15} className="text-teal-700" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Participants</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
                                            {activeProject.members?.map((member, i) => {
                                                const displayName = typeof member === 'string' ? member : member.fullName;
                                                const isCaptain = displayName === activeProject.captain;

                                                return (
                                                    <div key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                                                        <UserCircle2 size={13} className="text-slate-400 shrink-0" />
                                                        <span className="text-xs font-semibold text-slate-700 truncate">{displayName}</span>
                                                        {isCaptain && (
                                                            <span className="text-[8px] font-bold bg-teal-600 text-white px-1.5 py-0.2 rounded shrink-0">C</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Info size={15} className="text-teal-700" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Title</span>
                                        </div>
                                        <p className="text-base sm:text-lg text-slate-800 leading-relaxed italic font-semibold">
                                            &ldquo;{activeProject.problemStatement}&rdquo;
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 lg:grid-cols-2">
                                    <div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proposed idea</h3>
                                        <p className="mt-1.5 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-600">{activeProject.proposedIdea || 'No proposed idea submitted.'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Technology stack</h3>
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {Object.entries(activeProject.techStack || {}).flatMap(([category, items]) =>
                                                (items || []).map(item => <span key={`${category}-${item}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-700">{category}: {item}</span>)
                                            )}
                                            {!Object.values(activeProject.techStack || {}).some(items => items?.length) && <span className="text-xs text-slate-400">No technology stack submitted.</span>}
                                        </div>
                                    </div>
                                    {activeProject.submission?.projectZip && (
                                        <div className="border-t border-slate-100 pt-6">
                                            <a
                                                href={activeProject.submission.projectZip}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-100"
                                            >
                                                <ExternalLink size={16} />
                                                Open project ZIP in Google Drive
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Evaluation Form */}
                        <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 space-y-8 md:space-y-12 shadow-sm">
                            <div className="space-y-8 md:space-y-10">
                                {evaluationRound.criteria.map((criterion, i) => (
                                    <div key={criterion.id} className="group">
                                        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                                            {/* Number badge */}
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm md:text-base font-bold text-slate-400 group-hover:text-teal-700 group-hover:border-teal-200 transition-all shrink-0">
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-3">
                                                    <div>
                                                        <h4 className="text-base md:text-xl font-bold italic uppercase tracking-tight text-slate-900 mb-1">{criterion.label}</h4>
                                                        <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{criterion.desc}</p>
                                                    </div>
                                                    {/* Score Picker — ten scores in a compact, touch-friendly grid */}
                                                    <div className="grid w-full grid-cols-5 gap-1.5">
                                                        {Array.from({ length: 10 }, (_, index) => index + 1).map(v => {
                                                            const selected = currentScores[criterion.id] === v;
                                                            const selectedColor = v <= 3
                                                                ? "bg-rose-50 border-rose-400 text-rose-700"
                                                                : v <= 6
                                                                    ? "bg-amber-50 border-amber-400 text-amber-700"
                                                                    : v <= 8
                                                                        ? "bg-teal-50 border-teal-500 text-teal-700"
                                                                        : "bg-emerald-50 border-emerald-500 text-emerald-700";
                                                            const hoverColor = v <= 3
                                                                ? "hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700"
                                                                : v <= 6
                                                                    ? "hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
                                                                    : v <= 8
                                                                        ? "hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700"
                                                                        : "hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700";
                                                            const label = v === 1 ? "Poor" : v === 5 ? "Fair" : v === 8 ? "Good" : v === 10 ? "Best" : "";
                                                            return (
                                                                <button
                                                                    key={v}
                                                                    type="button"
                                                                    aria-label={`Score ${v} out of 10${label ? `, ${label}` : ""}`}
                                                                    aria-pressed={selected}
                                                                    onClick={() => handleScoreChange(criterion.id, v)}
                                                                    className={`flex min-h-11 flex-col items-center justify-center rounded-xl border-2 px-1 py-1.5 transition-all active:scale-95 ${selected
                                                                        ? selectedColor
                                                                        : `bg-slate-50 border-slate-200 text-slate-600 ${hoverColor}`
                                                                        }`}
                                                                >
                                                                    <span className="text-sm md:text-lg font-bold leading-none">{v}</span>
                                                                    {label && <span className="mt-0.5 text-[8px] font-bold uppercase leading-none tracking-wide">{label}</span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {i < evaluationRound.criteria.length - 1 && (
                                            <div className="mt-6 md:mt-8 h-[1px] w-full bg-slate-100" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Feedback Area */}
                            <div className="pt-6 md:pt-10 border-t border-slate-100">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                                        <MessageSquare size={16} />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-slate-900">Additional Feedback <span className="text-teal-700 text-xs normal-case font-bold ml-1">(Required)</span></h4>
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add constructive comments here..."
                                    className="w-full h-28 md:h-36 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 md:p-5 text-sm md:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all resize-none shadow-sm"
                                />
                                <p aria-live="polite" className={`mt-2 text-xs ${draftStatus === 'error' ? 'text-rose-600' : 'text-slate-400'}`}>
                                    {draftStatus === 'saving' ? 'Saving draft…' : draftStatus === 'saved' ? 'Draft saved' : draftStatus === 'error' ? 'Draft save failed. Keep this page open and retry before submitting.' : ''}
                                </p>
                            </div>

                            {/* Offline / Weak Connection Warning Banner */}
                            {offlineSubmitNotice && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 space-y-3 shadow-sm"
                                >
                                    <div className="flex items-start gap-3">
                                        <WifiOff className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-900">
                                                Weak / Offline Connection — Scores Safely Saved!
                                            </h4>
                                            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                                                Your evaluation for <strong className="text-slate-900 font-bold">{offlineSubmitNotice.teamName}</strong> (Score: {offlineSubmitNotice.totalScore} pts) is safely preserved in this phone&apos;s memory. You won&apos;t lose anything even if you close the app.
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleScoreSubmit()}
                                                    disabled={isSubmitting}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-amber-300 transition-colors shadow-sm"
                                                >
                                                    <RefreshCw size={13} className={isSubmitting ? "animate-spin" : ""} /> Retry Upload Now
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        toast.success(`Saved ${activeProject.name} to local queue. Will sync automatically.`);
                                                        setActiveProject(null);
                                                        setEvaluationRound(null);
                                                        setEvaluationId(null);
                                                        setCurrentScores({});
                                                        setComment("");
                                                        setDraftStatus('idle');
                                                        setTeamIdInput('');
                                                        setOfflineSubmitNotice(null);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                                                >
                                                    <ClipboardCheck size={13} /> Queue & Score Next Team
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Action Console */}
                            <div className="pt-4 md:pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
                                <button
                                    onClick={returnToTeamLookup}
                                    className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleScoreSubmit}
                                    disabled={isSubmitting || evaluationRound.criteria.some(criterion => !currentScores[criterion.id]) || !comment.trim()}
                                    className="w-full sm:w-auto h-11 px-8 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed group"
                                >
                                    <span className="flex items-center justify-center gap-2 text-xs">
                                        {isSubmitting ? 'Submitting…' : 'Submit Evaluation'} <CheckCircle2 size={16} />
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
