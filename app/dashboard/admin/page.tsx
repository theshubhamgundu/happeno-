"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    Users,
    ShieldCheck,
    Phone,
    Wifi,
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
    EyeOff,
    Download,
    Upload,
    LayoutDashboard,
    CheckCircle2,
    Clock3,
    ClipboardList,
    ArrowUpRight,
    Activity,
    Coffee,
    X
} from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect, useRef } from "react";
import { useHackathon, Project } from "@/context/HackathonContext";
import { EVENT_MEALS } from "@/lib/meals";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Papa from "papaparse";

export default function AdminDashboard() {
    const {
        projects,
        updateTeamLogistics,
        isLoading,
        judges,
        addJudge,
        removeJudge,
        volunteers,
        addVolunteer,
        removeVolunteer,
        wifiNetworks,
        addWifiNetwork,
        removeWifiNetwork,
        rooms,
        addRoom,
        removeRoom,
        emergencyContact,
        updateEmergencyContact,
        isCertificatesEnabled,
        toggleCertificatesEnabled,
        enabledMeals,
        updateEnabledMeals,
        bulkAssignMealPlan
    } = useHackathon();

    const [activeTab, setActiveTab] = useState<'teams' | 'judges' | 'volunteers' | 'wifi' | 'rooms' | 'settings'>('teams');
    const [searchQuery, setSearchQuery] = useState("");
    const [showLogisticsModal, setShowLogisticsModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Project | null>(null);
    const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
    const [emergencyForm, setEmergencyForm] = useState({ name: "", phone: "" });
    const [isEditingEmergency, setIsEditingEmergency] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<any>>(new Set());
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [selectedMergeTeams, setSelectedMergeTeams] = useState<string[]>([]);
    const [mergeTeamName, setMergeTeamName] = useState("");
    const [isMerging, setIsMerging] = useState(false);
    const [mergeSearchQuery, setMergeSearchQuery] = useState("");

    const [showBulkMealModal, setShowBulkMealModal] = useState(false);
    const [selectedBulkMeals, setSelectedBulkMeals] = useState<string[]>([]);
    const [isBulkAssigning, setIsBulkAssigning] = useState(false);
    
    // Pagination state for scalability
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Silent one-time backfill: if any team has no password OR has old-format password (no '@'), regenerate all
    const backfillRan = useRef(false);
    useEffect(() => {
        if (isLoading) return; // Wait until data is loaded
        if (backfillRan.current) return; // Only run once per session
        if (projects.length === 0) return;
        // Old format: VH26-TEAMNAME-101 (no '@')
        // New format: RA-AN-PR@VH26-101 (has '@')
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
                setTimeout(() => window.location.reload(), 1500);
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

    const togglePasswordVisibility = (teamId: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setVisiblePasswords(prev => {
            const next = new Set(prev);
            if (next.has(teamId)) next.delete(teamId);
            else next.add(teamId);
            return next;
        });
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
    const [newWifi, setNewWifi] = useState({ ssid: "", pass: "" });
    const [newRoom, setNewRoom] = useState({ name: "", capacity: "" });
    const [localLogistics, setLocalLogistics] = useState({
        room: "",
        volunteer_name: "",
        volunteer_phone: "",
        roomWifiSSID: "",
        roomWifiPass: ""
    });

    const handleOpenLogistics = (team: Project) => {
        setSelectedTeam(team);
        setLocalLogistics({
            room: team.room || "",
            volunteer_name: team.coordinator?.name || "",
            volunteer_phone: team.coordinator?.phone || "",
            roomWifiSSID: team.roomWifiSSID || "",
            roomWifiPass: team.roomWifiPass || ""
        });
        setShowLogisticsModal(true);
    };

    const handleSaveLogistics = () => {
        if (selectedTeam) {
            updateTeamLogistics(selectedTeam.id, localLogistics);
            setShowLogisticsModal(false);
        }
    };

    const handleVerifyPayment = async (transactionId?: string) => {
        if (!transactionId) {
            toast.error("No Transaction ID found for this team.");
            return;
        }

        const loadingToast = toast.loading("Verifying Payment & Sending Email...");

        try {
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId })
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Payment Verified! Confirmation Email Sent.");
                // Ideally update context, but reload works for now to sync everything
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.error("Verification Failed: " + data.message);
            }
        } catch (error) {
            toast.error("Network Error during verification");
        } finally {
            toast.dismiss(loadingToast);
        }
    };


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
        const pending = projects.filter(project => project.status === "PENDING");
        const assigned = projects.filter(project => Boolean(project.room));

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
            pending: pending.length,
            active: projects.length,
            assigned: assigned.length,
            unassigned: projects.length - assigned.length,
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
                    const rows = results.data as any[];
                    // Map generic headers to our expected JSON
                    const registrations = rows.map((row) => {
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

                    toast.loading(`Generating credentials for imported teams...`, { id: loadingToast });

                    // 2. Generate Passwords & Team IDs
                    const pwdRes = await fetch('/api/admin/generate-passwords', { method: 'POST' });
                    const pwdData = await pwdRes.json();

                    if (!pwdData.success) throw new Error(pwdData.error || 'Credential generation failed');

                    toast.success(`Successfully imported ${importData.imported} teams and generated credentials!`, { id: loadingToast });
                    
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
        const headers = ["Name", "ID", "Track", "College", "Lead", "Lead Mobile", "Status", "Room"];
        const rows = filteredTeams.map(t => [t.team, t.teamId, t.track, t.college, t.captain, t.captainMobile, t.status, t.room || "TBD"]);
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

    const handleExportWifi = () => {
        const headers = ["SSID / Network Name", "Password"];
        const rows = wifiNetworks.map(w => [w.ssid, w.pass]);
        openBrandedReport("WiFi Networks", "Total Networks", headers, rows, `wifi_export_${new Date().toISOString().split('T')[0]}`);
    };

    const handleExportRooms = () => {
        const headers = ["Room Name", "Capacity"];
        const rows = rooms.map(r => [r.name, r.capacity]);
        openBrandedReport("Room Assignments", "Total Rooms", headers, rows, `rooms_export_${new Date().toISOString().split('T')[0]}`);
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
                <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(125deg,rgba(89,28,135,0.42),rgba(13,8,30,0.9)_48%,rgba(18,13,36,0.82))] p-6 md:p-8 shadow-2xl">
                    <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#14b8a6]/10 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 h-40 w-80 rounded-full bg-slate-900/15 blur-3xl" />
                    <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#14b8a6]">
                                <Activity size={14} /> Operations overview
                            </div>
                            <h1 className="font-kanit text-3xl font-black italic uppercase tracking-tight text-white md:text-5xl">TRICITY control room</h1>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 md:text-base">Monitor registrations, complete pending approvals, and keep event operations organized from one focused workspace.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={toggleCertificatesEnabled} className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition hover:-translate-y-0.5 ${isCertificatesEnabled ? 'bg-green-500 text-white shadow-[0_8px_24px_rgba(34,197,94,0.3)]' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                                <Download size={16} /> {isCertificatesEnabled ? "Certificates: Enabled" : "Certificates: Disabled"}
                            </button>
                            <button onClick={() => setActiveTab("teams")} className="inline-flex items-center gap-2 rounded-xl bg-[#14b8a6] px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:-translate-y-0.5 hover:bg-white">
                                <Users size={16} /> View teams
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <MetricCard label="Registered entries" value={dashboardStats.total} icon={Users} tone="purple" />
                    <MetricCard label="Awaiting review" value={dashboardStats.pending} icon={Clock3} tone="amber" />
                    <MetricCard label="Participating entries" value={dashboardStats.active} icon={CheckCircle2} tone="green" />
                    <MetricCard label="Room assigned" value={dashboardStats.assigned} icon={MapPin} tone="blue" />
                    <MetricCard label="Meals claim rate" value={dashboardStats.mealsIncluded > 0 ? `${Math.round((dashboardStats.mealsClaimed / dashboardStats.mealsIncluded) * 100)}%` : "0%"} icon={Coffee} tone="red" />
                </section>

            {/* Navigation Tabs */}
            <section className="rounded-[1.5rem] border border-white/10 bg-[#10091c]/70 p-2 shadow-lg backdrop-blur-xl">
                <div className="mb-2 px-3 pt-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Manage event operations</div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                {[
                    { id: 'teams', label: 'Entries', icon: Users },
                    { id: 'judges', label: 'Judges', icon: ShieldCheck },
                    { id: 'volunteers', label: 'Volunteers', icon: Phone },
                    { id: 'wifi', label: 'WiFi', icon: Wifi },
                    { id: 'rooms', label: 'Rooms', icon: MapPin },
                    { id: 'settings', label: 'Meals', icon: Coffee }
                ].map((tab: { id: string, label: string, icon: any }) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab.id
                            ? 'bg-[#14b8a6] text-black shadow-[0_8px_24px_rgba(20,184,166,0.18)]'
                            : 'text-white/50 hover:bg-white/8 hover:text-white'
                            }`}
                    >
                        <tab.icon size={16} />
                        <span className="truncate">{tab.label}</span>
                    </button>
                ))}
                </div>
            </section>

            {/* Registrations Tab */}
            {activeTab === 'teams' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="font-kanit text-2xl font-black uppercase italic tracking-tight text-white">Registration entries</h2>
                            <p className="mt-1 text-xs text-white/45">Search, verify payments, assign logistics, or open a participant's complete record.</p>
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
                                                    {team.status === 'PENDING' && (
                                                        <span className="text-[8px] font-black bg-slate-900/20 text-slate-900 border border-slate-800/50 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
                                                            Verification Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">{team.track} • {team.college}</p>
                                                {/* Password Badge */}
                                                <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                                    <Lock size={10} className="text-blue-400/60" />
                                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Password:</span>
                                                    <code className={`text-[11px] font-mono font-bold transition-all ${team.password
                                                        ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                                                        : 'text-white/20 bg-white/5 border border-white/10'
                                                        } px-2 py-0.5 rounded`}>
                                                        {team.password
                                                            ? (visiblePasswords.has(team.id) ? team.password : '••••••••')
                                                            : 'Not Set'}
                                                    </code>
                                                    {team.password && (
                                                        <button
                                                            onClick={(e) => togglePasswordVisibility(team.id, e)}
                                                            className="text-white/30 hover:text-blue-400 transition-colors"
                                                            title={visiblePasswords.has(team.id) ? 'Hide password' : 'Show password'}
                                                        >
                                                            {visiblePasswords.has(team.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                            {team.status === 'PENDING' && (
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-[#14b8a6]/10 border border-[#14b8a6] px-3 py-2 rounded-lg text-xs font-mono text-[#14b8a6] flex flex-col">
                                                        <span className="text-[8px] opacity-70 uppercase">Transaction ID</span>
                                                        <span className="font-bold">{team.transactionId || team.id}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleVerifyPayment(team.transactionId || team.id)}
                                                        className="px-4 py-3 rounded-xl bg-slate-900 text-white font-black uppercase italic text-[10px] tracking-widest shadow-lg hover:bg-slate-800 transition-all animate-pulse"
                                                    >
                                                        Verify Payment
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4">
                                                <button onClick={() => handleOpenLogistics(team)} className="px-6 py-3 rounded-xl bg-[#14b8a6] text-black font-black uppercase italic text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Assign Logistics</button>
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

                                                    {/* 3. Logistics & Deployment */}
                                                    <div className="space-y-3">
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2"><Wifi size={10} /> Room & Connectivity</span>
                                                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] text-white/40 font-bold uppercase">Room</span>
                                                                <span className="text-xs font-black text-white italic">{team.room || "TBD"}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-tight">Room WiFi</span>
                                                                <div className="text-right">
                                                                    <div className="text-[9px] font-black text-slate-900 italic">SSID: {team.roomWifiSSID || "N/A"}</div>
                                                                    <div className="text-[9px] font-black text-slate-900 italic">PASS: {team.roomWifiPass || "N/A"}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 4. Login Password */}
                                                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2"><Lock size={10} /> Login Password</span>
                                                        <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20 space-y-3">
                                                            <div className="flex justify-between items-center gap-3">
                                                                <span className="text-[10px] text-white/40 font-bold uppercase shrink-0">Team Password</span>
                                                                <code className="text-xs font-mono font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded border border-blue-500/20">
                                                                    {team.password
                                                                        ? (visiblePasswords.has(team.id) ? team.password : '••••••••')
                                                                        : <span className="text-white/20 italic">Not Set</span>}
                                                                </code>
                                                                {team.password && (
                                                                    <button
                                                                        onClick={(e) => togglePasswordVisibility(team.id, e)}
                                                                        className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-blue-400 transition-colors"
                                                                    >
                                                                        {visiblePasswords.has(team.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!team.password && (
                                                            <p className="text-[9px] text-slate-900/70 font-bold uppercase tracking-wide">
                                                                âš  Set a password in Supabase for this team to enable login.
                                                            </p>
                                                        )}
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
                                                    <code className="text-[10px] font-mono text-slate-900 font-black">PASS: {judge.password}</code>
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
                                                <code className="text-[10px] font-mono text-blue-400 font-black">PASS: {vol.password}</code>
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

            {/* WiFi Tab */}
            {activeTab === 'wifi' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#14b8a6]">WiFi Network Management</h3>
                            <button
                                onClick={handleExportWifi}
                                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-[#14b8a6] hover:border-[#14b8a6]/50 transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
                            >
                                <Download size={18} /> Export WiFi CSV
                            </button>
                        </div>

                        {/* Add WiFi Form */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Network Name (SSID)</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#14b8a6] transition-colors"
                                    value={newWifi.ssid}
                                    placeholder="e.g. tricity-Guest"
                                    onChange={(e) => setNewWifi({ ...newWifi, ssid: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Password</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#14b8a6] transition-colors"
                                    value={newWifi.pass}
                                    placeholder="e.g. securePass123"
                                    onChange={(e) => setNewWifi({ ...newWifi, pass: e.target.value })}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        if (newWifi.ssid && newWifi.pass) {
                                            addWifiNetwork(newWifi);
                                            setNewWifi({ ssid: "", pass: "" });
                                        } else {
                                            toast.error("Please fill in both SSID and Password");
                                        }
                                    }}
                                    className="w-full py-4 rounded-2xl bg-[#14b8a6] text-black font-black uppercase italic tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]"
                                >
                                    <Plus size={18} /> Add Network
                                </button>
                            </div>
                        </div >

                        {/* WiFi List */}
                        < div className="space-y-4" >
                            {
                                wifiNetworks.length === 0 ? (
                                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-black/20">
                                        <Wifi size={48} className="mx-auto text-white/10 mb-4" />
                                        <p className="text-white/20 font-black uppercase tracking-[0.2em] text-xs">No WiFi Networks Configured</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {wifiNetworks.map((net) => (
                                            <div key={net.id} className="relative p-6 bg-white/5 border border-white/10 rounded-[1.5rem] group hover:bg-white/[0.08] transition-all hover:border-white/20 overflow-hidden">
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-900/20 flex items-center justify-center text-slate-900 border border-slate-800/20 shadow-[0_0_15px_rgba(147,51,234,0.15)]">
                                                            <Wifi size={20} />
                                                        </div>
                                                        <button
                                                            onClick={() => removeWifiNetwork(net.id)}
                                                            className="w-8 h-8 rounded-lg bg-slate-900/10 text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800 hover:text-white transform group-hover:scale-110 active:scale-95"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black italic uppercase tracking-tighter text-white truncate" title={net.ssid}>{net.ssid}</h4>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Key:</span>
                                                            <code className="text-[10px] font-mono text-[#14b8a6] font-bold bg-[#14b8a6]/10 px-2 py-1 rounded border border-[#14b8a6]/20 truncate">{net.pass}</code>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Rooms Tab */}
            {activeTab === 'rooms' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#14b8a6]">Room directory</h3>
                                <p className="mt-1 text-xs text-white/40">Create rooms and record their available capacity or facilities.</p>
                            </div>
                            <button
                                onClick={handleExportRooms}
                                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-[#14b8a6] hover:border-[#14b8a6]/50 transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
                            >
                                <Download size={18} /> Export Rooms CSV
                            </button>
                        </div>

                        {/* Add Room Form */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Room Name / Number</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#14b8a6] transition-colors"
                                    value={newRoom.name}
                                    placeholder="e.g. LAB 101"
                                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Capacity / Info</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#14b8a6] transition-colors"
                                    value={newRoom.capacity}
                                    placeholder="e.g. 50 pax or Projector Available"
                                    onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        if (newRoom.name && newRoom.capacity) {
                                            addRoom(newRoom);
                                            setNewRoom({ name: "", capacity: "" });
                                        } else {
                                            toast.error("Please fill in both Name and Capacity info");
                                        }
                                    }}
                                    className="w-full py-4 rounded-2xl bg-[#14b8a6] text-black font-black uppercase italic tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                                >
                                    <Plus size={18} /> Add Room
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {rooms.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-black/20">
                                    <MapPin size={48} className="mx-auto text-white/10 mb-4" />
                                    <p className="text-white/20 font-black uppercase tracking-[0.2em] text-xs">No Rooms Configured</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rooms.map((room) => (
                                        <div key={room.id} className="relative p-6 bg-white/5 border border-white/10 rounded-[1.5rem] group hover:bg-white/[0.08] transition-all hover:border-white/20 overflow-hidden">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                                        <MapPin size={20} />
                                                    </div>
                                                    <button onClick={() => removeRoom(room.id)} className="w-8 h-8 rounded-lg bg-slate-900/10 text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800 hover:text-white">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black italic uppercase tracking-tighter text-white truncate">{room.name}</h4>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Details:</span>
                                                        <span className="text-[10px] font-bold text-white/60 truncate">{room.capacity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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

            {/* Logistics Modal */}
            <AnimatePresence>
                {showLogisticsModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogisticsModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0B0114] border border-white/10 rounded-[3rem] p-8 lg:p-12 max-w-xl w-full relative z-10 text-white">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-8 text-[#14b8a6]">Deploy Team Logistics</h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Assigned Room</label>
                                        <select className="w-full bg-[#0B0114] border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#14b8a6] appearance-none" value={localLogistics.room} onChange={(e) => setLocalLogistics({ ...localLogistics, room: e.target.value })}>
                                            <option value="">Select Room</option>
                                            {rooms.map(room => (<option key={room.id} value={room.name}>{room.name} ({room.capacity})</option>))}
                                            <option value="custom">Custom...</option>
                                        </select>
                                        {localLogistics.room === "custom" && (<input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none mt-2" onChange={(e) => setLocalLogistics({ ...localLogistics, room: e.target.value })} placeholder="Enter Room Name" />)}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Assign Coordinator</label>
                                        <select className="w-full bg-[#0B0114] border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#14b8a6] appearance-none" value={localLogistics.volunteer_name} onChange={(e) => { const v = volunteers.find(v => v.name === e.target.value); setLocalLogistics({ ...localLogistics, volunteer_name: e.target.value, volunteer_phone: v?.phone || "" }); }}>
                                            <option value="">Select Volunteer</option>
                                            {volunteers.map(vol => (<option key={vol.id} value={vol.name}>{vol.name} ({vol.role})</option>))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Select WiFi Network</label>
                                        <select className="w-full bg-[#0B0114] border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#14b8a6] appearance-none" value={localLogistics.roomWifiSSID} onChange={(e) => { const n = wifiNetworks.find(n => n.ssid === e.target.value); setLocalLogistics({ ...localLogistics, roomWifiSSID: n?.ssid || e.target.value, roomWifiPass: n?.pass || "" }); }}>
                                            <option value="">Select WiFi</option>
                                            {wifiNetworks.map(net => (<option key={net.id} value={net.ssid}>{net.ssid}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">WiFi Password</label>
                                        <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none" value={localLogistics.roomWifiPass} onChange={(e) => setLocalLogistics({ ...localLogistics, roomWifiPass: e.target.value })} placeholder="Enter Password" />
                                    </div>
                                </div>
                                <div className="pt-8 grid grid-cols-2 gap-4">
                                    <button onClick={() => setShowLogisticsModal(false)} className="py-4 rounded-2xl border border-white/10 font-black uppercase italic text-xs tracking-widest">Abort</button>
                                    <button onClick={handleSaveLogistics} className="py-4 rounded-2xl bg-[#14b8a6] text-black font-black uppercase italic text-xs tracking-widest shadow-lg active:scale-95 transition-all">Deploy Station Data</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
