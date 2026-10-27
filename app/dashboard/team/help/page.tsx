"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Headphones, CheckCircle2, X, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";

export default function HelpPage() {
    const { user } = useAuth();
    const { projects } = useHackathon();
    const team = useMemo(() => projects.find((project) => project.teamId === user?.teamId || project.id === user?.teamId) || null, [projects, user]);

    // Help request state
    const [showHelpForm, setShowHelpForm] = useState(false);
    const [helpCategory, setHelpCategory] = useState("Technical");
    const [helpDescription, setHelpDescription] = useState("");
    const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);
    const [myTickets, setMyTickets] = useState<any[]>([]);
    const [isCancellingTicketId, setIsCancellingTicketId] = useState<string | null>(null);

    const fetchMyTickets = useCallback(async () => {
        try {
            const res = await fetch(`/api/help-tickets?t=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMyTickets(data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch team tickets:', error);
        }
    }, []);

    useEffect(() => {
        fetchMyTickets();
    }, [fetchMyTickets]);

    const handleCancelHelp = async (ticketId: string) => {
        setIsCancellingTicketId(ticketId);
        try {
            const res = await fetch('/api/help-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel', ticketId })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Help request cancelled.');
                setMyTickets(data.tickets || []);
            } else {
                toast.error(data.error || 'Failed to cancel ticket.');
            }
        } catch {
            toast.error('Could not cancel help request.');
        } finally {
            setIsCancellingTicketId(null);
        }
    };

    const handleSubmitHelp = async () => {
        if (!helpDescription.trim()) {
            toast.error('Please describe your issue.');
            return;
        }
        setIsSubmittingHelp(true);
        try {
            const res = await fetch('/api/help-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: helpCategory,
                    description: helpDescription,
                    teamName: team?.team || 'Unknown Team'
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Help request sent! A volunteer will be with you shortly.');
                setShowHelpForm(false);
                setHelpDescription('');
                if (data.tickets) {
                    setMyTickets(data.tickets);
                } else {
                    fetchMyTickets();
                }
            } else {
                toast.error(data.error || 'Failed to submit help request.');
            }
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setIsSubmittingHelp(false);
        }
    };

    return (
        <DashboardLayout type="team" title="Need Help?" subtitle="Request technical support or mentoring from our expert volunteers">
            <div className="max-w-2xl mx-auto">
                <section className="rounded-2xl border-2 border-black bg-white p-6 sm:p-8 shadow-[4px_4px_0px_#000]">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-black bg-[#f7cb46] text-black shadow-[2px_2px_0px_#000]">
                            <Headphones size={24} />
                        </span>
                        <div>
                            <h3 className="text-lg font-black text-black">Support Desk</h3>
                            <p className="text-sm font-medium text-slate-700">Submit a ticket and a volunteer will visit your table.</p>
                        </div>
                    </div>

                    {/* Active Tickets List */}
                    {myTickets.length > 0 && (
                        <div className="space-y-3 mb-6">
                            {myTickets.map(ticket => {
                                const isCancelling = isCancellingTicketId === ticket.id;
                                return (
                                    <div key={ticket.id} className="rounded-xl border-2 border-black bg-white p-4 shadow-[3px_3px_0px_#000]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-black bg-[#ffdc8b] text-black shadow-[1px_1px_0px_#000]">
                                                        {ticket.category}
                                                    </span>
                                                    {ticket.tableNumber && (
                                                        <span className="text-xs font-bold text-black border border-black bg-[#c0f7fe] px-2 py-0.5 rounded shadow-[1px_1px_0px_#000]">
                                                            Table {ticket.tableNumber}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-black mt-2">
                                                    {ticket.description}
                                                </p>
                                            </div>

                                            {ticket.status === 'open' && (
                                                <button
                                                    onClick={() => handleCancelHelp(ticket.id)}
                                                    disabled={isCancelling}
                                                    title="Cancel request"
                                                    className="text-black border-2 border-black p-1.5 rounded-lg transition-all disabled:opacity-50 bg-[#fe90e8] hover:bg-[#ffdc8b] shadow-[2px_2px_0px_#000]"
                                                >
                                                    {isCancelling ? (
                                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <X size={16} />
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Live Status Indicator */}
                                        <div className="mt-4 pt-3 border-t-2 border-black flex items-center justify-between text-xs">
                                            {ticket.status === 'open' && (
                                                <span className="inline-flex items-center gap-2 font-black text-black border border-black bg-[#ffdc8b] px-3 py-1 rounded-md shadow-[1px_1px_0px_#000]">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-black animate-ping" />
                                                    Waiting for volunteer...
                                                </span>
                                            )}
                                            {ticket.status === 'accepted' && (
                                                <span className="inline-flex items-center gap-2 font-black text-black border border-black bg-[#99e885] px-3 py-1.5 rounded-md shadow-[1px_1px_0px_#000]">
                                                    <CheckCircle2 size={16} className="text-black" />
                                                    {ticket.acceptedBy ? `${ticket.acceptedBy} is on the way!` : 'Volunteer is on the way!'}
                                                </span>
                                            )}
                                            {ticket.status === 'resolved' && (
                                                <span className="inline-flex items-center gap-1.5 text-black font-black border border-black bg-[#c0f7fe] px-3 py-1 rounded-md shadow-[1px_1px_0px_#000]">
                                                    <CheckCircle2 size={14} />
                                                    Resolved
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!showHelpForm ? (
                        <div>
                            {myTickets.filter(t => t.status !== 'resolved').length < 3 ? (
                                <button
                                    onClick={() => setShowHelpForm(true)}
                                    className="w-full py-3.5 rounded-xl border-2 border-black bg-[#f7cb46] text-black text-sm font-black hover:bg-[#ffdc8b] transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
                                >
                                    <Headphones size={18} />
                                    {myTickets.filter(t => t.status !== 'resolved').length > 0 ? "+ Request Another Help" : "Request Help / Mentor"}
                                </button>
                            ) : (
                                <p className="text-sm text-black font-bold text-center border-2 border-black bg-[#ffdc8b] p-3 rounded-xl shadow-[3px_3px_0px_#000]">
                                    You have 3 active requests in queue. Please wait for a volunteer.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 bg-white p-5 sm:p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_#000]">
                            <div>
                                <label className="text-xs font-black uppercase tracking-wider text-black mb-1.5 block">Category</label>
                                <select
                                    value={helpCategory}
                                    onChange={e => setHelpCategory(e.target.value)}
                                    className="w-full rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm font-bold text-black outline-none shadow-[2px_2px_0px_#000] transition-all"
                                >
                                    <option value="Technical">Technical (Code/Bug)</option>
                                    <option value="Mentor">Need a Mentor</option>
                                    <option value="WiFi/Infra">WiFi / Infrastructure</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-wider text-black mb-1.5 block">Describe your issue</label>
                                <textarea
                                    value={helpDescription}
                                    onChange={e => setHelpDescription(e.target.value)}
                                    placeholder="e.g. Our backend API is returning 500 errors..."
                                    rows={4}
                                    className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black outline-none shadow-[2px_2px_0px_#000] transition-all resize-none placeholder:text-slate-400"
                                />
                            </div>
                            <div className="flex gap-3 pt-2 border-t-2 border-black">
                                <button
                                    onClick={() => setShowHelpForm(false)}
                                    className="flex-1 py-2.5 rounded-xl border-2 border-black bg-white text-sm font-black text-black hover:bg-slate-100 shadow-[2px_2px_0px_#000] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitHelp}
                                    disabled={isSubmittingHelp || !helpDescription.trim()}
                                    className="flex-1 py-2.5 rounded-xl border-2 border-black bg-[#99e885] text-black text-sm font-black hover:bg-[#83df6e] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
                                >
                                    {isSubmittingHelp ? (
                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                    Send Request
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
