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
    Check,
    Trash2,
    Plus,
    Loader2
} from "lucide-react";
import { useState, useMemo, Fragment } from "react";
import { useHackathon, Project, Member } from "@/context/HackathonContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { EVENT_MEALS } from "@/lib/meals";
import { MAX_TEAM_MEMBERS } from "@/lib/constants";

interface UserListItem extends Member {
    teamName: string;
    teamId: string;
    track: string;
    isTrackSelected: boolean;
}

interface ExistingMemberChoice {
    sourceTeamId: string;
    sourceTeamName: string;
    memberIndex: number;
    member: Member;
}

const AVATAR_GRADIENTS = [
    "bg-gradient-to-br from-[#14b8a6] to-teal-700 border-slate-900 text-white shadow-md",
    "bg-gradient-to-br from-indigo-500 to-purple-700 border-slate-900 text-white shadow-md",
    "bg-gradient-to-br from-teal-500 to-cyan-600 border-slate-900 text-white shadow-md",
    "bg-gradient-to-br from-rose-500 to-pink-600 border-slate-900 text-white shadow-md",
    "bg-gradient-to-br from-violet-500 to-fuchsia-600 border-slate-900 text-white shadow-md",
    "bg-gradient-to-br from-emerald-500 to-green-600 border-slate-900 text-white shadow-md",
];

export default function UsersManagement() {
    const { projects, isLoading, updateMemberDetails, removeTeamMember, addTeamMember, transferTeamMembers, toggleMealAccess } = useHackathon();
    const [editingParticipant, setEditingParticipant] = useState<UserListItem | null>(null);
    const [editingLocation, setEditingLocation] = useState<{ teamId: string; memberIndex: number } | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<UserListItem>>({});
    const [addingToTeam, setAddingToTeam] = useState<Project | null>(null);
    const [newMemberForm, setNewMemberForm] = useState<Member>({ fullName: '' });
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [addParticipantMode, setAddParticipantMode] = useState<'manual' | 'existing'>('manual');
    const [existingMemberQuery, setExistingMemberQuery] = useState('');
    const [selectedExistingMembers, setSelectedExistingMembers] = useState<{ sourceTeamId: string; memberIndex: number }[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

    const handleAddParticipant = async () => {
        if (!addingToTeam) return;
        if (addParticipantMode === 'manual' && !newMemberForm.fullName.trim()) return;
        if (addParticipantMode === 'existing' && !selectedExistingMembers.length) return;

        setIsAddingMember(true);
        const added = addParticipantMode === 'manual'
            ? await addTeamMember(addingToTeam.id, newMemberForm)
            : await transferTeamMembers(addingToTeam.id, selectedExistingMembers);
        setIsAddingMember(false);
        if (added) {
            setAddingToTeam(null);
            setNewMemberForm({ fullName: '' });
            setSelectedExistingMembers([]);
            setExistingMemberQuery('');
        }
    };

    const existingMemberChoices = useMemo<ExistingMemberChoice[]>(() => {
        if (!addingToTeam) return [];
        const query = existingMemberQuery.trim().toLowerCase();
        return projects.flatMap(project => {
            if (String(project.id) === String(addingToTeam.id)) return [];
            const sourceTeamId = String(project.teamId || project.id);
            return project.members.flatMap((entry, memberIndex) => {
                const member = typeof entry === 'string' ? { fullName: entry } : entry;
                const searchable = [member.fullName, member.email, member.phone, project.team, project.teamId]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (query && !searchable.includes(query)) return [];
                return [{ sourceTeamId, sourceTeamName: project.team, memberIndex, member }];
            });
        });
    }, [projects, addingToTeam, existingMemberQuery]);

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

            return matchesSearch;
        });
    }, [projects, searchQuery]);

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
            { color: "text-teal-700", border: "border-teal-200", bg: "bg-teal-50", glow: "rgba(20,184,166,0.15)", accent: "#0d9488" },
            { color: "text-emerald-700", border: "border-emerald-200", bg: "bg-emerald-50", glow: "rgba(16,185,129,0.15)", accent: "#059669" },
            { color: "text-purple-700", border: "border-purple-200", bg: "bg-purple-50", glow: "rgba(186,69,232,0.15)", accent: "#7c3aed" },
            { color: "text-amber-700", border: "border-amber-200", bg: "bg-amber-50", glow: "rgba(245,158,11,0.15)", accent: "#d97706" },
            { color: "text-slate-700", border: "border-slate-200", bg: "bg-slate-100", glow: "rgba(100,116,139,0.15)", accent: "#475569" },
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
            <DashboardLayout type="admin" title="Hacker Directory">
                <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Syncing User Directory...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="admin" title="Hacker Directory">
            <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors font-bold text-xs uppercase tracking-widest mb-3">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-slate-900 leading-none">
                            Hacker <span className="text-teal-600">Directory</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.16em] mt-3 flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {allUsers.length} Operational Units Detected
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleExportCSV}
                            className="p-3.5 px-5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 font-bold uppercase text-xs tracking-wider"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-grow group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by hacker, email, or college..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-14 pr-6 text-slate-900 font-semibold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-slate-400 tracking-wide text-sm shadow-sm"
                        />
                    </div>
                </div>

                {/* User Table */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/70">
                                    <th className="p-5 pl-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.16em]">Team Name & Track</th>
                                    <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.16em]">Members</th>
                                    <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.16em]">Status</th>
                                    <th className="p-5 pr-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.16em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <AnimatePresence mode="popLayout">
                                    {filteredProjects.map((project: Project, idx: number) => {
                                        const isExpanded = expandedTeamId === project.id;
                                        
                                        return (
                                        <Fragment key={`${project.id}-${idx}`}>
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className={`group hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/60' : ''}`}
                                                onClick={() => setExpandedTeamId(isExpanded ? null : project.id)}
                                            >
                                                <td className="p-5 pl-7">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold border border-teal-100">
                                                            <Users size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-900 font-bold tracking-tight group-hover:text-teal-700 transition-colors text-base">{project.team || 'Unknown Team'}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">{project.teamId}</span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{project.track || 'TBD'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex -space-x-2">
                                                            {project.members.slice(0, 4).map((m, i) => (
                                                                <div key={i} className={`w-7 h-7 rounded-full ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}>
                                                                    {(typeof m === 'string' ? m : m.fullName)?.[0]?.toUpperCase() || '?'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600">{project.members.length} Members</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        {project.status || 'REGISTERED'}
                                                    </span>
                                                </td>
                                                <td className="p-5 pr-7 text-right">
                                                    <button 
                                                        className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 group-hover:text-slate-800 transition-all inline-flex items-center justify-center"
                                                    >
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </button>
                                                </td>
                                            </motion.tr>
                                            
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.tr
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="bg-slate-50/40 border-b border-slate-200"
                                                    >
                                                        <td colSpan={4} className="p-0">
                                                            <div className="p-6 pl-14 sm:pl-20 space-y-4">
                                                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.16em]">Team Participants ({project.members.length}/{MAX_TEAM_MEMBERS})</p>
                                                                    <button
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            setNewMemberForm({ fullName: '' });
                                                                            setAddParticipantMode('manual');
                                                                            setExistingMemberQuery('');
                                                                            setSelectedExistingMembers([]);
                                                                            setAddingToTeam(project);
                                                                        }}
                                                                        disabled={project.members.length >= MAX_TEAM_MEMBERS}
                                                                        title={project.members.length >= MAX_TEAM_MEMBERS ? `Teams are limited to ${MAX_TEAM_MEMBERS} participants` : 'Add participant'}
                                                                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                                                                    >
                                                                        <Plus size={14} /> {project.members.length >= MAX_TEAM_MEMBERS ? 'Team full' : 'Add participant'}
                                                                    </button>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                                                    {project.members.map((member, mIdx) => {
                                                                        const m = typeof member === 'string' ? { fullName: member } as Member : member;
                                                                        return (
                                                                            <div key={mIdx} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between group/member hover:border-slate-300 transition-colors shadow-sm">
                                                                                <div className="flex gap-3.5">
                                                                                    <div className={`w-9 h-9 rounded-full ${AVATAR_GRADIENTS[mIdx % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                                                                                        {m.fullName?.[0]?.toUpperCase() || '?'}
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-bold text-slate-900">{m.fullName || 'Unknown'}</p>
                                                                                        <div className="flex items-center gap-2 mt-1">
                                                                                            <p className="text-[10px] text-slate-500 font-medium">{m.email || 'NO_EMAIL'}</p>
                                                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                                            <p className="text-[10px] text-slate-500 font-medium">{m.phone || 'NO_PHONE'}</p>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 mt-2.5">
                                                                                            <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wide">{m.college || 'Unknown College'}</span>
                                                                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-semibold text-slate-600">{m.year || 'N/A'}</span>
                                                                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-semibold text-slate-600">{m.department || 'N/A'}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex gap-1.5 opacity-100 md:flex-col md:opacity-0 md:group-hover/member:opacity-100 transition-opacity">
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
                                                                                            setEditingLocation({ teamId: String(project.id), memberIndex: mIdx });
                                                                                        }}
                                                                                        className="p-1.5 rounded-lg bg-slate-100 text-teal-700 hover:bg-teal-50 transition-colors"
                                                                                        title="Edit Participant"
                                                                                    >
                                                                                        <Edit size={13} />
                                                                                    </button>
                                                                                    <button 
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (project.members.length <= 1 || !window.confirm(`Remove ${m.fullName || 'this participant'} from ${project.team}?`)) return;
                                                                                            void removeTeamMember(project.id, mIdx);
                                                                                        }}
                                                                                        disabled={project.members.length <= 1}
                                                                                        className="p-1.5 rounded-lg bg-slate-100 text-rose-600 hover:bg-rose-50 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                                                                                        title={project.members.length <= 1 ? 'A team must have at least one participant' : 'Remove Participant'}
                                                                                    >
                                                                                        <Trash2 size={13} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Meal Pass Toggle Section */}
                                                                <div className="mt-6 border-t border-slate-200 pt-5">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <Coffee size={15} className="text-amber-600" />
                                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.16em]">Food & Snack Passes</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2.5">
                                                                        {EVENT_MEALS.map((meal) => {
                                                                            // Check if ANY member has access to this meal (we'll treat it as team-wide access for this UI)
                                                                            const memberStates = project.memberMealState || {};
                                                                            const hasAnyAccess = Object.values(memberStates).some(memberSlots => !!memberSlots[meal.key]);
                                                                            const hasAnyClaimed = Object.values(memberStates).some(memberSlots => !!memberSlots[meal.key]?.claimedAt);
                                                                            
                                                                            const isIncluded = hasAnyAccess;
                                                                            const isClaimed = hasAnyClaimed;
                                                                            
                                                                            return (
                                                                                <div key={meal.key} className={`flex items-center gap-3 p-2.5 px-3 rounded-xl border ${isIncluded ? 'bg-amber-50/80 border-amber-200' : 'bg-white border-slate-200'} transition-colors`}>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{meal.shortLabel}</span>
                                                                                        {isClaimed ? (
                                                                                            <span className="text-[8px] font-bold text-emerald-700 uppercase">Claimed</span>
                                                                                        ) : isIncluded ? (
                                                                                            <span className="text-[8px] font-bold text-amber-700 uppercase">Pending</span>
                                                                                        ) : (
                                                                                            <span className="text-[8px] font-bold text-slate-400 uppercase">No Access</span>
                                                                                        )}
                                                                                    </div>
                                                                                    
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleMealAccess(project.id, meal.key, !isIncluded);
                                                                                        }}
                                                                                        disabled={isClaimed}
                                                                                        className={`w-9 h-5 rounded-full p-0.5 transition-colors flex ${isIncluded ? 'bg-amber-500 justify-end' : 'bg-slate-200 justify-start'} ${isClaimed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-amber-200'}`}
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
                                        <td colSpan={5} className="p-16 text-center">
                                            <div className="flex flex-col items-center opacity-40">
                                                <Search size={40} className="mb-3 text-slate-400" />
                                                <p className="font-bold uppercase tracking-widest text-slate-700 text-sm">No Teams Found</p>
                                                <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria</p>
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
                                onClick={() => { setEditingParticipant(null); setEditingLocation(null); }}
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
                                    onClick={() => { setEditingParticipant(null); setEditingLocation(null); }}
                                    className="px-6 py-2.5 rounded-full bg-gray-200 text-black font-bold uppercase text-[11px] tracking-widest hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={async () => {
                                        if (editingLocation) {
                                            const saved = await updateMemberDetails(editingLocation.teamId, editingLocation.memberIndex, {
                                                fullName: editFormData.fullName || '',
                                                email: editFormData.email,
                                                phone: editFormData.phone,
                                                college: editFormData.college,
                                                year: editFormData.year,
                                                department: editFormData.department
                                            });
                                            if (saved) {
                                                setEditingParticipant(null);
                                                setEditingLocation(null);
                                            }
                                        }
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

            <AnimatePresence>
                {addingToTeam && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl md:p-8"
                        >
                            <button
                                onClick={() => setAddingToTeam(null)}
                                className="absolute right-5 top-5 text-gray-400 transition-colors hover:text-gray-700"
                                aria-label="Close add participant form"
                            >
                                <X size={20} />
                            </button>
                            <h2 className="mb-1 text-xl font-bold uppercase tracking-wide text-gray-800">
                                Add <span className="text-[#14b8a6]">Participant</span>
                            </h2>
                            <p className="mb-6 text-xs text-gray-500">Adding to {addingToTeam.team} ({addingToTeam.teamId})</p>
                            <div className="mb-5 grid grid-cols-2 rounded-xl border border-gray-200 bg-gray-100 p-1">
                                <button
                                    onClick={() => setAddParticipantMode('manual')}
                                    className={`rounded-lg px-3 py-2.5 text-xs font-bold transition ${addParticipantMode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Manual entry
                                </button>
                                <button
                                    onClick={() => setAddParticipantMode('existing')}
                                    className={`rounded-lg px-3 py-2.5 text-xs font-bold transition ${addParticipantMode === 'existing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Existing member
                                </button>
                            </div>

                            {addParticipantMode === 'manual' ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {([
                                        ['fullName', 'Full Name', 'text'],
                                        ['email', 'Email', 'email'],
                                        ['phone', 'Phone', 'tel'],
                                        ['college', 'College', 'text'],
                                        ['year', 'Year', 'text'],
                                        ['department', 'Department', 'text']
                                    ] as const).map(([field, label, type]) => (
                                        <label key={field} className="space-y-1.5">
                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}{field === 'fullName' ? ' *' : ''}</span>
                                            <input
                                                type={type}
                                                required={field === 'fullName'}
                                                value={newMemberForm[field] || ''}
                                                onChange={event => setNewMemberForm(current => ({ ...current, [field]: event.target.value }))}
                                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20"
                                            />
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold text-gray-600">Move an existing person from another team.</p>
                                        <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-800">
                                            {selectedExistingMembers.length}/{MAX_TEAM_MEMBERS - addingToTeam.members.length} selected
                                        </span>
                                    </div>
                                    <input
                                        type="search"
                                        value={existingMemberQuery}
                                        onChange={event => setExistingMemberQuery(event.target.value)}
                                        placeholder="Search name, email, team, or ID"
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20"
                                    />
                                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                                        {existingMemberChoices.map(choice => {
                                            const choiceKey = `${choice.sourceTeamId}:${choice.memberIndex}`;
                                            const isSelected = selectedExistingMembers.some(selection => `${selection.sourceTeamId}:${selection.memberIndex}` === choiceKey);
                                            const atSelectionLimit = selectedExistingMembers.length >= MAX_TEAM_MEMBERS - addingToTeam.members.length;
                                            return (
                                                <label key={choiceKey} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white hover:border-gray-300'} ${!isSelected && atSelectionLimit ? 'cursor-not-allowed opacity-50' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={!isSelected && atSelectionLimit}
                                                        onChange={event => setSelectedExistingMembers(current => event.target.checked
                                                            ? [...current, { sourceTeamId: choice.sourceTeamId, memberIndex: choice.memberIndex }]
                                                            : current.filter(selection => `${selection.sourceTeamId}:${selection.memberIndex}` !== choiceKey)
                                                        )}
                                                        className="mt-0.5 h-4 w-4 accent-teal-700"
                                                    />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-bold text-gray-900">{choice.member.fullName || 'Unnamed participant'}</span>
                                                        <span className="mt-0.5 block truncate text-xs text-gray-500">{choice.member.email || choice.member.phone || 'No contact details'}</span>
                                                        <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-wide text-teal-800">From {choice.sourceTeamName} · {choice.sourceTeamId}</span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                        {!existingMemberChoices.length && (
                                            <p className="px-3 py-8 text-center text-sm text-gray-500">No participants found on other teams.</p>
                                        )}
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-gray-500">Selected people will be removed from their current teams. An empty source team will be removed from the active directory.</p>
                                </div>
                            )}
                            <div className="mt-7 flex justify-end gap-3">
                                <button
                                    onClick={() => setAddingToTeam(null)}
                                    className="rounded-lg bg-gray-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-700 transition hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddParticipant}
                                    disabled={isAddingMember || (addParticipantMode === 'manual' ? !newMemberForm.fullName.trim() : !selectedExistingMembers.length)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#14b8a6] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#0d9488] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isAddingMember ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    {isAddingMember ? 'Saving...' : addParticipantMode === 'manual' ? 'Add Participant' : 'Move Selected'}
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
