"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, QrCode, ShieldCheck, Users, Coffee, Check, ChevronLeft, ChevronRight, AlertCircle, UtensilsCrossed, Clock } from "lucide-react";
import QRCode from "qrcode";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import { EVENT_MEALS, hasIndividualMealPass } from "@/lib/meals";

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

    // Generate leader QR (Gate Check-in only)
    useEffect(() => { 
        if (team) {
            const payload = JSON.stringify({ teamId: team.teamId || String(team.id), passType: "leader" });
            QRCode.toDataURL(payload, { 
                width: 360, margin: 1, color: { dark: "#172033", light: "#ffffff" } 
            }).then(setLeaderQr); 
        }
    }, [team]);

    // Generate member QRs (ONLY for members who purchased a meal pass)
    useEffect(() => {
        if (team && members.length > 0) {
            const generateAll = async () => {
                const qrs: Record<string, string> = {};
                for (let i = 0; i < members.length; i++) {
                    const memberId = getMemberId(members[i], i);
                    const memberEmail = typeof members[i] === "object" ? members[i]?.email : undefined;
                    const eligible = hasIndividualMealPass(team, memberId, memberEmail);

                    if (eligible) {
                        const payload = JSON.stringify({ teamId: team.teamId || String(team.id), passType: "member", memberId });
                        qrs[memberId] = await QRCode.toDataURL(payload, {
                            width: 360, margin: 1, color: { dark: "#7c2d12", light: "#ffffff" }
                        });
                    }
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
    const currentMemberObj = !isLeaderPass ? members[currentMemberIndex] : null;
    const currentMemberId = !isLeaderPass ? getMemberId(currentMemberObj, currentMemberIndex) : "";
    const currentMemberEmail = typeof currentMemberObj === "object" ? currentMemberObj?.email : undefined;
    const currentMemberName = !isLeaderPass ? getMemberName(currentMemberObj) : "";

    // Meal pass eligibility for active member
    const hasMealPass = !isLeaderPass ? hasIndividualMealPass(team, currentMemberId, currentMemberEmail) : false;

    // Meal progress for current member
    const memberMealState = !isLeaderPass ? (team.memberMealState?.[currentMemberId] || team.memberMealState?.[currentMemberEmail?.toLowerCase() || ''] || {}) : {};

    return (
        <DashboardLayout type="team" title="Event pass">
            <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-4">
                    {/* Pass Carousel Navigation */}
                    <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
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
                                {isLeaderPass ? "Team Check-in Pass (Gate Entry)" : `${currentMemberName} — ${hasMealPass ? 'Meal Pass' : 'Gate Only'}`}
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
                        /* ===== LEADER / GATE CHECK-IN PASS ===== */
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 p-5">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
                                        <ShieldCheck size={19} />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TRI-CITY AI HACKATHON</p>
                                        <p className="text-sm font-bold text-slate-900">Venue Gate Check-in Pass</p>
                                    </div>
                                </div>
                                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${team.checkedInAt || team.isCheckedIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                                    {team.checkedInAt || team.isCheckedIn ? '✓ Team Checked In' : 'Valid for Gate Entry'}
                                </span>
                            </div>
                            <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:items-center md:p-7">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-inner">
                                    {leaderQr ? <img src={leaderQr} alt="Team check-in QR" className="aspect-square w-full" /> : <div className="aspect-square animate-pulse rounded-xl bg-slate-200" />}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TEAM</p>
                                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{team.team}</h2>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{team.teamId}</span>
                                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">Gate Pass</span>
                                    </div>
                                    <p className="mt-4 text-xs leading-5 text-slate-500">
                                        Present this QR code at the registration gate between <strong>8:00 AM – 11:00 AM</strong>. Only the <strong>Team Leader</strong> needs to present this to check in the whole team.
                                    </p>
                                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] font-medium text-amber-800">
                                        ⚠️ <strong>Notice:</strong> This pass is strictly for venue entry and <u>cannot</u> be used to claim food or meals at dining counters.
                                    </div>
                                </div>
                            </div>
                            <div className="grid border-t border-slate-100 sm:grid-cols-2">
                                <Detail icon={CalendarDays} label="Check-in Window" value="8:00 AM – 11:00 AM (Oct 10)" />
                                <Detail icon={Clock} label="Status" value={team.checkedInAt ? `Checked in at ${new Date(team.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Awaiting Gate Arrival"} />
                            </div>
                        </section>
                    ) : (
                        /* ===== MEMBER PASS (MEAL OR GATE ONLY) ===== */
                        hasMealPass ? (
                            /* ELIGIBLE FOR MEAL PASS */
                            <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/50 p-5">
                                    <div className="flex items-center gap-3">
                                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
                                            <Coffee size={19} />
                                        </span>
                                        <div>
                                            <p className="text-xs font-semibold text-amber-600/70 tracking-widest uppercase">Individual Meal Pass</p>
                                            <p className="text-sm font-bold text-slate-900">{currentMemberName}</p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold">
                                        Meal Access Active
                                    </span>
                                </div>
                                <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:items-center md:p-7">
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-3 shadow-inner">
                                        {memberQrs[currentMemberId] ? (
                                            <img src={memberQrs[currentMemberId]} alt={`${currentMemberName} meal QR`} className="aspect-square w-full" />
                                        ) : (
                                            <div className="aspect-square animate-pulse rounded-xl bg-amber-100" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-amber-600/70 uppercase tracking-wider">Participant</p>
                                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{currentMemberName}</h2>
                                        <p className="mt-2 inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                                            Meal Pass Included
                                        </p>
                                        <p className="mt-4 text-xs leading-5 text-slate-500">
                                            Show this individual QR code at the dining counters during designated meal times. Each meal pass is <strong>scanned only once per meal timing window</strong>.
                                        </p>
                                    </div>
                                </div>

                                {/* Meal Progress with Timing Windows */}
                                {enabledMeals.length > 0 && (
                                    <div className="border-t border-amber-100 p-5 bg-amber-50/20">
                                        <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest mb-3">Meal Schedule & Claims</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {enabledMeals.map(mealKey => {
                                                const config = EVENT_MEALS.find(m => m.key === mealKey);
                                                const claimed = !!memberMealState[mealKey]?.claimedAt;
                                                const claimedAt = memberMealState[mealKey]?.claimedAt;
                                                return (
                                                    <div key={mealKey} className={`flex items-center justify-between p-3 rounded-xl border ${claimed ? 'bg-emerald-50/80 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800">{config?.mealLabel || mealKey}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{config?.dayLabel}</span>
                                                                {config?.timeWindow && (
                                                                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                                        {config.timeWindow}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {claimed ? (
                                                            <div className="text-right">
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-wider">
                                                                    <Check size={12} /> Claimed
                                                                </span>
                                                                {claimedAt && (
                                                                    <p className="text-[9px] text-slate-400 mt-0.5">
                                                                        {new Date(claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider border border-slate-200">
                                                                Available
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </section>
                        ) : (
                            /* NOT ELIGIBLE / NO MEAL PASS PURCHASED */
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-400 text-white shadow-sm">
                                            <UtensilsCrossed size={19} />
                                        </span>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase">Participant Pass</p>
                                            <p className="text-sm font-bold text-slate-800">{currentMemberName}</p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 text-xs font-semibold">
                                        Gate Access Only
                                    </span>
                                </div>
                                <div className="p-6 md:p-8 text-center max-w-lg mx-auto space-y-4">
                                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                                        <AlertCircle size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">No Meal Pass Purchased</h3>
                                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                            <strong>{currentMemberName}</strong> is registered for hackathon venue admission and project participation, but <strong>did not purchase a meal pass</strong>.
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left text-xs space-y-2 text-slate-600">
                                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                                            <Check size={14} className="text-emerald-600" />
                                            <span>Full venue entrance access (Gate Pass valid 8:00 AM – 11:00 AM)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                                            <Check size={14} className="text-emerald-600" />
                                            <span>Project submission, mentoring & hackathon workspace access</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <span className="text-rose-500 font-black">✕</span>
                                            <span>Dining counter meal tokens (Not purchased)</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        If you would like to purchase on-site meal tokens, please speak with the event organizing desk during morning check-in.
                                    </p>
                                </div>
                            </section>
                        )
                    )}
                </div>

                <aside className="space-y-4">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-indigo-600" />
                            <p className="text-sm font-bold text-slate-900">Team Passes</p>
                        </div>
                        <div className="mt-4 space-y-1.5">
                            {/* Gate Check-in Pass Button */}
                            <button 
                                onClick={() => setActivePassIndex(0)}
                                className={`flex items-center justify-between text-xs w-full text-left px-3 py-2 rounded-lg transition ${activePassIndex === 0 ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <span className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-indigo-600" />
                                    <span>Team Gate Pass</span>
                                </span>
                                <span className="text-[9px] uppercase tracking-wider font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                                    Gate Entry
                                </span>
                            </button>

                            {/* Member Passes */}
                            {names.map((name, index) => {
                                const passIdx = index + 1; // 0 = leader
                                const isActive = activePassIndex === passIdx;
                                const mId = getMemberId(members[index], index);
                                const mEmail = typeof members[index] === "object" ? members[index]?.email : undefined;
                                const memberHasMeal = hasIndividualMealPass(team, mId, mEmail);

                                return (
                                    <button 
                                        key={`${name}-${index}`} 
                                        onClick={() => setActivePassIndex(passIdx)}
                                        className={`flex items-center justify-between text-xs w-full text-left px-3 py-2 rounded-lg transition ${isActive ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${isActive ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                                {name?.charAt(0)}
                                            </span>
                                            <span className="truncate">{name}</span>
                                        </span>
                                        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${memberHasMeal ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                                            {memberHasMeal ? 'Meal' : 'Gate'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                    <button onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 hover:shadow-md">
                        <Download size={16} /> Print or save pass
                    </button>
                    <p className="flex items-center justify-center gap-1 text-xs text-slate-400 text-center">
                        <QrCode size={13} /> Only participants with purchased meal passes receive dining QR codes.
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
