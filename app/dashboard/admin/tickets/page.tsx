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
    X,
    LifeBuoy,
    Phone,
    Mail
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
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    source?: 'edit_registration' | 'dashboard' | 'email';
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
            return { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" };
        case "mentor":
            return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" };
        case "wifi/infra":
        case "wifi":
            return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
        default:
            return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
    }
}

export default function AdminTickets() {
    const { user } = useAuth();
    const [filter, setFilter] = useState<'all' | 'assigned' | 'resolved'>('all');
    const [tickets, setTickets] = useState<HelpTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);

    const adminIdentifier = user?.name || user?.id || "Admin";

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
        }, 120000); // 2 minutes
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
                    toast.success("Ticket claimed! Mentor assigned.");
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
        return ticket.acceptedBy === adminIdentifier ||
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
        <DashboardLayout type="admin" title="Mentor & Help Queue">
            {/* Header with live status, counts, and manual refresh */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-slate-900 flex items-center gap-3">
                        Participant Help Requests
                        {openCount > 0 && (
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Live command queue of teams requesting mentorship, technical guidance, or infrastructure help.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-stretch sm:self-auto">
                    <button
                        onClick={() => fetchTickets(false)}
                        disabled={isRefreshing}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                        <RefreshCw size={14} className={isRefreshing ? "animate-spin text-teal-600" : ""} />
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
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <span>Active Queue</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'all' ? 'bg-white text-teal-800' : 'bg-slate-100 text-slate-700'}`}>
                        {tickets.filter(t => t.status !== 'resolved').length}
                    </span>
                </button>

                <button
                    onClick={() => setFilter('assigned')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${
                        filter === 'assigned'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <span>My Claims</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'assigned' ? 'bg-white text-teal-800' : 'bg-slate-100 text-slate-700'}`}>
                        {myCount}
                    </span>
                </button>

                <button
                    onClick={() => setFilter('resolved')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${
                        filter === 'resolved'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <span>Resolved</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'resolved' ? 'bg-white text-teal-800' : 'bg-slate-100 text-slate-700'}`}>
                        {resolvedCount}
                    </span>
                </button>
            </div>

            {/* Ticket Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-xs uppercase font-bold tracking-widest text-slate-400">Loading Help Queue...</p>
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
                                        ? 'bg-white border-amber-300 shadow-[0_4px_20px_rgba(245,158,11,0.08)]'
                                        : ticket.status === 'accepted'
                                        ? 'bg-white border-teal-400 shadow-[0_4px_20px_rgba(20,184,166,0.08)]'
                                        : 'bg-slate-50 border-slate-200 opacity-70'
                                }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-3 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${catColors.bg} ${catColors.text} ${catColors.border}`}>
                                                <CategoryIcon size={14} />
                                                <span className="capitalize">{ticket.category}</span>
                                            </span>

                                            {ticket.teamId && ticket.teamId !== 'NO_TEAM_ID' && ticket.teamId !== 'GUEST' ? (
                                                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                                    ID: {ticket.teamId}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                                    No Team ID Entered
                                                </span>
                                            )}

                                            <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                                                {ticket.teamName}
                                            </span>

                                            {ticket.source === 'edit_registration' && (
                                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 uppercase tracking-wider">
                                                    Registration Portal
                                                </span>
                                            )}

                                            {ticket.tableNumber && (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
                                                    <MapPin size={12} />
                                                    <span>Table {ticket.tableNumber}</span>
                                                </span>
                                            )}

                                            <span className="text-[11px] text-slate-400 font-medium ml-auto md:ml-0 flex items-center gap-1">
                                                <Clock size={12} />
                                                <span>{timeAgo(ticket.createdAt)}</span>
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                                            {ticket.description}
                                        </p>

                                        {/* POC Contact Information & Direct Action Buttons */}
                                        {(ticket.contactName || ticket.contactPhone || ticket.contactEmail) && (
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                                                {ticket.contactName && (
                                                    <span className="text-slate-800 font-bold flex items-center gap-1.5">
                                                        <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">POC:</span>
                                                        {ticket.contactName}
                                                    </span>
                                                )}
                                                {ticket.contactPhone && (
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={`tel:${ticket.contactPhone}`}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-bold text-xs transition shadow-sm"
                                                            title="Call Contact"
                                                        >
                                                            <Phone size={12} className="text-teal-600" />
                                                            <span>Call: {ticket.contactPhone}</span>
                                                        </a>
                                                        <a
                                                            href={`https://wa.me/${ticket.contactPhone.replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs transition shadow-sm"
                                                            title="Chat on WhatsApp"
                                                        >
                                                            <MessageSquare size={12} className="text-emerald-600" />
                                                            <span>WhatsApp</span>
                                                        </a>
                                                    </div>
                                                )}
                                                {ticket.contactEmail && (
                                                    <a
                                                        href={`mailto:${ticket.contactEmail}`}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs transition"
                                                        title="Email POC"
                                                    >
                                                        <Mail size={12} className="text-slate-400" />
                                                        <span>{ticket.contactEmail}</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {ticket.status === 'accepted' && (
                                            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl w-fit">
                                                <User size={13} />
                                                <span>Claimed by: <strong>{ticket.acceptedBy || "Mentor"}</strong></span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                        {ticket.status === 'open' && (
                                            <button
                                                onClick={() => handleTicketAction(ticket.id, 'accept')}
                                                disabled={isPendingAction}
                                                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                            >
                                                {isPendingAction ? (
                                                    <RefreshCw size={14} className="animate-spin" />
                                                ) : (
                                                    <Check size={14} />
                                                )}
                                                <span>Claim Request</span>
                                            </button>
                                        )}

                                        {ticket.status === 'accepted' && (
                                            <>
                                                <button
                                                    onClick={() => handleTicketAction(ticket.id, 'resolve')}
                                                    disabled={isPendingAction}
                                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                                >
                                                    {isPendingAction ? (
                                                        <RefreshCw size={14} className="animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 size={14} />
                                                    )}
                                                    <span>Mark Resolved</span>
                                                </button>

                                                {assignedToMe && (
                                                    <button
                                                        onClick={() => handleTicketAction(ticket.id, 'cancel')}
                                                        disabled={isPendingAction}
                                                        className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all disabled:opacity-50"
                                                        title="Release claim back to queue"
                                                    >
                                                        Release
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {ticket.status === 'resolved' && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                <span>Resolved</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                        <LifeBuoy size={44} className="text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800">
                            {filter === 'assigned'
                                ? "You haven't claimed any tickets yet"
                                : filter === 'resolved'
                                ? "No resolved tickets yet"
                                : "No active help requests"}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            {filter === 'all'
                                ? "When teams ask for technical or mentor guidance, tickets will instantly appear here."
                                : "Check the active queue to view open requests from participants."}
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
