"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    Users,
    ShieldCheck,
    Trash2,
    Plus,
    ExternalLink,
    Code,
    Presentation,
    Play,
    Globe,
    Search,
    MapPin,
    AlertTriangle,
    Save,
    UserCog,
    Lock,
    Eye,
    Download,
    Upload,
    LayoutDashboard,
    CheckCircle2,
    ClipboardList,
    ArrowUpRight,
    Coffee,
    X
} from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect, useRef } from "react";
import { useHackathon } from "@/context/HackathonContext";
import { EVENT_MEALS } from "@/lib/meals";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Papa from "papaparse";

export default function AdminDashboard() {
    const {
        projects,
        isLoading,
        judges,
        addJudge,
        removeJudge,
        volunteers,
        addVolunteer,
        removeVolunteer,
        emergencyContact,
        updateEmergencyContact,
        enabledMeals,
        updateEnabledMeals,
        bulkAssignMealPlan
    } = useHackathon();

    const [activeTab, setActiveTab] = useState<'teams' | 'judges' | 'volunteers' | 'settings'>('teams');
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
    const [emergencyForm, setEmergencyForm] = useState({ name: "", phone: "" });
    const [isEditingEmergency, setIsEditingEmergency] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [selectedMergeTeams, setSelectedMergeTeams] = useState<string[]>([]);
    const [mergeTeamName, setMergeTeamName] = useState("");
    const [isMerging, setIsMerging] = useState(false);
    const [mergeSearchQuery, setMergeSearchQuery] = useState("");
    const [mergeResult, setMergeResult] = useState<{ teamId: string; teamName: string; password: string; memberCount: number } | null>(null);

    const [showBulkMealModal, setShowBulkMealModal] = useState(false);
    const [selectedBulkMeals, setSelectedBulkMeals] = useState<string[]>([]);
    const [isBulkAssigning, setIsBulkAssigning] = useState(false);

    useEffect(() => {
        const sectionToTab = {
            entries: 'teams',
            judges: 'judges',
            volunteers: 'volunteers',
            meals: 'settings'
        } as const;
        const selectSection = (section: string) => {
            setActiveTab(sectionToTab[section as keyof typeof sectionToTab] || 'teams');
        };
        const syncActiveTab = () => selectSection(window.location.hash.slice(1));
        const handleSidebarNavigation = (event: Event) => {
            selectSection((event as CustomEvent<string>).detail);
        };
        syncActiveTab();
        window.addEventListener('hashchange', syncActiveTab);
        window.addEventListener('admin-section-change', handleSidebarNavigation);
        return () => {
            window.removeEventListener('hashchange', syncActiveTab);
            window.removeEventListener('admin-section-change', handleSidebarNavigation);
        };
    }, []);
    
    // Pagination state for scalability
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Silent one-time backfill: if any team has no password OR has old-format password (no '@'), regenerate all
    const backfillRan = useRef(false);
    useEffect(() => {
        if (isLoading) return; // Wait until data is loaded
        if (backfillRan.current) return; // Only run once per session
        if (projects.length === 0) return;
        // Old format: TRI-TEAMNAME-101 (no '@')
        // New format: RA-AN-PR@TRI-101 (has '@')
        const needsUpdate = projects.some(p => !p.password || !p.password.includes('@'));
        if (!needsUpdate) return; // All passwords already in new format
        backfillRan.current = true;
        console.log(`ðŸ”‘ Detected old/missing passwords â€” regenerating with new member-initials formula...`);
        fetch('/api/admin/generate-passwords', { method: 'POST' })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    console.log(`âœ… Passwords updated for ${data.updated} teams. Refreshing...`);
                    window.location.reload();
                }
            })
            .catch(err => console.error('Password backfill failed:', err));
    }, [projects, isLoading]);

    const handleMergeTeams = async () => {
        if (selectedMergeTeams.length < 2) {
            toast.error("Please select at least 2 teams to merge.");
            return;
        }
        if (!mergeTeamName.trim()) {
            toast.error("Please enter a name for the new merged team.");
            return;
        }
        setIsMerging(true);
        try {
            const res = await fetch('/api/admin/merge-teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceTeamIds: selectedMergeTeams,
                    newTeamName: mergeTeamName
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setShowMergeModal(false);
                setSelectedMergeTeams([]);
                setMergeTeamName("");
                setMergeResult({
                    teamId: data.newTeamId,
                    teamName: data.newTeamName,
                    password: data.newPassword,
                    memberCount: data.memberCount
                });
            } else {
                toast.error(data.error || "Failed to merge teams");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during merge");
        } finally {
            setIsMerging(false);
        }
    };

    const handleBulkMealAssign = async () => {
        if (selectedBulkMeals.length === 0) {
            toast.error("Please select at least one meal to assign.");
            return;
        }
        setIsBulkAssigning(true);
        try {
            const allProjectIds = projects.map(p => p.id);
            await bulkAssignMealPlan(allProjectIds, selectedBulkMeals, true);
            setShowBulkMealModal(false);
            setSelectedBulkMeals([]);
        } finally {
            setIsBulkAssigning(false);
        }
    };

    const [newJudge, setNewJudge] = useState({ name: "", specialization: "" });
    const [newVolunteer, setNewVolunteer] = useState({ name: "", phone: "", role: "" });
    const filteredTeams = useMemo(() => {
        return projects.filter(p => {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return true;

            const teamName = (p.team || "Unknown Team").toLowerCase();
            const captainName = (p.captain || "N/A").toLowerCase();

            const matchesTeam = teamName.includes(query);
            const matchesId = (p.teamId || "").toLowerCase().includes(query);
            const matchesCaptain = captainName.includes(query);

            // Handle numeric-only search (e.g., "101" -> matches "VH-101")
            const isNumeric = /^\d+$/.test(query);
            const matchesPrefixId = isNumeric && (p.teamId || "").toLowerCase().includes(`tricity_${query}`);

            return matchesTeam || matchesId || matchesCaptain || matchesPrefixId;
        });
    }, [projects, searchQuery]);

    const paginatedTeams = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTeams.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTeams, currentPage]);

    const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);

    const dashboardStats = useMemo(() => {
        let totalMealsClaimed = 0;
        let totalMealsIncluded = 0;
        projects.forEach(p => {
            if (p.memberMealState) {
                Object.values(p.memberMealState).forEach(memberSlots => {
                    Object.values(memberSlots).forEach(slot => {
                        totalMealsIncluded++; // Each slot represents an included meal
                        if (slot.claimedAt) totalMealsClaimed++;
                    });
                });
            }
        });

        return {
            total: projects.length,
            active: projects.length,
            mealsClaimed: totalMealsClaimed,
            mealsIncluded: totalMealsIncluded
        };
    }, [projects]);

    // --- CSV IMPORT LOGIC ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const loadingToast = toast.loading(`Parsing ${file.name}...`);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rows = results.data as Record<string, string>[];
                    const hasRegistrationIds = rows.some(row => row['Registration ID']?.trim());
                    const registrations = hasRegistrationIds
                        ? Array.from(rows.reduce((groups, row) => {
                            const teamId = row['Registration ID']?.trim();
                            if (!teamId) return groups;

                            const participant = {
                                fullName: row['Name']?.trim() || '',
                                email: row['Email']?.trim() || '',
                                phone: row['Phone Number']?.trim() || '',
                                college: row['College']?.trim() || '',
                                year: row['Year']?.trim() || '',
                                department: row['Department']?.trim() || ''
                            };
                            if (!participant.fullName && !participant.email) return groups;

                            const registration = groups.get(teamId) || {
                                teamId,
                                teamName: row['Team Name']?.trim() || '',
                                track: row['Selected Tracks']?.trim() || 'General',
                                participants: [] as { participant: typeof participant; isLeader: boolean }[]
                            };
                            registration.participants.push({
                                participant,
                                isLeader: row['Role']?.trim().toLowerCase() === 'team leader'
                            });
                            groups.set(teamId, registration);
                            return groups;
                        }, new Map<string, { teamId: string; teamName: string; track: string; participants: { participant: { fullName: string; email: string; phone: string; college: string; year: string; department: string }; isLeader: boolean }[] }>()).values())
                            .map(registration => {
                                registration.participants.sort((a, b) => Number(b.isLeader) - Number(a.isLeader));
                                const participants = registration.participants.map(entry => entry.participant);
                                return {
                                    ...registration,
                                    participants,
                                    teamName: registration.teamName.toLowerCase() === 'individual'
                                        ? participants[0]?.fullName || registration.teamName
                                        : registration.teamName
                                };
                            })
                        : rows.map((row) => {
                        const participants = [];
                        
                        // Leader
                        if (row['Leader Name'] || row['Leader Email']) {
                            participants.push({
                                fullName: row['Leader Name'] || '',
                                email: row['Leader Email'] || '',
                                phone: row['Leader Phone'] || '',
                                college: row['College'] || ''
                            });
                        }
                        // Member 2
                        if (row['Member 2 Name'] || row['Member 2 Email']) {
                            participants.push({
                                fullName: row['Member 2 Name'] || '',
                                email: row['Member 2 Email'] || '',
                                phone: row['Member 2 Phone'] || ''
                            });
                        }
                        // Member 3
                        if (row['Member 3 Name'] || row['Member 3 Email']) {
                            participants.push({
                                fullName: row['Member 3 Name'] || '',
                                email: row['Member 3 Email'] || '',
                                phone: row['Member 3 Phone'] || ''
                            });
                        }
                        // Member 4
                        if (row['Member 4 Name'] || row['Member 4 Email']) {
                            participants.push({
                                fullName: row['Member 4 Name'] || '',
                                email: row['Member 4 Email'] || '',
                                phone: row['Member 4 Phone'] || ''
                            });
                        }

                        return {
                            teamName: row['Team Name'] || '',
                            track: row['Track'] || 'General',
                            problemStatement: row['Problem Statement'] || '',
                            participants
                        };
                    });

                    toast.loading(`Importing ${registrations.length} teams...`, { id: loadingToast });

                    // 1. Import Registrations
                    const importRes = await fetch('/api/admin/import-registrations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ registrations })
                    });
                    const importData = await importRes.json();
                    
                    if (!importData.success) throw new Error(importData.error || 'Import failed');

                    if (importData.emailFailures > 0) {
                        toast.warning(`Imported ${importData.imported} teams; ${importData.emailsSent} emails sent, ${importData.emailFailures} failed.`, { id: loadingToast });
                    } else {
                        toast.success(`Successfully imported ${importData.imported} teams and sent ${importData.emailsSent} emails.`, { id: loadingToast });
                    }
                    
                    // Reload page to fetch new data
                    setTimeout(() => window.location.reload(), 2000);
                } catch (error: any) {
                    console.error("CSV Import Error:", error);
                    toast.error(error.message || "Failed to process CSV file", { id: loadingToast });
                } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            },
            error: (error) => {
                toast.error(`Error parsing CSV: ${error.message}`, { id: loadingToast });
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };
    // ------------------------

    // Shared branded report opener
    const openBrandedReport = (title: string, subtitle: string, headers: string[], rows: (string | number | undefined | null)[][], filename: string) => {
        const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
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
    <title>TRI-CITY AI HACKATHON â€” ${title}</title>
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
        <span style="font-weight:700;font-size:13px;">ðŸ“‹ TRI-CITY AI HACKATHON â€” ${title} (${rows.length} records)</span>
        <button onclick="window.print()" style="background:#14b8a6;color:#000;border:none;padding:8px 22px;
            border-radius:6px;font-weight:900;font-size:13px;cursor:pointer;">ðŸ–¨ï¸ Print / Save as PDF</button>
    </div>
    <div style="padding:18px 24px;margin-top:50px;">
        <div style="display:flex;align-items:center;justify-content:flex-start;gap:20px;margin-bottom:8px;">
            <img src="/Centle India-logo.png" style="height:80px;object-fit:contain;flex-shrink:0;" />
            <div style="font-family:'Segoe UI',Arial,sans-serif;">
                <div style="font-size:11px;color:#333;letter-spacing:0.5px;font-weight:700;">Centle India</div>
                <div style="font-size:22px;font-weight:900;letter-spacing:3px;color:#1a1a8c;margin-top:4px;">TRI-CITY AI HACKATHON</div>
                <div style="font-size:13px;font-weight:700;letter-spacing:5px;color:#cc0000;margin-top:2px;">${title.toUpperCase()}</div>
                <div style="font-size:10px;color:#888;margin-top:5px;">Date: ${now} &nbsp;|&nbsp; ${subtitle}: ${rows.length}</div>
            </div>
        </div>
        <div style="height:3px;background:linear-gradient(90deg,#cc0000,#1a1a8c,#cc0000);margin:8px 0 14px;border-radius:2px;"></div>
        <table><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table>
        <div style="margin-top:14px;text-align:center;font-size:9px;color:#bbb;border-top:1px solid #eee;padding-top:8px;">
            TRI-CITY AI HACKATHON Hackathon &nbsp;|&nbsp; Centle India &nbsp;|&nbsp; ${title} &nbsp;|&nbsp; Generated: ${now}
        </div>
    </div>
</body>
</html>`;
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    };

    const handleExportTeams = () => {
        const headers = ["Name", "ID", "Track", "College", "Lead", "Lead Mobile", "Status"];
        const rows = filteredTeams.map(t => [t.team, t.teamId, t.track, t.college, t.captain, t.captainMobile, t.status]);
        openBrandedReport("Registrations", "Total Entries", headers, rows, `entries_export_${new Date().toISOString().split('T')[0]}`);
    };

    const handleExportJudges = () => {
        const headers = ["Name", "Judge ID", "Specialization", "Password"];
        const rows = judges.map(j => [j.name, j.generatedId, j.specialization, j.password]);
        openBrandedReport("Judges Directory", "Total Judges", headers, rows, `judges_export_${new Date().toISOString().split('T')[0]}`);
    };

    const handleExportVolunteers = () => {
        const headers = ["Name", "Volunteer ID", "Phone", "Role", "Password"];
        const rows = volunteers.map(v => [v.name, v.generatedId, v.phone, v.role, v.password]);
        openBrandedReport("Volunteers Directory", "Total Volunteers", headers, rows, `volunteers_export_${new Date().toISOString().split('T')[0]}`);
    };

    if (isLoading) {
        return (
            <DashboardLayout type="admin" title="Initializing Admin Grid...">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="admin" title="Admin workspace">
            <div className="mx-auto max-w-[1600px] space-y-8 pb-10">
                <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    <MetricCard label="Registered entries" value={dashboardStats.total} icon={Users} tone="purple" />
                    <MetricCard label="Participating entries" value={dashboardStats.active} icon={CheckCircle2} tone="green" />
                    <MetricCard label="Meals claim rate" value={dashboardStats.mealsIncluded > 0 ? `${Math.round((dashboardStats.mealsClaimed / dashboardStats.mealsIncluded) * 100)}%` : "0%"} icon={Coffee} tone="red" />
                </section>

            {/* Registrations Tab */}
            {activeTab === 'teams' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="font-kanit text-2xl font-black uppercase italic tracking-tight text-white">Registration entries</h2>
                            <p className="mt-1 text-xs text-white/45">Search registrations or open a participant's complete record.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-white/45"><span className="h-2 w-2 rounded-full bg-[#14b8a6]" /> {filteredTeams.length} shown</div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Search by ID (e.g. 101) or Team Name..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                            className="h-14 w-full rounded-xl border border-white/10 bg-[#0B0114]/60 py-3 pl-12 pr-4 text-sm font-medium text-white outline-none transition-all placeholder:text-white/25 focus:border-[#14b8a6]/70 focus:ring-2 focus:ring-[#14b8a6]/10"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={19} />
                        </div>
                        <div className="flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total</span>
                            <span className="text-xl font-black italic text-[#14b8a6]">{projects.length}</span>
                        </div>
                        <button
                            onClick={handleExportTeams}
                            className="flex h-14 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-[10px] font-black uppercase tracking-wider text-white transition hover:border-[#14b8a6]/50 hover:text-[#14b8a6]"
                        >
                            <Download size={18} /> Export
                        </button>
                        
                        {/* Merge Teams */}
                        <button
                            onClick={() => setShowMergeModal(true)}
                            className="flex h-14 shrink-0 items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/20 px-5 text-[10px] font-black uppercase tracking-wider text-blue-400 transition hover:border-blue-500/70 hover:bg-blue-500/30"
                        >
                            <Users size={18} /> Merge Teams
                        </button>

                        {/* CSV Import */}
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="flex h-14 shrink-0 items-center gap-2 rounded-xl border border-[#a855f7]/40 bg-[#a855f7]/20 px-5 text-[10px] font-black uppercase tracking-wider text-[#c084fc] transition hover:border-[#a855f7]/70 hover:bg-[#a855f7]/30 disabled:opacity-50"
                        >
                            {isImporting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#c084fc] border-t-transparent" />
                            ) : (
                                <Upload size={18} />
                            )}
                            {isImporting ? 'Importing...' : 'Import CSV'}
                        </button>
                        
                        {/* Bulk Meals Button */}
                        <button
                            onClick={() => setShowBulkMealModal(true)}
                            className="flex h-14 shrink-0 items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/20 px-5 text-[10px] font-black uppercase tracking-wider text-amber-400 transition hover:border-amber-500/70 hover:bg-amber-500/30"
                        >
                            <Coffee size={18} /> Bulk Meal Assign
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {paginatedTeams.map((team) => (
                            <div
                                key={team.id}
                                className={`bg-white/5 border border-white/10 rounded-[2rem] transition-all hover:bg-white/[0.07] cursor-pointer overflow-hidden ${expandedTeamId === team.id ? 'bg-white/[0.08] shadow-2xl' : 'opacity-80'}`}
                                onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                            >
                                <div className="p-8">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black bg-slate-900/20 text-slate-900">
                                                {team.team ? team.team[0] : "?"}
                                            </div>
                                            <div>
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{team.team}</h3>
                                                    <span className="text-[10px] font-black text-[#14b8a6] px-2 py-0.5 border border-[#14b8a6]/30 rounded bg-[#14b8a6]/5">{team.teamId}</span>
                                                </div>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">{team.track} • {team.college}</p>
                                                <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                                    <Lock size={10} className="text-blue-400/60" />
                                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Login credentials are protected</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-4">
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedTeamId === team.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8 mt-8 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                                                    {/* 1. Project Title */}
                                                    <div className="space-y-3">
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2"><MapPin size={10} /> Project Title</span>
                                                        <div className="bg-black/20 rounded-xl p-4 border border-white/5 h-32 overflow-y-auto custom-scrollbar">
                                                            <p className="text-xs text-white/60 leading-relaxed font-medium whitespace-pre-wrap">{team.problemStatement || "No title defined yet."}</p>
                                                        </div>
                                                    </div>

                                                    {/* 2. Final Submissions */}
                                                    <div className="space-y-3">
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2"><Globe size={10} /> Final Submissions</span>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[
                                                                { label: 'GitHub', url: team.submission?.github, icon: Code },
                                                                { label: 'Pitch', url: team.submission?.presentation, icon: Presentation },
                                                                { label: 'Demo', url: team.submission?.demo, icon: Play },
                                                                { label: 'Live', url: team.submission?.deployment, icon: Globe }
                                                            ].map((link, idx) => {
                                                                const formattedUrl = link.url && !link.url.match(/^https?:\/\//)
                                                                    ? `https://${link.url}`
                                                                    : link.url;

                                                                return (
                                                                    <a
                                                                        key={idx}
                                                                        href={formattedUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${link.url ? 'bg-green-500/5 border-green-500/20 text-green-400 hover:bg-green-500/10' : 'bg-white/5 border-white/5 text-white/10 pointer-events-none'}`}
                                                                    >
                                                                        <link.icon size={14} />
                                                                        <span className="text-[8px] font-black uppercase">{link.label}</span>
                                                                    </a>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* 3. Credential storage */}
                                                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2"><Lock size={10} /> Login credentials</span>
                                                        <p className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs leading-relaxed text-white/50">
                                                            Credentials are stored as one-way hashes and cannot be viewed here. The team receives its password when credentials are issued.
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-50 hover:bg-white/10 transition"
                            >
                                Previous
                            </button>
                            <span className="text-white/50 text-sm font-bold">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-50 hover:bg-white/10 transition"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Judges Tab */}
            {activeTab === 'judges' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Add Official Judge</h3>
                            <button
                                onClick={handleExportJudges}
                                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-[#14b8a6] hover:border-[#14b8a6]/50 transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
                            >
                                <Download size={18} /> Export Judges CSV
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Full Name</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#14b8a6]"
                                    value={newJudge.name}
                                    placeholder="e.g. Dr. Smith"
                                    onChange={(e) => setNewJudge({ ...newJudge, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Specialization Domain</label>
                                <input
                                    className="w-full bg-[#0B0114] border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#14b8a6] transition-colors"
                                    value={newJudge.specialization}
                                    placeholder="e.g. General"
                                    onChange={(e) => setNewJudge({ ...newJudge, specialization: e.target.value })}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        if (newJudge.name && newJudge.specialization) {
                                            addJudge(newJudge);
                                            setNewJudge({ name: "", specialization: "" });
                                        }
                                    }}
                                    className="w-full py-4 rounded-2xl bg-[#14b8a6] text-black font-black uppercase italic tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                                >
                                    <Plus size={18} /> Add Judicial POC
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-12 mb-6">
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Registered Evaluators</h3>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Total: {judges.length} Judges</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {judges.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                    <p className="text-white/20 font-bold uppercase tracking-[0.3em] text-xs font-kanit">No Judges Assigned Yet</p>
                                </div>
                            ) : (
                                [...judges]
                                    .sort((a, b) => {
                                        const idA = parseInt(a.generatedId?.split("-")[1] || "0");
                                        const idB = parseInt(b.generatedId?.split("-")[1] || "0");
                                        return idA - idB;
                                    })
                                    .map((judge) => (
                                        <div key={judge.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-xl bg-slate-900/20 flex items-center justify-center text-slate-900"><ShieldCheck size={24} /></div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-lg font-black italic uppercase tracking-tight">{judge.name}</h4>
                                                        <span className="text-[9px] font-black text-[#14b8a6] px-2 py-0.5 border border-[#14b8a6]/30 rounded bg-[#14b8a6]/5">{judge.generatedId}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{judge.specialization}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black text-white/20 uppercase block tracking-widest">Credentials</span>
                                                    <code className="text-[10px] font-mono text-slate-900 font-black">{judge.password ? `PASS: ${judge.password}` : 'Password shown only when issued'}</code>
                                                </div>
                                                <button onClick={() => removeJudge(judge.id)} className="p-3 rounded-xl bg-slate-900/10 text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800 hover:text-white"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Volunteers Tab */}
            {activeTab === 'volunteers' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Assign Station Volunteer</h3>
                            <button
                                onClick={handleExportVolunteers}
                                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-[#14b8a6] hover:border-[#14b8a6]/50 transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
                            >
                                <Download size={18} /> Export Volunteers
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Name</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
                                    value={newVolunteer.name}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Phone</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
                                    value={newVolunteer.phone}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Role</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
                                    value={newVolunteer.role}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, role: e.target.value })}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        if (newVolunteer.name && newVolunteer.phone) {
                                            addVolunteer(newVolunteer);
                                            setNewVolunteer({ name: "", phone: "", role: "" });
                                        }
                                    }}
                                    className="w-full py-4 rounded-2xl bg-[#14b8a6] text-black font-black uppercase italic tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> Register Staff
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {volunteers.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                    <p className="text-white/20 font-bold uppercase tracking-[0.3em] text-xs font-kanit">No Volunteers Registered</p>
                                </div>
                            ) : (
                                volunteers.map((vol) => (
                                    <div key={vol.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400"><Users size={24} /></div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-lg font-black italic uppercase tracking-tight">{vol.name}</h4>
                                                    <span className="text-[9px] font-black text-blue-400 px-2 py-0.5 border border-blue-400/30 rounded bg-blue-400/5">{vol.generatedId}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{vol.role} • {vol.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="text-[9px] font-black text-white/20 uppercase block tracking-widest">Credentials</span>
                                                <code className="text-[10px] font-mono text-blue-400 font-black">{vol.password ? `PASS: ${vol.password}` : 'Password shown only when issued'}</code>
                                            </div>
                                            <button onClick={() => removeVolunteer(vol.id)} className="p-3 rounded-xl bg-slate-900/10 text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800 hover:text-white"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Tab - Meal Management */}
            {activeTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#14b8a6]">Meal Settings</h3>
                                <p className="mt-1 text-xs text-white/40">Configure which meals are active for the event. Only enabled meals can be claimed by participants.</p>
                            </div>
                        </div>

                        {/* Enabled Meals Configuration */}
                        <div className="space-y-6 mb-8">
                            <div>
                                <h4 className="text-lg font-black text-white mb-4 uppercase tracking-tight">Available Meals</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {EVENT_MEALS.map((meal) => (
                                        <label key={meal.key} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                                            <input
                                                type="checkbox"
                                                checked={enabledMeals.includes(meal.key)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        updateEnabledMeals([...enabledMeals, meal.key]);
                                                    } else {
                                                        updateEnabledMeals(enabledMeals.filter(k => k !== meal.key));
                                                    }
                                                }}
                                                className="w-5 h-5 rounded border-white/20 bg-black/50 text-[#14b8a6] focus:ring-[#14b8a6]"
                                            />
                                            <div className="flex-1">
                                                <div className="text-white font-black text-sm">{meal.dayLabel} - {meal.mealLabel}</div>
                                                <div className="text-white/50 text-xs font-bold">{meal.shortLabel}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => updateEnabledMeals(EVENT_MEALS.map(m => m.key))}
                                    className="px-4 py-3 rounded-xl bg-[#14b8a6]/20 border border-[#14b8a6]/40 text-[#14b8a6] font-black uppercase text-xs tracking-widest hover:bg-[#14b8a6]/30 transition-all"
                                >
                                    Enable All
                                </button>
                                <button
                                    onClick={() => updateEnabledMeals([])}
                                    className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-black uppercase text-xs tracking-widest hover:bg-red-500/30 transition-all"
                                >
                                    Disable All
                                </button>
                            </div>
                        </div>

                        {/* Meal Statistics */}
                        <div className="border-t border-white/10 pt-8">
                            <h4 className="text-lg font-black text-white mb-4 uppercase tracking-tight">Meal Claim Statistics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {enabledMeals.map((mealKey) => {
                                    const meal = EVENT_MEALS.find(m => m.key === mealKey);
                                    const totalClaims = projects.reduce((sum, p) => {
                                        const mms = p.memberMealState || {};
                                        return sum + Object.values(mms).filter(memberSlots => 
                                            memberSlots[mealKey]?.claimedAt
                                        ).length;
                                    }, 0);
                                    
                                    const totalMembers = projects.reduce((sum, p) => sum + (p.members?.length || 0), 0);
                                    
                                    return (
                                        <div key={mealKey} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                            <div className="text-white font-black text-sm mb-1">{meal?.shortLabel || mealKey}</div>
                                            <div className="text-[#14b8a6] text-2xl font-black">{totalClaims}</div>
                                            <div className="text-white/50 text-xs">
                                                of {totalMembers} participants ({totalMembers > 0 ? Math.round((totalClaims / totalMembers) * 100) : 0}%)
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reserved panel intentionally disabled. */}
            {false && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Team status</h3>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Change a team’s eligibility status. Restoring a team is available at any time.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active</span>
                                <span className="text-2xl font-black italic text-green-400">{projects.length}</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Registered</span>
                                <span className="text-2xl font-black italic text-green-400">{projects.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative mb-8">
                        <input
                            type="text"
                            placeholder="Search registered team..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 pl-14 text-white font-medium focus:outline-none focus:border-slate-800/50 transition-all"
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={24} />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {filteredTeams.map((team) => (
                            <div
                                key={team.id}
                                className="flex items-center justify-between p-6 rounded-3xl border border-white/10 bg-white/5 transition-all"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black bg-green-500/20 text-green-400">
                                        {team.team ? team.team[0] : "?"}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">{team.team}</h4>
                                            <span className="text-[10px] font-black text-white/40 px-2 py-0.5 border border-white/10 rounded">{team.teamId}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">{team.track}</p>
                                    </div>
                                </div>

                                <button
                                    disabled
                                    className="px-8 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest bg-white/10 text-white/40"
                                >
                                    Registered
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showMergeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-[#0B0114] border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">Merge Teams</h3>
                                    <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-2">Combine Solo/Duo Registrations</p>
                                </div>
                                <button onClick={() => setShowMergeModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                    <Trash2 size={20} className="text-white/50" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">New Team Name</label>
                                    <input value={mergeTeamName} onChange={(e) => setMergeTeamName(e.target.value)} placeholder="e.g. The Innovators" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#14b8a6]" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Search Teams to Merge</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                        <input value={mergeSearchQuery} onChange={(e) => setMergeSearchQuery(e.target.value)} placeholder="Search by name, ID, or captain..." className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[#14b8a6]" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Select Teams ({selectedMergeTeams.length} selected)</label>
                                    <div className="bg-black/30 border border-white/5 rounded-2xl p-2 h-64 overflow-y-auto space-y-1">
                                        {projects.filter(p => !mergeSearchQuery || p.team.toLowerCase().includes(mergeSearchQuery.toLowerCase()) || p.teamId?.toLowerCase().includes(mergeSearchQuery.toLowerCase()) || p.captain?.toLowerCase().includes(mergeSearchQuery.toLowerCase())).map(team => (
                                            <label key={team.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer border border-transparent hover:border-white/5 transition-colors">
                                                <input type="checkbox" checked={selectedMergeTeams.includes(team.id.toString())} onChange={(e) => {
                                                    if (e.target.checked) setSelectedMergeTeams([...selectedMergeTeams, team.id.toString()]);
                                                    else setSelectedMergeTeams(selectedMergeTeams.filter(id => id !== team.id.toString()));
                                                }} className="w-4 h-4 rounded bg-black border-white/20 text-[#14b8a6] focus:ring-[#14b8a6] focus:ring-offset-black" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-white truncate">{team.team}</span>
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/10 text-white/50">{team.teamId}</span>
                                                    </div>
                                                    <div className="text-[10px] text-white/40 truncate">{team.captain} • {team.members?.length || 0} member(s)</div>
                                                </div>
                                            </label>
                                        ))}
                                        {projects.length === 0 && <div className="p-4 text-center text-white/40 text-xs">No teams found</div>}
                                    </div>
                                </div>

                                <button onClick={handleMergeTeams} disabled={isMerging || selectedMergeTeams.length < 2 || !mergeTeamName} className="w-full py-4 rounded-2xl bg-[#14b8a6] text-black font-black uppercase italic text-sm tracking-widest shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2">
                                    {isMerging ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Users size={18} />}
                                    {isMerging ? "Merging Teams..." : "Confirm Merge"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {mergeResult && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B0114] p-7 shadow-2xl">
                            <div className="mb-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#14b8a6]">Merge complete</p>
                                <h3 className="mt-2 text-2xl font-black uppercase text-white">{mergeResult.teamName}</h3>
                                <p className="mt-1 text-sm text-white/50">{mergeResult.memberCount} members can use these participant credentials.</p>
                            </div>
                            <div className="space-y-3">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Team ID</p>
                                    <p className="mt-2 select-all font-mono text-lg font-bold text-white">{mergeResult.teamId}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Password</p>
                                    <p className="mt-2 select-all break-all font-mono text-lg font-bold text-[#14b8a6]">{mergeResult.password}</p>
                                </div>
                            </div>
                            <button onClick={() => { setMergeResult(null); window.location.reload(); }} className="mt-6 w-full rounded-xl bg-[#14b8a6] py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-white">Done</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {showBulkMealModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-[#0B0114] border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Bulk Meal Assign</h2>
                                    <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-2">Grant access for selected meals to all active teams.</p>
                                </div>
                                <button onClick={() => setShowBulkMealModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                    <X size={20} className="text-white/50" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {EVENT_MEALS.map((meal) => (
                                    <label key={meal.key} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedBulkMeals.includes(meal.key)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedBulkMeals(prev => [...prev, meal.key]);
                                                else setSelectedBulkMeals(prev => prev.filter(k => k !== meal.key));
                                            }}
                                            className="w-5 h-5 rounded border-white/20 bg-black/50 text-[#14b8a6] focus:ring-[#14b8a6]"
                                        />
                                        <div>
                                            <div className="font-bold text-white uppercase text-sm tracking-wider">{meal.mealLabel}</div>
                                            <div className="text-[10px] text-white/40 uppercase tracking-widest">{meal.dayLabel}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-8">
                                <button
                                    onClick={handleBulkMealAssign}
                                    disabled={isBulkAssigning || selectedBulkMeals.length === 0}
                                    className="w-full py-4 rounded-xl font-black uppercase italic tracking-widest transition-all bg-[#14b8a6] text-black hover:bg-[#14b8a6]/80 disabled:opacity-50"
                                >
                                    {isBulkAssigning ? 'ASSIGNING...' : `ASSIGN ${selectedBulkMeals.length} MEAL(S) TO ALL`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}

function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: any; tone: "purple" | "amber" | "green" | "blue" | "orange" | "red" }) {
    const tones = {
        purple: "bg-slate-900/15 text-slate-900 border-slate-800/20",
        amber: "bg-amber-500/15 text-amber-300 border-amber-400/20",
        green: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
        blue: "bg-sky-500/15 text-sky-300 border-sky-400/20",
        orange: "bg-slate-900/15 text-slate-900 border-slate-800/20",
        red: "bg-slate-900/15 text-slate-900 border-slate-800/20",
    };

    return (
        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-lg transition hover:-translate-y-0.5 hover:bg-white/[0.07]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/45">{label}</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
                </div>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tones[tone]}`}><Icon size={17} /></span>
            </div>
        </article>
    );
}
