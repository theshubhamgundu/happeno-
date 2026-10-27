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

    const getMemberId = (m: any, idx: number) => typeof m === 'object' && (m.participant_id || m.id) ? String(m.participant_id || m.id) : `m${idx}`;
    const getMemberName = (m: any) => typeof m === 'object' ? (m.fullName || m.name || 'Unknown Member') : String(m);
    const getMemberEmail = (m: any) => typeof m === 'object' ? m.email : null;

    // Determine Meal Eligibility
    const hasIndividualMealPass = (t: any, mId: string, mEmail?: string | null) => {
        if (typeof t.mealAccess?.purchased_meals === 'boolean') return t.mealAccess?.purchased_meals;
        if (Array.isArray(t.mealAccess?.purchased_meals)) {
            if (t.mealAccess?.purchased_meals.includes('all')) return true;
            if (t.mealAccess?.purchased_meals.length >= (t.members?.length || 0)) return true;
            if (t.mealAccess?.purchased_meals.includes(mId)) return true;
            if (mEmail && t.mealAccess?.purchased_meals.includes(mEmail)) return true;
        }
        return false;
    };

    const hasIndividualActivityPass = (t: any, mId: string, mEmail?: string | null) => {
        if (typeof t.mealAccess?.networking_passes === 'boolean') return t.mealAccess?.networking_passes;
        if (Array.isArray(t.mealAccess?.networking_passes)) {
            if (t.mealAccess?.networking_passes.includes('all')) return true;
            if (t.mealAccess?.networking_passes.length >= (t.members?.length || 0)) return true;
            if (t.mealAccess?.networking_passes.includes(mId)) return true;
            if (mEmail && t.mealAccess?.networking_passes.includes(mEmail)) return true;
        }
        return false;
    };

    // Generate Universal QR passes with embedded names
    useEffect(() => {
        if (team && members.length > 0) {
            const generateAll = async () => {
                const qrs: Record<string, string> = {};
                for (let i = 0; i < members.length; i++) {
                    const memberId = getMemberId(members[i], i);
                    const memberName = getMemberName(members[i]);
                    const payload = JSON.stringify({ teamId: team.teamId || String(team.id), memberId, passType: 'member' });
                    
                    const rawQrDataUrl = await QRCode.toDataURL(payload, {
                        width: 400, margin: 2, color: { dark: "#0f172a", light: "#ffffff" }
                    });

                    // Embed the name directly into the image canvas
                    const img = new window.Image();
                    img.src = rawQrDataUrl;
                    
                    await new Promise(resolve => {
                        img.onload = () => {
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                                canvas.width = 400;
                                canvas.height = 460;
                                
                                // White background
                                ctx.fillStyle = "#ffffff";
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                
                                // Draw QR
                                ctx.drawImage(img, 0, 0, 400, 400);
                                
                                // Draw Text
                                ctx.textAlign = "center";
                                
                                ctx.font = "bold 14px system-ui, sans-serif";
                                ctx.fillStyle = "#64748b";
                                ctx.fillText("PARTICIPANT", 200, 410);
                                
                                ctx.font = "900 24px system-ui, sans-serif";
                                ctx.fillStyle = "#0f172a";
                                ctx.fillText(memberName.toUpperCase().substring(0, 30), 200, 435);
                                
                                qrs[memberId] = canvas.toDataURL("image/png");
                            } else {
                                qrs[memberId] = rawQrDataUrl;
                            }
                            resolve(null);
                        };
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
    const hasMealPass = (currentMember ? hasIndividualMealPass(team, currentMemberId, currentMemberEmail) : false) ||
        (currentMember && typeof currentMember !== 'string' && typeof currentMember.meal_pass === 'boolean' ? currentMember.meal_pass : false);
    const hasNetworkingPass = (currentMember ? hasIndividualActivityPass(team, currentMemberId, currentMemberEmail) : false) ||
        (currentMember && typeof currentMember !== 'string' && typeof currentMember.networking_pass === 'boolean' ? currentMember.networking_pass : false);
    const allocatedPlace = team.room || 'Pending Allocation';

    return (
        <DashboardLayout type="team" title="Event Passes">
            <div className="mb-6">
                <h1 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                    <Ticket className="text-black" size={28} />
                    Event Pass
                </h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start text-black">
                <div className="flex flex-col items-center">
                    {/* The Pass Card */}
                    <div className="relative w-full max-w-sm overflow-hidden rounded-xl border-2 border-black bg-white p-5 shadow-[6px_6px_0px_#000] sm:p-8">
                        {/* Header */}
                        <div className="mb-5 flex items-center justify-between border-b-2 border-black pb-4 sm:mb-6">
                            <div className="min-w-0">
                                <span className="inline-block rounded border border-black bg-[#f7cb46] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-black">
                                    HACKATHON EVENT PASS
                                </span>
                                <h3 className="mt-1.5 truncate text-lg font-black text-black">{team.team || team.name}</h3>
                            </div>
                            <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#99e885] shadow-[1.5px_1.5px_0px_#000]">
                                <QrCode size={20} className="text-black" />
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="mx-auto mb-5 w-fit rounded-lg border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#000] sm:mb-6 sm:p-4">
                            {memberQrs[currentMemberId] ? (
                                <img src={memberQrs[currentMemberId]} alt={`${currentMemberName} QR`} className="w-48 h-48" />
                            ) : (
                                <div className="h-48 w-48 animate-pulse rounded-lg bg-neutral-200 border-2 border-black" />
                            )}
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-600">Participant</p>
                                <p className="mt-0.5 text-base font-black uppercase text-black">{currentMemberName}</p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="min-w-0 rounded-lg border-2 border-black bg-white p-3 shadow-[2px_2px_0px_#000]">
                                    <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] text-neutral-600"><MapPin size={10}/> Allocated Place</p>
                                    <p className="mt-1 truncate text-sm font-black uppercase text-black">{allocatedPlace}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="min-w-0 rounded-lg border-2 border-black bg-white p-3 shadow-[2px_2px_0px_#000]">
                                        <p className="flex items-center justify-between gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-neutral-700">
                                            <span className="flex items-center gap-1"><CheckCircle2 size={10}/> Meals</span>
                                            <span role="img" aria-label={hasMealPass ? "Meal pass purchased" : "Meal pass not purchased"}>{hasMealPass ? "✅" : "❌"}</span>
                                        </p>
                                    </div>
                                    <div className="min-w-0 rounded-lg border-2 border-black bg-white p-3 shadow-[2px_2px_0px_#000]">
                                        <p className="flex items-center justify-between gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-neutral-700">
                                            <span className="flex items-center gap-1"><Ticket size={10}/> Activity Pass</span>
                                            <span role="img" aria-label={hasNetworkingPass ? "Activity pass purchased" : "Activity pass not purchased"}>{hasNetworkingPass ? "✅" : "❌"}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Edge punches effect */}
                        <div className="absolute left-0 top-1/2 -ml-3 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-black bg-[#ede8f5]"></div>
                        <div className="absolute right-0 top-1/2 -mr-3 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-black bg-[#ede8f5]"></div>
                    </div>

                    <button
                        onClick={() => handleDownload(activePassIndex)}
                        className="mt-6 flex items-center gap-2 rounded-lg bg-[#f7cb46] hover:bg-[#ffd24d] px-6 py-3 text-xs font-black uppercase tracking-wider text-black border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
                    >
                        <Download size={16} /> Download QR Code
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <aside className="space-y-4">
                    <div className="rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000]">
                        <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-black">Team Roster</h3>
                        <div className="space-y-2">
                            {members.map((member: any, i: number) => {
                                const isSelected = i === activePassIndex;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setActivePassIndex(i)}
                                        className={`w-full flex items-center justify-between rounded-lg px-3 py-3 text-left transition-transform border-2 border-black shadow-[2px_2px_0px_#000] ${isSelected ? 'bg-[#ffdc8b] text-black font-black' : 'bg-white hover:bg-neutral-50 text-neutral-900 font-bold hover:translate-x-[1px] hover:translate-y-[1px]'}`}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black">
                                                {getMemberName(member)}
                                            </p>
                                            <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}>
                                                {i === 0 ? 'Team Lead' : 'Member'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-xl border-2 border-black bg-[#ffdc8b] p-4 shadow-[3px_3px_0px_#000] text-black">
                        <p className="flex items-start gap-2 text-xs font-semibold leading-relaxed">
                            <Info size={16} className="shrink-0 mt-0.5 text-black" />
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
