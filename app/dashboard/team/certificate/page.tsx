"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import CertificatePreview from "@/components/CertificatePreview";
import {
    Clock,
    Lock,
    Unlock,
    Star,
    Award,
    CheckCircle2,
    Users,
    AlertCircle,
    Send,
    Sparkles,
    ShieldAlert,
    HelpCircle
} from "lucide-react";
import { toast } from "sonner";

interface CertificateStatusResponse {
    success: boolean;
    config: {
        is_enabled: boolean;
        unlock_at: string | null;
        require_feedback: boolean;
        require_checkin: boolean;
        event_title: string;
        issuer_name: string;
        issue_date: string;
        signatory_1_name: string;
        signatory_1_title: string;
        signatory_2_name: string;
        signatory_2_title: string;
        custom_subtitle: string;
    };
    window: {
        is_open: boolean;
        is_enabled: boolean;
        unlock_at: string | null;
        time_remaining_ms: number;
        lock_reason: string | null;
    };
    teamStatus: {
        team_id: string;
        team_name: string;
        is_checked_in: boolean;
        has_submitted_feedback: boolean;
        can_claim: boolean;
        lock_reason: string | null;
        members: Array<{
            name: string;
            email: string;
            role: string;
            index: number;
            certificate_id: string;
            verification_hash: string;
        }>;
    } | null;
}

export default function TeamCertificatePage() {
    const { user } = useAuth();
    const [data, setData] = useState<CertificateStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMemberIndex, setSelectedMemberIndex] = useState(0);

    // Countdown state
    const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

    // Feedback Form state
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({
        rating_overall: 5,
        rating_organization: 5,
        rating_mentorship: 5,
        rating_judging: 5,
        rating_food: 5,
        highlight: "",
        feedback_text: ""
    });

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch("/api/certificate/status", { cache: "no-store" });
            const json = await res.json();
            if (json.success) {
                setData(json);
                if (json.window.time_remaining_ms > 0) {
                    setTimeLeftMs(json.window.time_remaining_ms);
                }
            }
        } catch (err) {
            console.error("Failed to fetch certificate status:", err);
            toast.error("Could not load certificate status.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Live countdown timer ticker
    useEffect(() => {
        if (timeLeftMs <= 0) return;

        const interval = setInterval(() => {
            setTimeLeftMs((prev) => {
                if (prev <= 1000) {
                    clearInterval(interval);
                    fetchStatus(); // re-evaluate when countdown hits 0
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeftMs, fetchStatus]);

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingFeedback(true);

        try {
            const res = await fetch("/api/certificate/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    team_id: user?.teamId,
                    ...feedbackForm
                })
            });

            const result = await res.json();
            if (result.success) {
                toast.success("Thank you! Your feedback has been recorded.");
                await fetchStatus();
            } else {
                toast.error(result.error || "Failed to submit feedback.");
            }
        } catch (err) {
            console.error("Feedback submit error:", err);
            toast.error("Failed to connect to feedback service.");
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const formatCountdown = (ms: number) => {
        const totalSecs = Math.max(0, Math.floor(ms / 1000));
        const days = Math.floor(totalSecs / 86400);
        const hours = Math.floor((totalSecs % 86400) / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;

        return { days, hours, minutes, seconds };
    };

    const countdown = formatCountdown(timeLeftMs);

    return (
        <DashboardLayout type="team" title="Official Certificates">
            <div className="max-w-6xl mx-auto space-y-8 pb-16">
                {/* Header Banner */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-700">
                                Happeno Credential Center
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
                            Hackathon Certificates
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                            Verified participation certificates with verifiable digital signatures and public QR validation for every team member.
                        </p>
                    </div>

                    {data?.teamStatus && (
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl shrink-0">
                            <Users size={18} className="text-teal-700" />
                            <div>
                                <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">Your Team</p>
                                <p className="text-xs font-bold text-slate-900">{data.teamStatus.team_name} ({data.teamStatus.team_id})</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* State Machine Renderer */}
                {isLoading ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
                        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Certificate Registry...</p>
                    </div>
                ) : !data?.window.is_open ? (
                    /* STATE 1: WINDOW IS LOCKED / COUNTDOWN */
                    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm text-center max-w-2xl mx-auto space-y-8">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto shadow-sm">
                            <Lock size={30} />
                        </div>

                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-widest mb-3 border border-amber-200">
                                Certificate Window Locked
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Certificates Unlock Soon
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                                {data?.window.unlock_at
                                    ? `Organizers have scheduled certificate distribution for ${new Date(data.window.unlock_at).toLocaleString()}. The claim portal will open automatically once the timer expires.`
                                    : "Certificate distribution is currently closed by the organizing committee. Please check back after the closing ceremony."}
                            </p>
                        </div>

                        {/* Live Countdown Display */}
                        {timeLeftMs > 0 && (
                            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto pt-2">
                                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                                    <span className="block text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                                        {countdown.days}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Days</span>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                                    <span className="block text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                                        {String(countdown.hours).padStart(2, "0")}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Hours</span>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                                    <span className="block text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                                        {String(countdown.minutes).padStart(2, "0")}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Mins</span>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                                    <span className="block text-2xl sm:text-3xl font-black text-teal-700 font-mono">
                                        {String(countdown.seconds).padStart(2, "0")}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Secs</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left text-xs text-slate-500 space-y-2">
                            <p className="font-bold text-slate-700 flex items-center gap-1.5">
                                <HelpCircle size={14} className="text-teal-700" /> What to expect when the window opens:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-500">
                                <li>All verified team members receive individual participation certificates.</li>
                                {data?.config.require_feedback && (
                                    <li>A brief 2-minute feedback form must be submitted by your team lead to unlock instant downloads.</li>
                                )}
                                <li>Direct print-ready PDF export and shareable verification URLs.</li>
                            </ul>
                        </div>
                    </div>
                ) : data?.config.require_checkin && !data?.teamStatus?.is_checked_in ? (
                    /* GATING ERROR: NOT CHECKED IN */
                    <div className="bg-white rounded-3xl p-10 text-center border border-rose-200 shadow-sm max-w-lg mx-auto space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100">
                            <ShieldAlert size={28} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">Check-in Required</h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Organizers have enabled venue check-in verification. Your team is not currently marked as checked-in. Please contact the help desk or event volunteers to record your attendance.
                        </p>
                    </div>
                ) : data?.config.require_feedback && !data?.teamStatus?.has_submitted_feedback ? (
                    /* STATE 2: WINDOW OPEN, BUT FEEDBACK REQUIRED */
                    <div className="space-y-6">
                        {/* Stepper Guide */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                                    1
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Step 1: Event Feedback (Required)</p>
                                    <p className="text-[10px] text-slate-500">Help organizers improve future hackathon editions</p>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-3 opacity-40">
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                                    2
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Step 2: Certificate Download</p>
                                    <p className="text-[10px] text-slate-500">Unlocks instantly upon submitting review</p>
                                </div>
                            </div>
                        </div>

                        {/* Feedback Form Card */}
                        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
                            <div className="mb-8 pb-6 border-b border-slate-100">
                                <span className="text-[10px] font-mono uppercase font-bold text-teal-700 tracking-wider">
                                    Participant Feedback Matrix
                                </span>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                                    Share Your Sprint Experience
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Ratings help recognize top mentors, evaluate food & venue logistics, and calibrate future jury sessions.
                                </p>
                            </div>

                            <form onSubmit={handleFeedbackSubmit} className="space-y-8">
                                {/* Rating Grids */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Overall Experience */}
                                    <RatingField
                                        label="Overall Hackathon Experience"
                                        description="General impression, atmosphere, and platform execution."
                                        value={feedbackForm.rating_overall}
                                        onChange={(val) => setFeedbackForm({ ...feedbackForm, rating_overall: val })}
                                    />

                                    {/* Organization & Logistics */}
                                    <RatingField
                                        label="Organization & Help Desk"
                                        description="Schedule coordination, announcements, and volunteer assistance."
                                        value={feedbackForm.rating_organization}
                                        onChange={(val) => setFeedbackForm({ ...feedbackForm, rating_organization: val })}
                                    />

                                    {/* Mentorship */}
                                    <RatingField
                                        label="Mentorship & Technical Guidance"
                                        description="Availability and helpfulness of industry and technical mentors."
                                        value={feedbackForm.rating_mentorship}
                                        onChange={(val) => setFeedbackForm({ ...feedbackForm, rating_mentorship: val })}
                                    />

                                    {/* Judging & Fair Play */}
                                    <RatingField
                                        label="Evaluation & Judging Fair-Play"
                                        description="Clarity of rubric guidelines, time per team, and jury feedback."
                                        value={feedbackForm.rating_judging}
                                        onChange={(val) => setFeedbackForm({ ...feedbackForm, rating_judging: val })}
                                    />

                                    {/* Food & Hospitality */}
                                    <RatingField
                                        label="Food, Hospitality & Venue"
                                        description="Meal quality, workspace comfort, internet connectivity, and snacks."
                                        value={feedbackForm.rating_food}
                                        onChange={(val) => setFeedbackForm({ ...feedbackForm, rating_food: val })}
                                    />
                                </div>

                                {/* Qualitative Text Inputs */}
                                <div className="space-y-6 pt-4 border-t border-slate-100">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                                            What was the biggest highlight of your hackathon?
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Mentor session at 2 AM, building the live prototype, keynote..."
                                            value={feedbackForm.highlight}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, highlight: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                                            Any suggestions or feedback for the organizing team?
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Share any constructive criticism, ideas for the next edition, or shoutouts..."
                                            value={feedbackForm.feedback_text}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_text: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmittingFeedback}
                                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-600/20 transition disabled:opacity-50"
                                    >
                                        <Send size={15} />
                                        {isSubmittingFeedback ? "Submitting..." : "Submit Review & Unlock Certificates"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    /* STATE 3: UNLOCKED AND READY TO CLAIM/DOWNLOAD */
                    <div className="space-y-6">
                        {/* Status banner */}
                        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                    <CheckCircle2 size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-950">Certificates Unlocked & Ready</p>
                                    <p className="text-[10px] text-emerald-700">All member credentials have been signed and registered with the Happeno Registry.</p>
                                </div>
                            </div>

                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                                {data?.teamStatus?.members.length || 0} Certificates Available
                            </span>
                        </div>

                        {/* Member Switcher Tabs */}
                        {data?.teamStatus?.members && data.teamStatus.members.length > 0 && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {data.teamStatus.members.map((member, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedMemberIndex(idx)}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-2 ${
                                            selectedMemberIndex === idx
                                                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Award size={14} className={selectedMemberIndex === idx ? "text-teal-400" : "text-slate-400"} />
                                        <span>{member.name}</span>
                                        <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded ${
                                            selectedMemberIndex === idx ? "bg-white/10 text-white/80" : "bg-slate-100 text-slate-500"
                                        }`}>
                                            {member.role}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Certificate Preview Card */}
                        {data?.teamStatus?.members[selectedMemberIndex] && (
                            <CertificatePreview
                                certificateId={data.teamStatus.members[selectedMemberIndex].certificate_id}
                                recipientName={data.teamStatus.members[selectedMemberIndex].name}
                                teamName={data.teamStatus.team_name}
                                teamId={data.teamStatus.team_id}
                                role={data.teamStatus.members[selectedMemberIndex].role}
                                eventTitle={data.config.event_title}
                                issuerName={data.config.issuer_name}
                                issueDate={data.config.issue_date}
                                signatory1Name={data.config.signatory_1_name}
                                signatory1Title={data.config.signatory_1_title}
                                signatory2Name={data.config.signatory_2_name}
                                signatory2Title={data.config.signatory_2_title}
                                customSubtitle={data.config.custom_subtitle}
                                verificationHash={data.teamStatus.members[selectedMemberIndex].verification_hash}
                            />
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function RatingField({
    label,
    description,
    value,
    onChange
}: {
    label: string;
    description: string;
    value: number;
    onChange: (val: number) => void;
}) {
    return (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900">{label}</label>
                <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {value} / 5
                </span>
            </div>
            <p className="text-[11px] text-slate-400">{description}</p>
            <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="p-1 rounded-lg transition hover:scale-110 cursor-pointer"
                    >
                        <Star
                            size={20}
                            className={
                                star <= value
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300 hover:text-amber-200"
                            }
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
