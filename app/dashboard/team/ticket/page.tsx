"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, QrCode, ShieldCheck, Users, Coffee, Check, ChevronLeft, ChevronRight } from "lucide-react";
import QRCode from "qrcode";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import { EVENT_MEALS } from "@/lib/meals";

function getMemberId(member: any, index: number): string {
    if (typeof member === "string") return `member_${index}`;
    return member.email || `member_${index}`;
}

function getMemberName(member: any): string {
    return typeof member === "string" ? member : member.fullName;
}

export default function TeamTicket() {
    const { user } = useAuth();
    const { projects, isLoading, enabledMeals } = useHackathon();
    const [leaderQr, setLeaderQr] = useState("");
    const [memberQrs, setMemberQrs] = useState<Record<string, string>>({});
    const [activePassIndex, setActivePassIndex] = useState(0); // 0 = leader, 1+ = members

    const team = useMemo(() => projects.find((project) => project.teamId === user?.teamId || project.id === user?.teamId) || null, [projects, user]);

    const members = useMemo(() => team?.members || [], [team]);

    // Generate leader QR
    useEffect(() => { 
        if (team) {
            const payload = JSON.stringify({ teamId: team.teamId || String(team.id), passType: "leader" });
            QRCode.toDataURL(payload, { 
                width: 360, margin: 1, color: { dark: "#172033", light: "#ffffff" } 
            }).then(setLeaderQr); 
        }
    }, [team]);

    // Generate member QRs
    useEffect(() => {
        if (team && members.length > 0) {
            const generateAll = async () => {
                const qrs: Record<string, string> = {};
                for (let i = 0; i < members.length; i++) {
                    const memberId = getMemberId(members[i], i);
                    const payload = JSON.stringify({ teamId: team.teamId || String(team.id), passType: "member", memberId });
                    qrs[memberId] = await QRCode.toDataURL(payload, {
                        width: 360, margin: 1, color: { dark: "#7c2d12", light: "#ffffff" }
                    });
                }
                setMemberQrs(qrs);
            };
            generateAll();
        }
    }, [team, members]);

    if (isLoading || !team) {
        return (
            <DashboardLayout type="team" title="Event pass">
                <div className="grid min-h-[360px] place-items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                </div>
            </DashboardLayout>
        );
    }

    const names = members.map((member: any) => getMemberName(member));
    const totalPasses = 1 + members.length; // 1 leader + N members
    const isLeaderPass = activePassIndex === 0;
    const currentMemberIndex = activePassIndex - 1;
    const currentMemberId = !isLeaderPass ? getMemberId(members[currentMemberIndex], currentMemberIndex) : "";
    const currentMemberName = !isLeaderPass ? getMemberName(members[currentMemberIndex]) : "";

    // Meal progress for current member
    const memberMealState = !isLeaderPass ? (team.memberMealState?.[currentMemberId] || {}) : {};

    return (
        <DashboardLayout type="team" title="Event pass">
            <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-4">
                    {/* Pass Carousel Navigation */}
                    <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3">
                        <button 
                            onClick={() => setActivePassIndex(Math.max(0, activePassIndex - 1))}
                            disabled={activePassIndex === 0}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Pass {activePassIndex + 1} of {totalPasses}
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                                {isLeaderPass ? "Team Leader — Check-in Pass" : `${currentMemberName} — Meal Pass`}
                            </p>
                        </div>
                        <button 
                            onClick={() => setActivePassIndex(Math.min(totalPasses - 1, activePassIndex + 1))}
                            disabled={activePassIndex === totalPasses - 1}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Pass Card */}
                    {isLeaderPass ? (
                        /* ===== LEADER / CHECK-IN PASS ===== */
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-100 p-5">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
                                        <ShieldCheck size={19} />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400">TRICITY AI HACKATHON</p>
                                        <p className="text-sm font-semibold">Team Check-in Pass</p>
                                    </div>
                                </div>
                                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${team.checkedInAt || team.isCheckedIn ? 'bg-emerald-50 text-emerald-700' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                                    {team.checkedInAt || team.isCheckedIn ? '✓ Checked In' : 'Valid'}
                                </span>
                            </div>
                            <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:items-center md:p-7">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                    {leaderQr ? <img src={leaderQr} alt="Team check-in QR" className="aspect-square w-full" /> : <div className="aspect-square animate-pulse rounded-xl bg-slate-200" />}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400">TEAM</p>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{team.team}</h2>
                                    <p className="mt-2 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{team.teamId}</p>
                                    <p className="mt-4 text-sm leading-6 text-slate-500">
                                        Show this code at the entrance. Only the <strong>Team Leader</strong> needs to present this — it checks in the entire team.
                                    </p>
                                </div>
                            </div>
                            <div className="grid border-t border-slate-100 sm:grid-cols-1">
                                <Detail icon={CalendarDays} label="Check-in" value="8:00 AM · Event day" />
                            </div>
                        </section>
                    ) : (
                        /* ===== MEMBER / MEAL PASS ===== */
                        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/50 p-5">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
                                        <Coffee size={19} />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold text-amber-600/70 tracking-widest uppercase">Individual Meal Pass</p>
                                        <p className="text-sm font-semibold text-slate-900">{currentMemberName}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:items-center md:p-7">
                                <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-3">
                                    {memberQrs[currentMemberId] ? (
                                        <img src={memberQrs[currentMemberId]} alt={`${currentMemberName} meal QR`} className="aspect-square w-full" />
                                    ) : (
                                        <div className="aspect-square animate-pulse rounded-xl bg-amber-100" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-amber-600/70 uppercase tracking-wider">Member</p>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{currentMemberName}</h2>
                                    <p className="mt-2 inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                                        Meal Pass
                                    </p>
                                    <p className="mt-4 text-sm leading-6 text-slate-500">
                                        Show this pass at each food counter to claim your meal. Each scan is per-member, per-meal.
                                    </p>
                                </div>
                            </div>

                            {/* Meal Progress */}
                            {enabledMeals.length > 0 && (
                                <div className="border-t border-amber-100 p-5">
                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-3">Meal Progress</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {enabledMeals.map(mealKey => {
                                            const config = EVENT_MEALS.find(m => m.key === mealKey);
                                            const claimed = !!memberMealState[mealKey]?.claimedAt;
                                            return (
                                                <div key={mealKey} className={`flex items-center justify-between p-3 rounded-xl border ${claimed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{config?.mealLabel || mealKey}</p>
                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{config?.dayLabel}</p>
                                                    </div>
                                                    {claimed ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-wider">
                                                            <Check size={12} /> Claimed
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider border border-amber-100">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </div>

                <aside className="space-y-4">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-indigo-600" />
                            <p className="text-sm font-semibold">Team members</p>
                        </div>
                        <div className="mt-4 space-y-2">
                            {names.map((name, index) => {
                                const passIdx = index + 1; // 0 = leader
                                const isActive = activePassIndex === passIdx;
                                return (
                                    <button 
                                        key={`${name}-${index}`} 
                                        onClick={() => setActivePassIndex(passIdx)}
                                        className={`flex items-center gap-2 text-sm w-full text-left px-2 py-1.5 rounded-lg transition ${isActive ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${isActive ? 'bg-amber-200 text-amber-800' : 'bg-slate-100'}`}>
                                            {name?.charAt(0)}
                                        </span>
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                    <button onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 hover:shadow-md">
                        <Download size={16} /> Print or save pass
                    </button>
                    <p className="flex items-center justify-center gap-1 text-xs text-slate-400">
                        <QrCode size={13} /> Each member has their own unique QR
                    </p>
                </aside>
            </div>
        </DashboardLayout>
    );
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) { 
    return (
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <Icon size={17} className="text-slate-400" />
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
            </div>
        </div>
    ); 
}
