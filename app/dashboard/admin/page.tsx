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
    Check,
    ArrowRightLeft,
    DoorOpen,
    Wifi,
    QrCode,
    Edit3,
    Mail,
    Pause,
    PlayCircle,
    RefreshCw,
    Sun,
    Moon,
    Inbox,
    Send,
    Reply,
    GitMerge,
    History,
    type LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect, useRef } from "react";
import { useHackathon } from "@/context/HackathonContext";
import QRCode from "qrcode";
import { EVENT_MEALS } from "@/lib/meals";
import { TRACKS } from "@/lib/constants";
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
        bulkAssignMealPlan,
        deleteTeams,
        bulkUpdateTeams,
        checkInTeam
    } = useHackathon();

    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMoveTrackModal, setShowMoveTrackModal] = useState(false);
    const [selectedTargetTrack, setSelectedTargetTrack] = useState<string>(() => TRACKS[0] || "AI/ML");
    const [customTargetTrack, setCustomTargetTrack] = useState("");
    const [showMoveRoomModal, setShowMoveRoomModal] = useState(false);
    const [targetRoom, setTargetRoom] = useState("");
    const [targetWifiSSID, setTargetWifiSSID] = useState("");
    const [targetWifiPass, setTargetWifiPass] = useState("");
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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

    // Inbound cPanel Mailbox State
    const [helpdeskSubTab, setHelpdeskSubTab] = useState<'tickets' | 'inbox'>('tickets');
    const [inboundEmails, setInboundEmails] = useState<any[]>([]);
    const [inboxStatus, setInboxStatus] = useState<{
        total: number;
        unseen: number;
        connected: boolean;
        host: string;
        user: string;
        lastChecked: string;
    } | null>(null);
    const [isLoadingEmails, setIsLoadingEmails] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [replyModalEmail, setReplyModalEmail] = useState<any | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [isConvertingTicket, setIsConvertingTicket] = useState<number | null>(null);

    const fetchInboundEmails = async () => {
        setIsLoadingEmails(true);
        setEmailError(null);
        try {
            const res = await fetch('/api/admin/inbound-email');
            const data = await res.json();
            if (data.success) {
                setInboundEmails(data.emails || []);
                setInboxStatus(data.status || null);
            } else {
                setEmailError(data.error || 'Failed to connect to cPanel mailbox.');
            }
        } catch (err: any) {
            setEmailError(err?.message || 'Could not reach server.');
        } finally {
            setIsLoadingEmails(false);
        }
    };

    const handleConvertEmailToTicket = async (email: any) => {
        setIsConvertingTicket(email.id);
        try {
            const res = await fetch('/api/admin/inbound-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_ticket',
                    emailId: email.id,
                    fromEmail: email.fromEmail,
                    fromName: email.fromName,
                    subject: email.subject,
                    snippet: email.snippet,
                    teamId: email.matchedTeamId || 'GUEST',
                    teamName: email.matchedTeamName || email.fromName || email.fromEmail
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'Help ticket created from email!');
                void fetchHelpTickets();
            } else {
                toast.error(data.error || 'Failed to create ticket.');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error creating ticket.');
        } finally {
            setIsConvertingTicket(null);
        }
    };

    const handleSendEmailReply = async () => {
        if (!replyModalEmail || !replyText.trim()) {
            toast.error('Please enter a reply message.');
            return;
        }
        setIsSendingReply(true);
        try {
            const res = await fetch('/api/admin/inbound-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reply_email',
                    to: replyModalEmail.fromEmail,
                    subject: replyModalEmail.subject,
                    replyText: replyText.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Reply sent to ${replyModalEmail.fromEmail} successfully!`);
                setReplyModalEmail(null);
                setReplyText('');
            } else {
                toast.error(data.error || 'Failed to send reply.');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error sending reply.');
        } finally {
            setIsSendingReply(false);
        }
    };

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
            fetchInboundEmails();
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
            const targetIds = selectedTeamIds.length > 0 
                ? selectedTeamIds 
                : projects.map(p => p.id);
            await bulkAssignMealPlan(targetIds, selectedBulkMeals, true);
            setShowBulkMealModal(false);
            setSelectedBulkMeals([]);
            if (selectedTeamIds.length > 0) setSelectedTeamIds([]);
        } finally {
            setIsBulkAssigning(false);
        }
    };

    const filteredTeams = useMemo(() => {
        return projects.filter(p => {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return true;

            const teamName = (p.team || "Unknown Team").toLowerCase();
            const captainName = (p.captain || "N/A").toLowerCase();
            const captainMobile = (p.captainMobile || "").toLowerCase();
            const college = (p.college || "").toLowerCase();
            const teamId = (p.teamId || String(p.id || "")).toLowerCase();

            const matchesTeam = teamName.includes(query);
            const matchesId = teamId.includes(query);
            const matchesCaptain = captainName.includes(query);
            const matchesMobile = captainMobile.includes(query);
            const matchesCollege = college.includes(query);

            // Handle numeric-only search (e.g., "101" -> matches "VH-101")
            const isNumeric = /^\d+$/.test(query);
            const matchesPrefixId = isNumeric && teamId.includes(`tricity_${query}`);

            // Search member names, emails, and phones
            const members = Array.isArray(p.members) ? p.members : [];
            const matchesMembers = members.some(m => {
                if (typeof m === 'string') return m.toLowerCase().includes(query);
                return (
                    (m.fullName || "").toLowerCase().includes(query) ||
                    (m.email || "").toLowerCase().includes(query) ||
                    (m.phone || "").toLowerCase().includes(query) ||
                    (m.college || "").toLowerCase().includes(query)
                );
            });

            return matchesTeam || matchesId || matchesCaptain || matchesMobile || matchesCollege || matchesPrefixId || matchesMembers;
        });
    }, [projects, searchQuery]);

    const paginatedTeams = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTeams.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTeams, currentPage]);

    const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);

    const toggleSelectTeam = (id: string) => {
        setSelectedTeamIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const isAllPageSelected = useMemo(() => {
        if (paginatedTeams.length === 0) return false;
        return paginatedTeams.every(t => selectedTeamIds.includes(t.teamId || String(t.id)));
    }, [paginatedTeams, selectedTeamIds]);

    const isAllFilteredSelected = useMemo(() => {
        if (filteredTeams.length === 0) return false;
        return filteredTeams.every(t => selectedTeamIds.includes(t.teamId || String(t.id)));
    }, [filteredTeams, selectedTeamIds]);

    const handleToggleSelectAllPage = () => {
        const pageIds = paginatedTeams.map(t => t.teamId || String(t.id));
        if (isAllPageSelected) {
            setSelectedTeamIds(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            setSelectedTeamIds(prev => Array.from(new Set([...prev, ...pageIds])));
        }
    };

    const handleSelectAllFiltered = () => {
        const allIds = filteredTeams.map(t => t.teamId || String(t.id));
        if (isAllFilteredSelected) {
            setSelectedTeamIds([]);
        } else {
            setSelectedTeamIds(allIds);
        }
    };

    const clearSelection = () => {
        setSelectedTeamIds([]);
    };

    const handleConfirmBulkDelete = async () => {
        if (selectedTeamIds.length === 0) return;
        setIsBulkProcessing(true);
        try {
            const ok = await deleteTeams(selectedTeamIds);
            if (ok) {
                setSelectedTeamIds([]);
                setShowDeleteModal(false);
            }
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleConfirmMoveTrack = async () => {
        const finalTrack = customTargetTrack.trim() || selectedTargetTrack;
        if (!finalTrack) {
            toast.error("Please specify a track.");
            return;
        }
        setIsBulkProcessing(true);
        try {
            const ok = await bulkUpdateTeams(selectedTeamIds, { track: finalTrack });
            if (ok) {
                setSelectedTeamIds([]);
                setShowMoveTrackModal(false);
                setCustomTargetTrack("");
            }
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleConfirmMoveRoom = async () => {
        if (!targetRoom.trim()) {
            toast.error("Please specify a room or hall.");
            return;
        }
        setIsBulkProcessing(true);
        try {
            const ok = await bulkUpdateTeams(selectedTeamIds, {
                room: targetRoom.trim(),
                roomWifiSSID: targetWifiSSID.trim(),
                roomWifiPass: targetWifiPass.trim()
            });
            if (ok) {
                setSelectedTeamIds([]);
                setShowMoveRoomModal(false);
                setTargetRoom("");
                setTargetWifiSSID("");
                setTargetWifiPass("");
            }
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleBulkCheckIn = async () => {
        setIsBulkProcessing(true);
        try {
            const ok = await bulkUpdateTeams(selectedTeamIds, { isCheckedIn: true });
            if (ok) {
                toast.success(`Checked in ${selectedTeamIds.length} teams.`);
                setSelectedTeamIds([]);
            }
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const [newJudge, setNewJudge] = useState({ name: "", specialization: "" });
    const [newVolunteer, setNewVolunteer] = useState({ name: "", phone: "", role: "" });

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

    // --- HELP DESK & PASS MODAL ---
    const [passModalTeam, setPassModalTeam] = useState<any | null>(null);
    const [passQrDataUrl, setPassQrDataUrl] = useState<string>('');
    const [isCheckingInFromPass, setIsCheckingInFromPass] = useState(false);
    const [passTheme, setPassTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        if (!passModalTeam) {
            setPassQrDataUrl('');
            return;
        }
        const teamId = passModalTeam.teamId || String(passModalTeam.id);
        QRCode.toDataURL(teamId, {
            width: 340,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' }
        }).then(setPassQrDataUrl).catch(console.error);
    }, [passModalTeam]);

    // --- EDIT TEAM CONTACT MODAL ---
    const [editModalTeam, setEditModalTeam] = useState<any | null>(null);
    const [editFormData, setEditFormData] = useState({
        teamName: '',
        captain: '',
        email: '',
        captainMobile: '',
        college: '',
        track: '',
        room: '',
        resendPass: false
    });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const openEditModal = (team: any) => {
        setEditModalTeam(team);
        setEditFormData({
            teamName: team.team || team.name || '',
            captain: team.captain || '',
            email: team.members?.[0]?.email || team.email || '',
            captainMobile: team.captainMobile || team.members?.[0]?.phone || '',
            college: team.college || '',
            track: team.track || '',
            room: team.room || '',
            resendPass: false
        });
    };

    const handleSaveTeamEdit = async () => {
        if (!editModalTeam) return;
        setIsSavingEdit(true);
        try {
            const teamId = editModalTeam.teamId || String(editModalTeam.id);
            const res = await fetch('/api/admin/edit-team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId,
                    ...editFormData
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to update team');

            toast.success(data.message || 'Team updated successfully');
            if (data.temporaryPassword) {
                setCredentialResetResult({
                    teamId,
                    teamName: editFormData.teamName,
                    leadEmail: editFormData.email,
                    temporaryPassword: data.temporaryPassword,
                    emailAccepted: Boolean(data.emailAccepted)
                });
            }
            setEditModalTeam(null);
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            toast.error(err.message || 'Error updating team');
        } finally {
            setIsSavingEdit(false);
        }
    };

    // --- PURGE DEMO DATA MODAL ---
    const [showPurgeModal, setShowPurgeModal] = useState(false);
    const [purgeConfirmText, setPurgeConfirmText] = useState('');
    const [isPurging, setIsPurging] = useState(false);

    const handlePurgeDemo = async () => {
        if (purgeConfirmText !== 'PURGE_ALL_MOCK_REGISTRATIONS') {
            toast.error('Confirmation token does not match.');
            return;
        }
        setIsPurging(true);
        try {
            const res = await fetch('/api/admin/purge-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmation: purgeConfirmText })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to purge demo data');
            toast.success(data.message);
            setShowPurgeModal(false);
            setPurgeConfirmText('');
            setTimeout(() => window.location.reload(), 1200);
        } catch (err: any) {
            toast.error(err.message || 'Purge failed');
        } finally {
            setIsPurging(false);
        }
    };

    // --- PASS & CREDENTIAL DISPATCHER MODAL ---
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [dispatchStatus, setDispatchStatus] = useState<{ total: number; pending: number; issued: number } | null>(null);
    const [isDispatching, setIsDispatching] = useState(false);
    const [isDispatchPaused, setIsDispatchPaused] = useState(false);
    const dispatchPausedRef = useRef(false);
    const [dispatchStats, setDispatchStats] = useState({ processed: 0, success: 0, failed: 0, remaining: 0 });
    const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);

    const fetchDispatchStatus = async () => {
        try {
            const res = await fetch('/api/admin/dispatch-credentials');
            const data = await res.json();
            if (data.success) {
                setDispatchStatus({ total: data.total, pending: data.pending, issued: data.issued });
                setDispatchStats(prev => ({ ...prev, remaining: data.pending }));
            }
        } catch (e) {
            console.error('Failed to fetch dispatch status:', e);
        }
    };

    const handleOpenDispatchModal = () => {
        setShowDispatchModal(true);
        void fetchDispatchStatus();
    };

    const handleStartDispatch = async () => {
        setIsDispatching(true);
        setIsDispatchPaused(false);
        dispatchPausedRef.current = false;

        let keepRunning = true;
        let batchCount = 0;

        while (keepRunning) {
            if (dispatchPausedRef.current) {
                setDispatchLogs(prev => [`[PAUSED] Dispatcher paused by admin.`, ...prev.slice(0, 40)]);
                break;
            }

            try {
                batchCount++;
                const res = await fetch('/api/admin/dispatch-credentials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ batchSize: 15 })
                });
                const data = await res.json();

                if (!data.success) {
                    toast.error(data.error || 'Batch failed');
                    setDispatchLogs(prev => [`[ERROR] Batch ${batchCount} failed: ${data.error}`, ...prev.slice(0, 40)]);
                    break;
                }

                if (data.processed === 0) {
                    toast.success('All passes and credentials have been dispatched!');
                    setDispatchLogs(prev => [`[COMPLETE] All registered teams have been issued passes!`, ...prev.slice(0, 40)]);
                    keepRunning = false;
                    break;
                }

                setDispatchStats(prev => ({
                    processed: prev.processed + data.processed,
                    success: prev.success + data.successCount,
                    failed: prev.failed + data.failureCount,
                    remaining: data.remaining
                }));

                const logSummary = `Batch ${batchCount}: Dispatched ${data.processed} teams (${data.successCount} sent, ${data.failureCount} failed) â€” ${data.remaining} remaining`;
                setDispatchLogs(prev => [logSummary, ...prev.slice(0, 40)]);

                if (data.remaining === 0) {
                    toast.success('All passes have been dispatched successfully!');
                    keepRunning = false;
                    break;
                }

                // 600ms cooldown between batches to maintain healthy SMTP connection pools
                await new Promise(resolve => setTimeout(resolve, 600));

            } catch (err: any) {
                console.error('Dispatch loop error:', err);
                setDispatchLogs(prev => [`[ERROR] Connection error: ${err.message}`, ...prev.slice(0, 40)]);
                break;
            }
        }

        setIsDispatching(false);
        void fetchDispatchStatus();
    };

    const handleTogglePauseDispatch = () => {
        if (isDispatchPaused) {
            setIsDispatchPaused(false);
            dispatchPausedRef.current = false;
            void handleStartDispatch();
        } else {
            setIsDispatchPaused(true);
            dispatchPausedRef.current = true;
        }
    };

    // --- CSV IMPORT LOGIC ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState<{
        isImporting: boolean;
        currentChunk: number;
        totalChunks: number;
        processedTeams: number;
        totalTeams: number;
    } | null>(null);

    // --- ROSTER CORRECTION WINDOW & AUDIT STATE ---
    const [showRosterModal, setShowRosterModal] = useState(false);
    const [rosterPortalMode, setRosterPortalMode] = useState<'edit' | 'closed' | 'event'>('edit');
    const [rosterOverride, setRosterOverride] = useState<string>('auto');
    const [rosterAuditLogs, setRosterAuditLogs] = useState<any[]>([]);
    const [isLoadingRosterSettings, setIsLoadingRosterSettings] = useState(false);
    const [isDispatchingRosterLinks, setIsDispatchingRosterLinks] = useState(false);
    const [rosterDispatchTarget, setRosterDispatchTarget] = useState<'leads' | 'members'>('leads');
    const [rosterDispatchProgress, setRosterDispatchProgress] = useState({ processed: 0, sent: 0, failed: 0 });

    const fetchRosterSettings = async () => {
        setIsLoadingRosterSettings(true);
        try {
            const res = await fetch('/api/admin/roster-settings');
            const data = await res.json();
            if (data.success) {
                setRosterPortalMode(data.portalMode || 'edit');
                setRosterOverride(data.settings?.participant_edit_override || 'auto');
                setRosterAuditLogs(data.auditLogs || []);
            }
        } catch (e) {
            console.error('Failed to fetch roster settings:', e);
        } finally {
            setIsLoadingRosterSettings(false);
        }
    };

    const handleSetRosterOverride = async (overrideValue: string) => {
        try {
            const res = await fetch('/api/admin/roster-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'set_override', overrideValue })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                void fetchRosterSettings();
            } else {
                toast.error(data.error || 'Failed to update window.');
            }
        } catch {
            toast.error('Network error updating window.');
        }
    };

    const handleDispatchRosterEmails = async (target: 'leads' | 'members') => {
        setRosterDispatchTarget(target);
        setIsDispatchingRosterLinks(true);
        setRosterDispatchProgress({ processed: 0, sent: 0, failed: 0 });

        let offset = 0;
        const batchSize = 25;
        let keepGoing = true;

        toast.loading(`Starting batch dispatch to ${target}...`, { id: 'roster-dispatch' });

        try {
            while (keepGoing) {
                const res = await fetch('/api/admin/dispatch-verification-emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target, batchSize, offset })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Dispatch error');

                setRosterDispatchProgress(prev => ({
                    processed: prev.processed + (data.processed || 0),
                    sent: prev.sent + (data.sentCount || 0),
                    failed: prev.failed + (data.failCount || 0)
                }));

                if (!data.hasMore || (data.processed || 0) === 0) {
                    keepGoing = false;
                } else {
                    offset += data.processed;
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            toast.success(`Completed dispatch to ${target}!`, { id: 'roster-dispatch' });
        } catch (err: any) {
            toast.error(err.message || 'Error during dispatch.', { id: 'roster-dispatch' });
        } finally {
            setIsDispatchingRosterLinks(false);
        }
    };

    const [resettingTeamId, setResettingTeamId] = useState<string | null>(null);
    const [credentialResetResult, setCredentialResetResult] = useState<{
        teamId: string;
        teamName: string;
        leadEmail: string;
        temporaryPassword: string;
        emailAccepted: boolean;
    } | null>(null);

    const handleResetTeamCredentials = async (teamId: string, teamName: string) => {
        const confirmed = window.confirm(`Reset login credentials for ${teamName}? A new temporary password will be generated and shown immediately on your screen.`);
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
            if (result.emailAccepted) toast.success('Password generated & emailed to lead.');
            else toast.warning('Password generated. SMTP failed to deliver; share password directly with lead.');
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

                    // High-speed Chunked Ingestion (100 teams per batch)
                    const CHUNK_SIZE = 100;
                    const totalChunks = Math.ceil(registrations.length / CHUNK_SIZE);
                    let totalImported = 0;

                    setImportProgress({
                        isImporting: true,
                        currentChunk: 0,
                        totalChunks,
                        processedTeams: 0,
                        totalTeams: registrations.length
                    });

                    toast.loading(`Importing ${registrations.length} teams in ${totalChunks} fast chunks...`, { id: loadingToast });

                    for (let i = 0; i < totalChunks; i++) {
                        const chunk = registrations.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                        setImportProgress({
                            isImporting: true,
                            currentChunk: i + 1,
                            totalChunks,
                            processedTeams: Math.min((i + 1) * CHUNK_SIZE, registrations.length),
                            totalTeams: registrations.length
                        });

                        const importRes = await fetch('/api/admin/import-registrations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ registrations: chunk, skipEmail: true })
                        });
                        const importData = await importRes.json();

                        if (!importData.success) {
                            throw new Error(importData.error || `Chunk ${i + 1} failed`);
                        }
                        totalImported += importData.imported || chunk.length;
                    }

                    toast.success(`Successfully imported ${totalImported} teams! Open the Pass Dispatcher to send passes.`, { id: loadingToast, duration: 6000 });
                    setTimeout(() => window.location.reload(), 2500);
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

                        {/* Roster Window & Audit Hub */}
                        <button
                            type="button"
                            onClick={() => {
                                setShowRosterModal(true);
                                void fetchRosterSettings();
                            }}
                            className="flex h-14 shrink-0 items-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/20 px-5 text-[10px] font-black uppercase tracking-wider text-teal-300 transition hover:border-teal-500/70 hover:bg-teal-500/30 cursor-pointer"
                        >
                            <GitMerge size={18} /> Roster Window & Audit
                            <span className={`w-2 h-2 rounded-full ${rosterPortalMode === 'edit' ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'}`} />
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
                            <Coffee size={18} /> Bulk Meals
                        </button>

                        {/* Dispatch Passes & Credentials Button */}
                        <button
                            onClick={handleOpenDispatchModal}
                            className="flex h-14 shrink-0 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-5 text-[10px] font-black uppercase tracking-wider text-emerald-400 transition hover:border-emerald-500/70 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        >
                            <Mail size={18} /> Dispatch Passes
                        </button>

                        {/* Purge Demo Data Button */}
                        <button
                            onClick={() => {
                                setPurgeConfirmText('');
                                setShowPurgeModal(true);
                            }}
                            className="flex h-14 shrink-0 items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-[10px] font-black uppercase tracking-wider text-red-400 transition hover:border-red-500/60 hover:bg-red-500/20"
                            title="Wipe mock/demo data before importing real CSV"
                        >
                            <Trash2 size={16} /> Purge Demo
                        </button>
                    </div>

                    {/* Bulk Selection Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleToggleSelectAllPage}
                                className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                                    isAllPageSelected
                                        ? 'bg-[#14b8a6] border-[#14b8a6] text-black shadow-[0_0_12px_rgba(20,184,166,0.5)]'
                                        : selectedTeamIds.length > 0
                                            ? 'bg-[#14b8a6]/20 border-[#14b8a6] text-[#14b8a6]'
                                            : 'border-white/20 bg-white/5 hover:border-white/40 text-transparent'
                                }`}
                                title={isAllPageSelected ? "Deselect this page" : "Select all on this page"}
                            >
                                {isAllPageSelected ? (
                                    <Check size={16} className="stroke-[3] text-black" />
                                ) : selectedTeamIds.length > 0 ? (
                                    <span className="w-2.5 h-0.5 bg-[#14b8a6] rounded-full" />
                                ) : null}
                            </button>
                            <div>
                                <span className="text-xs font-black uppercase italic tracking-wider text-white block">
                                    {selectedTeamIds.length > 0 ? (
                                        <span className="text-[#14b8a6]">{selectedTeamIds.length} of {filteredTeams.length} Selected</span>
                                    ) : (
                                        <span className="text-white/60">Bulk Actions & Direct Select</span>
                                    )}
                                </span>
                                <span className="text-[10px] text-white/35 font-semibold">
                                    Select teams for bulk deletion, track moving, room assignments, and check-in
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs">
                            <button
                                type="button"
                                onClick={handleToggleSelectAllPage}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold transition-all text-[11px]"
                            >
                                {isAllPageSelected ? "Deselect Page" : `Select Page (${paginatedTeams.length})`}
                            </button>
                            <button
                                type="button"
                                onClick={handleSelectAllFiltered}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold transition-all text-[11px]"
                            >
                                {isAllFilteredSelected ? "Deselect All" : `Select All Matching (${filteredTeams.length})`}
                            </button>
                            {selectedTeamIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold transition-all text-[11px]"
                                >
                                    Clear Selection
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {paginatedTeams.map((team) => {
                            const teamKey = team.teamId || String(team.id);
                            const isSelected = selectedTeamIds.includes(teamKey);

                            return (
                                <div
                                    key={team.id}
                                    className={`border rounded-[2rem] transition-all cursor-pointer overflow-hidden ${
                                        isSelected
                                            ? 'bg-[#14b8a6]/[0.06] border-[#14b8a6]/60 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                                            : expandedTeamId === team.id
                                                ? 'bg-white/[0.08] border-white/20 shadow-2xl'
                                                : 'bg-white/5 border-white/10 hover:bg-white/[0.07] opacity-90'
                                    }`}
                                    onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                                >
                                    <div className="p-8">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                            <div className="flex items-center gap-5">
                                                {/* Selection Checkbox */}
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSelectTeam(teamKey);
                                                    }}
                                                    className={`w-7 h-7 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                                                        isSelected
                                                            ? 'bg-[#14b8a6] border-[#14b8a6] text-black shadow-[0_0_12px_rgba(20,184,166,0.6)]'
                                                            : 'border-white/20 bg-white/5 hover:border-white/40 text-transparent'
                                                    }`}
                                                    title={isSelected ? "Deselect team" : "Select team"}
                                                >
                                                    <Check size={16} className={`stroke-[3] ${isSelected ? 'text-black' : 'opacity-0'}`} />
                                                </div>

                                                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black bg-slate-900/20 text-slate-900 shrink-0">
                                                    {team.team ? team.team[0] : "?"}
                                                </div>
                                                <div>
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{team.team}</h3>
                                                        <span className="text-[10px] font-black text-[#14b8a6] px-2 py-0.5 border border-[#14b8a6]/30 rounded bg-[#14b8a6]/5">{team.teamId}</span>
                                                        {team.isCheckedIn && (
                                                            <span className="text-[9px] font-black uppercase text-green-400 px-2 py-0.5 border border-green-500/30 rounded bg-green-500/10">Checked In ✓</span>
                                                        )}
                                                        {team.room && (
                                                            <span className="text-[9px] font-black uppercase text-amber-300 px-2 py-0.5 border border-amber-400/30 rounded bg-amber-400/10">Room: {team.room}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">{team.track} • {team.college}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                                {/* On-Screen Pass & QR Modal */}
                                                <button
                                                    type="button"
                                                    onClick={() => setPassModalTeam(team)}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#14b8a6]/40 bg-[#14b8a6]/10 hover:bg-[#14b8a6]/20 text-[#14b8a6] text-[10px] font-black uppercase tracking-wider transition-all"
                                                    title="View Official Digital Pass & QR on screen"
                                                >
                                                    <QrCode size={14} /> Pass
                                                </button>

                                                {/* Quick Edit Details Modal */}
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(team)}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider transition-all"
                                                    title="Correct email typos, phone, name, or resend pass"
                                                >
                                                    <Edit3 size={14} /> Edit
                                                </button>

                                                {/* Reset Login Credentials */}
                                                <button
                                                    type="button"
                                                    disabled={!team.teamId || resettingTeamId === team.teamId}
                                                    onClick={() => { if (team.teamId) void handleResetTeamCredentials(team.teamId, team.team); }}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                                                    title="Generate new temporary password and show on screen"
                                                >
                                                    <KeyRound size={14} /> {resettingTeamId === team.teamId ? '...' : 'Reset'}
                                                </button>

                                                {/* Delete Team */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTeamIds([teamKey]);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="p-2 rounded-xl border border-white/10 hover:border-red-500/40 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                    title="Delete this team"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
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
                        );
                    })}
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
                    <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="font-kanit text-2xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
                                <Headphones className="text-[#14b8a6]" size={26} />
                                Help Desk & Inbound Inquiries
                            </h2>
                            <p className="mt-1 text-xs text-white/50">Manage live table requests and inbound email queries from participants.</p>
                        </div>

                        {/* Sub-tab Selector */}
                        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10">
                            <button
                                type="button"
                                onClick={() => setHelpdeskSubTab('tickets')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    helpdeskSubTab === 'tickets'
                                        ? 'bg-[#14b8a6] text-black shadow-[0_0_15px_rgba(20,184,166,0.3)]'
                                        : 'text-white/60 hover:text-white'
                                }`}
                            >
                                <Clock size={14} />
                                Onsite Table Queue
                                {helpTickets.filter(t => t.status === 'open').length > 0 && (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                        helpdeskSubTab === 'tickets' ? 'bg-black text-[#14b8a6]' : 'bg-amber-400 text-black'
                                    }`}>
                                        {helpTickets.filter(t => t.status === 'open').length}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setHelpdeskSubTab('inbox');
                                    if (inboundEmails.length === 0) void fetchInboundEmails();
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    helpdeskSubTab === 'inbox'
                                        ? 'bg-[#14b8a6] text-black shadow-[0_0_15px_rgba(20,184,166,0.3)]'
                                        : 'text-white/60 hover:text-white'
                                }`}
                            >
                                <Inbox size={14} />
                                Inbound Mailbox
                                {inboxStatus?.unseen ? (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                        helpdeskSubTab === 'inbox' ? 'bg-black text-[#14b8a6]' : 'bg-teal-400 text-black'
                                    }`}>
                                        {inboxStatus.unseen}
                                    </span>
                                ) : null}
                            </button>
                        </div>
                    </div>

                    {/* SUB-TAB 1: Onsite Table Queue */}
                    {helpdeskSubTab === 'tickets' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs text-white/50 font-bold uppercase tracking-wider">
                                    Table Assistance Requests
                                </span>
                                <button
                                    onClick={fetchHelpTickets}
                                    className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-white/10 cursor-pointer"
                                >
                                    <RefreshCw size={12} className={isLoadingTickets ? 'animate-spin' : ''} /> Refresh
                                </button>
                            </div>

                            {isLoadingTickets && helpTickets.length === 0 ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : helpTickets.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                    <Headphones size={48} className="mx-auto mb-4 text-white/10" />
                                    <p className="text-white/30 font-bold uppercase tracking-[0.3em] text-xs">No active table requests</p>
                                    <p className="text-white/20 text-xs mt-2">Participants can submit mentor and help requests directly from their portal.</p>
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
                                                                ticket.category === 'Email Query' ? 'bg-teal-500/20 text-teal-300' :
                                                                'bg-purple-500/20 text-purple-300'
                                                            }`}>{ticket.category}</span>
                                                        </div>
                                                        <p className="text-sm text-white/70 mt-1 whitespace-pre-wrap">{ticket.description}</p>
                                                        {ticket.tableNumber && <p className="text-[10px] text-white/40 mt-1 font-bold">📍 Table: {ticket.tableNumber}</p>}
                                                        <p className="text-[9px] text-white/30 mt-1">{new Date(ticket.createdAt).toLocaleTimeString()}{ticket.acceptedBy ? ` • Accepted by ${ticket.acceptedBy}` : ''}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {ticket.status === 'open' && (
                                                        <button
                                                            onClick={() => handleTicketAction(ticket.id, 'accept')}
                                                            className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider hover:bg-blue-500/30 transition cursor-pointer"
                                                        >
                                                            Accept
                                                        </button>
                                                    )}
                                                    {(ticket.status === 'open' || ticket.status === 'accepted') && (
                                                        <button
                                                            onClick={() => handleTicketAction(ticket.id, 'resolve')}
                                                            className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-black uppercase tracking-wider hover:bg-green-500/30 transition cursor-pointer"
                                                        >
                                                            Resolve
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleTicketAction(ticket.id, 'cancel')}
                                                        className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 transition cursor-pointer"
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

                    {/* SUB-TAB 2: cPanel Inbound Mailbox */}
                    {helpdeskSubTab === 'inbox' && (
                        <div className="space-y-4">
                            {/* Mailbox Status Banner */}
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0">
                                        <Inbox size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-white">business@centle.in</span>
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">cPanel IMAP (SSL:993)</span>
                                        </div>
                                        <p className="text-[11px] text-white/40 mt-0.5">
                                            Server: {inboxStatus?.host || 'cloud-xent.crazzydns.com'} • {inboxStatus?.total ?? inboundEmails.length} messages ({inboxStatus?.unseen ?? 0} unread)
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={fetchInboundEmails}
                                    disabled={isLoadingEmails}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black font-black uppercase tracking-wider text-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                                >
                                    <RefreshCw size={14} className={isLoadingEmails ? 'animate-spin' : ''} />
                                    {isLoadingEmails ? 'Syncing...' : 'Sync Mailbox'}
                                </button>
                            </div>

                            {/* Error State */}
                            {emailError && (
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
                                    <AlertTriangle size={18} className="shrink-0 text-red-400" />
                                    <div>
                                        <p className="font-bold">IMAP Sync Error</p>
                                        <p className="text-white/60 text-[11px] mt-0.5">{emailError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Inbound Emails List */}
                            {isLoadingEmails && inboundEmails.length === 0 ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : inboundEmails.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                    <Inbox size={48} className="mx-auto mb-4 text-white/10" />
                                    <p className="text-white/30 font-bold uppercase tracking-[0.3em] text-xs">No emails in inbox</p>
                                    <p className="text-white/20 text-xs mt-2">Replies to your passes or queries to business@centle.in will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {inboundEmails.map(email => (
                                        <div
                                            key={email.id}
                                            className={`p-5 rounded-2xl border transition-all ${
                                                email.isUnread
                                                    ? 'bg-teal-500/[0.06] border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                                                    : 'bg-white/[0.02] border-white/10'
                                            }`}
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                        email.isUnread ? 'bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/40' : 'bg-white/10 text-white/50'
                                                    }`}>
                                                        <Mail size={16} />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-sm text-white">{email.fromName || email.fromEmail}</span>
                                                            <span className="text-[11px] font-mono text-white/40">({email.fromEmail})</span>

                                                            {/* Matched Team Pill */}
                                                            {email.matchedTeamName && (
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                                                                    Team: {email.matchedTeamName} {email.matchedTeamId ? `(${email.matchedTeamId})` : ''}
                                                                </span>
                                                            )}

                                                            {email.isUnread && (
                                                                <span className="px-2 py-0.5 rounded-full bg-teal-400 text-black text-[9px] font-black uppercase">
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                                                            {email.subject}
                                                        </h4>

                                                        <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">
                                                            {email.snippet || '(No message preview)'}
                                                        </p>

                                                        <p className="text-[10px] text-white/30 font-mono mt-2">
                                                            {new Date(email.date).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons for Inbound Email */}
                                                <div className="flex items-center gap-2 shrink-0 self-end lg:self-start">
                                                    <button
                                                        type="button"
                                                        onClick={() => setReplyModalEmail(email)}
                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-[11px] font-bold transition cursor-pointer"
                                                    >
                                                        <Reply size={13} /> Reply
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isConvertingTicket === email.id}
                                                        onClick={() => void handleConvertEmailToTicket(email)}
                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-40"
                                                    >
                                                        <Plus size={13} /> {isConvertingTicket === email.id ? 'Creating...' : 'Create Ticket'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                                    {isBulkAssigning ? 'ASSIGNING...' : selectedTeamIds.length > 0 ? `ASSIGN ${selectedBulkMeals.length} MEAL(S) TO ${selectedTeamIds.length} TEAMS` : `ASSIGN ${selectedBulkMeals.length} MEAL(S) TO ALL`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ FLOATING BULK ACTIONS TOOLBAR ═══════════ */}
            <AnimatePresence>
                {selectedTeamIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-4xl bg-[#0D0219]/95 border-2 border-[#14b8a6]/50 rounded-2xl p-4 shadow-[0_15px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-wrap items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-[#14b8a6] text-black font-black flex items-center justify-center text-sm shadow-[0_0_15px_rgba(20,184,166,0.5)]">
                                {selectedTeamIds.length}
                            </span>
                            <div>
                                <span className="text-white font-black text-sm uppercase italic tracking-wider block">
                                    {selectedTeamIds.length} Team{selectedTeamIds.length === 1 ? '' : 's'} Selected
                                </span>
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="text-[10px] text-white/50 hover:text-white underline uppercase tracking-widest transition-colors"
                                >
                                    Deselect all
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Move Track */}
                            <button
                                type="button"
                                onClick={() => setShowMoveTrackModal(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 text-xs font-black uppercase italic tracking-wider transition-all"
                            >
                                <ArrowRightLeft size={14} /> Move Track
                            </button>

                            {/* Assign Room */}
                            <button
                                type="button"
                                onClick={() => setShowMoveRoomModal(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-black uppercase italic tracking-wider transition-all"
                            >
                                <DoorOpen size={14} /> Assign Room
                            </button>

                            {/* Bulk Check-In */}
                            <button
                                type="button"
                                onClick={handleBulkCheckIn}
                                disabled={isBulkProcessing}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#14b8a6]/20 border border-[#14b8a6]/40 text-[#14b8a6] hover:bg-[#14b8a6]/30 text-xs font-black uppercase italic tracking-wider transition-all disabled:opacity-50"
                            >
                                <CheckCircle2 size={14} /> Check In ({selectedTeamIds.length})
                            </button>

                            {/* Assign Meals */}
                            <button
                                type="button"
                                onClick={() => setShowBulkMealModal(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-black uppercase italic tracking-wider transition-all"
                            >
                                <Coffee size={14} /> Assign Meals
                            </button>

                            {/* Merge (if >= 2 selected) */}
                            {selectedTeamIds.length >= 2 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMergeTeams(selectedTeamIds);
                                        setShowMergeModal(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 text-xs font-black uppercase italic tracking-wider transition-all"
                                >
                                    <Users size={14} /> Merge ({selectedTeamIds.length})
                                </button>
                            )}

                            {/* Bulk Delete */}
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-xs font-black uppercase italic tracking-wider transition-all"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════ BULK DELETE MODAL ═══════════ */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0D0219] border-2 border-red-500/30 rounded-[2rem] p-7 shadow-2xl overflow-hidden">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                                    <Trash2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white">
                                        Delete {selectedTeamIds.length} Team{selectedTeamIds.length === 1 ? '' : 's'}?
                                    </h3>
                                    <p className="text-xs text-red-400 font-bold uppercase tracking-widest mt-0.5">Irreversible Permanent Deletion</p>
                                </div>
                            </div>

                            <p className="text-xs text-white/70 leading-relaxed mb-4">
                                This action will permanently remove the <strong className="text-white">{selectedTeamIds.length}</strong> selected registration{selectedTeamIds.length === 1 ? '' : 's'} from the database. All associated member rosters, login credentials, evaluation scores, and final submissions will be permanently purged.
                            </p>

                            <div className="max-h-36 overflow-y-auto custom-scrollbar p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 mb-6 text-xs font-mono text-white/60">
                                {selectedTeamIds.slice(0, 10).map(id => {
                                    const t = projects.find(p => (p.teamId || String(p.id)) === id);
                                    return (
                                        <div key={id} className="flex justify-between items-center py-0.5 border-b border-white/5 last:border-0">
                                            <span className="text-white truncate">{t?.team || t?.name || id}</span>
                                            <span className="text-[#14b8a6] text-[10px] ml-2 shrink-0">{id}</span>
                                        </div>
                                    );
                                })}
                                {selectedTeamIds.length > 10 && (
                                    <div className="text-[10px] text-white/40 italic pt-1">
                                        ...and {selectedTeamIds.length - 10} more teams
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isBulkProcessing}
                                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmBulkDelete}
                                    disabled={isBulkProcessing}
                                    className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black italic text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                >
                                    {isBulkProcessing ? 'Deleting...' : `Yes, Delete (${selectedTeamIds.length})`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ MOVE TRACK MODAL ═══════════ */}
            <AnimatePresence>
                {showMoveTrackModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0D0219] border-2 border-blue-500/30 rounded-[2rem] p-7 shadow-2xl overflow-hidden">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center shrink-0">
                                    <ArrowRightLeft size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white">
                                        Move {selectedTeamIds.length} Team{selectedTeamIds.length === 1 ? '' : 's'}
                                    </h3>
                                    <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-0.5">Bulk Track Reassignment</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">Select Target Track</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                        {TRACKS.map(track => (
                                            <button
                                                key={track}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTargetTrack(track);
                                                    setCustomTargetTrack("");
                                                }}
                                                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                                                    selectedTargetTrack === track && !customTargetTrack
                                                        ? 'bg-blue-500/20 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                {track}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">Or Custom Track Name</label>
                                    <input
                                        type="text"
                                        value={customTargetTrack}
                                        onChange={(e) => setCustomTargetTrack(e.target.value)}
                                        placeholder="e.g. Web3 & DeFi, Robotics, etc."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-blue-400 transition-all font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowMoveTrackModal(false)}
                                    disabled={isBulkProcessing}
                                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmMoveTrack}
                                    disabled={isBulkProcessing}
                                    className="flex-1 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-black italic text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                                >
                                    {isBulkProcessing ? 'Moving...' : `Apply to ${selectedTeamIds.length} Teams`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ ASSIGN ROOM MODAL ═══════════ */}
            <AnimatePresence>
                {showMoveRoomModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0D0219] border-2 border-emerald-500/30 rounded-[2rem] p-7 shadow-2xl overflow-hidden">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                    <DoorOpen size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white">
                                        Assign Room ({selectedTeamIds.length} Teams)
                                    </h3>
                                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Venue Location Allocation</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">Room / Hall Location *</label>
                                    <input
                                        type="text"
                                        value={targetRoom}
                                        onChange={(e) => setTargetRoom(e.target.value)}
                                        placeholder="e.g. Auditorium 2 - Row B, Lab 401"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-emerald-400 transition-all font-semibold"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">Wi-Fi Network SSID (Optional)</label>
                                        <input
                                            type="text"
                                            value={targetWifiSSID}
                                            onChange={(e) => setTargetWifiSSID(e.target.value)}
                                            placeholder="e.g. TRICITY_HACK_5G"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-emerald-400 transition-all font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">Wi-Fi Password (Optional)</label>
                                        <input
                                            type="text"
                                            value={targetWifiPass}
                                            onChange={(e) => setTargetWifiPass(e.target.value)}
                                            placeholder="e.g. hack2026pass"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-emerald-400 transition-all font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowMoveRoomModal(false)}
                                    disabled={isBulkProcessing}
                                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmMoveRoom}
                                    disabled={isBulkProcessing || !targetRoom.trim()}
                                    className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-black italic text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                >
                                    {isBulkProcessing ? 'Assigning...' : `Assign to ${selectedTeamIds.length} Teams`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ ON-SCREEN DIGITAL PASS MODAL ═══════════ */}
            <AnimatePresence>
                {passModalTeam && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className={`w-full max-w-md ${
                                passTheme === 'light'
                                    ? 'bg-white text-slate-900 border border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)]'
                                    : 'bg-[#0a0216] text-white border-2 border-[#14b8a6]/40 shadow-[0_0_60px_rgba(20,184,166,0.25)]'
                            } rounded-[2.2rem] p-6 sm:p-7 overflow-hidden relative`}
                        >
                            {/* VIP Lanyard Notch */}
                            <div className={`w-14 h-1.5 rounded-full mx-auto -mt-2 mb-4 ${
                                passTheme === 'light' ? 'bg-slate-300' : 'bg-white/20'
                            }`} />

                            <div className={`flex items-center justify-between pb-4 border-b mb-4 ${
                                passTheme === 'light' ? 'border-slate-200' : 'border-white/10'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                        passTheme === 'light'
                                            ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm'
                                            : 'bg-[#14b8a6]/20 border-[#14b8a6]/40 text-[#14b8a6] shadow-[0_0_15px_rgba(20,184,166,0.25)]'
                                    }`}>
                                        <QrCode size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-black uppercase italic tracking-tight leading-tight ${
                                            passTheme === 'light' ? 'text-slate-900' : 'text-white'
                                        }`}>
                                            Event Digital Pass
                                        </h3>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5 ${
                                            passTheme === 'light' ? 'text-teal-700' : 'text-[#14b8a6]'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full inline-block animate-pulse ${
                                                passTheme === 'light' ? 'bg-teal-600' : 'bg-[#14b8a6]'
                                            }`} />
                                            Tri-City AI Hackathon 2026
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPassTheme(passTheme === 'light' ? 'dark' : 'light')}
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition cursor-pointer ${
                                            passTheme === 'light'
                                                ? 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                : 'border-white/15 bg-white/10 hover:bg-white/20 text-white/80'
                                        }`}
                                        title={`Switch to ${passTheme === 'light' ? 'Dark' : 'Light'} Pass`}
                                    >
                                        {passTheme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPassModalTeam(null)}
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition cursor-pointer ${
                                            passTheme === 'light'
                                                ? 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                : 'border-white/10 text-white/60 hover:text-white'
                                        }`}
                                        style={passTheme === 'dark' ? { backgroundColor: 'rgba(255, 255, 255, 0.08)' } : undefined}
                                        title="Close Pass"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Pass Card with QR */}
                            <div
                                className={`border rounded-2xl p-5 mb-4 text-center relative overflow-hidden shadow-sm ${
                                    passTheme === 'light' ? 'border-slate-200' : 'border-white/10 shadow-inner'
                                }`}
                                style={
                                    passTheme === 'light'
                                        ? { background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }
                                        : { background: 'linear-gradient(180deg, rgba(25, 10, 46, 0.8) 0%, rgba(12, 3, 24, 0.95) 100%)' }
                                }
                            >
                                {/* Sci-fi Corner Brackets around QR */}
                                <div className="relative inline-block mb-3.5">
                                    <div className={`absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 rounded-tl pointer-events-none ${
                                        passTheme === 'light' ? 'border-teal-600' : 'border-[#14b8a6]'
                                    }`} />
                                    <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 rounded-tr pointer-events-none ${
                                        passTheme === 'light' ? 'border-teal-600' : 'border-[#14b8a6]'
                                    }`} />
                                    <div className={`absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 rounded-bl pointer-events-none ${
                                        passTheme === 'light' ? 'border-teal-600' : 'border-[#14b8a6]'
                                    }`} />
                                    <div className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 rounded-br pointer-events-none ${
                                        passTheme === 'light' ? 'border-teal-600' : 'border-[#14b8a6]'
                                    }`} />

                                    <div className={`p-3 bg-white rounded-2xl border ${
                                        passTheme === 'light'
                                            ? 'border-slate-200/90 shadow-sm'
                                            : 'border-white/10 shadow-[0_0_30px_rgba(20,184,166,0.25)]'
                                    }`}>
                                        {passQrDataUrl ? (
                                            <img src={passQrDataUrl} alt="Check-in QR" className="w-44 h-44 sm:w-52 sm:h-52 mx-auto object-contain block" />
                                        ) : (
                                            <div className="w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center text-slate-400">
                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`text-[10px] font-mono tracking-widest uppercase font-black mb-1.5 ${
                                    passTheme === 'light' ? 'text-teal-700' : 'text-[#14b8a6]'
                                }`}>
                                    OFFICIAL ENTRY BADGE
                                </div>

                                <h4 className={`text-2xl font-black italic uppercase tracking-tight leading-tight ${
                                    passTheme === 'light' ? 'text-slate-900' : 'text-white'
                                }`}>
                                    {passModalTeam.team || passModalTeam.name}
                                </h4>

                                <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full border shadow-xs ${
                                    passTheme === 'light'
                                        ? 'bg-teal-50 border-teal-200/90 text-teal-800'
                                        : 'border-[#14b8a6]/40 text-[#14b8a6]'
                                }`} style={passTheme === 'dark' ? { backgroundColor: 'rgba(20, 184, 166, 0.12)' } : undefined}>
                                    <span className="font-mono text-xs font-black tracking-wider">{passModalTeam.teamId || passModalTeam.id}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void navigator.clipboard.writeText(passModalTeam.teamId || passModalTeam.id);
                                            toast.success("Team ID copied!");
                                        }}
                                        className={`transition p-0.5 ${
                                            passTheme === 'light' ? 'text-teal-600 hover:text-teal-900' : 'text-[#14b8a6]/70 hover:text-white'
                                        }`}
                                        title="Copy Team ID"
                                    >
                                        <Copy size={13} />
                                    </button>
                                </div>

                                {/* Details Grid */}
                                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-4 border-t text-left text-xs ${
                                    passTheme === 'light' ? 'border-slate-200' : 'border-white/10'
                                }`}>
                                    <div
                                        className={`rounded-xl p-3 border ${
                                            passTheme === 'light' ? 'bg-slate-100/70 border-slate-200' : 'border-white/10'
                                        }`}
                                        style={passTheme === 'dark' ? { backgroundColor: 'rgba(255, 255, 255, 0.04)' } : undefined}
                                    >
                                        <span className={`text-[9px] uppercase tracking-wider font-black block mb-0.5 ${
                                            passTheme === 'light' ? 'text-teal-700' : 'text-[#14b8a6]'
                                        }`}>
                                            Team Lead
                                        </span>
                                        <span className={`font-bold text-sm block leading-tight ${
                                            passTheme === 'light' ? 'text-slate-900' : 'text-white'
                                        }`}>
                                            {passModalTeam.captain || 'N/A'}
                                        </span>
                                        {passModalTeam.captainMobile && (
                                            <span className={`text-[11px] font-mono block mt-1 ${
                                                passTheme === 'light' ? 'text-slate-600' : 'text-white/60'
                                            }`}>
                                                {passModalTeam.captainMobile}
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        className={`rounded-xl p-3 border ${
                                            passTheme === 'light' ? 'bg-slate-100/70 border-slate-200' : 'border-white/10'
                                        }`}
                                        style={passTheme === 'dark' ? { backgroundColor: 'rgba(255, 255, 255, 0.04)' } : undefined}
                                    >
                                        <span className={`text-[9px] uppercase tracking-wider font-black block mb-0.5 ${
                                            passTheme === 'light' ? 'text-purple-700' : 'text-purple-400'
                                        }`}>
                                            Track & Room
                                        </span>
                                        <span className={`font-bold text-xs block leading-snug break-words ${
                                            passTheme === 'light' ? 'text-slate-900' : 'text-white'
                                        }`}>
                                            {passModalTeam.track || 'General Track'}
                                        </span>
                                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                            <span className={`text-[10px] uppercase font-semibold ${
                                                passTheme === 'light' ? 'text-slate-500' : 'text-white/50'
                                            }`}>
                                                Location:
                                            </span>
                                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                                passModalTeam.room 
                                                    ? (passTheme === 'light' 
                                                        ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                                        : 'bg-amber-400/15 text-amber-300 border-amber-400/30')
                                                    : (passTheme === 'light'
                                                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                                                        : 'bg-white/5 text-white/50 border-white/10')
                                            }`}>
                                                {passModalTeam.room ? `Room ${passModalTeam.room}` : 'Unassigned'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mt-3.5 flex items-center justify-center">
                                    {passModalTeam.isCheckedIn ? (
                                        <span className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                                            passTheme === 'light'
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                        }`}>
                                            <span className={`w-2 h-2 rounded-full animate-pulse ${
                                                passTheme === 'light' ? 'bg-emerald-600' : 'bg-emerald-400'
                                            }`} />
                                            <CheckCircle size={15} /> Checked In & Verified
                                        </span>
                                    ) : (
                                        <span className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                                            passTheme === 'light'
                                                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                                                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                        }`}>
                                            <span className={`w-2 h-2 rounded-full animate-ping ${
                                                passTheme === 'light' ? 'bg-amber-500' : 'bg-amber-400'
                                            }`} />
                                            <Clock size={15} /> Pending Check-In
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center gap-2.5">
                                {!passModalTeam.isCheckedIn && (
                                    <button
                                        type="button"
                                        disabled={isCheckingInFromPass}
                                        onClick={async () => {
                                            setIsCheckingInFromPass(true);
                                            try {
                                                const ok = await checkInTeam(passModalTeam.id);
                                                if (ok) {
                                                    setPassModalTeam((prev: any) => prev ? { ...prev, isCheckedIn: true } : null);
                                                    toast.success("Team marked as checked-in successfully!");
                                                }
                                            } finally {
                                                setIsCheckingInFromPass(false);
                                            }
                                        }}
                                        className={`w-full py-3.5 rounded-xl active:scale-95 font-black uppercase italic tracking-wider text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                                            passTheme === 'light'
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                                                : 'bg-gradient-to-r from-emerald-500 via-[#14b8a6] to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-[0_0_25px_rgba(20,184,166,0.35)]'
                                        }`}
                                    >
                                        <CheckCircle size={16} /> {isCheckingInFromPass ? 'Checking in...' : 'Check-In Team Now'}
                                    </button>
                                )}

                                {passQrDataUrl && (
                                    <a
                                        href={passQrDataUrl}
                                        download={`tricity-pass-${passModalTeam.teamId || passModalTeam.id}.png`}
                                        className={`w-full py-3.5 rounded-xl border font-bold uppercase tracking-wider text-xs transition text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                                            passTheme === 'light'
                                                ? 'border-slate-300 bg-slate-900 hover:bg-slate-800 text-white'
                                                : 'border-white/15 text-white hover:border-[#14b8a6]/50 hover:text-[#14b8a6]'
                                        }`}
                                        style={passTheme === 'dark' ? { backgroundColor: 'rgba(255, 255, 255, 0.06)' } : undefined}
                                    >
                                        <Download size={15} /> Download Pass Image
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ EDIT TEAM CONTACT MODAL ═══════════ */}
            <AnimatePresence>
                {editModalTeam && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0D0219] border-2 border-blue-500/40 rounded-[2rem] p-6 sm:p-7 shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                                        <Edit3 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Edit Team Contact</h3>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{editModalTeam.teamId || editModalTeam.id}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditModalTeam(null)}
                                    className="w-8 h-8 rounded-full border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                                    title="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); void handleSaveTeamEdit(); }} className="space-y-3.5">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">Team Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.teamName}
                                        onChange={e => setEditFormData({ ...editFormData, teamName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-400 transition font-semibold"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">Captain / Lead Name</label>
                                        <input
                                            type="text"
                                            value={editFormData.captain}
                                            onChange={e => setEditFormData({ ...editFormData, captain: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-400 transition font-semibold"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">Captain Mobile Number</label>
                                        <input
                                            type="text"
                                            value={editFormData.captainMobile}
                                            onChange={e => setEditFormData({ ...editFormData, captainMobile: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-400 transition font-mono font-semibold"
                                            placeholder="10-digit mobile"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">
                                        Captain Email Address <span className="text-amber-400 text-[9px]">(Fix typos here)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={editFormData.email}
                                        onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-400 transition font-mono font-semibold"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">College</label>
                                        <input
                                            type="text"
                                            value={editFormData.college}
                                            onChange={e => setEditFormData({ ...editFormData, college: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-400 transition font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">Assigned Room</label>
                                        <input
                                            type="text"
                                            value={editFormData.room}
                                            onChange={e => setEditFormData({ ...editFormData, room: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-400 transition font-semibold"
                                            placeholder="e.g. Lab 3 / Desk 12"
                                        />
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editFormData.resendPass}
                                            onChange={e => setEditFormData({ ...editFormData, resendPass: e.target.checked })}
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                                        />
                                        <span className="text-xs text-amber-200 font-semibold">
                                            Generate new credentials & email fresh pass to this address immediately
                                        </span>
                                    </label>
                                </div>

                                <div className="flex items-center gap-3 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditModalTeam(null)}
                                        className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit}
                                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black italic text-xs uppercase tracking-wider transition disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                    >
                                        {isSavingEdit ? 'Saving...' : 'Save & Update'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ CREDENTIAL REVEAL MODAL ═══════════ */}
            <AnimatePresence>
                {credentialResetResult && (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-[#0D0219] border-2 border-amber-400/50 rounded-[2rem] p-6 sm:p-7 shadow-[0_0_40px_rgba(251,191,36,0.25)] overflow-hidden">
                            <div className="flex items-center gap-3.5 mb-4">
                                <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0">
                                    <KeyRound size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Login Credentials Issued</h3>
                                    <p className="text-[10px] text-amber-300 font-bold uppercase tracking-widest">{credentialResetResult.teamName}</p>
                                </div>
                            </div>

                            <p className="text-xs text-white/70 leading-relaxed mb-4">
                                A fresh login password has been generated for team <strong className="text-white">{credentialResetResult.teamId}</strong>.
                            </p>

                            <div className="p-4 rounded-xl bg-black/50 border border-amber-400/30 space-y-2 mb-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Team ID:</span>
                                    <span className="text-[#14b8a6] font-mono font-bold">{credentialResetResult.teamId}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/40 uppercase tracking-wider text-[10px] font-bold">New Password:</span>
                                    <span className="text-amber-300 font-mono font-black text-sm select-all bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                        {credentialResetResult.temporaryPassword}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                                    <span className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Recipient:</span>
                                    <span className="text-white/70 font-mono truncate max-w-[200px]">{credentialResetResult.leadEmail}</span>
                                </div>
                            </div>

                            {/* Email delivery indicator */}
                            <div className={`p-2.5 rounded-xl border text-xs mb-5 flex items-center gap-2 ${credentialResetResult.emailAccepted ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                                {credentialResetResult.emailAccepted ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                                <span className="text-[11px] leading-tight">
                                    {credentialResetResult.emailAccepted
                                        ? 'Email successfully accepted by SMTP server for delivery.'
                                        : 'SMTP failed or offline. Give this password directly to the team lead.'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        void navigator.clipboard.writeText(`Team ID: ${credentialResetResult.teamId}\nPassword: ${credentialResetResult.temporaryPassword}\nLogin: https://tricity.online/login`);
                                        toast.success("Credentials copied to clipboard!");
                                    }}
                                    className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-black uppercase italic tracking-wider text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                                >
                                    <Copy size={14} /> Copy Credentials
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCredentialResetResult(null)}
                                    className="py-3 px-5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ PURGE DEMO REGISTRATIONS MODAL ═══════════ */}
            <AnimatePresence>
                {showPurgeModal && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0D0219] border-2 border-red-500/40 rounded-[2rem] p-7 shadow-2xl overflow-hidden">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white">Purge Demo Registrations</h3>
                                    <p className="text-xs text-red-400 font-bold uppercase tracking-widest mt-0.5">Pre-Import Database Wipe</p>
                                </div>
                            </div>

                            <p className="text-xs text-white/70 leading-relaxed mb-4">
                                This will completely wipe all demo / mock registrations in Supabase to give you a pristine database prior to importing the official agency CSV. Admin accounts, settings, and judging configs will remain intact.
                            </p>

                            <div className="mb-5">
                                <label className="text-[10px] font-black uppercase text-red-300 tracking-wider block mb-1.5">
                                    Type <span className="font-mono text-white bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/30">PURGE_ALL_MOCK_REGISTRATIONS</span> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={purgeConfirmText}
                                    onChange={e => setPurgeConfirmText(e.target.value)}
                                    placeholder="PURGE_ALL_MOCK_REGISTRATIONS"
                                    className="w-full bg-white/5 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-red-500 font-mono font-bold"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPurgeModal(false)}
                                    disabled={isPurging}
                                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePurgeDemo}
                                    disabled={isPurging || purgeConfirmText !== 'PURGE_ALL_MOCK_REGISTRATIONS'}
                                    className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black italic text-xs uppercase tracking-wider transition disabled:opacity-40 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                >
                                    {isPurging ? 'Purging...' : 'Wipe Database Clean'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ PASS & CREDENTIAL DISPATCHER MODAL ═══════════ */}
            <AnimatePresence>
                {showDispatchModal && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-[#0D0219] border-2 border-emerald-500/40 rounded-[2rem] p-7 shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden">
                            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                                        <Mail size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Pass & Credential Dispatcher</h3>
                                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-0.5">High-Volume Batch Email Delivery</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isDispatching) {
                                            toast.warning("Please pause or let the current batch finish before closing.");
                                            return;
                                        }
                                        setShowDispatchModal(false);
                                    }}
                                    className="w-8 h-8 rounded-full border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                                    title="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Status Metrics */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Total Teams</span>
                                    <span className="text-2xl font-black text-white italic">{dispatchStatus?.total ?? projects.length}</span>
                                </div>
                                <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 text-center">
                                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">Passes Issued</span>
                                    <span className="text-2xl font-black text-emerald-400 italic">{dispatchStatus?.issued ?? 0}</span>
                                </div>
                                <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 text-center">
                                    <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block mb-1">Pending Delivery</span>
                                    <span className="text-2xl font-black text-amber-300 italic">{dispatchStatus?.pending ?? projects.length}</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-5 bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-white/60">Dispatch Progress</span>
                                    <span className="text-emerald-400">
                                        {dispatchStatus?.total ? Math.round(((dispatchStatus.issued) / dispatchStatus.total) * 100) : 0}% Delivered
                                    </span>
                                </div>
                                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 to-[#14b8a6] h-full transition-all duration-300 rounded-full"
                                        style={{
                                            width: `${dispatchStatus?.total ? Math.min(100, Math.round(((dispatchStatus.issued) / dispatchStatus.total) * 100)) : 0}%`
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] text-white/40 font-mono pt-1">
                                    <span>Processed: {dispatchStats.processed}</span>
                                    <span className="text-emerald-400">Sent: {dispatchStats.success}</span>
                                    <span className="text-red-400">Failed: {dispatchStats.failed}</span>
                                </div>
                            </div>

                            {/* Real-time Activity Logs */}
                            <div className="mb-6">
                                <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-2">Live Delivery Log</span>
                                <div className="h-36 overflow-y-auto custom-scrollbar p-3 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-white/60 space-y-1">
                                    {dispatchLogs.length === 0 ? (
                                        <div className="text-white/30 italic text-center py-10">Click &ldquo;Start Dispatch&rdquo; below to begin sending passes in controlled batches.</div>
                                    ) : (
                                        dispatchLogs.map((log, idx) => (
                                            <div key={idx} className="leading-tight py-0.5 border-b border-white/5 last:border-0 truncate">
                                                {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Controller Buttons */}
                            <div className="flex items-center gap-3">
                                {!isDispatching ? (
                                    <button
                                        type="button"
                                        onClick={handleStartDispatch}
                                        disabled={dispatchStatus?.pending === 0}
                                        className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-black italic text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-40"
                                    >
                                        <PlayCircle size={16} /> Start Safe Batch Dispatch
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleTogglePauseDispatch}
                                        className={`flex-1 py-3.5 rounded-xl font-black italic text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 ${isDispatchPaused ? 'bg-emerald-500 hover:bg-emerald-600 text-black' : 'bg-amber-500 hover:bg-amber-600 text-black'}`}
                                    >
                                        {isDispatchPaused ? <PlayCircle size={16} /> : <Pause size={16} />}
                                        {isDispatchPaused ? 'Resume Dispatch' : 'Pause Dispatcher'}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => void fetchDispatchStatus()}
                                    className="py-3.5 px-4 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition"
                                    title="Refresh counts"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ CHUNKED CSV IMPORT PROGRESS MODAL ═══════════ */}
            <AnimatePresence>
                {importProgress?.isImporting && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-[#0D0219] border-2 border-purple-500/40 rounded-[2rem] p-7 shadow-[0_0_50px_rgba(168,85,247,0.25)] text-center">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <Upload size={26} />
                            </div>
                            <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Importing Registrations</h3>
                            <p className="text-xs text-purple-300 font-bold uppercase tracking-widest mt-1 mb-5">
                                Chunk {importProgress.currentChunk} of {importProgress.totalChunks}
                            </p>

                            <div className="space-y-2 mb-6 text-left">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-white/60">Ingesting into database...</span>
                                    <span className="text-purple-400">{Math.round((importProgress.processedTeams / importProgress.totalTeams) * 100)}%</span>
                                </div>
                                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-[#14b8a6] h-full transition-all duration-300 rounded-full"
                                        style={{
                                            width: `${Math.round((importProgress.processedTeams / importProgress.totalTeams) * 100)}%`
                                        }}
                                    />
                                </div>
                                <p className="text-[11px] text-white/40 text-center font-mono">
                                    {importProgress.processedTeams} / {importProgress.totalTeams} teams imported
                                </p>
                            </div>

                            <p className="text-[11px] text-white/40 italic">
                                Please keep this tab open while teams are written to Supabase.
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ EMAIL REPLY MODAL ═══════════ */}
            <AnimatePresence>
                {replyModalEmail && (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-xl bg-[#0D0219] border-2 border-blue-500/40 rounded-[2rem] p-6 sm:p-8 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                                        <Reply size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Reply to Inbound Email</h3>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                                            Sending via business@centle.in (cPanel SMTP)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReplyModalEmail(null)}
                                    className="w-8 h-8 rounded-full border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                                    title="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Email Details Overview */}
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 mb-4">
                                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                                    <span className="text-white/40 uppercase tracking-wider text-[10px] font-bold">To:</span>
                                    <span className="font-bold text-white font-mono">{replyModalEmail.fromEmail}</span>
                                </div>
                                {replyModalEmail.matchedTeamName && (
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Registered Team:</span>
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                                            {replyModalEmail.matchedTeamName} {replyModalEmail.matchedTeamId ? `(${replyModalEmail.matchedTeamId})` : ''}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Subject:</span>
                                    <span className="font-bold text-white/90 truncate max-w-sm">Re: {replyModalEmail.subject}</span>
                                </div>
                            </div>

                            {/* Original Message Snippet */}
                            <div className="mb-4">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-wider block mb-1">
                                    Original Message Snippet
                                </label>
                                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white/60 italic max-h-24 overflow-y-auto">
                                    {replyModalEmail.snippet || '(No text preview available)'}
                                </div>
                            </div>

                            {/* Quick Response Templates */}
                            <div className="mb-4">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-wider block mb-1.5">
                                    Quick Response Templates
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setReplyText(`Hello,\n\nWe have verified your registration details. Your digital pass and login credentials have been re-issued. Please check your inbox or visit the onsite help desk if you need immediate printouts.\n\nBest regards,\nTri-City Organizing Committee`)}
                                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70 hover:text-white transition cursor-pointer"
                                    >
                                        Pass Verification
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReplyText(`Hello,\n\nThank you for reaching out! A volunteer or mentor has been notified. You can also raise an instant ticket at the Help Desk section of your team portal or visit Desk 1 at the venue.\n\nBest regards,\nTri-City Technical Support`)}
                                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70 hover:text-white transition cursor-pointer"
                                    >
                                        Mentor/Desk Info
                                    </button>
                                </div>
                            </div>

                            {/* Reply Input Form */}
                            <form onSubmit={(e) => { e.preventDefault(); void handleSendEmailReply(); }} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1.5">
                                        Your Response Message
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="Type your response to the participant here..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-400 transition leading-relaxed"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setReplyModalEmail(null)}
                                        className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSendingReply || !replyText.trim()}
                                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black italic text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] cursor-pointer"
                                    >
                                        <Send size={14} className={isSendingReply ? 'animate-spin' : ''} />
                                        {isSendingReply ? 'Sending Reply...' : 'Send Email Response'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════ ROSTER CORRECTION WINDOW & AUDIT MODAL ═══════════ */}
            <AnimatePresence>
                {showRosterModal && (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-4xl max-h-[90vh] bg-[#0D0219] border-2 border-teal-500/40 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-[#14b8a6] border border-teal-500/40 flex items-center justify-center shrink-0">
                                        <GitMerge size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white">
                                            Roster Correction Window & Audit Trail
                                        </h3>
                                        <p className="text-xs text-teal-400 font-bold uppercase tracking-widest mt-0.5">
                                            Self-Service Control Hub (Oct 5–6 Window)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowRosterModal(false)}
                                    className="w-8 h-8 rounded-full border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                                    title="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Section 1: Window Status & Live Override */}
                            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 mb-6 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                                            Current Participant Portal Status
                                        </span>
                                        <div className="flex items-center gap-2.5 mt-1">
                                            <span className={`w-2.5 h-2.5 rounded-full ${
                                                rosterPortalMode === 'edit' ? 'bg-emerald-400 animate-pulse' :
                                                rosterPortalMode === 'event' ? 'bg-blue-400' : 'bg-amber-400'
                                            }`} />
                                            <span className="text-base font-black italic uppercase text-white">
                                                {rosterPortalMode === 'edit' ? 'Correction Window Open (Edit Mode)' :
                                                 rosterPortalMode === 'event' ? 'Event Workspace Active (Hackathon Live)' :
                                                 'Locked / Frozen (Countdown Active)'}
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/60">
                                                Override: {rosterOverride}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Override Controls */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => void handleSetRosterOverride('open')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                rosterOverride === 'open' ? 'bg-emerald-500 text-black font-black' : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
                                            }`}
                                        >
                                            Force Open
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleSetRosterOverride('closed')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                rosterOverride === 'closed' ? 'bg-amber-500 text-black font-black' : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
                                            }`}
                                        >
                                            Force Lock
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleSetRosterOverride('auto')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                rosterOverride === 'auto' ? 'bg-teal-500 text-black font-black' : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
                                            }`}
                                        >
                                            Auto (Oct 5–6)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Launch Campaign Dispatchers */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {/* Lead Dispatcher Card */}
                                <div className="p-5 rounded-3xl bg-teal-500/[0.05] border border-teal-500/30 space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-[#14b8a6] flex items-center justify-center font-bold">
                                            <Mail size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">1. Magic Links to Team Leads</h4>
                                            <span className="text-[10px] text-teal-400 font-semibold">Primary Roster Access</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/60 leading-relaxed">
                                        Emails each Team Captain their private, encrypted link to <strong>/edit-registration</strong> so they can fix names, replace absent members, or merge without passwords.
                                    </p>
                                    <button
                                        type="button"
                                        disabled={isDispatchingRosterLinks}
                                        onClick={() => void handleDispatchRosterEmails('leads')}
                                        className="w-full py-2.5 rounded-xl bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black font-black uppercase tracking-wider text-xs transition cursor-pointer disabled:opacity-50"
                                    >
                                        {isDispatchingRosterLinks && rosterDispatchTarget === 'leads' ? 'Dispatching Leads...' : 'Dispatch Magic Links to Leads'}
                                    </button>
                                </div>

                                {/* Member Dispatcher Card */}
                                <div className="p-5 rounded-3xl bg-blue-500/[0.05] border border-blue-500/30 space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">2. Confirmation to Members</h4>
                                            <span className="text-[10px] text-blue-300 font-semibold">Read-Only Notice</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/60 leading-relaxed">
                                        Sends read-only confirmation to all participants so they know they are registered and gives them their lead&apos;s contact for coordination.
                                    </p>
                                    <button
                                        type="button"
                                        disabled={isDispatchingRosterLinks}
                                        onClick={() => void handleDispatchRosterEmails('members')}
                                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-xs transition cursor-pointer disabled:opacity-50"
                                    >
                                        {isDispatchingRosterLinks && rosterDispatchTarget === 'members' ? 'Dispatching Members...' : 'Dispatch Member Notices'}
                                    </button>
                                </div>
                            </div>

                            {/* Live Dispatch Progress */}
                            {isDispatchingRosterLinks && (
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-white">
                                        <span>Dispatching to {rosterDispatchTarget}...</span>
                                        <span className="text-teal-400">Processed: {rosterDispatchProgress.processed} (Sent: {rosterDispatchProgress.sent})</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                        <div className="bg-teal-400 h-full animate-pulse w-full rounded-full" />
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Live Immutable Audit Trail */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <History size={16} className="text-[#14b8a6]" />
                                        <h4 className="font-bold text-white text-sm">Live Roster Audit Trail</h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={fetchRosterSettings}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70 hover:text-white transition cursor-pointer"
                                    >
                                        <RefreshCw size={12} className={isLoadingRosterSettings ? 'animate-spin' : ''} /> Refresh
                                    </button>
                                </div>

                                {rosterAuditLogs.length === 0 ? (
                                    <div className="py-12 text-center rounded-2xl border border-dashed border-white/10">
                                        <History size={32} className="mx-auto mb-2 text-white/20" />
                                        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">No roster modifications yet</p>
                                        <p className="text-[11px] text-white/20 mt-1">Changes made during Oct 5–6 will appear here in real-time with IP addresses.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                        {rosterAuditLogs.map((log: any) => (
                                            <div
                                                key={log.id}
                                                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                                            log.action === 'MERGE_TEAMS' ? 'bg-purple-500/20 text-purple-300' :
                                                            log.action === 'REPLACE_MEMBER' ? 'bg-amber-500/20 text-amber-300' :
                                                            'bg-teal-500/20 text-teal-300'
                                                        }`}>
                                                            {log.action}
                                                        </span>
                                                        <span className="font-mono font-bold text-white">{log.teamId}</span>
                                                        <span className="text-white/40 text-[11px]">• {log.actor}</span>
                                                    </div>
                                                    <p className="text-white/70 text-[11px]">{log.summary}</p>
                                                </div>

                                                <div className="text-right shrink-0 text-[10px] font-mono text-white/30">
                                                    <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                                                    <div>IP: {log.ip}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
