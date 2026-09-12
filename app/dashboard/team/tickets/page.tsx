"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    Tag
} from "lucide-react";

export default function TeamTickets() {

    return (
        <DashboardLayout type="team" title="Support Portal">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Ticket List Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">My Tickets</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { id: "TK-102", title: "API Gateway timeout error", category: "Technical", status: "In Progress", time: "25m ago" },
                            { id: "TK-098", title: "Missing power sockets at Table 12", category: "Operations", status: "Resolved", time: "2h ago" },
                        ].map((ticket) => (
                            <div key={ticket.id} className="group bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/[0.08] transition-all cursor-pointer backdrop-blur-md">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{ticket.id}</span>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${ticket.category === 'Technical' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                            {ticket.category}
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-white/20 italic">{ticket.time}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold group-hover:text-white transition-colors capitalize italic">{ticket.title}</h3>
                                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${ticket.status === 'Resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'Resolved' ? 'bg-green-500' : 'bg-purple-500 animate-pulse'}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{ticket.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info/Stats sidebar */}
                <div className="space-y-6">
                    <div className="bg-[#FFEE00] border-4 border-black rounded-[2.5rem] p-8 shadow-[12px_12px_0_#9E00F9]">
                        <h3 className="text-black text-xl font-black italic uppercase leading-tight mb-4 tracking-tighter">Instant Support</h3>
                        <p className="text-black/60 text-xs font-medium mb-8">
                            Our volunteers are roaming the halls. If it's urgent, flag anyone in a purple tricity t-shirt!
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-black/5 p-3 rounded-xl">
                                <Tag size={16} className="text-black" />
                                <span className="text-xs font-bold text-black uppercase tracking-widest">Avg Response: 5m</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md">
                        <h3 className="text-lg font-bold mb-6 italic">Support Guidelines</h3>
                        <ul className="space-y-4">
                            {[
                                "Explain the technical issue clearly",
                                "Include screenshots for UI bugs",
                                "Wait for volunteer assignment",
                                "Close ticket once resolved"
                            ].map((step, i) => (
                                <li key={i} className="flex gap-3 text-xs text-white/40 font-medium italic">
                                    <span className="text-purple-500">â€¢</span>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
