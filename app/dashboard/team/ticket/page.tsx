"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import { useEffect, useState, useMemo } from "react";
import { QrCode, Download, MapPin, Calendar, Clock, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { DEMO_PROJECT, DEMO_TEAM_ID } from "@/lib/demo-data";

export default function TeamTicket() {
    const { user } = useAuth();
    const { projects, isLoading, wifiDetails } = useHackathon();
    const [qrDataUrl, setQrDataUrl] = useState<string>("");

    // Find the team matching the logged-in user's teamId
    const activeTeam = useMemo(() => {
        if (!user?.teamId) return null;
        const matchingTeam = projects.find(p => p.teamId === user.teamId || p.id === user.teamId);
        return matchingTeam || (user.teamId === DEMO_TEAM_ID ? DEMO_PROJECT : null);
    }, [projects, user]);

    useEffect(() => {
        if (activeTeam) {
            // Encode the Team ID or Transaction ID for the scanner
            const data = activeTeam.teamId || activeTeam.id.toString();
            QRCode.toDataURL(data, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFEE00',
                },
            }).then(setQrDataUrl);
        }
    }, [activeTeam]);

    if (isLoading || !activeTeam) return null;

    return (
        <DashboardLayout type="team" title="Digital Entry Pass">
            <div className="max-w-md mx-auto">
                {/* Ticket Container */}
                <div className="bg-[#FFEE00] rounded-[3rem] overflow-hidden shadow-[0_20px_60px_rgba(255,238,0,0.3)] border-4 border-black relative">

                    {/* Top Section: Official Legend */}
                    <div className="bg-black p-8 text-center border-b-4 border-dashed border-[#FFEE00]/50">
                        <div className="flex items-center justify-center gap-2">
                            <ShieldCheck className="text-[#FFEE00]" size={24} />
                            <span className="text-[12px] font-black text-[#FFEE00] uppercase tracking-[0.5em]">Gate Pass Authorized</span>
                        </div>
                    </div>

                    {/* Middle Section: QR Code */}
                    <div className="p-10 flex flex-col items-center justify-center bg-[#FFEE00]">
                        <div className="bg-black p-4 rounded-[2.5rem] shadow-2xl mb-8 translate-x-6 group transition-transform hover:scale-105">
                            {qrDataUrl ? (
                                <img src={qrDataUrl} alt="Team QR Code" className="w-64 h-64 rounded-3xl" />
                            ) : (
                                <div className="w-64 h-64 bg-white/10 animate-pulse rounded-3xl" />
                            )}
                        </div>

                        <div className="text-center space-y-1">
                            <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">Team Identity</span>
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-black">{activeTeam.team}</h3>
                            <div className="inline-block px-4 py-1 bg-black text-[#FFEE00] rounded-full text-xs font-black tracking-widest uppercase">
                                {activeTeam.teamId}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Details Grid */}
                    <div className="p-8 bg-black/5 border-t-4 border-dashed border-black/10 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-black/30 uppercase tracking-widest flex items-center gap-1">
                                    <MapPin size={10} /> Venue
                                </span>
                                <p className="text-sm font-black text-black uppercase italic">{activeTeam.room || "C-BLOCK 304"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-black/30 uppercase tracking-widest flex items-center gap-1">
                                    <Clock size={10} /> Check-In
                                </span>
                                <p className="text-sm font-black text-black uppercase italic">08:00 AM IST</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-black/30 uppercase tracking-widest block">Team Roster</span>
                            <div className="flex flex-wrap gap-2">
                                {activeTeam.members.map((m: any, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-black/10 rounded-lg text-[10px] font-bold text-black border border-black/5">
                                        {typeof m === 'string' ? m : m.fullName}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Decorative Cutouts */}
                    <div className="absolute top-1/2 -left-4 w-8 h-8 bg-[#06000D] rounded-full -translate-y-1/2 border-r-4 border-black" />
                    <div className="absolute top-1/2 -right-4 w-8 h-8 bg-[#06000D] rounded-full -translate-y-1/2 border-l-4 border-black" />
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => window.print()}
                        className="flex-grow py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase italic text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                    >
                        <Download size={18} /> Download PDF
                    </button>
                </div>

                <p className="mt-6 text-center text-white/20 text-[10px] font-medium uppercase tracking-[0.2em]">
                    Present this QR code to the volunteer at the entrance.
                </p>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none; }
                    body { background: white !important; }
                    .print-ticket { margin: 0; padding: 0; }
                }
            `}</style>
        </DashboardLayout>
    );
}
