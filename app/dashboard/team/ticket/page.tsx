'use client';
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import { Download, Info, QrCode, Ticket, CheckCircle2, MapPin } from "lucide-react";
import QRCode from "qrcode";

export default function TicketPage() {
    const { user } = useAuth();
    const { projects, isLoading, enabledMeals } = useHackathon();
    const [memberQrs, setMemberQrs] = useState<Record<string, string>>({});
    const [activePassIndex, setActivePassIndex] = useState(0);

    const team = useMemo(() => projects.find((project) => project.teamId === user?.teamId || project.id === user?.teamId) || null, [projects, user]);
    const members = useMemo(() => team?.members || [], [team]);

    const getMemberId = (m: any, idx: number) => typeof m === 'object' && m.id ? String(m.id) : `m${idx}`;
    const getMemberName = (m: any) => typeof m === 'object' ? (m.fullName || m.name || 'Unknown Member') : String(m);
    const getMemberEmail = (m: any) => typeof m === 'object' ? m.email : null;

    // Determine Meal Eligibility
    const hasIndividualMealPass = (t: any, mId: string, mEmail?: string | null) => {
        if (typeof t.mealAccess?.purchased_meals === 'boolean') return t.mealAccess?.purchased_meals;
        if (Array.isArray(t.mealAccess?.purchased_meals)) {
            if (t.mealAccess?.purchased_meals.includes('all')) return true;
            if (t.mealAccess?.purchased_meals.includes(mId)) return true;
            if (mEmail && t.mealAccess?.purchased_meals.includes(mEmail)) return true;
        }
        return false;
    };

    // Generate Universal QR passes
    useEffect(() => {
        if (team && members.length > 0) {
            const generateAll = async () => {
                const qrs: Record<string, string> = {};
                for (let i = 0; i < members.length; i++) {
                    const memberId = getMemberId(members[i], i);
                    const payload = JSON.stringify({ teamId: team.teamId || String(team.id), memberId });
                    qrs[memberId] = await QRCode.toDataURL(payload, {
                        width: 400, margin: 1, color: { dark: "#0f172a", light: "#ffffff" }
                    });
                }
                setMemberQrs(qrs);
            };
            generateAll();
        }
    }, [team, members]);

    const handleDownload = useCallback((memberIndex: number) => {
        const member = members[memberIndex];
        const memberName = getMemberName(member);
        const memberId = getMemberId(member, memberIndex);
        const qrDataUrl = memberQrs[memberId];
        if (!qrDataUrl) return;
        
        // Simple download of the QR code itself for now
        const a = document.createElement("a");
        a.href = qrDataUrl;
        a.download = `EventPass_${memberName.replace(/\s+/g, '_')}_${team?.teamId}.png`;
        a.click();
    }, [members, memberQrs, team]);

    if (isLoading) {
        return (
            <DashboardLayout type="team" title="Event Passes">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#14b8a6]" />
                </div>
            </DashboardLayout>
        );
    }

    if (!team) {
        return (
            <DashboardLayout type="team" title="Event Passes">
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                    <h2 className="text-lg font-semibold text-slate-800">No team is linked to this account</h2>
                    <p className="mt-2 text-sm text-slate-500">Please complete registration to view your passes.</p>
                </div>
            </DashboardLayout>
        );
    }

    const currentMember = members[activePassIndex];
    const currentMemberId = currentMember ? getMemberId(currentMember, activePassIndex) : '';
    const currentMemberName = currentMember ? getMemberName(currentMember) : '';
    const currentMemberEmail = currentMember ? getMemberEmail(currentMember) : '';
    const hasMealPass = currentMember && typeof currentMember !== 'string' && typeof currentMember.meal_pass === 'boolean'
        ? currentMember.meal_pass
        : currentMember ? hasIndividualMealPass(team, currentMemberId, currentMemberEmail) : false;
    const hasNetworkingPass = currentMember && typeof currentMember !== 'string'
        ? currentMember.networking_pass === true
        : false;
    const allocatedPlace = team.room || 'Pending Allocation';

    return (
        <DashboardLayout type="team" title="Event Passes">
            <div className="mb-6">
                <h1 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-2">
                    <Ticket className="text-[#14b8a6]" size={28} />
                    Event Pass
                </h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
                <div className="flex flex-col items-center">
                    {/* The Pass Card */}
                    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-xl sm:p-8">
                        {/* Header */}
                        <div className="mb-5 flex items-center justify-between border-b border-gray-200 pb-4 sm:mb-6">
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Hackathon Event Pass</p>
                                <h3 className="mt-1 truncate text-lg font-bold text-gray-900">{team.team || team.name}</h3>
                            </div>
                            <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                                <QrCode size={20} className="text-teal-700" />
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="mx-auto mb-5 w-fit rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:mb-6 sm:p-4">
                            {memberQrs[currentMemberId] ? (
                                <img src={memberQrs[currentMemberId]} alt={`${currentMemberName} QR`} className="w-48 h-48" />
                            ) : (
                                <div className="h-48 w-48 animate-pulse rounded-xl bg-gray-200" />
                            )}
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">Participant</p>
                                <p className="mt-0.5 text-base font-bold uppercase text-gray-900">{currentMemberName}</p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] text-gray-500"><MapPin size={10}/> Allocated Place</p>
                                    <p className="mt-1 truncate text-sm font-bold uppercase text-teal-700">{allocatedPlace}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                        <p className="flex items-center justify-between gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">
                                            <span className="flex items-center gap-1"><CheckCircle2 size={10}/> Meals</span>
                                            <span role="img" aria-label={hasMealPass ? "Meal pass purchased" : "Meal pass not purchased"}>{hasMealPass ? "✅" : "❌"}</span>
                                        </p>
                                    </div>
                                    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                        <p className="flex items-center justify-between gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">
                                            <span className="flex items-center gap-1"><Ticket size={10}/> Networking</span>
                                            <span role="img" aria-label={hasNetworkingPass ? "Networking pass purchased" : "Networking pass not purchased"}>{hasNetworkingPass ? "✅" : "❌"}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Edge punches effect */}
                        <div className="absolute left-0 top-1/2 -ml-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[#faf9f7]"></div>
                        <div className="absolute right-0 top-1/2 -mr-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[#faf9f7]"></div>
                    </div>

                    <button
                        onClick={() => handleDownload(activePassIndex)}
                        className="mt-6 flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-teal-700 hover:-translate-y-0.5"
                    >
                        <Download size={16} /> Download QR Code
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <aside className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Team Roster</h3>
                        <div className="space-y-2">
                            {members.map((member: any, i: number) => {
                                const mId = getMemberId(member, i);
                                const mEmail = getMemberEmail(member);
                                const mMeal = hasIndividualMealPass(team, mId, mEmail);
                                const isSelected = i === activePassIndex;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setActivePassIndex(i)}
                                        className={`w-full flex items-center justify-between rounded-xl px-3 py-3 text-left transition-colors border ${isSelected ? 'bg-teal-50 border-teal-200' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`truncate text-sm font-bold ${isSelected ? 'text-teal-900' : 'text-slate-700'}`}>
                                                {getMemberName(member)}
                                            </p>
                                            <p className={`text-[10px] uppercase tracking-wider font-semibold mt-0.5 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`}>
                                                {i === 0 ? 'Team Lead' : 'Member'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm text-amber-800">
                        <p className="flex items-start gap-2 text-xs font-medium leading-relaxed">
                            <Info size={16} className="shrink-0 mt-0.5" />
                            <span>
                                <strong>Important:</strong> Present this single QR code to volunteers for gate entry, hackathon check-in, and dining access (if eligible).
                            </span>
                        </p>
                    </div>
                </aside>
            </div>
        </DashboardLayout>
    );
}
