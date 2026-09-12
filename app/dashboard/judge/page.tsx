"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    ClipboardCheck,
    Search,
    ChevronRight,
    Star,
    MessageSquare,
    Users,
    X,
    Info,
    Lock,
    Clock,
    Target,
    ArrowLeft,
    UserCircle2,
    CheckCircle2,
    Github,
    Presentation,
    PlaySquare,
    Globe,
    ExternalLink,
    XCircle
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useHackathon, Project } from "@/context/HackathonContext";
import { useAuth } from "@/context/AuthContext";
import { STATIC_ROUNDS_CONFIG } from "@/lib/constants";

export default function JudgeDashboard() {
    const { hackathonStartDate, projects, updateProjectScore, judges, isRoundLockEnabled, roundConfigs } = useHackathon();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [evaluationRound, setEvaluationRound] = useState<any>(null);
    const [comment, setComment] = useState("");
    const [currentScores, setCurrentScores] = useState<Record<string, number>>({});

    const currentJudge = useMemo(() => {
        return judges.find(j => j.id === user?.id || j.generatedId === user?.id);
    }, [judges, user]);

    const judgingRounds = useMemo(() => {
        return roundConfigs.map((round: any) => {
            const date = new Date(hackathonStartDate);
            date.setDate(date.getDate() + round.dayOffset);
            date.setHours(round.hour, round.minute || 0, 0, 0);
            return {
                ...round,
                startTime: date
            };
        });
    }, [hackathonStartDate, roundConfigs]);

    const currentTime = new Date();



    // 1. All registered projects are available for judging.
    const activeProjects = useMemo(() => {
        return projects;
    }, [projects]);

    // 2. Calculate Stats
    const totalAvailable = activeProjects.length;

    const completedCount = useMemo(() => {
        if (!currentJudge) return 0;
        return activeProjects.filter(p => {
            // A project is considered completed for THIS judge if for every round:
            // 1. This judge has scored it
            // 2. OR 2 other judges have already scored it (capacity full)
            return judgingRounds.every(r => {
                const scores = p.roundScores?.[r.id] || {};
                const judgeAlreadyScored = scores[currentJudge.generatedId] !== undefined;
                const totalScores = Object.keys(scores).length;
                return judgeAlreadyScored || totalScores >= 1;
            });
        }).length;
    }, [activeProjects, judgingRounds, currentJudge]);

    const pendingCount = totalAvailable - completedCount;

    // 3. Filter for Display (Search)
    const displayProjects = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return activeProjects;

        return activeProjects.filter(p => {
            const matchesName = (p.name || "").toLowerCase().includes(query);
            const matchesTeam = (p.team || "").toLowerCase().includes(query);
            const matchesTrack = (p.track || "").toLowerCase().includes(query);
            const matchesId = (p.teamId || "").toLowerCase().includes(query);
            const isNumeric = /^\d+$/.test(query);
            const matchesPrefixId = isNumeric && (p.teamId || "").toLowerCase().includes(`vh-${query}`);

            return matchesName || matchesTeam || matchesTrack || matchesId || matchesPrefixId;
        });
    }, [activeProjects, searchQuery]);

    const handleEvaluateClick = (project: Project) => {
        if (!currentJudge) {
            toast.error("Judge profile not found");
            return;
        }

        // Find the first round that needs judging:
        // Needs judging if: I haven't scored it AND it has < 2 scores total
        const nextRound = judgingRounds.find(r => {
            const scores = project.roundScores?.[r.id] || {};
            const judgeAlreadyScored = scores[currentJudge.generatedId] !== undefined;
            const totalScores = Object.keys(scores).length;
            return !judgeAlreadyScored && totalScores < 1;
        });

        if (!nextRound) {
            toast.info("All rounds for this entry already have maximum evaluations.");
            return;
        }

        if (isRoundLockEnabled && currentTime < nextRound.startTime) {
            toast.error(`${nextRound.title} is locked. It will open at ${nextRound.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            return;
        }

        setActiveProject(project);
        setEvaluationRound(nextRound);
        setCurrentScores({});
        setComment("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleScoreChange = (criterionId: string, value: number) => {
        setCurrentScores(prev => ({
            ...prev,
            [criterionId]: value
        }));
    };

    const handleScoreSubmit = () => {
        if (!activeProject || !evaluationRound || !currentJudge) return;
        const values = Object.values(currentScores);
        const total = values.reduce((a, b) => a + b, 0);
        const average = total / evaluationRound.criteria.length;

        // Final check for 2-judge limit before updating
        const existingScores = activeProject.roundScores?.[evaluationRound.id] || {};
        const isSelfUpdate = existingScores[currentJudge.generatedId] !== undefined;
        if (!isSelfUpdate && Object.keys(existingScores).length >= 1) {
            toast.error("This entry already has an evaluation for this round.");
            setActiveProject(null);
            return;
        }

        updateProjectScore(
            activeProject.id,
            evaluationRound.id,
            currentJudge.generatedId,
            Number(total.toFixed(1)),
            comment,
            currentScores
        );
        toast.success(`Evaluation submitted: ${activeProject.name}`);

        setActiveProject(null);
        setEvaluationRound(null);
        setCurrentScores({});
        setComment("");
    };

    const dashboardTitle = activeProject
        ? "Project Evaluation"
        : currentJudge
            ? `Judge: ${currentJudge.name}`
            : "Judge Dashboard";


    return (
        <DashboardLayout type="judge" title={dashboardTitle}>
            <AnimatePresence mode="wait">
                {!activeProject ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {/* Profile Summary — compact identity strip */}
                        {currentJudge && (
                            <div className="mb-6 flex items-center gap-3 px-4 py-2.5 bg-white/5 border border-purple-500/15 rounded-2xl backdrop-blur-md">
                                {/* Live dot */}
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                </span>
                                {/* Name */}
                                <span className="font-black italic uppercase tracking-tighter text-white text-sm leading-none truncate">
                                    {currentJudge.name}
                                </span>
                                {/* Specialization badge */}
                                <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/20 text-[8px] font-black text-purple-300 uppercase tracking-widest whitespace-nowrap">
                                    {currentJudge.specialization || "General"}
                                </span>
                                {/* Spacer */}
                                <div className="flex-1" />
                                {/* ID chip */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFEE00]/10 border border-[#FFEE00]/25 rounded-lg">
                                    <div className="w-1 h-1 rounded-full bg-[#FFEE00] animate-pulse" />
                                    <code className="text-[11px] font-mono font-black text-[#FFEE00] tracking-widest whitespace-nowrap">
                                        {currentJudge.generatedId}
                                    </code>
                                </div>
                            </div>
                        )}


                        {/* Stats Grid — always 3 cols, compact on mobile */}
                        <div className="grid grid-cols-3 gap-2 md:gap-6 mb-8">
                            {/* Card 1: Active */}
                            <div className="bg-[#FFEE00] border-2 md:border-4 border-black rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 flex flex-col justify-between shadow-[4px_4px_0_#9333ea] md:shadow-[8px_8px_0_#9333ea] relative group">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Users size={12} className="text-black md:hidden" />
                                        <Users size={20} className="text-black hidden md:block" />
                                        <span className="text-[8px] md:text-[10px] font-black text-black/50 uppercase tracking-widest">Live</span>
                                    </div>
                                    <h3 className="text-3xl md:text-5xl font-black italic text-black leading-none">{totalAvailable}</h3>
                                    <span className="text-[8px] md:text-sm font-bold text-black/60 mt-1 block uppercase">Active</span>
                                </div>
                            </div>

                            {/* Card 2: Completed */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 flex flex-col justify-center backdrop-blur-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 md:w-32 h-16 md:h-32 bg-green-500/10 rounded-full blur-[30px] md:blur-[50px] translate-x-1/2 -translate-y-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-1 mb-1 md:mb-4">
                                        <CheckCircle2 className="text-green-400" size={12} />
                                        <span className="text-[8px] md:text-[10px] font-bold text-white/40 uppercase tracking-widest">Done</span>
                                    </div>
                                    <div className="text-3xl md:text-5xl font-black italic text-white leading-none">{completedCount}</div>
                                    <div className="text-[8px] md:text-[10px] font-bold text-white/30 uppercase mt-1 md:mt-2">Evaluated</div>
                                </div>
                            </div>

                            {/* Card 3: Pending */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 flex flex-col justify-center backdrop-blur-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 md:w-32 h-16 md:h-32 bg-orange-500/10 rounded-full blur-[30px] md:blur-[50px] translate-x-1/2 -translate-y-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-1 mb-1 md:mb-4">
                                        <Clock className="text-orange-400" size={12} />
                                        <span className="text-[8px] md:text-[10px] font-bold text-white/40 uppercase tracking-widest">Todo</span>
                                    </div>
                                    <div className="text-3xl md:text-5xl font-black italic text-white leading-none">{pendingCount}</div>
                                    <div className="text-[8px] md:text-[10px] font-bold text-white/30 uppercase mt-1 md:mt-2">Pending</div>
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="mb-8 relative max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="text-white/30" size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by Project ID or Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#0B0114] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20 uppercase tracking-wide"
                            />
                        </div>

                        {/* Projects Grid */}
                        {displayProjects.length === 0 ? (
                            <div className="bg-black/20 border-2 border-dashed border-white/10 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
                                <Search size={48} className="text-white/20 mb-6" />
                                <h3 className="text-2xl font-black uppercase italic text-white/40">No projects found</h3>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {displayProjects.map((project) => {
                                    const nextRound = judgingRounds.find(r => {
                                        const scores = project.roundScores?.[r.id] || {};
                                        const judgeAlreadyScored = scores[currentJudge?.generatedId || ""] !== undefined;
                                        const totalScores = Object.keys(scores).length;
                                        return !judgeAlreadyScored && totalScores < 2;
                                    });
                                    const isFullyEvaluated = !nextRound;
                                    const currentRoundDisplay = nextRound || judgingRounds[judgingRounds.length - 1];

                                    return (
                                        <motion.div
                                            layoutId={`project-${project.id}`}
                                            key={project.id}
                                            className="group bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-8 hover:bg-white/[0.08] transition-all duration-300 flex flex-col md:flex-row items-center gap-8 shadow-xl"
                                        >
                                            <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-[1.5rem] border border-white/10 flex items-center justify-center shrink-0">
                                                <span className="text-3xl font-black text-white/80 italic">{(project.name || "?")[0]}</span>
                                            </div>

                                            <div className="flex-grow text-center md:text-left min-w-0">
                                                {/* Title */}
                                                <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white leading-tight truncate">{project.name}</h3>
                                                {/* ID + Badge row — wraps cleanly */}
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mt-1.5 mb-2">
                                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-black uppercase tracking-wider text-white/40 whitespace-nowrap">{project.teamId}</span>
                                                    {nextRound && (
                                                        <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-[9px] font-black uppercase tracking-wider text-purple-400 whitespace-nowrap">
                                                            {nextRound.title}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5 truncate">
                                                    <Users size={11} /> {project.team}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                                                {isFullyEvaluated ? (
                                                    <div className="h-14 w-full md:w-auto px-8 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center md:justify-start gap-3">
                                                        <div className="flex flex-col items-center md:items-end">
                                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status</span>
                                                            <span className="text-sm font-black italic text-green-400 uppercase tracking-wide">Submitted</span>
                                                        </div>
                                                        <CheckCircle2 size={16} className="text-green-500" />
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEvaluateClick(project)}
                                                        disabled={isRoundLockEnabled && currentTime < currentRoundDisplay.startTime}
                                                        className={`w-full md:flex-none h-14 px-8 font-black uppercase tracking-widest italic rounded-2xl transition-all shadow-[0_4px_0_#9333ea] active:shadow-none active:translate-y-1 ${isRoundLockEnabled && currentTime < currentRoundDisplay.startTime
                                                            ? "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed shadow-none active:translate-y-0"
                                                            : "bg-[#FFEE00] hover:bg-[#E6D600] text-black"
                                                            }`}
                                                    >
                                                        {isRoundLockEnabled && currentTime < currentRoundDisplay.startTime ? (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <Lock size={14} /> Locked
                                                            </span>
                                                        ) : (
                                                            `Judge ${currentRoundDisplay.title}`
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
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
                        <div className="flex items-center justify-between mb-2">
                            <button
                                onClick={() => setActiveProject(null)}
                                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                            >
                                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-widest">Back to Projects</span>
                            </button>
                            <div className="flex items-center gap-3 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                <Target size={16} className="text-purple-400" />
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                                    {evaluationRound.title} Evaluation Active
                                </span>
                            </div>
                        </div>

                        {/* Project Information Card */}
                        <div className="bg-white/5 border border-white/10 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFEE00]/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />

                            <div className="relative z-10 space-y-8 md:space-y-10">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#FFEE00] to-[#FFB800] p-[2px] shrink-0">
                                        <div className="w-full h-full bg-black rounded-[calc(1.5rem-2px)] flex items-center justify-center text-2xl md:text-3xl font-black italic text-[#FFEE00]">
                                            {activeProject.name[0]}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none truncate md:whitespace-normal">
                                            {activeProject.name}
                                        </h2>
                                        <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                            <span className="text-[9px] md:text-xs font-bold text-[#FFEE00] uppercase tracking-widest bg-[#FFEE00]/10 px-2 py-0.5 rounded border border-[#FFEE00]/20">ID: {activeProject.teamId}</span>
                                            <span className="text-[9px] md:text-xs font-bold text-white/30 uppercase tracking-widest">Active Pool</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users size={16} className="text-purple-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Participants</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                                            {activeProject.members?.map((member: any, i: number) => {
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
                                            "{activeProject.problemStatement}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Evaluation Form */}
                        <div className="bg-[#0B0114] border border-white/10 rounded-[2rem] md:rounded-[3.5rem] p-5 md:p-14 space-y-8 md:space-y-16 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-y-1/2" />

                            <div className="relative z-10 space-y-12">
                                {evaluationRound.criteria.map((criterion: any, i: number) => (
                                    <div key={criterion.id} className="group">
                                        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                                            {/* Number badge */}
                                            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-base md:text-2xl font-black text-white/20 group-hover:text-purple-500/40 group-hover:border-purple-500/20 transition-all shrink-0">
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-3">
                                                    <div>
                                                        <h4 className="text-lg md:text-2xl font-black italic uppercase tracking-tight text-white mb-1">{criterion.label}</h4>
                                                        <p className="text-white/40 text-xs md:text-sm leading-relaxed">{criterion.desc}</p>
                                                    </div>
                                                    {/* Score Picker — segmented 5-button, no dropdown, no overflow */}
                                                    <div className="flex items-stretch gap-1.5 w-full">
                                                        {[
                                                            { v: 1, l: "Poor", color: "hover:bg-red-500/20    hover:border-red-500/40    hover:text-red-300" },
                                                            { v: 2, l: "Fair", color: "hover:bg-orange-500/20 hover:border-orange-500/40 hover:text-orange-300" },
                                                            { v: 3, l: "Avg", color: "hover:bg-yellow-500/20 hover:border-yellow-500/40 hover:text-yellow-300" },
                                                            { v: 4, l: "Good", color: "hover:bg-blue-500/20   hover:border-blue-500/40   hover:text-blue-300" },
                                                            { v: 5, l: "Best", color: "hover:bg-green-500/20  hover:border-green-500/40  hover:text-green-300" },
                                                        ].map(({ v, l, color }) => {
                                                            const selected = currentScores[criterion.id] === v;
                                                            const selectedColors = [
                                                                "", // 0 unused
                                                                "bg-red-500/20 border-red-500 text-red-300",
                                                                "bg-orange-500/20 border-orange-500 text-orange-300",
                                                                "bg-yellow-500/20 border-yellow-500 text-yellow-300",
                                                                "bg-blue-500/20 border-blue-500 text-blue-300",
                                                                "bg-green-500/20 border-green-500 text-green-300",
                                                            ];
                                                            return (
                                                                <button
                                                                    key={v}
                                                                    type="button"
                                                                    onClick={() => handleScoreChange(criterion.id, v)}
                                                                    className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all active:scale-95 ${selected
                                                                        ? selectedColors[v]
                                                                        : `bg-white/5 border-white/10 text-white/30 ${color}`
                                                                        }`}
                                                                >
                                                                    <span className="text-base md:text-xl font-black leading-none">{v}</span>
                                                                    <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 leading-none">{l}</span>
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
                            <div className="pt-16 border-t border-white/10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                        <MessageSquare size={20} className="text-purple-400" />
                                    </div>
                                    <h4 className="text-3xl font-black italic uppercase tracking-tighter text-white">Additional Feedback <span className="text-red-500 text-sm normal-case font-bold ml-2">(Required)</span></h4>
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add constructive comments here..."
                                    className="w-full h-32 md:h-48 bg-white/5 border-2 border-white/10 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 text-sm md:text-xl font-medium text-white placeholder:text-white/10 focus:outline-none focus:border-purple-500/50 transition-all resize-none shadow-inner"
                                />
                            </div>

                            {/* Action Console */}
                            <div className="pt-10 flex flex-col md:flex-row items-center justify-end gap-4 md:gap-8">
                                <button
                                    onClick={() => setActiveProject(null)}
                                    className="w-full md:w-auto h-16 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleScoreSubmit}
                                    disabled={Object.keys(currentScores).length < evaluationRound.criteria.length || !comment.trim()}
                                    className="w-full md:w-auto h-14 md:h-16 px-12 md:px-16 bg-[#FFEE00] hover:bg-[#E6D600] text-black font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl transition-all shadow-[0_4px_0_#9333ea] md:shadow-[0_6px_0_#9333ea] active:shadow-none active:translate-y-1 disabled:opacity-30 disabled:grayscale disabled:pointer-events-none group"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Submit Evaluation <CheckCircle2 size={18} />
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
