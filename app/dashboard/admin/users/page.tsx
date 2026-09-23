"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    Users,
    Search,
    Mail,
    Phone,
    ArrowLeft,
    Download,
    ChevronRight,
    ChevronDown,
    Edit,
    X,
    Save,
    Coffee,
    Check
} from "lucide-react";
import { useState, useMemo, Fragment } from "react";
import { useHackathon, Project, Member } from "@/context/HackathonContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { EVENT_MEALS } from "@/lib/meals";

interface UserListItem extends Member {
    teamName: string;
    teamId: string;
    track: string;
    isTrackSelected: boolean;
}

const AVATAR_GRADIENTS = [
    "bg-gradient-to-br from-[#14b8a6] to-teal-700 border-slate-900 text-white shadow-md",
    "bg-gradient-to-br from-indigo-500 to-purple-700 border-slate-900 text-white shadow-md",
    "bg-gradient-to-br from-blue-500 to-cyan-600 border-slate-900 text-white shadow-md",
    "bg-gradient-to-br from-rose-500 to-pink-600 border-slate-900 text-white shadow-md",
    "bg-gradient-to-br from-violet-500 to-fuchsia-600 border-slate-900 text-white shadow-md",
    "bg-gradient-to-br from-emerald-500 to-green-600 border-slate-900 text-white shadow-md",
];

export default function UsersManagement() {
    const { projects, isLoading, updateMemberDetails, toggleMealAccess } = useHackathon();
    const [editingParticipant, setEditingParticipant] = useState<UserListItem | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<UserListItem>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [filterYear, setFilterYear] = useState<string>("All Years");
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

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

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch =
                (project.team?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                (project.track?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                project.members.some(m => {
                    const memberObj = typeof m === 'string' ? { fullName: m } : m;
                    return (memberObj.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                           (memberObj.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                           (memberObj.college?.toLowerCase() || "").includes(searchQuery.toLowerCase());
                });

            const matchesYear = filterYear === "All Years" || project.members.some(m => {
                const memberObj = typeof m === 'string' ? { fullName: m } : m;
                return memberObj.year === filterYear;
            });

            return matchesSearch && matchesYear;
        });
    }, [projects, searchQuery, filterYear]);

    const filteredUsersForExport = useMemo(() => {
        const users: UserListItem[] = [];
        filteredProjects.forEach(project => {
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
    }, [filteredProjects]);

    const handleExportCSV = () => {
        const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const headers = ["Full Name", "Email", "Phone", "College", "Year", "Department", "Team Name", "Team ID", "Track", "Status"];
        const rows = filteredUsersForExport.map(user => [
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
        <button onclick="window.print()" style="background:#14b8a6;color:#000;border:none;padding:8px 22px;
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
            { color: "text-slate-900", border: "border-slate-800/20", bg: "bg-slate-900/10", glow: "rgba(186,69,232,0.15)", accent: "#BA45E8" },
            { color: "text-slate-900", border: "border-slate-800/20", bg: "bg-slate-900/10", glow: "rgba(236,72,153,0.15)", accent: "#EC4899" },
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
                    <div className="w-12 h-12 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
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
                        <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-white/40 hover:text-[#14b8a6] transition-colors font-bold text-xs uppercase tracking-widest mb-4">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
                            Hacker <span className="text-[#14b8a6]">Directory</span>
                        </h1>
                        <p className="text-white/40 font-bold uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            {allUsers.length} Operational Units Detected
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleExportCSV}
                            className="p-4 rounded-2xl bg-[#14b8a6] text-black border border-[#14b8a6]/20 hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(20,184,166,0.2)]"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>



                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                    <div className="relative flex-grow group w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#14b8a6] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="SEARCH BY HACKER, EMAIL, OR COLLEGE..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-white font-bold italic uppercase outline-none focus:border-[#14b8a6] focus:bg-white/10 transition-all placeholder:text-white/10 tracking-widest text-sm"
                        />
                    </div>

                    <div className="flex gap-4 w-full lg:w-auto">
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold uppercase text-xs outline-none focus:border-slate-800 transition-all cursor-pointer appearance-none min-w-[160px]"
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
                                    <th className="p-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Team Name & Track</th>
                                    <th className="p-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Members</th>
                                    <th className="p-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Status</th>
                                    <th className="p-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {filteredProjects.map((project: Project, idx: number) => {
                                        const isExpanded = expandedTeamId === project.id;
                                        
                                        return (
                                        <Fragment key={`${project.id}-${idx}`}>
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className={`group hover:bg-white/[0.03] transition-colors cursor-pointer ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                                                onClick={() => setExpandedTeamId(isExpanded ? null : project.id)}
                                            >
                                                <td className="p-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900/20 to-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6] font-black border border-white/10">
                                                            <Users size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-black italic uppercase tracking-tight group-hover:text-[#14b8a6] transition-colors text-lg">{project.team || 'Unknown Team'}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] text-[#14b8a6]/60 font-bold uppercase tracking-widest">{project.teamId}</span>
                                                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{project.track || 'TBD'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex -space-x-2.5">
                                                            {project.members.slice(0, 4).map((m, i) => (
                                                                <div key={i} className={`w-8 h-8 rounded-full ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} border-2 flex items-center justify-center text-[11px] font-black text-white z-[${4 - i}]`}>
                                                                    {(typeof m === 'string' ? m : m.fullName)?.[0]?.toUpperCase() || '?'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <span className="text-xs font-bold text-white/60">{project.members.length} Members</span>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] bg-green-500/10 text-green-400 border border-green-500/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                        {project.status || 'REGISTERED'}
                                                    </span>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <button 
                                                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 group-hover:text-white transition-all inline-flex items-center justify-center"
                                                    >
                                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                    </button>
                                                </td>
                                            </motion.tr>
                                            
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.tr
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="bg-black/40 border-b border-white/5"
                                                    >
                                                        <td colSpan={4} className="p-0">
                                                            <div className="p-8 pl-24 space-y-4">
                                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Team Participants</p>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {project.members.map((member, mIdx) => {
                                                                        const m = typeof member === 'string' ? { fullName: member } as Member : member;
                                                                        return (
                                                                            <div key={mIdx} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-start justify-between group/member hover:bg-white/10 transition-colors">
                                                                                <div className="flex gap-4">
                                                                                    <div className={`w-10 h-10 rounded-full ${AVATAR_GRADIENTS[mIdx % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-black text-sm border border-white/20 shadow-md`}>
                                                                                        {m.fullName?.[0]?.toUpperCase() || '?'}
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-black italic uppercase tracking-tight text-white">{m.fullName || 'Unknown'}</p>
                                                                                        <div className="flex items-center gap-2 mt-1">
                                                                                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{m.email || 'NO_EMAIL'}</p>
                                                                                            <span className="w-1 h-1 rounded-full bg-white/20" />
                                                                                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{m.phone || 'NO_PHONE'}</p>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 mt-3">
                                                                                            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">{m.college || 'Unknown College'}</span>
                                                                                            <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-bold text-white/50">{m.year || 'N/A'}</span>
                                                                                            <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-bold text-white/50">{m.department || 'N/A'}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-col gap-2 opacity-0 group-hover/member:opacity-100 transition-opacity">
                                                                                    <button 
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            const userObj = {
                                                                                                ...m,
                                                                                                teamName: project.team,
                                                                                                teamId: project.teamId || "N/A",
                                                                                                track: project.track || "TBD",
                                                                                                isTrackSelected: !!project.track
                                                                                            };
                                                                                            setEditingParticipant(userObj as UserListItem);
                                                                                            setEditFormData(userObj);
                                                                                        }}
                                                                                        className="p-2 rounded-lg bg-white/5 text-[#14b8a6]/60 hover:text-[#14b8a6] hover:bg-[#14b8a6]/10 transition-colors"
                                                                                        title="Edit Participant"
                                                                                    >
                                                                                        <Edit size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Meal Pass Toggle Section */}
                                                                <div className="mt-8 border-t border-white/10 pt-6">
                                                                    <div className="flex items-center gap-3 mb-4">
                                                                        <Coffee size={16} className="text-amber-500" />
                                                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Food & Snack Passes</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-3">
                                                                        {EVENT_MEALS.map((meal) => {
                                                                            // Check if ANY member has access to this meal (we'll treat it as team-wide access for this UI)
                                                                            const memberStates = project.memberMealState || {};
                                                                            const hasAnyAccess = Object.values(memberStates).some(memberSlots => !!memberSlots[meal.key]);
                                                                            const hasAnyClaimed = Object.values(memberStates).some(memberSlots => !!memberSlots[meal.key]?.claimedAt);
                                                                            
                                                                            const isIncluded = hasAnyAccess;
                                                                            const isClaimed = hasAnyClaimed;
                                                                            
                                                                            return (
                                                                                <div key={meal.key} className={`flex items-center gap-3 p-3 rounded-xl border ${isIncluded ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'} transition-colors`}>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{meal.shortLabel}</span>
                                                                                        {isClaimed ? (
                                                                                            <span className="text-[8px] font-bold text-green-400 uppercase">Claimed</span>
                                                                                        ) : isIncluded ? (
                                                                                            <span className="text-[8px] font-bold text-amber-500 uppercase">Pending</span>
                                                                                        ) : (
                                                                                            <span className="text-[8px] font-bold text-white/30 uppercase">No Access</span>
                                                                                        )}
                                                                                    </div>
                                                                                    
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleMealAccess(project.id, meal.key, !isIncluded);
                                                                                        }}
                                                                                        disabled={isClaimed}
                                                                                        className={`w-10 h-6 rounded-full p-1 transition-colors flex ${isIncluded ? 'bg-amber-500 justify-end' : 'bg-white/20 justify-start'} ${isClaimed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-white/20'}`}
                                                                                    >
                                                                                        <motion.div 
                                                                                            layout 
                                                                                            className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm"
                                                                                        >
                                                                                            {isIncluded && <Check size={10} className="text-amber-600" />}
                                                                                        </motion.div>
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </Fragment>
                                        );
                                    })}
                                </AnimatePresence>
                                {filteredProjects.length === 0 && (
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

            {/* Edit Modal */}
            <AnimatePresence>
                {editingParticipant && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white p-8 rounded-[1rem] shadow-2xl max-w-lg w-full relative"
                        >
                            <button
                                onClick={() => setEditingParticipant(null)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            
                            <h2 className="text-xl font-bold uppercase tracking-wide text-gray-800 mb-6">
                                EDIT <span className="text-[#14b8a6]">PARTICIPANT</span>
                            </h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={editFormData.fullName || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                                        className="w-full bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2.5 text-black font-bold outline-none focus:ring-2 focus:ring-[#14b8a6]/50 focus:border-transparent transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
                                    <input 
                                        type="email" 
                                        value={editFormData.email || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                        className="w-full bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2.5 text-black font-bold outline-none focus:ring-2 focus:ring-[#14b8a6]/50 focus:border-transparent transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone</label>
                                    <input 
                                        type="text" 
                                        value={editFormData.phone || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        className="w-full bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2.5 text-black font-bold outline-none focus:ring-2 focus:ring-[#14b8a6]/50 focus:border-transparent transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">College</label>
                                    <input 
                                        type="text" 
                                        value={editFormData.college || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, college: e.target.value })}
                                        className="w-full bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2.5 text-black font-bold outline-none focus:ring-2 focus:ring-[#14b8a6]/50 focus:border-transparent transition-all text-sm"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Year</label>
                                        <input 
                                            type="text" 
                                            value={editFormData.year || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                                            className="w-full bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2.5 text-black font-bold outline-none focus:ring-2 focus:ring-[#14b8a6]/50 focus:border-transparent transition-all text-sm"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Department</label>
                                        <input 
                                            type="text" 
                                            value={editFormData.department || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                            className="w-full bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2.5 text-black font-bold outline-none focus:ring-2 focus:ring-[#14b8a6]/50 focus:border-transparent transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end gap-4">
                                <button 
                                    onClick={() => setEditingParticipant(null)}
                                    className="px-6 py-2.5 rounded-full bg-gray-200 text-black font-bold uppercase text-[11px] tracking-widest hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        const projectId = projects.find(p => p.team === editingParticipant.teamName)?.id;
                                        if (projectId && editingParticipant.email) {
                                            updateMemberDetails(projectId, editingParticipant.email, {
                                                fullName: editFormData.fullName || '',
                                                email: editFormData.email,
                                                phone: editFormData.phone,
                                                college: editFormData.college,
                                                year: editFormData.year,
                                                department: editFormData.department
                                            });
                                        }
                                        setEditingParticipant(null);
                                    }}
                                    className="px-6 py-2.5 rounded-full bg-[#14b8a6] text-black font-bold uppercase text-[11px] tracking-widest hover:bg-[#0d9488] transition-colors flex items-center gap-2"
                                >
                                    <Save size={14} /> Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
