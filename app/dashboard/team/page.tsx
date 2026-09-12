"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    Users,
    MapPin,
    UserSquare2,
    Edit3,
    Save,
    Cpu,
    Target,
    ExternalLink,
    QrCode
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import { DEMO_PROJECT, DEMO_TEAM_ID } from "@/lib/demo-data";

export default function TeamDashboard() {
    const { wifiDetails, isSubmissionLocked, projects, isLoading } = useHackathon();
    const [problemStatement, setProblemStatement] = useState("");
    const [isEditingProblem, setIsEditingProblem] = useState(false);

    const { user } = useAuth();

    // Find the team matching the logged-in user's teamId
    const activeTeam = useMemo(() => {
        if (!user?.teamId) return null;

        // Try precise match first
        let found = projects.find(p => p.teamId === user.teamId);

        // Fallback: Try match by transaction ID or parts of ID if needed
        if (!found) {
            found = projects.find(p => p.id === user.teamId);
        }

        // Demo entry is intentionally self-contained so it is available before
        // (or without) the remote teams API responding.
        if (!found && user.teamId === DEMO_TEAM_ID) return DEMO_PROJECT;

        return found || null;
    }, [projects, user]);

    const teamDetails = useMemo(() => {
        if (!activeTeam) return {
            members: [],
            room: "TBD",
            coordinator: { name: "Not Assigned", phone: "N/A" }
        };

        const mappedMembers = (activeTeam.members || []).map((m: any, i: number) => {
            if (typeof m === 'string') {
                return { name: m, role: i === 0 ? "Captain" : "Member", phone: i === 0 ? activeTeam.captainMobile : "Hidden" };
            }
            return {
                name: m.fullName,
                role: i === 0 ? "Captain" : (m.role || "Member"),
                phone: m.phone || "Hidden"
            };
        });

        return {
            members: mappedMembers,
            room: activeTeam.room || "TBD",
            coordinator: {
                name: activeTeam.coordinator?.name || "Not Assigned",
                phone: activeTeam.coordinator?.phone || "N/A"
            }
        };
    }, [activeTeam]);

    useEffect(() => {
        if (activeTeam) {
            setProblemStatement(activeTeam.problemStatement || "Project Scope Pending...");
        }
    }, [activeTeam]);

    const handleCommitProblem = async () => {
        if (isEditingProblem && activeTeam?.id) {
            try {
                await fetch('/api/teams', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: activeTeam.id, problemStatement })
                });
            } catch (err) {
                console.error("Failed to commit problem:", err);
            }
        }
        setIsEditingProblem(!isEditingProblem);
    };

    if (isLoading) {
        return (
            <DashboardLayout type="team" title="Logging In...">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!activeTeam) {
        return (
            <DashboardLayout type="team" title="No Team Found">
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <h2 className="text-2xl font-black text-white mb-4 italic uppercase">Identity Error</h2>
                    <p className="text-white/40 max-w-md">We couldn't find a registered team associated with this session. Please ensure you have completed the registration and payment process.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="team" title="Team Command Center">

            {/* --- Top Stats Row --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6 mb-3 lg:mb-6 shrink-0">
                {/* Team Identity Card - YELLOW STYLE */}
                <div className="bg-[#FFEE00] border-2 border-black rounded-2xl lg:rounded-[1.8rem] p-3.5 lg:p-4.5 flex items-center justify-between shadow-[4px_4px_0_#9333ea] lg:shadow-[5px_5px_0_#9333ea] relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col">
                        <span className="text-[8px] lg:text-[9px] font-black text-black/40 uppercase tracking-[0.2em] leading-none">
                            {teamDetails.members.length === 1 ? 'Individual Profile' : teamDetails.members.length === 2 ? 'Duo Profile' : 'Squad Profile'}
                        </span>
                        <h3 className="text-xl lg:text-2xl font-black italic uppercase tracking-tighter text-black leading-tight mt-0.5 lg:mt-1">
                            {activeTeam.team}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 lg:mt-1">
                            <span className="text-[8px] lg:text-[9px] font-black text-[#FFEE00] px-1.5 lg:px-2 py-0.5 border border-black rounded bg-black uppercase tracking-[0.1em] leading-none">
                                {activeTeam.teamId || "ID-PENDING"}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-black flex flex-col items-center justify-center border-2 border-black group-hover:rotate-6 transition-transform duration-300 shadow-lg relative overflow-hidden group/btn">
                        <Link href="/dashboard/team/ticket" className="absolute inset-0 flex items-center justify-center bg-[#FFEE00] text-black opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <QrCode size={20} />
                        </Link>
                        <span className="text-lg lg:text-2xl font-black text-[#FFEE00] z-10 group-hover:opacity-0 transition-opacity">
                            {activeTeam.team[0]}
                        </span>
                    </div>
                </div>

                {/* Track Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl lg:rounded-3xl p-3.5 lg:p-6 flex flex-col justify-center relative overflow-hidden hover:bg-white/[0.08] transition-all border-b-purple-500/50">
                    <div className="flex items-center gap-2 mb-1 lg:mb-2">
                        <Target className="text-purple-400 shrink-0" size={14} />
                        <span className="text-[8px] lg:text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Competitive Track</span>
                    </div>
                    <div className="text-base lg:text-xl font-black italic uppercase tracking-tight text-white line-clamp-1">
                        {activeTeam.track}
                    </div>
                </div>

                {/* Grid Location - YELLOW STYLE */}
                <div className="bg-[#FFEE00] border-2 border-black rounded-2xl lg:rounded-3xl p-3.5 lg:p-6 flex flex-col justify-center relative shadow-[4px_4px_0_#9333ea] lg:shadow-[6px_6px_0_#9333ea]">
                    <div className="flex items-center gap-2 mb-1 lg:mb-2">
                        <MapPin className="text-black/60 shrink-0" size={14} />
                        <span className="text-[8px] lg:text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">Grid Location</span>
                    </div>
                    <div className="text-xl lg:text-3xl font-black italic uppercase tracking-tight text-black flex items-baseline gap-1 lg:gap-2">
                        {activeTeam.room || "TBD"}
                    </div>
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6 flex-grow min-h-0 pb-2">

                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-3 lg:space-y-6 flex flex-col min-h-0">

                    {/* Problem Statement Section */}
                    <div className="bg-white/5 border border-white/10 rounded-[1.2rem] lg:rounded-[2rem] p-4 lg:p-8 backdrop-blur-md flex flex-col h-full hover:border-purple-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4 lg:mb-8">
                            <div className="flex items-center gap-3 lg:gap-4">
                                <div className="p-2 lg:p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                    <Cpu className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-sm lg:text-2xl font-black italic uppercase tracking-tighter text-white">Project Scope</h2>
                                    <p className="text-[8px] lg:text-xs font-bold text-white/30 uppercase tracking-widest mt-0.5">Title & Core Vision</p>
                                </div>
                            </div>
                            {!isSubmissionLocked && (
                                <button
                                    onClick={handleCommitProblem}
                                    className={`px-3 lg:px-5 py-1.5 lg:py-2.5 rounded-xl lg:rounded-2xl text-[9px] lg:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${isEditingProblem
                                        ? "bg-green-500 border-green-600 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                                        }`}
                                >
                                    {isEditingProblem ? <Save size={14} /> : <Edit3 size={14} />}
                                    {isEditingProblem ? "Commit" : "Update"}
                                </button>
                            )}
                        </div>

                        <div className="relative flex-grow">
                            {isEditingProblem ? (
                                <>
                                    <textarea
                                        value={problemStatement}
                                        onChange={(e) => setProblemStatement(e.target.value)}
                                        placeholder="Define your project's mission..."
                                        className="w-full h-full min-h-[150px] lg:min-h-[200px] bg-black/40 border-2 border-purple-500/30 rounded-2xl lg:rounded-[2.5rem] p-5 lg:p-8 text-white font-medium focus:outline-none focus:border-purple-500 transition-all text-[12px] lg:text-xl leading-relaxed resize-none custom-scrollbar"
                                        data-lenis-prevent
                                    />
                                    <div className="absolute top-4 right-6 flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 animate-pulse delay-75" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500/30 animate-pulse delay-150" />
                                    </div>
                                </>
                            ) : (
                                <div className="h-full min-h-[150px] lg:min-h-[200px] bg-black/20 border border-white/5 rounded-2xl lg:rounded-[2.5rem] p-5 lg:p-10 flex items-center relative group">
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 to-transparent rounded-[2.5rem] pointer-events-none" />
                                    <p className="text-white/80 font-medium leading-relaxed text-[13px] lg:text-2xl whitespace-pre-wrap relative z-10 italic">
                                        "{problemStatement || "No title defined yet."}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (1/3) - Team Roster */}
                <div className="bg-white/5 border border-white/10 rounded-[1.2rem] lg:rounded-[2rem] p-4 lg:p-6 backdrop-blur-md flex flex-col h-full">
                    <div className="flex items-center gap-3 lg:gap-4 mb-6 lg:mb-10">
                        <UserSquare2 className="text-pink-400" size={20} />
                        <h2 className="text-sm lg:text-xl font-black italic uppercase tracking-tighter text-white">
                            {teamDetails.members.length === 1 ? 'Participant Info' : 'Team Roster'}
                        </h2>
                    </div>

                    <div
                        className="space-y-3 lg:space-y-4 overflow-y-auto pr-1 custom-scrollbar scroll-smooth"
                        data-lenis-prevent
                    >
                        {teamDetails.members.map((member, i) => (
                            <div key={i} className="group bg-white/5 hover:bg-white/[0.08] lg:hover:border-white/20 border border-white/5 rounded-xl lg:rounded-2xl p-2.5 lg:p-4 flex items-center gap-3 lg:gap-4 transition-all duration-300">
                                <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 flex items-center justify-center text-white/80 font-black text-base lg:text-xl shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                    {member.name.charAt(0)}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="text-[11px] lg:text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                        {member.name}
                                    </div>
                                    <div className="text-[8px] lg:text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] lg:tracking-[0.15em] mt-0.5 truncate flex items-center gap-1.5">
                                        {member.role}
                                        {member.role === "Captain" && <span className="w-1 h-1 rounded-full bg-[#FFEE00] animate-pulse" />}
                                    </div>
                                </div>
                                {member.role === "Captain" && (
                                    <div className="px-1 lg:px-2 py-0.5 lg:py-1 bg-[#FFEE00] rounded lg:rounded-lg text-[6px] lg:text-[8px] font-black text-black uppercase tracking-widest shrink-0 shadow-[1px_1px_0_black] lg:shadow-[2px_2px_0_black]">
                                        LEAD
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </DashboardLayout>
    );
}
