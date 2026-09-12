"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Clock,
    User,
    MapPin,
    ArrowRight
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VolunteerTickets() {
    const [filter, setFilter] = useState<'all' | 'assigned' | 'resolved'>('all');
    const [tickets, setTickets] = useState([
        { id: "TK-105", team: "Cyber Titans", location: "Lab 301, Block C", issue: "Server rack overheating warnings.", priority: "critical", status: "open", time: "5m ago" },
        { id: "TK-104", team: "Code Ninjas", location: "Hall A, Table 12", issue: "Need extra power strips.", priority: "medium", status: "assigned", assignee: "You", time: "15m ago" },
        { id: "TK-103", team: "Pixel Perfect", location: "Cafeteria", issue: "Vegan meal tokens missing.", priority: "low", status: "resolved", assignee: "Sarah", time: "1h ago" },
    ]);

    const filteredTickets = tickets.filter(t => {
        if (filter === 'assigned') return t.status === 'assigned' && t.assignee === 'You';
        if (filter === 'resolved') return t.status === 'resolved';
        return t.status !== 'resolved'; // Default 'all' shows open & assigned
    });

    const handleClaim = (id: string) => {
        setTickets(tickets.map(t => t.id === id ? { ...t, status: 'assigned', assignee: 'You' } : t));
    };

    const handleResolve = (id: string) => {
        setTickets(tickets.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
    };

    return (
        <DashboardLayout type="volunteer" title="Ticket Queue">
            <div className="flex gap-4 mb-8 overflow-x-auto scrollbar-hide">
                {['all', 'assigned', 'resolved'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 ${filter === f ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-white/5 text-white/40 hover:bg-white/10'
                            }`}
                    >
                        {f === 'all' ? 'Active Queue' : f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                        <div key={ticket.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md relative group hover:border-purple-500/30 transition-all">
                            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                <div className="space-y-4 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{ticket.id}</span>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${ticket.priority === 'critical' ? 'bg-red-500/10 text-red-500' :
                                                ticket.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {ticket.priority}
                                        </div>
                                        {ticket.status === 'assigned' && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px] font-bold uppercase tracking-widest">
                                                <User size={10} />
                                                Assigned: {ticket.assignee}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold italic mb-1">{ticket.issue}</h3>
                                        <div className="flex items-center gap-4 text-sm text-white/60 font-medium">
                                            <span className="flex items-center gap-1.5"><User size={14} /> {ticket.team}</span>
                                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {ticket.location}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 min-w-[140px]">
                                    <span className="text-xs font-bold text-white/20 italic flex items-center gap-1">
                                        <Clock size={12} /> {ticket.time}
                                    </span>

                                    {ticket.status === 'open' && (
                                        <button
                                            onClick={() => handleClaim(ticket.id)}
                                            className="w-full py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest italic rounded-xl hover:scale-105 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            Claim Ticket
                                            <ArrowRight size={14} />
                                        </button>
                                    )}

                                    {ticket.status === 'assigned' && ticket.assignee === 'You' && (
                                        <button
                                            onClick={() => handleResolve(ticket.id)}
                                            className="w-full py-3 bg-green-500 text-white font-black uppercase text-[10px] tracking-widest italic rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            Mark Resolved
                                            <CheckCircle2 size={14} />
                                        </button>
                                    )}

                                    {ticket.status === 'resolved' && (
                                        <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-white/20 font-bold text-xs uppercase tracking-widest cursor-default">
                                            Completed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <CheckCircle2 size={48} className="mb-4" />
                        <h3 className="text-xl font-bold italic uppercase tracking-tight">All Clear!</h3>
                        <p className="text-sm">No tickets found in this category.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
