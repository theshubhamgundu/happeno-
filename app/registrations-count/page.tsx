"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useHackathon } from "@/context/HackathonContext";
import { Lock, Users, ShieldCheck, Download, Search, FileText, ChevronRight, LogOut } from "lucide-react";

export default function RegistrationsCountPage() {
    const { projects, isLoading } = useHackathon();
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const handleLogin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (password === "tricity@2.0") {
            setIsAuthenticated(true);
            setError("");
        } else {
            setError("Invalid credentials. Please contact administration.");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setPassword("");
    };

    const completedRegistrations = useMemo(() => {
        const filtered = projects.filter(p => {
            const isCompleted = p.status === 'COMPLETED';
            if (!isCompleted) return false;

            const searchLower = searchTerm.toLowerCase();
            return (
                p.team?.toLowerCase().includes(searchLower) ||
                p.teamId?.toLowerCase().includes(searchLower) ||
                p.captain?.toLowerCase().includes(searchLower) ||
                p.college?.toLowerCase().includes(searchLower)
            );
        });

        return filtered.sort((a, b) => {
            const idA = parseInt(a.teamId?.split('_').pop()?.replace(/\D/g, '') || "0");
            const idB = parseInt(b.teamId?.split('_').pop()?.replace(/\D/g, '') || "0");
            return idA - idB;
        });
    }, [projects, searchTerm]);

    const exportToCSV = () => {
        if (completedRegistrations.length === 0) return;

        const headers = ["Team ID", "Team Name", "Track", "Captain", "Phone", "College", "Status"];
        const rows = completedRegistrations.map(team => [
            team.teamId || "N/A",
            team.team || team.name,
            team.track,
            team.captain,
            team.captainMobile,
            team.college,
            "COMPLETED"
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
        const time = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-').replace(/ /g, '');
        const filename = `updated_registrations_${date}_${time}.csv`;

        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full"
                >
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white mb-6">
                                <Lock size={20} />
                            </div>
                            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                                Internal Administration
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Secure access for event coordinators
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider ml-1">Access Key</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                                />
                                {error && (
                                    <p className="text-red-500 text-xs font-medium mt-2 ml-1">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                Authenticate
                                <ChevronRight size={16} />
                            </button>
                        </form>
                    </div>
                    <p className="text-center text-slate-400 text-xs mt-8 font-medium">
                        &copy; 2026 tricity Infrastructure. All rights reserved.
                    </p>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
            {/* Top Navigation */}
            <nav className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-900 text-white p-2 rounded-lg">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold tracking-tight">TRI-CITY AI HACKATHON Audit</h2>
                            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Registration Registry</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-all border border-slate-200"
                        >
                            <Download size={14} />
                            Export CSV
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-all border border-red-100"
                        >
                            <LogOut size={14} />
                            Sign Out
                        </button>
                        <div className="h-6 w-[1px] bg-slate-200 mx-2" />
                        <div className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase border border-slate-200 transition-colors group-hover:bg-slate-200">
                                AD
                            </div>
                            <span className="text-xs font-bold text-slate-700">Administrator</span>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-10">
                {/* Stats Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Metrics</p>
                        <h3 className="text-2xl font-bold text-slate-900">Registration Activity</h3>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm group hover:border-blue-500/30 transition-all cursor-default lg:col-span-2 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Confirmed Participation</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-900">{isLoading ? "---" : completedRegistrations.length}</span>
                                <span className="text-sm font-semibold text-slate-500">Verified Teams</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                {/* Filters and List */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Filter by Team, ID, or Captain..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Displaying</span>
                            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
                                {completedRegistrations.length} Entries
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Team Identity</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Domain</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Leadership</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Institution</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Loading Records...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : completedRegistrations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-300">
                                                <FileText size={40} />
                                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">No matching records found</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    completedRegistrations.map((team) => (
                                        <tr key={team.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{team.team || team.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{team.teamId || "SYSTEM_GEN"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wide">
                                                    {team.track}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">{team.captain}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{team.captainMobile}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px] block">
                                                    {team.college}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                                                    <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                                    Active
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Authorized Registry Access Only
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sync: Live
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
