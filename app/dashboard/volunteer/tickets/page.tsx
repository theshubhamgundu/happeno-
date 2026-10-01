"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Clock,
    User,
    MapPin,
    ArrowRight,
    RefreshCw,
    Headphones,
    Wifi,
    Code2,
    HelpCircle,
    Check,
    X
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export interface HelpTicket {
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

function timeAgo(dateString: string): string {
    const diff = Math.max(0, Date.now() - new Date(dateString).getTime());
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function getCategoryIcon(category: string) {
    switch (category.toLowerCase()) {
        case "technical":
            return Code2;
        case "mentor":
            return Headphones;
        case "wifi/infra":
        case "wifi":
            return Wifi;
        default:
            return HelpCircle;
    }
}

function getCategoryColor(category: string): { bg: string; text: string; border: string } {
    switch (category.toLowerCase()) {
        case "technical":
            return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" };
        case "mentor":
            return { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" };
        case "wifi/infra":
        case "wifi":
            return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
        default:
            return { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/20" };
    }
}

export default function VolunteerTickets() {
    const { user } = useAuth();
    const [filter, setFilter] = useState<'all' | 'assigned' | 'resolved'>('all');
    const [tickets, setTickets] = useState<HelpTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);

    const volunteerIdentifier = user?.name || user?.id || "Volunteer";

    const fetchTickets = useCallback(async (quiet = false) => {
        if (!quiet) setIsRefreshing(true);
        try {
            const res = await fetch('/api/help-tickets');
            if (res.ok) {
                const data: HelpTicket[] = await res.json();
                setTickets(data);
            } else {
                if (!quiet) toast.error("Could not fetch tickets from server.");
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            if (!quiet) toast.error("Network error fetching tickets.");
        } finally {
            setIsLoading(false);
            if (!quiet) setIsRefreshing(false);
        }
    }, []);

    // Initial load and live polling every 6 seconds
    useEffect(() => {
        fetchTickets(false);
        const timer = setInterval(() => {
            fetchTickets(true);
        }, 6000);
        return () => clearInterval(timer);
    }, [fetchTickets]);

    const handleTicketAction = async (ticketId: string, action: 'accept' | 'resolve' | 'cancel') => {
        setActionId(ticketId);
        try {
            const res = await fetch('/api/help-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, action })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setTickets(data.tickets);
                if (action === 'accept') {
                    toast.success("Ticket claimed! Walk over to their table.");
                } else if (action === 'resolve') {
                    toast.success("Ticket marked as resolved.");
                } else {
                    toast.info("Ticket dismissed.");
                }
            } else {
                toast.error(data.error || "Failed to update ticket.");
            }
        } catch (error) {
            console.error("Error updating ticket:", error);
            toast.error("Network error while updating ticket.");
        } finally {
            setActionId(null);
        }
    };

    const isAssignedToMe = (ticket: HelpTicket) => {
        if (ticket.status !== 'accepted') return false;
        return ticket.acceptedBy === volunteerIdentifier ||
               (user?.name && ticket.acceptedBy === user.name) ||
               (user?.id && ticket.acceptedBy === user.id);
    };

    const openCount = tickets.filter(t => t.status === 'open').length;
    const myCount = tickets.filter(t => isAssignedToMe(t)).length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

    const filteredTickets = tickets.filter(t => {
        if (filter === 'assigned') return isAssignedToMe(t);
        if (filter === 'resolved') return t.status === 'resolved';
        return t.status !== 'resolved'; // 'all' shows active: open and accepted
    });

    return (
        <DashboardLayout type="volunteer" title="Live Help Queue">
            {/* Header with live status, counts, and manual refresh */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
                        Participant Help Requests
                        {openCount > 0 && (
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-white/50 mt-1">
                        Live queue of teams requesting mentorship, technical guidance, or infrastructure help.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-stretch sm:self-auto">
                    <button
                        onClick={() => fetchTickets(false)}
                        disabled={isRefreshing}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#14b8a6]" : ""} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 sm:gap-4 mb-8 overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${
                        filter === 'all'
                            ? 'bg-slate-900 text-white border-white/20 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                            : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <span>Active Queue</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'all' ? 'bg-[#14b8a6] text-black' : 'bg-white/10 text-white/60'}`}>
                        {tickets.filter(t => t.status !== 'resolved').length}
                    </span>
                </button>

                <button
                    onClick={() => setFilter('assigned')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${
                        filter === 'assigned'
                            ? 'bg-slate-900 text-white border-white/20 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                            : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <span>My Claims</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'assigned' ? 'bg-[#14b8a6] text-black' : 'bg-white/10 text-white/60'}`}>
                        {myCount}
                    </span>
                </button>

                <button
                    onClick={() => setFilter('resolved')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${
                        filter === 'resolved'
                            ? 'bg-slate-900 text-white border-white/20 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                            : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <span>Resolved</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'resolved' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'}`}>
                        {resolvedCount}
                    </span>
                </button>
            </div>

            {/* Ticket Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-8 h-8 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-xs uppercase font-bold tracking-widest text-white/40">Loading Help Queue...</p>
                    </div>
                ) : filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => {
                        const CategoryIcon = getCategoryIcon(ticket.category);
                        const catColors = getCategoryColor(ticket.category);
                        const isPendingAction = actionId === ticket.id;
                        const assignedToMe = isAssignedToMe(ticket);

                        return (
                            <motion.div
                                key={ticket.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`rounded-2xl p-6 backdrop-blur-md border transition-all ${
                                    ticket.status === 'open'
                                        ? 'bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/40'
                                        : assignedToMe
                                        ? 'bg-[#14b8a6]/[0.05] border-[#14b8a6]/30 hover:border-[#14b8a6]/50'
                                        : ticket.status === 'accepted'
                                        ? 'bg-blue-500/[0.04] border-blue-500/20 hover:border-blue-500/40'
                                        : 'bg-white/[0.02] border-white/10 opacity-70'
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center">
                                    <div className="space-y-3 flex-grow min-w-0">
                                        {/* Badges Bar */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-wider">
                                                {ticket.id}
                                            </span>

                                            {/* Status Badge */}
                                            {ticket.status === 'open' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                    Waiting for Volunteer
                                                </span>
                                            )}

                                            {ticket.status === 'accepted' && (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                    assignedToMe
                                                        ? 'bg-[#14b8a6]/20 text-[#14b8a6] border-[#14b8a6]/40'
                                                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                                }`}>
                                                    <User size={10} />
                                                    {assignedToMe ? 'Assigned to You' : `Assigned to ${ticket.acceptedBy}`}
                                                </span>
                                            )}

                                            {ticket.status === 'resolved' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                    <Check size={10} />
                                                    Resolved
                                                </span>
                                            )}

                                            {/* Category Tag */}
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${catColors.bg} ${catColors.text} ${catColors.border}`}>
                                                <CategoryIcon size={11} />
                                                {ticket.category}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <h3 className="text-lg font-bold text-white leading-snug break-words">
                                                {ticket.description}
                                            </h3>
                                        </div>

                                        {/* Team, Location & Time */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-white/60 font-medium">
                                            <span className="flex items-center gap-1.5 font-bold text-white/90">
                                                <User size={14} className="text-[#14b8a6]" />
                                                {ticket.teamName}
                                                {ticket.teamId && (
                                                    <span className="text-[10px] font-mono text-white/40 ml-1">
                                                        ({ticket.teamId})
                                                    </span>
                                                )}
                                            </span>

                                            {ticket.tableNumber && (
                                                <span className="flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                    <MapPin size={12} />
                                                    Table: {ticket.tableNumber}
                                                </span>
                                            )}

                                            <span className="flex items-center gap-1.5 text-white/40 text-[11px]">
                                                <Clock size={12} />
                                                {timeAgo(ticket.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                                        {ticket.status === 'open' && (
                                            <button
                                                onClick={() => handleTicketAction(ticket.id, 'accept')}
                                                disabled={isPendingAction}
                                                className="px-5 py-2.5 bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isPendingAction ? (
                                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <span>Accept & Walk Over</span>
                                                        <ArrowRight size={14} />
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {ticket.status === 'accepted' && (
                                            <button
                                                onClick={() => handleTicketAction(ticket.id, 'resolve')}
                                                disabled={isPendingAction}
                                                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isPendingAction ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle2 size={14} />
                                                        <span>Mark Resolved</span>
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {ticket.status !== 'resolved' && (
                                            <button
                                                onClick={() => handleTicketAction(ticket.id, 'cancel')}
                                                disabled={isPendingAction}
                                                title="Dismiss Ticket"
                                                className="p-2.5 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl border border-white/10 hover:border-red-500/30 transition-all disabled:opacity-50"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-white/10 bg-white/[0.02]">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-4">
                            <CheckCircle2 size={32} className="text-[#14b8a6]" />
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-tight text-white">All Clear!</h3>
                        <p className="text-xs text-white/40 mt-1 max-w-sm">
                            {filter === 'assigned'
                                ? "You don't have any claimed tickets right now. Claim an active ticket above."
                                : filter === 'resolved'
                                ? "No resolved tickets yet."
                                : "No active help requests in the queue right now. Great job!"}
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
