"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Download, Lock, CheckCircle2, BarChart3, Users, FileText, LogOut } from "lucide-react";
import { useHackathon, Project } from "@/context/HackathonContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function LiveScorePage() {
    const { projects, judges, roundConfigs } = useHackathon();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDomain, setSelectedDomain] = useState("All Domains");

    const domains = useMemo(() => {
        const uniqueDomains = Array.from(new Set(projects.map(p => p.track).filter(Boolean)));
        return ["All Domains", ...uniqueDomains];
    }, [projects]);

    const calculateAverage = useMemo(() => (p: Project, roundId?: string) => {
        if (!p.roundScores) return 0;

        if (roundId) {
            const judgeScores = p.roundScores[roundId] || {};
            const scores = Object.values(judgeScores).filter(s => s !== null && s !== undefined);
            if (scores.length === 0) return 0;
            return scores.reduce((s, v) => s + (Number(v) || 0), 0) / scores.length;
        }

        let totalSum = 0;
        let completedRounds = 0;
        roundConfigs.forEach(round => {
            const rid = round.id;
            const judgeScores = p.roundScores[rid] || {};
            const scores = Object.values(judgeScores).filter(s => s !== null && s !== undefined);
            if (scores.length > 0) {
                const avg = scores.reduce((s, v) => s + (Number(v) || 0), 0) / scores.length;
                totalSum += avg;
                completedRounds++;
            }
        });
        return completedRounds ? totalSum / completedRounds : 0;
    }, [roundConfigs]);

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => {
                const matchesSearch =
                    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.teamId || "").toLowerCase().includes(searchQuery.toLowerCase());
                const matchesDomain = selectedDomain === "All Domains" || p.track === selectedDomain;
                return matchesSearch && matchesDomain;
            })
            .sort((a, b) => calculateAverage(b) - calculateAverage(a));
    }, [projects, searchQuery, selectedDomain, calculateAverage]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/livescore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (!response.ok) throw new Error('Access denied.');
            window.location.reload();
        } catch {
            toast.error('Access denied.');
        }
    };

    useEffect(() => {
        fetch('/api/auth/session')
            .then(response => response.ok ? response.json() : null)
            .then(session => setIsAuthenticated(session?.role === 'livescore'))
            .catch(() => setIsAuthenticated(false));
    }, []);

    const downloadCSV = (roundId?: string) => {
        const round = roundConfigs.find(r => r.id === roundId);
        const fileName = round ? `HAPPENO_${round.title.replace(/\s+/g, '_')}.csv` : `HAPPENO_Standings.csv`;

        let csvContent = "Rank,Team ID,Team Name,Domain";
        if (roundId) {
            let maxJudges = 1;
            filteredProjects.forEach(p => {
                const count = Object.keys(p.roundScores?.[roundId] || {}).length;
                if (count > maxJudges) maxJudges = count;
            });
            for (let i = 1; i <= maxJudges; i++) {
                csvContent += `,Judge ${i},Score ${i},Feedback ${i}`;
            }
            csvContent += ",Average Score\n";
        } else {
            csvContent += `,${roundConfigs.map(round => `${round.title} Avg`).join(',')},Overall Average\n`;
        }

        filteredProjects.forEach((p, index) => {
            let row = `${index + 1},"${p.teamId}","${p.name}","${p.track}"`;
            if (roundId) {
                const roundScores = p.roundScores?.[roundId] || {};
                const roundComments = p.roundComments?.[roundId] || {};
                const judgeIds = Object.keys(roundScores);
                judgeIds.forEach(jid => {
                    const judgeName = judges.find(j => j.generatedId === jid)?.name || jid;
                    const score = roundScores[jid];
                    const comment = (roundComments[jid] || "").replace(/"/g, '""');
                    row += `,"${judgeName}",${score},"${comment}"`;
                });
                let maxJudges = 1;
                filteredProjects.forEach(fp => {
                    const count = Object.keys(fp.roundScores?.[roundId] || {}).length;
                    if (count > maxJudges) maxJudges = count;
                });
                for (let i = judgeIds.length; i < maxJudges; i++) {
                    row += ",,,";
                }
                row += `,${calculateAverage(p, roundId).toFixed(2)}\n`;
            } else {
                row += `,${roundConfigs.map(round => calculateAverage(p, round.id).toFixed(2)).join(',')},${calculateAverage(p).toFixed(2)}\n`;
            }
            csvContent += row;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Data exported to ${fileName}`);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-8">
                <div className="w-full max-w-sm bg-white border border-neutral-300 rounded shadow-lg overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-10">
                            <div className="inline-block p-4 bg-slate-900 rounded-lg mb-4">
                                <Lock className="text-white" size={24} />
                            </div>
                            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">HAPPENO Hackathon</h1>
                            <p className="text-sm text-neutral-500 mt-2 uppercase tracking-widest font-semibold">Live Scoreboard Access</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Access Key Required</label>
                                <input
                                    type="password"
                                    placeholder="Enter Key"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md py-3 px-4 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all font-mono"
                                />
                            </div>
                            <button className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-md transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                Login to Portal
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-sans pb-20 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-300 pb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Happeno Hackathon Standings</h1>
                        <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live Administrative Data Feed
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            void fetch('/api/auth/logout', { method: 'POST' });
                            setIsAuthenticated(false);
                        }}
                        className="bg-white border border-slate-300 hover:bg-slate-800 hover:border-slate-800 hover:text-slate-900 p-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                        title="Sign Out"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Summary Modules */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { label: "Deployment Count", val: projects.length, icon: Users },
                            { label: "On-Site Checkins", val: projects.filter(p => p.isCheckedIn).length, icon: CheckCircle2 },
                            { label: "In Evaluation", val: projects.length, icon: BarChart3 },
                            { label: "Final Release", val: projects.filter(p => p.submission?.isFinal).length, icon: FileText },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white border border-slate-300 rounded-xl p-6 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-900">
                                    <stat.icon size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-2xl font-black text-slate-900">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search & Export Toolbar */}
                    <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-sm flex flex-col lg:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full lg:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="SEARCH DATABASE FOR TEAM NAME OR ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 text-xs font-bold tracking-tight focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 uppercase"
                            />
                        </div>

                        <div className="w-full lg:w-64">
                            <select
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2.5 px-3 text-xs font-bold uppercase tracking-tight appearance-none cursor-pointer focus:outline-none"
                            >
                                {domains.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto">
                            {roundConfigs.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => downloadCSV(r.id)}
                                    className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-[10px] font-bold text-slate-600 flex items-center gap-2 transition-all whitespace-nowrap"
                                >
                                    <Download size={12} /> {r.title}
                                </button>
                            ))}
                            <button
                                onClick={() => downloadCSV()}
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-black text-[10px] font-bold flex items-center gap-2 shadow-md transition-all whitespace-nowrap"
                            >
                                <Download size={12} /> EXPORT GLOBAL DATA
                            </button>
                        </div>
                    </div>

                    {/* Leaderboard Grid */}
                    <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 border-b border-slate-800">
                                        <th className="py-5 px-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20">POS</th>
                                        <th className="py-5 px-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">IDENTIFICATION</th>
                                        {roundConfigs.map(r => (
                                            <th key={r.id} className="py-5 px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.id.toUpperCase()}</th>
                                        ))}
                                        <th className="py-5 px-8 text-right text-[10px] font-bold text-white uppercase tracking-widest">AGGREGATE IQ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <AnimatePresence mode="popLayout">
                                        {filteredProjects.map((p, idx) => (
                                            <motion.tr
                                                layout
                                                key={p.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="py-5 px-6 font-black text-slate-400 text-sm">
                                                    #{idx + 1}
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 text-base leading-tight uppercase tracking-tight">{p.name || "UNNAMED UNIT"}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded">{p.teamId}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.track || "GENERAL"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {roundConfigs.map(round => <ScoreCell key={round.id} p={p} roundId={round.id} calculateAverage={calculateAverage} />)}
                                                <td className="py-5 px-8 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xl font-black text-slate-900 tabular-nums">
                                                            {calculateAverage(p).toFixed(2)}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Global Mean</span>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ScoreCell({ p, roundId, calculateAverage }: { p: Project; roundId: string; calculateAverage: (project: Project, id?: string) => number }) {
    const avg = calculateAverage(p, roundId);
    const hasScores = p.roundScores?.[roundId] && Object.keys(p.roundScores[roundId]).length > 0;

    return (
        <td className="py-5 px-4 text-center">
            <span className={`text-[15px] font-bold ${hasScores ? 'text-slate-900' : 'text-slate-300 font-mono'}`}>
                {hasScores ? avg.toFixed(2) : '---'}
            </span>
        </td>
    );
}
