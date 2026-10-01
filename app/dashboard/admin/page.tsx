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
    Eye,
    Download,
    Upload,
    LayoutDashboard,
    CheckCircle2,
    ClipboardList,
    Award,
    Database,
    ArrowUpRight,
    Coffee,
    X,
    KeyRound,
    Copy,
    FileSpreadsheet,
    Headphones,
    MessageSquare,
    ScanLine,
    Clock,
    CheckCircle,
    type LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect, useRef } from "react";
import { useHackathon } from "@/context/HackathonContext";
import { EVENT_MEALS } from "@/lib/meals";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Papa from "papaparse";
import { QRScanner } from "@/components/QRScanner";
import type { JudgingRound } from "@/lib/judging-rounds";

export default function AdminDashboard() {
    const {
        projects,
        isLoading,
        roundConfigs,
        saveRoundConfigs,
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

    const [activeTab, setActiveTab] = useState<'teams' | 'judges' | 'volunteers' | 'settings' | 'helpdesk' | 'exports' | 'checkin'>('teams');
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

    // Help Tickets State
    interface HelpTicket {
        id: string;
        teamId: string;
        teamName: string;
        category: string;
        description: string;
        tableNumber?: string;
        status: 'open' | 'accepted' | 'resolved';
        acceptedBy?: string;
        createdAt: string;
        updatedAt: string;
    }
    const [helpTickets, setHelpTickets] = useState<HelpTicket[]>([]);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);

    // Check-in Scanner State
    const [showCheckinScanner, setShowCheckinScanner] = useState(false);
    const [checkinResult, setCheckinResult] = useState<{ teamName: string; teamId: string; status: string } | null>(null);

    // CSV Export State
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [isBulkAssigning, setIsBulkAssigning] = useState(false);

    useEffect(() => {
        const sectionToTab = {
            entries: 'teams',
            judges: 'judges',
            volunteers: 'volunteers',
            meals: 'settings',
            helpdesk: 'helpdesk',
            exports: 'exports',
            checkin: 'checkin'
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

    // Fetch help tickets
    const fetchHelpTickets = async () => {
        setIsLoadingTickets(true);
        try {
            const res = await fetch('/api/help-tickets');
            if (res.ok) {
                const data = await res.json();
                setHelpTickets(data);
            }
        } catch (err) {
            console.error('Failed to fetch help tickets:', err);
        } finally {
            setIsLoadingTickets(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'helpdesk') {
            fetchHelpTickets();
            const interval = setInterval(fetchHelpTickets, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [activeTab]);

    const handleTicketAction = async (ticketId: string, action: 'accept' | 'resolve' | 'cancel') => {
        try {
            const res = await fetch('/api/help-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, action })
            });
            const data = await res.json();
            if (data.success) {
                setHelpTickets(data.tickets);
                toast.success(`Ticket ${action === 'accept' ? 'accepted' : action === 'resolve' ? 'resolved' : 'cancelled'}!`);
            } else {
                toast.error(data.error || 'Failed to update ticket.');
            }
        } catch {
            toast.error('Could not update ticket.');
        }
    };

    // CSV Export handler
    const handleCSVExport = async (type: string, label: string) => {
        setIsExporting(type);
        try {
            const res = await fetch(`/api/admin/export-csv?type=${type}`);
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tricity_${type}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success(`${label} exported successfully!`);
        } catch {
            toast.error(`Failed to export ${label}.`);
        } finally {
            setIsExporting(null);
        }
    };

    // Admin check-in scanner handler
    const handleCheckinScan = async (data: string): Promise<boolean> => {
        let teamId = data.trim();
        try {
            const parsed = JSON.parse(data);
            teamId = String(parsed.teamId || parsed.registrationId || teamId).trim();
        } catch { }
        if (!teamId) {
            toast.error('Invalid QR code.');
            return false;
        }
        try {
            const response = await fetch('/api/volunteer/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, passType: 'legacy', memberId: '' })
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                toast.error(payload.error || 'Scan could not be verified.');
                setCheckinResult({ teamName: 'Unknown', teamId, status: 'ERROR' });
                return false;
            }
            const result = payload.result as Record<string, unknown>;
            const teamName = String(result.teamName || 'Team');
            const status = String(result.status || 'UNKNOWN');
            setCheckinResult({ teamName, teamId: String(result.teamId || teamId), status });
            if (status === 'PERMITTED') {
                toast.success(`${teamName} checked in successfully!`);
            } else if (status === 'ALREADY_CHECKED_IN') {
                toast.warning(`${teamName} was already checked in.`);
            }
            return true;
        } catch {
            toast.error('Scanner could not reach the server.');
            return false;
        }
    };
    
    // Pagination state for scalability
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

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
    const [resettingTeamId, setResettingTeamId] = useState<string | null>(null);
    const [credentialResetResult, setCredentialResetResult] = useState<{
        teamId: string;
        teamName: string;
        leadEmail: string;
        temporaryPassword: string;
        emailAccepted: boolean;
    } | null>(null);

    const handleResetTeamCredentials = async (teamId: string, teamName: string) => {
        const confirmed = window.confirm(`Reset login for ${teamName}? The current password will stop working immediately, and a new password will be emailed to the registered lead.`);
        if (!confirmed) return;

        setResettingTeamId(teamId);
        setCredentialResetResult(null);
        try {
            const response = await fetch('/api/admin/reset-team-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId })
            });
            const result = await response.json() as {
                success?: boolean;
                error?: string;
                message?: string;
                teamId?: string;
                leadEmail?: string;
                temporaryPassword?: string;
                emailAccepted?: boolean;
            };

            if (!response.ok || !result.success || !result.temporaryPassword || !result.leadEmail) {
                throw new Error(result.error || 'Could not reset team credentials.');
            }

            setCredentialResetResult({
                teamId: result.teamId || teamId,
                teamName,
                leadEmail: result.leadEmail,
                temporaryPassword: result.temporaryPassword,
                emailAccepted: Boolean(result.emailAccepted)
            });
            if (result.emailAccepted) toast.success(result.message || 'SMTP accepted the credentials email.');
            else toast.warning(result.message || 'SMTP did not accept the email. Share the new password through a verified channel.');
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Could not reset team credentials.');
        } finally {
            setResettingTeamId(null);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const loadingToast = toast.loading(`Parsing ${file.name}...`);

        const readValue = (row: Record<string, string>, keys: string[]) => {
            for (const key of keys) {
                const value = row[key];
                if (typeof value === 'string' && value.trim()) return value.trim();
            }
            return '';
        };

        const normalizeParticipants = (row: Record<string, string>) => {
            const participantEntries: Array<{ fullName: string; email: string; phone: string; college: string; year: string; department: string }> = [];
            const base = {
                fullName: readValue(row, ['Name', 'full_name', 'fullName', 'Leader Name', 'captain', 'Captain Name']),
                email: readValue(row, ['Email', 'email', 'Leader Email', 'Captain Email']),
                phone: readValue(row, ['Phone Number', 'phone', 'Leader Phone', 'Captain Phone', 'Mobile Number']),
                college: readValue(row, ['College', 'college', 'Leader College']),
                year: readValue(row, ['Year', 'year']),
                department: readValue(row, ['Department', 'department'])
            };

            if (base.fullName || base.email) {
                participantEntries.push(base);
            }

            for (let index = 2; index <= 4; index += 1) {
                const fullName = readValue(row, [`Member ${index} Name`, `Member${index} Name`, `member_${index}_name`, `member${index}Name`]);
                const email = readValue(row, [`Member ${index} Email`, `Member${index} Email`, `member_${index}_email`, `member${index}Email`]);
                const phone = readValue(row, [`Member ${index} Phone`, `Member${index} Phone`, `member_${index}_phone`, `member${index}Phone`]);
                const college = readValue(row, [`Member ${index} College`, `member_${index}_college`, `member${index}College`]);
                if (fullName || email || phone || college) {
                    participantEntries.push({ fullName, email, phone, college, year: '', department: '' });
                }
            }

            return participantEntries.filter(entry => entry.fullName || entry.email || entry.phone || entry.college);
        };

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rows = results.data as Record<string, string>[];
                    const groupedRegistrations = rows.reduce((groups, row) => {
                        const teamId = readValue(row, ['Registration ID', 'registration_id', 'team_id', 'Team ID']) || `TRICITY_IMPORT_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
                        const current = groups.get(teamId) || {
                            teamId,
                            teamName: readValue(row, ['Team Name', 'team_name', 'Team']) || '',
                            track: readValue(row, ['Selected Tracks', 'track', 'Track']) || 'General',
                            problemStatement: readValue(row, ['Problem Statement', 'problem_statement']) || '',
                            participants: [] as Array<{ fullName: string; email: string; phone: string; college: string; year: string; department: string }>,
                            leaderEmail: ''
                        };

                        const participants = normalizeParticipants(row);
                        if (participants.length) {
                            current.participants.push(...participants);
                        }

                        const roleValue = readValue(row, ['Role', 'role', 'Lead Role'])?.toLowerCase() || '';
                        if (roleValue.includes('leader') && participants[0]?.email) {
                            current.leaderEmail = participants[0].email;
                        }
                        current.teamName = current.teamName || readValue(row, ['Team Name', 'team_name', 'Team']) || participants[0]?.fullName || 'Unknown Team';
                        groups.set(teamId, current);
                        return groups;
                    }, new Map<string, {
                        teamId: string;
                        teamName: string;
                        track: string;
                        problemStatement: string;
                        participants: Array<{ fullName: string; email: string; phone: string; college: string; year: string; department: string }>;
                            leaderEmail: string;
                    }>());

                    const registrations = Array.from(groupedRegistrations.values()).map(entry => {
                        const participants = entry.participants.filter(participant => participant.fullName || participant.email || participant.phone || participant.college);
                        const captain = participants.find(participant => participant.email.toLowerCase() === entry.leaderEmail.toLowerCase()) || participants[0] || {
                            fullName: '',
                            email: '',
                            phone: '',
                            college: '',
                            year: '',
                            department: ''
                        };

                        return {
                            teamId: entry.teamId,
                            teamName: entry.teamName.toLowerCase() === 'individual' ? captain.fullName || entry.teamName : entry.teamName,
                            track: entry.track || 'General',
                            problemStatement: entry.problemStatement,
                            participants: [captain, ...participants.filter(participant => participant.email.toLowerCase() !== captain.email.toLowerCase())],
                            captain
                        };
                    }).filter(registration => registration.teamId && registration.participants.length > 0);

                    if (!registrations.length) {
                        throw new Error('No valid participant rows were found in the CSV.');
                    }

                    toast.loading(`Importing ${registrations.length} teams...`, { id: loadingToast });

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

                    setTimeout(() => window.location.reload(), 2000);
                } catch (error: unknown) {
                    console.error('CSV Import Error:', error);
                    const message = error instanceof Error ? error.message : 'Failed to process CSV file';
                    toast.error(message, { id: loadingToast });
                } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            },
            error: (error) => {
                const message = error instanceof Error ? `Error parsing CSV: ${error.message}` : 'Error parsing CSV file';
                toast.error(message, { id: loadingToast });
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
                <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <MetricCard label="Registered entries" value={dashboardStats.total} icon={Users} tone="purple" />
                    <MetricCard label="Participating entries" value={dashboardStats.active} icon={CheckCircle2} tone="green" />
                    <MetricCard label="Checked in" value={projects.filter(p => p.isCheckedIn).length} icon={ScanLine} tone="blue" />
                    <MetricCard label="Open help tickets" value={helpTickets.filter(t => t.status === 'open').length} icon={Headphones} tone="amber" />
                    <MetricCard label="Meals claim rate" value={dashboardStats.mealsIncluded > 0 ? `${Math.round((dashboardStats.mealsClaimed / dashboardStats.mealsIncluded) * 100)}%` : "0%"} icon={Coffee} tone="red" />
                    <MetricCard label="Judges active" value={judges.length} icon={ShieldCheck} tone="orange" />
                </section>

                {/* Quick Access Toolbar */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'teams', label: 'Entries', icon: Users },
                        { key: 'judges', label: 'Judges', icon: ShieldCheck },
                        { key: 'volunteers', label: 'Volunteers', icon: Users },
                        { key: 'settings', label: 'Meals', icon: Coffee },
                        { key: 'helpdesk', label: 'Help Desk', icon: Headphones },
                        { key: 'exports', label: 'CSV Exports', icon: FileSpreadsheet },
                        { key: 'checkin', label: 'QR Check-in', icon: ScanLine },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.key
                                    ? 'bg-[#14b8a6] text-black shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                                    : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

            {/* Registrations Tab */}
            {activeTab === 'teams' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="font-kanit text-2xl font-black uppercase italic tracking-tight text-white">Registration entries</h2>
                            <p className="mt-1 text-xs text-white/45">Search registrations or open a participant&apos;s complete record.</p>
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

                                                    {/* 3. Credential recovery */}
                                                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2"><KeyRound size={10} /> Login recovery</span>
                                                        <button
                                                            type="button"
                                                            disabled={!team.teamId || resettingTeamId === team.teamId}
                                                            onClick={() => { if (team.teamId) void handleResetTeamCredentials(team.teamId, team.team); }}
                                                            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-200 transition hover:bg-amber-400/20 disabled:cursor-wait disabled:opacity-50"
                                                        >
                                                            <KeyRound size={13} />
                                                            {resettingTeamId === team.teamId ? 'Resetting...' : 'Reset & email password'}
                                                        </button>
                                                        {credentialResetResult && credentialResetResult.teamId === team.teamId && (
                                                            <div role="status" aria-live="polite" className="space-y-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
                                                                <p className="text-xs font-bold text-white">New password (shown once)</p>
                                                                <p className="break-all rounded-lg bg-black/30 p-3 font-mono text-sm text-amber-100">{credentialResetResult.temporaryPassword}</p>
                                                                <p className="text-xs leading-relaxed text-white/60">
                                                                    {credentialResetResult.emailAccepted
                                                                        ? `SMTP accepted the message for ${credentialResetResult.leadEmail}. Check Inbox and Spam; delivery is not confirmed. Share this password only through a verified support channel.`
                                                                        : `SMTP did not accept the message for ${credentialResetResult.leadEmail}. Share this password only through a verified support channel.`}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => void navigator.clipboard.writeText(credentialResetResult.temporaryPassword).then(() => toast.success('Password copied.')).catch(() => toast.error('Clipboard access is unavailable.'))}
                                                                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold text-white/80 hover:bg-white/10"
                                                                    >
                                                                        <Copy size={12} /> Copy password
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCredentialResetResult(null)}
                                                                        className="rounded-lg px-3 py-2 text-[10px] font-bold text-white/50 hover:bg-white/5"
                                                                    >
                                                                        Dismiss
                                                                    </button>
                                                                </div>
                                                            </div>
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
                    <JudgingRoundSettings rounds={roundConfigs} onSave={saveRoundConfigs} />
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

            {/* ═══════════ HELP DESK TAB ═══════════ */}
            {activeTab === 'helpdesk' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="font-kanit text-2xl font-black uppercase italic tracking-tight text-white">Help Desk Queue</h2>
                            <p className="mt-1 text-xs text-white/45">Live mentor/help requests from participants. Refreshes every 10 seconds.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={fetchHelpTickets} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-white/10">
                                Refresh
                            </button>
                            <div className="flex items-center gap-2 text-xs font-bold text-white/45"><span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> {helpTickets.filter(t => t.status === 'open').length} open</div>
                        </div>
                    </div>

                    {isLoadingTickets && helpTickets.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : helpTickets.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                            <Headphones size={48} className="mx-auto mb-4 text-white/10" />
                            <p className="text-white/30 font-bold uppercase tracking-[0.3em] text-xs">No help requests yet</p>
                            <p className="text-white/20 text-xs mt-2">Participants can submit requests from their dashboard.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {helpTickets.map(ticket => (
                                <div key={ticket.id} className={`p-6 rounded-2xl border transition-all ${
                                    ticket.status === 'open' ? 'bg-amber-500/5 border-amber-500/20' :
                                    ticket.status === 'accepted' ? 'bg-blue-500/5 border-blue-500/20' :
                                    'bg-green-500/5 border-green-500/20 opacity-60'
                                }`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                ticket.status === 'open' ? 'bg-amber-500/20 text-amber-400' :
                                                ticket.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                                {ticket.status === 'open' ? <Clock size={20} /> :
                                                 ticket.status === 'accepted' ? <MessageSquare size={20} /> :
                                                 <CheckCircle size={20} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="text-lg font-black italic uppercase tracking-tight text-white">{ticket.teamName}</h4>
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/10 text-white/50">{ticket.teamId}</span>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                                        ticket.category === 'Technical' ? 'bg-blue-500/20 text-blue-300' :
                                                        ticket.category === 'WiFi/Infra' ? 'bg-red-500/20 text-red-300' :
                                                        'bg-purple-500/20 text-purple-300'
                                                    }`}>{ticket.category}</span>
                                                </div>
                                                <p className="text-sm text-white/60 mt-1">{ticket.description}</p>
                                                {ticket.tableNumber && <p className="text-[10px] text-white/40 mt-1 font-bold">📍 Table: {ticket.tableNumber}</p>}
                                                <p className="text-[9px] text-white/30 mt-1">{new Date(ticket.createdAt).toLocaleTimeString()}{ticket.acceptedBy ? ` • Accepted by ${ticket.acceptedBy}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {ticket.status === 'open' && (
                                                <button
                                                    onClick={() => handleTicketAction(ticket.id, 'accept')}
                                                    className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider hover:bg-blue-500/30 transition"
                                                >
                                                    Accept
                                                </button>
                                            )}
                                            {(ticket.status === 'open' || ticket.status === 'accepted') && (
                                                <button
                                                    onClick={() => handleTicketAction(ticket.id, 'resolve')}
                                                    className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-black uppercase tracking-wider hover:bg-green-500/30 transition"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleTicketAction(ticket.id, 'cancel')}
                                                className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 transition"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ CSV EXPORTS TAB ═══════════ */}
            {activeTab === 'exports' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="font-kanit text-2xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
                                <FileSpreadsheet className="text-[#14b8a6]" size={28} />
                                One-Click CSV Export Hub
                            </h2>
                            <p className="mt-1 text-xs text-white/50 max-w-2xl">
                                Instantly download live Hackathon datasets formatted for Excel, Google Sheets, Mailchimp, and printer-ready ceremony packets.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleCSVExport('master', 'Master Event Dump')}
                                disabled={isExporting !== null}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black font-black uppercase text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(20,184,166,0.25)] active:scale-95 disabled:opacity-50"
                            >
                                <Database size={16} />
                                {isExporting === 'master' ? 'Generating...' : 'Export Complete Master Archive'}
                            </button>
                        </div>
                    </div>

                    {/* Section 1: Ceremony & Evaluation */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#14b8a6]">
                            <Award size={16} />
                            <span>1. Judging, Ceremony & Deliverables</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { 
                                    type: 'standings', 
                                    label: 'Final Scores & Standings', 
                                    desc: 'Team rank, track, problem statement, Round 1 score, Round 2 score, total score, and judge comments. Essential for closing ceremony awards.', 
                                    badge: 'Closing Ceremony',
                                    icon: Award, 
                                    color: 'amber' 
                                },
                                { 
                                    type: 'submissions', 
                                    label: 'Project Deliverables & Links', 
                                    desc: 'Live deployment URLs, GitHub repository links, demo video links, and presentation slide decks for judging review.', 
                                    badge: 'Jury Review',
                                    icon: Presentation, 
                                    color: 'teal' 
                                },
                            ].map(exp => (
                                <button
                                    key={exp.type}
                                    onClick={() => handleCSVExport(exp.type, exp.label)}
                                    disabled={isExporting !== null}
                                    className="group p-6 rounded-2xl border border-white/10 bg-white/5 text-left hover:bg-white/[0.08] hover:border-white/20 transition-all disabled:opacity-50 relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            exp.color === 'amber' ? 'bg-amber-500/20 text-amber-300' : 'bg-teal-500/20 text-teal-400'
                                        }`}>
                                            <exp.icon size={22} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                                                {exp.badge}
                                            </span>
                                            {isExporting === exp.type ? (
                                                <div className="w-5 h-5 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Download size={16} className="text-white/20 group-hover:text-[#14b8a6] transition" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="mt-4 text-lg font-black italic uppercase tracking-tight text-white">{exp.label}</h3>
                                    <p className="mt-1 text-xs text-white/50 leading-relaxed">{exp.desc}</p>
                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#14b8a6]">
                                        <FileSpreadsheet size={13} />
                                        Download CSV
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Catering & Venue Logistics */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#14b8a6]">
                            <Coffee size={16} />
                            <span>2. Catering & Venue Operations</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { 
                                    type: 'meals', 
                                    label: 'Meal Claims & Catering Audit', 
                                    desc: 'Detailed log of breakfast, lunch, snacks, and dinner claims across Day 1 & Day 2. Perfect for catering vendor invoice reconciliation.', 
                                    icon: Coffee, 
                                    color: 'red' 
                                },
                                { 
                                    type: 'dietary', 
                                    label: 'Dietary Restrictions', 
                                    desc: 'Special diet requirements, vegetarian/vegan preferences, and allergies for food preparation.', 
                                    icon: Coffee, 
                                    color: 'orange' 
                                },
                                { 
                                    type: 'checkin', 
                                    label: 'Gate Check-in & Rooms', 
                                    desc: 'Participant arrival timestamps, assigned rooms, assigned volunteer guide, and Wi-Fi credentials.', 
                                    icon: ScanLine, 
                                    color: 'green' 
                                },
                            ].map(exp => (
                                <button
                                    key={exp.type}
                                    onClick={() => handleCSVExport(exp.type, exp.label)}
                                    disabled={isExporting !== null}
                                    className="group p-6 rounded-2xl border border-white/10 bg-white/5 text-left hover:bg-white/[0.08] hover:border-white/20 transition-all disabled:opacity-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            exp.color === 'red' ? 'bg-rose-500/20 text-rose-300' :
                                            exp.color === 'orange' ? 'bg-orange-500/20 text-orange-300' :
                                            'bg-emerald-500/20 text-emerald-300'
                                        }`}>
                                            <exp.icon size={22} />
                                        </div>
                                        {isExporting === exp.type ? (
                                            <div className="w-5 h-5 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Download size={16} className="text-white/20 group-hover:text-[#14b8a6] transition" />
                                        )}
                                    </div>
                                    <h3 className="mt-4 text-lg font-black italic uppercase tracking-tight text-white">{exp.label}</h3>
                                    <p className="mt-1 text-xs text-white/50 leading-relaxed">{exp.desc}</p>
                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#14b8a6]">
                                        <FileSpreadsheet size={13} />
                                        Download CSV
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Communications & Staff Directories */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#14b8a6]">
                            <Users size={16} />
                            <span>3. Communications & People Directories</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { 
                                    type: 'emails', 
                                    label: 'Participant Emails (Mail Merge)', 
                                    desc: 'Every participant email, name, phone, team name, and track for newsletters and announcements.', 
                                    icon: ClipboardList, 
                                    color: 'blue' 
                                },
                                { 
                                    type: 'teams', 
                                    label: 'All Registered Teams', 
                                    desc: 'Complete teams roster with captain contacts, college, and track selections.', 
                                    icon: Users, 
                                    color: 'teal' 
                                },
                                { 
                                    type: 'judges', 
                                    label: 'Judges Directory', 
                                    desc: 'Official judge IDs, names, and assigned domain specializations.', 
                                    icon: ShieldCheck, 
                                    color: 'purple' 
                                },
                                { 
                                    type: 'volunteers', 
                                    label: 'Volunteers Directory', 
                                    desc: 'Floor operations staff, contact phone numbers, and event roles.', 
                                    icon: Users, 
                                    color: 'blue' 
                                },
                            ].map(exp => (
                                <button
                                    key={exp.type}
                                    onClick={() => handleCSVExport(exp.type, exp.label)}
                                    disabled={isExporting !== null}
                                    className="group p-5 rounded-2xl border border-white/10 bg-white/5 text-left hover:bg-white/[0.08] hover:border-white/20 transition-all disabled:opacity-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            exp.color === 'blue' ? 'bg-sky-500/20 text-sky-300' :
                                            exp.color === 'teal' ? 'bg-teal-500/20 text-teal-300' :
                                            'bg-purple-500/20 text-purple-300'
                                        }`}>
                                            <exp.icon size={18} />
                                        </div>
                                        {isExporting === exp.type ? (
                                            <div className="w-4 h-4 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Download size={14} className="text-white/20 group-hover:text-[#14b8a6] transition" />
                                        )}
                                    </div>
                                    <h3 className="mt-3 text-base font-black italic uppercase tracking-tight text-white">{exp.label}</h3>
                                    <p className="mt-1 text-[11px] text-white/50 leading-relaxed">{exp.desc}</p>
                                    <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[#14b8a6]">
                                        <FileSpreadsheet size={11} />
                                        Download CSV
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ QR CHECK-IN TAB ═══════════ */}
            {activeTab === 'checkin' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="font-kanit text-2xl font-black uppercase italic tracking-tight text-white">QR Check-in Scanner</h2>
                            <p className="mt-1 text-xs text-white/45">Scan participant QR codes to mark them as checked-in at the venue.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Checked In</span>
                                <span className="text-xl font-black italic text-[#14b8a6]">{projects.filter(p => p.isCheckedIn).length}</span>
                                <span className="text-white/30 font-bold">/</span>
                                <span className="text-lg font-black text-white/50">{projects.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Scanner Panel */}
                        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 overflow-hidden">
                            {showCheckinScanner ? (
                                <div className="space-y-4">
                                    <QRScanner
                                        onScan={handleCheckinScan}
                                        onClose={() => { setShowCheckinScanner(false); setCheckinResult(null); }}
                                        showCloseButton={true}
                                        continuous={true}
                                        embedded={true}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                                    <div className="w-24 h-24 rounded-3xl bg-[#14b8a6]/10 border border-[#14b8a6]/20 flex items-center justify-center">
                                        <ScanLine size={48} className="text-[#14b8a6]" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-xl font-black italic uppercase tracking-tight text-white">Ready to Scan</h3>
                                        <p className="text-xs text-white/40 mt-1">Open the camera to start scanning participant QR codes</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCheckinScanner(true)}
                                        className="px-8 py-4 rounded-2xl bg-[#14b8a6] text-black font-black uppercase italic tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(20,184,166,0.2)]"
                                    >
                                        Open Scanner
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Recent Check-ins */}
                        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                            <h3 className="text-lg font-black italic uppercase tracking-tight text-white mb-4">Recent Check-ins</h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {projects.filter(p => p.isCheckedIn).length === 0 ? (
                                    <div className="py-12 text-center">
                                        <p className="text-white/20 font-bold uppercase tracking-[0.3em] text-xs">No teams checked in yet</p>
                                    </div>
                                ) : (
                                    projects
                                        .filter(p => p.isCheckedIn)
                                        .sort((a, b) => {
                                            const aTime = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
                                            const bTime = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
                                            return bTime - aTime;
                                        })
                                        .slice(0, 50)
                                        .map(team => (
                                            <div key={team.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                                                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                                                    <CheckCircle size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{team.team}</p>
                                                    <p className="text-[10px] text-white/40">{team.teamId}{team.checkedInAt ? ` • ${new Date(team.checkedInAt).toLocaleTimeString()}` : ''}</p>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scan result feedback */}
                    <AnimatePresence>
                        {checkinResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className={`p-6 rounded-2xl border ${
                                    checkinResult.status === 'PERMITTED' ? 'bg-green-500/10 border-green-500/20' :
                                    checkinResult.status === 'ALREADY_CHECKED_IN' ? 'bg-amber-500/10 border-amber-500/20' :
                                    'bg-red-500/10 border-red-500/20'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        checkinResult.status === 'PERMITTED' ? 'bg-green-500 text-white' :
                                        checkinResult.status === 'ALREADY_CHECKED_IN' ? 'bg-amber-500 text-white' :
                                        'bg-red-500 text-white'
                                    }`}>
                                        {checkinResult.status === 'PERMITTED' ? <CheckCircle size={24} /> :
                                         checkinResult.status === 'ALREADY_CHECKED_IN' ? <AlertTriangle size={24} /> :
                                         <X size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black italic uppercase tracking-tight text-white">{checkinResult.teamName}</h4>
                                        <p className="text-sm text-white/60">
                                            {checkinResult.status === 'PERMITTED' ? 'Successfully checked in!' :
                                             checkinResult.status === 'ALREADY_CHECKED_IN' ? 'This team was already checked in.' :
                                             'Check-in failed.'}
                                        </p>
                                    </div>
                                    <button onClick={() => setCheckinResult(null)} className="ml-auto p-2 text-white/30 hover:text-white"><X size={20} /></button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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

function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: LucideIcon; tone: "purple" | "amber" | "green" | "blue" | "orange" | "red" }) {
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

function JudgingRoundSettings({ rounds, onSave }: { rounds: JudgingRound[]; onSave: (rounds: JudgingRound[]) => Promise<boolean> }) {
    const [draftRounds, setDraftRounds] = useState(rounds);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => setDraftRounds(rounds), [rounds]);

    const updateRound = (roundId: string, update: Partial<JudgingRound>) => {
        setDraftRounds(current => current.map(round => round.id === roundId ? { ...round, ...update } : round));
    };

    const addRound = () => {
        const last = draftRounds[draftRounds.length - 1];
        const nextNumber = draftRounds.reduce((max, round) => {
            const match = round.id.match(/(\d+)$/);
            return Math.max(max, match ? Number(match[1]) : 0);
        }, 0) + 1;
        const criteria = (last?.criteria || []).map((criterion, index) => ({
            ...criterion,
            id: `r${nextNumber}q${index + 1}`
        }));
        setDraftRounds(current => [...current, {
            id: `round${nextNumber}`,
            title: `Round ${nextNumber}`,
            subtitle: 'Evaluation round',
            dayOffset: last ? last.dayOffset + (last.hour >= 20 ? 1 : 0) : 0,
            hour: last && last.hour < 20 ? Math.min(last.hour + 2, 23) : 10,
            minute: 0,
            criteria: criteria.length ? criteria : [{ id: `r${nextNumber}q1`, label: 'Overall solution quality', desc: '' }]
        }]);
    };

    const save = async () => {
        setIsSaving(true);
        try {
            await onSave(draftRounds);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/[.04] p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Judging rounds</h3>
                    <p className="mt-1 text-xs text-white/45">Set round timing and scoring criteria. Submitted round history stays attached to its round ID.</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={addRound} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
                        <Plus size={14} /> Add round
                    </button>
                    <button type="button" onClick={() => void save()} disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-[#14b8a6] px-3 py-2 text-xs font-black uppercase text-black disabled:opacity-50">
                        <Save size={14} /> {isSaving ? 'Saving...' : 'Save rounds'}
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                {draftRounds.map(round => (
                    <article key={round.id} className="space-y-4 rounded-2xl border border-white/10 bg-black/15 p-4 md:p-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <input aria-label={`${round.title} title`} value={round.title} onChange={event => updateRound(round.id, { title: event.target.value })} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-white" />
                            <input aria-label={`${round.title} subtitle`} value={round.subtitle} onChange={event => updateRound(round.id, { subtitle: event.target.value })} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                            <label className="flex items-center gap-2 text-xs text-white/55">Day offset
                                <input type="number" min="0" max="7" value={round.dayOffset} onChange={event => updateRound(round.id, { dayOffset: Number(event.target.value) })} className="w-16 rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm text-white" />
                            </label>
                            <label className="flex items-center gap-2 text-xs text-white/55">Hour IST
                                <input type="number" min="0" max="23" value={round.hour} onChange={event => updateRound(round.id, { hour: Number(event.target.value) })} className="w-16 rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm text-white" />
                            </label>
                            <label className="flex items-center gap-2 text-xs text-white/55">Minute
                                <input type="number" min="0" max="59" value={round.minute} onChange={event => updateRound(round.id, { minute: Number(event.target.value) })} className="w-16 rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm text-white" />
                            </label>
                        </div>
                        <div className="space-y-2">
                            {round.criteria.map((criterion, index) => (
                                <div key={criterion.id} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                    <input aria-label={`${round.title} criterion ${index + 1}`} value={criterion.label} onChange={event => updateRound(round.id, { criteria: round.criteria.map(item => item.id === criterion.id ? { ...item, label: event.target.value } : item) })} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                    <input aria-label={`${round.title} criterion ${index + 1} guidance`} value={criterion.desc || ''} onChange={event => updateRound(round.id, { criteria: round.criteria.map(item => item.id === criterion.id ? { ...item, desc: event.target.value } : item) })} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70" />
                                </div>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
