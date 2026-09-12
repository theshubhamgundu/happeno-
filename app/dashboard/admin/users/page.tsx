"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    Users,
    Search,
    Mail,
    Phone,
    ArrowLeft,
    Download,
    Bot,
    ShieldHalf,
    Blocks,
    ChevronRight
} from "lucide-react";
import { useState, useMemo } from "react";
import { useHackathon, Project, Member } from "@/context/HackathonContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface UserListItem extends Member {
    teamName: string;
    teamId: string;
    track: string;
    isTrackSelected: boolean;
}

export default function UsersManagement() {
    const { projects, isLoading } = useHackathon();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterYear, setFilterYear] = useState<string>("All Years");

    const allUsers = useMemo(() => {
        const users: UserListItem[] = [];
        projects.forEach(project => {
            project.members.forEach(member => {
                const memberObj = typeof member === 'string'
                    ? { fullName: member }
                    : member;

                users.push({
                    ...memberObj,
                    teamName: project.team,
                    teamId: project.teamId || "N/A",
                    track: project.track || "TBD",
                    isTrackSelected: !!project.track
                });
            });
        });
        return users;
    }, [projects]);

    const filteredUsers = useMemo(() => {
        return allUsers.filter(user => {
            const matchesSearch =
                (user.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                (user.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.college?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.teamName?.toLowerCase() || "").includes(searchQuery.toLowerCase());

            const matchesYear = filterYear === "All Years" || user.year === filterYear;

            return matchesSearch && matchesYear;
        });
    }, [allUsers, searchQuery, filterYear]);

    const handleExportCSV = () => {
        const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const headers = ["Full Name", "Email", "Phone", "College", "Year", "Department", "Team Name", "Team ID", "Track", "Status"];
        const rows = filteredUsers.map(user => [
            user.fullName, user.email || "N/A", user.phone || "N/A", user.college || "N/A",
            user.year || "N/A", user.department || "N/A", user.teamName, user.teamId,
            user.track, "Registered"
        ]);
        const thS = 'border:1px solid #aaa;padding:8px 10px;font-size:11px;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;background:#1a1a8c;color:#fff;';
        const tdS = 'border:1px solid #ccc;padding:7px 10px;font-size:11px;text-align:left;vertical-align:top;';
        const headerRow = `<tr>${headers.map(h => `<th style="${thS}">${h}</th>`).join('')}</tr>`;
        const dataRows = rows.map((row, i) =>
            `<tr style="background:${i % 2 === 0 ? '#fff' : '#f7f8fc'};">${row.map(cell => `<td style="${tdS}">${cell ?? 'â€”'}</td>`).join('')}</tr>`
        ).join('');
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <title>TRI-CITY AI HACKATHON â€” Hacker Directory</title>
    <style>
        @page { size: A3 landscape; margin: 12mm; }
        @media print { .no-print { display: none !important; } body { margin: 0; } tr { page-break-inside: avoid; } }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; margin: 0; }
        table { border-collapse: collapse; width: 100%; }
    </style>
</head>
<body>
    <div class="no-print" style="position:fixed;top:0;left:0;right:0;background:#1a1a8c;color:#fff;
        padding:10px 24px;display:flex;justify-content:space-between;align-items:center;z-index:9999;font-family:Arial,sans-serif;">
        <span style="font-weight:700;font-size:13px;">ðŸ“‹ TRI-CITY AI HACKATHON â€” Hacker Directory (${rows.length} participants)</span>
        <button onclick="window.print()" style="background:#FFEE00;color:#000;border:none;padding:8px 22px;
            border-radius:6px;font-weight:900;font-size:13px;cursor:pointer;">ðŸ–¨ï¸ Print / Save as PDF</button>
    </div>
    <div style="padding:18px 24px;margin-top:50px;">
        <div style="display:flex;align-items:center;justify-content:flex-start;gap:20px;margin-bottom:8px;">
            <img src="/Centle India-logo.png" style="height:80px;object-fit:contain;flex-shrink:0;" />
            <div style="font-family:'Segoe UI',Arial,sans-serif;">
                <div style="font-size:11px;color:#333;letter-spacing:0.5px;font-weight:700;">Centle India</div>
                <div style="font-size:22px;font-weight:900;letter-spacing:3px;color:#1a1a8c;margin-top:4px;">TRI-CITY AI HACKATHON HACKATHON</div>
                <div style="font-size:13px;font-weight:700;letter-spacing:5px;color:#cc0000;margin-top:2px;">HACKER DIRECTORY</div>
                <div style="font-size:10px;color:#888;margin-top:5px;">Date: ${now} &nbsp;|&nbsp; Total Participants: ${rows.length}</div>
            </div>
        </div>
        <div style="height:3px;background:linear-gradient(90deg,#cc0000,#1a1a8c,#cc0000);margin:8px 0 14px;border-radius:2px;"></div>
        <table><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table>
        <div style="margin-top:14px;text-align:center;font-size:9px;color:#bbb;border-top:1px solid #eee;padding-top:8px;">
            TRI-CITY AI HACKATHON Hackathon &nbsp;|&nbsp; Centle India &nbsp;|&nbsp; Hacker Directory &nbsp;|&nbsp; Generated: ${now}
        </div>
    </div>
</body>
</html>`;
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    };


    const domainStats = useMemo(() => {
        // Dynamically detect all tracks from the data instead of hardcoding domains
        const trackMap: Record<string, { teams: number; participants: number }> = {};
        projects.forEach(p => {
            const track = (p.track || "Uncategorized").trim();
            if (!trackMap[track]) trackMap[track] = { teams: 0, participants: 0 };
            trackMap[track].teams++;
            trackMap[track].participants += (p.members?.length || 0);
        });

        const COLORS = [
            { color: "text-cyan-400", border: "border-cyan-400/20", bg: "bg-cyan-400/10", glow: "rgba(0,200,255,0.15)", accent: "#00C8FF" },
            { color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10", glow: "rgba(0,100,255,0.15)", accent: "#0064FF" },
            { color: "text-purple-400", border: "border-purple-400/20", bg: "bg-purple-400/10", glow: "rgba(186,69,232,0.15)", accent: "#BA45E8" },
            { color: "text-pink-400", border: "border-pink-400/20", bg: "bg-pink-400/10", glow: "rgba(236,72,153,0.15)", accent: "#EC4899" },
            { color: "text-green-400", border: "border-green-400/20", bg: "bg-green-400/10", glow: "rgba(34,197,94,0.15)", accent: "#22C55E" },
        ];

        return Object.entries(trackMap).map(([track, data], i) => ({
            label: track,
            short: track,
            icon: Users,
            ...COLORS[i % COLORS.length],
            teams: data.teams,
            participants: data.participants,
        }));
    }, [projects]);

    if (isLoading) {
        return (
            <DashboardLayout type="admin" title="Operational Surveillance">
                <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/40 font-kanit font-bold uppercase tracking-widest animate-pulse">Syncing User Directory...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="admin" title="Hacker Surveillance">
            <div className="max-w-[1600px] mx-auto space-y-10 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-white/40 hover:text-[#FFEE00] transition-colors font-bold text-xs uppercase tracking-widest mb-4">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
                            Hacker <span className="text-[#FFEE00]">Directory</span>
                        </h1>
                        <p className="text-white/40 font-bold uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            {allUsers.length} Operational Units Detected
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleExportCSV}
                            className="p-4 rounded-2xl bg-[#FFEE00] text-black border border-[#FFEE00]/20 hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(255,238,0,0.2)]"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Domain Breakdown */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-md overflow-hidden">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Domain Breakdown</h2>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Live registration data by track</p>
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Entries</p>
                                <p className="text-3xl font-black italic text-[#FFEE00] tracking-tighter">{projects.length}</p>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="text-right">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Participants</p>
                                <p className="text-3xl font-black italic text-[#FFEE00] tracking-tighter">{allUsers.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Domain Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {domainStats.map((domain: any, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.3 }}
                                className={`relative rounded-[2rem] p-6 border ${domain.border} overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-default`}
                                style={{ background: domain.glow }}
                            >
                                {/* Glow blob */}
                                <div
                                    className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-[50px] opacity-30 group-hover:opacity-60 transition-opacity"
                                    style={{ backgroundColor: domain.accent }}
                                />

                                {/* Icon + short label */}
                                <div className="flex items-start justify-between mb-5 relative z-10">
                                    <div className={`p-3 rounded-2xl ${domain.bg} border ${domain.border}`}>
                                        <domain.icon className={domain.color} size={22} />
                                    </div>
                                    <ChevronRight className="text-white/10 group-hover:text-white/30 transition-colors" size={18} />
                                </div>

                                {/* Track name */}
                                <div className="relative z-10 mb-5">
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${domain.color} mb-1`}>Track {i + 1}</p>
                                    <h3 className="text-sm font-black italic uppercase tracking-tight text-white leading-tight">{domain.short}</h3>
                                </div>

                                {/* Stats Row */}
                                <div className="relative z-10 flex items-stretch gap-3">
                                    <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-white/5">
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Teams</p>
                                        <p className={`text-3xl font-black italic ${domain.color} tracking-tighter leading-none`}>{domain.teams}</p>
                                    </div>
                                    <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-white/5">
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Participants</p>
                                        <p className={`text-3xl font-black italic ${domain.color} tracking-tighter leading-none`}>{domain.participants}</p>
                                    </div>
                                </div>

                                {/* Fill bar */}
                                <div className="relative z-10 mt-4">
                                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: projects.length > 0 ? `${(domain.teams / projects.length) * 100}%` : '0%',
                                                backgroundColor: domain.accent
                                            }}
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-white/20 mt-1.5 text-right">
                                        {projects.length > 0 ? Math.round((domain.teams / projects.length) * 100) : 0}% of total teams
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mobile totals (shown only on mobile) */}
                    <div className="md:hidden mt-6 flex gap-4">
                        <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-white/5 text-center">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Entries</p>
                            <p className="text-3xl font-black italic text-[#FFEE00]">{projects.length}</p>
                        </div>
                        <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-white/5 text-center">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Participants</p>
                            <p className="text-3xl font-black italic text-[#FFEE00]">{allUsers.length}</p>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                    <div className="relative flex-grow group w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFEE00] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="SEARCH BY HACKER, EMAIL, OR COLLEGE..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-white font-bold italic uppercase outline-none focus:border-[#FFEE00] focus:bg-white/10 transition-all placeholder:text-white/10 tracking-widest text-sm"
                        />
                    </div>

                    <div className="flex gap-4 w-full lg:w-auto">
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold uppercase text-xs outline-none focus:border-purple-500 transition-all cursor-pointer appearance-none min-w-[160px]"
                        >
                            <option value="All Years">All Years</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                        </select>
                    </div>
                </div>

                {/* User Table */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-xl relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="p-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Hacker Profile</th>
                                    <th className="p-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hidden lg:table-cell">Collegiate Info</th>
                                    <th className="p-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Deployment Team</th>
                                    <th className="p-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Status</th>
                                    <th className="p-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {filteredUsers.map((user: UserListItem, idx: number) => (
                                        <motion.tr
                                            key={`${user.email}-${idx}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-white/[0.03] transition-colors"
                                        >
                                            <td className="p-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-white font-black italic border border-white/10">
                                                        {user.fullName?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-black italic uppercase tracking-tight group-hover:text-[#FFEE00] transition-colors">{user.fullName || 'Unknown User'}</p>
                                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">{user.email || 'NO_EMAIL'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8 hidden lg:table-cell">
                                                <div className="space-y-1">
                                                    <p className="text-white/60 font-bold text-xs uppercase tracking-wide truncate max-w-[200px]">{user.college || 'PRIVATE_ORIGIN'}</p>
                                                    <div className="flex gap-2">
                                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-black uppercase tracking-tighter border border-blue-500/20">
                                                            {user.year || 'N/A'}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[9px] font-black uppercase tracking-tighter border border-purple-500/20">
                                                            {user.department || 'GEN'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <div className="space-y-1">
                                                    <p className="text-white font-black italic uppercase text-xs tracking-tight">{user.teamName}</p>
                                                    <p className="text-[9px] text-[#FFEE00]/60 font-bold uppercase tracking-widest">{user.teamId}</p>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] bg-green-500/10 text-green-400 border border-green-500/30">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                    REGISTERED
                                                </span>
                                            </td>
                                            <td className="p-8">
                                                <div className="flex gap-2">
                                                    <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                                                        <Mail size={14} />
                                                    </button>
                                                    <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                                                        <Phone size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center opacity-20">
                                                <Search size={48} className="mb-4" />
                                                <p className="font-kanit font-black italic uppercase tracking-widest text-xl">No Hostiles Detected</p>
                                                <p className="text-xs font-bold mt-2">Try adjusting your surveillance parameters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StarIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    )
}
