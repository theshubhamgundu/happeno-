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

    type LikertRating = "Excellent" | "Good" | "Average" | "Poor" | "Didn't attend / use";

    // Feedback Form state matching Likert Matrix questions
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState<{
        rating_overall: number;
        food_lunch_d1: LikertRating;
        food_dinner_d1: LikertRating;
        food_stalls: LikertRating;
        venue_workspace: LikertRating;
        venue_wifi_power: LikertRating;
        venue_restrooms: LikertRating;
        venue_night_security: LikertRating;
        venue_volunteers: LikertRating;
        tech_credentials: LikertRating;
        tech_mentor_support: LikertRating;
        tech_evaluation_fairness: LikertRating;
        highlight: string;
        feedback_text: string;
    }>({
        rating_overall: 5,
        food_lunch_d1: "Good",
        food_dinner_d1: "Good",
        food_stalls: "Good",
        venue_workspace: "Good",
        venue_wifi_power: "Good",
        venue_restrooms: "Good",
        venue_night_security: "Good",
        venue_volunteers: "Good",
        tech_credentials: "Good",
        tech_mentor_support: "Good",
        tech_evaluation_fairness: "Good",
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
                <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-black shadow-[4px_4px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#f7cb46] border border-black animate-pulse" />
                            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black bg-[#ffdc8b] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
                                Happeno Credential Center
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight font-display">
                            Hackathon Certificates
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-slate-700 mt-1 max-w-xl">
                            Verified participation certificates with verifiable digital signatures and public QR validation for every team member.
                        </p>
                    </div>

                    {data?.teamStatus && (
                        <div className="flex items-center gap-3 bg-[#ede8f5] border-2 border-black px-4 py-3 rounded-2xl shrink-0 shadow-[3px_3px_0px_#000]">
                            <Users size={18} className="text-black" />
                            <div>
                                <p className="text-[10px] font-mono text-slate-600 uppercase font-black">Your Team</p>
                                <p className="text-xs font-black text-black">{data.teamStatus.team_name} ({data.teamStatus.team_id})</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* State Machine Renderer */}
                {isLoading ? (
                    <div className="bg-white rounded-3xl p-16 text-center border-2 border-black shadow-[4px_4px_0px_#000]">
                        <div className="w-10 h-10 border-4 border-black border-t-[#f7cb46] rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-wider text-black">Loading Certificate Registry...</p>
                    </div>
                ) : !data?.window.is_open ? (
                    /* STATE 1: WINDOW IS LOCKED / COUNTDOWN */
                    <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-black shadow-[6px_6px_0px_#000] text-center max-w-2xl mx-auto space-y-8">
                        <div className="w-16 h-16 rounded-2xl bg-[#ffdc8b] text-black border-2 border-black flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000]">
                            <Lock size={30} />
                        </div>

                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#fe90e8] text-black text-[10px] font-black uppercase tracking-widest mb-3 border-2 border-black shadow-[2px_2px_0px_#000]">
                                Certificate Window Locked
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                                Certificates Unlock Soon
                            </h2>
                            <p className="text-xs sm:text-sm font-medium text-slate-700 mt-2 max-w-md mx-auto leading-relaxed">
                                {data?.window.unlock_at
                                    ? `Organizers have scheduled certificate distribution for ${new Date(data.window.unlock_at).toLocaleString()}. The claim portal will open automatically once the timer expires.`
                                    : "Certificate distribution is currently closed by the organizing committee. Please check back after the closing ceremony."}
                            </p>
                        </div>

                        {/* Live Countdown Display */}
                        {timeLeftMs > 0 && (
                            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto pt-2">
                                <div className="bg-white rounded-2xl p-3 border-2 border-black shadow-[3px_3px_0px_#000]">
                                    <span className="block text-2xl sm:text-3xl font-black text-black font-mono">
                                        {countdown.days}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Days</span>
                                </div>
                                <div className="bg-white rounded-2xl p-3 border-2 border-black shadow-[3px_3px_0px_#000]">
                                    <span className="block text-2xl sm:text-3xl font-black text-black font-mono">
                                        {String(countdown.hours).padStart(2, "0")}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Hours</span>
                                </div>
                                <div className="bg-white rounded-2xl p-3 border-2 border-black shadow-[3px_3px_0px_#000]">
                                    <span className="block text-2xl sm:text-3xl font-black text-black font-mono">
                                        {String(countdown.minutes).padStart(2, "0")}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Mins</span>
                                </div>
                                <div className="bg-white rounded-2xl p-3 border-2 border-black shadow-[3px_3px_0px_#000]">
                                    <span className="block text-2xl sm:text-3xl font-black text-black font-mono">
                                        {String(countdown.seconds).padStart(2, "0")}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Secs</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-[#ede8f5] rounded-2xl p-4 border-2 border-black text-left text-xs text-black space-y-2 shadow-[3px_3px_0px_#000]">
                            <p className="font-black text-black flex items-center gap-1.5">
                                <HelpCircle size={16} className="text-black" /> What to expect when the window opens:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 font-medium text-slate-800">
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
                    <div className="bg-white rounded-3xl p-10 text-center border-2 border-black shadow-[6px_6px_0px_#000] max-w-lg mx-auto space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#fe90e8] text-black flex items-center justify-center mx-auto border-2 border-black shadow-[3px_3px_0px_#000]">
                            <ShieldAlert size={28} />
                        </div>
                        <h2 className="text-xl font-black text-black">Check-in Required</h2>
                        <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            Organizers have enabled venue check-in verification. Your team is not currently marked as checked-in. Please contact the help desk or event volunteers to record your attendance.
                        </p>
                    </div>
                ) : data?.config.require_feedback && !data?.teamStatus?.has_submitted_feedback ? (
                    /* STATE 2: WINDOW OPEN, BUT FEEDBACK REQUIRED */
                    <div className="space-y-6">
                        {/* Stepper Guide */}
                        <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#f7cb46] border-2 border-black text-black flex items-center justify-center text-xs font-black shadow-[2px_2px_0px_#000]">
                                    1
                                </div>
                                <div>
                                    <p className="text-xs font-black text-black">Step 1: Event Feedback (Required)</p>
                                    <p className="text-[10px] font-medium text-slate-600">Help organizers improve future hackathon editions</p>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-3 opacity-50">
                                <div className="w-8 h-8 rounded-xl bg-slate-200 border-2 border-black text-black flex items-center justify-center text-xs font-black">
                                    2
                                </div>
                                <div>
                                    <p className="text-xs font-black text-black">Step 2: Certificate Download</p>
                                    <p className="text-[10px] font-medium text-slate-600">Unlocks instantly upon submitting review</p>
                                </div>
                            </div>
                        </div>

                        {/* Feedback Form Card */}
                        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-black shadow-[6px_6px_0px_#000]">
                            <div className="mb-8 pb-6 border-b-2 border-black">
                                <span className="text-[10px] font-mono uppercase font-black text-black bg-[#ffdc8b] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
                                    Participant Feedback Matrix
                                </span>
                                <h2 className="text-2xl font-black text-black tracking-tight mt-2">
                                    Share Your Sprint Experience
                                </h2>
                                <p className="text-xs font-medium text-slate-700 mt-1">
                                    Ratings help recognize top mentors, evaluate food & venue logistics, and calibrate future jury sessions.
                                </p>
                            </div>

                            <form onSubmit={handleFeedbackSubmit} className="space-y-10">
                                {/* Section 1: Rate the food */}
                                <MatrixQuestionSection
                                    title="Rate the food"
                                    columns={["Excellent", "Good", "Average", "Poor", "Didn't attend / use"]}
                                    rows={[
                                        { key: "food_lunch_d1", label: "Lunch (Day 1)" },
                                        { key: "food_dinner_d1", label: "Dinner (Day 1)" },
                                        { key: "food_stalls", label: "Food stall facilities" }
                                    ]}
                                    values={feedbackForm}
                                    onChange={(key, val) => setFeedbackForm({ ...feedbackForm, [key]: val })}
                                />

                                {/* Section 2: Rate the venue & facilities */}
                                <MatrixQuestionSection
                                    title="Rate the venue & facilities"
                                    columns={["Excellent", "Good", "Average", "Poor", "Didn't attend / use"]}
                                    rows={[
                                        { key: "venue_workspace", label: "Classroom / workspace comfort" },
                                        { key: "venue_wifi_power", label: "Wi-Fi & power points" },
                                        { key: "venue_restrooms", label: "Cleanliness & restrooms" },
                                        { key: "venue_night_security", label: "Safety & security during the night" },
                                        { key: "venue_volunteers", label: "Help from volunteers" }
                                    ]}
                                    values={feedbackForm}
                                    onChange={(key, val) => setFeedbackForm({ ...feedbackForm, [key]: val })}
                                />

                                {/* Section 3: Rate the technical support */}
                                <MatrixQuestionSection
                                    title="Rate the technical support"
                                    columns={["Excellent", "Good", "Average", "Poor", "Didn't attend / use"]}
                                    rows={[
                                        { key: "tech_credentials", label: "Access to technical credentials / tools provided" },
                                        { key: "tech_mentor_support", label: "Mentor support during the build" },
                                        { key: "tech_evaluation_fairness", label: "Fairness of the Evaluation" }
                                    ]}
                                    values={feedbackForm}
                                    onChange={(key, val) => setFeedbackForm({ ...feedbackForm, [key]: val })}
                                />

                                {/* Section 4: Overall & Qualitative Comments */}
                                <div className="space-y-6 pt-4 border-t-2 border-black">
                                    <div className="p-5 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <label className="text-xs font-black text-black block">Overall Hackathon Rating</label>
                                                <p className="text-[11px] font-medium text-slate-600">Your total satisfaction with the hackathon</p>
                                            </div>
                                            <span className="text-xs font-mono font-black text-black bg-[#f7cb46] px-2.5 py-1 rounded-lg border-2 border-black shadow-[1px_1px_0px_#000]">
                                                {feedbackForm.rating_overall} / 5 Stars
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setFeedbackForm({ ...feedbackForm, rating_overall: star })}
                                                    className="p-1 rounded-lg transition hover:scale-110 cursor-pointer"
                                                >
                                                    <Star
                                                        size={24}
                                                        className={
                                                            star <= feedbackForm.rating_overall
                                                                ? "text-black fill-[#f7cb46]"
                                                                : "text-slate-300"
                                                        }
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wide">
                                            What was the biggest highlight of your hackathon?
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Midnight coding vibe, mentor session, project showcase..."
                                            value={feedbackForm.highlight}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, highlight: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-black bg-white text-xs font-medium text-black placeholder:text-slate-400 focus:outline-none shadow-[2px_2px_0px_#000] transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wide">
                                            Any suggestions or feedback for the organizing team?
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Share any constructive criticism, ideas for the next edition, or shoutouts..."
                                            value={feedbackForm.feedback_text}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_text: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-black bg-white text-xs font-medium text-black placeholder:text-slate-400 focus:outline-none shadow-[2px_2px_0px_#000] transition"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmittingFeedback}
                                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border-2 border-black bg-[#f7cb46] hover:bg-[#ffdc8b] text-black font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none transition disabled:opacity-50"
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
                        <div className="bg-[#99e885] border-2 border-black rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-[4px_4px_0px_#000]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white border-2 border-black text-black flex items-center justify-center font-bold shadow-[2px_2px_0px_#000]">
                                    <CheckCircle2 size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-black">Certificates Unlocked & Ready</p>
                                    <p className="text-[10px] font-semibold text-slate-800">All member credentials have been signed and registered with the Happeno Registry.</p>
                                </div>
                            </div>

                            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black bg-white px-3 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_#000]">
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
                                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000] ${selectedMemberIndex === idx
                                                ? "bg-[#f7cb46] text-black"
                                                : "bg-white text-black hover:bg-[#ffdc8b]/30"
                                            }`}
                                    >
                                        <Award size={14} className="text-black" />
                                        <span>{member.name}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-black ${selectedMemberIndex === idx ? "bg-white text-black" : "bg-[#c0f7fe] text-black"
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

function MatrixQuestionSection({
    title,
    columns,
    rows,
    values,
    onChange
}: {
    title: string;
    columns: string[];
    rows: { key: string; label: string }[];
    values: Record<string, any>;
    onChange: (key: string, val: string) => void;
}) {
    return (
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
            {/* Matrix Title Header */}
            <div className="px-6 py-4 bg-[#c0f7fe] border-b-2 border-black">
                <h3 className="text-base font-black text-black tracking-tight">{title}</h3>
            </div>

            {/* Scrollable Table on mobile for flawless layout */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[620px]">
                    <thead>
                        <tr className="border-b-2 border-black bg-white">
                            <th className="py-4 px-6 w-2/5 font-black text-xs text-black uppercase tracking-wider">
                                Criteria
                            </th>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className="py-4 px-3 text-center text-xs font-black text-black tracking-tight"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/20">
                        {rows.map((row, rIdx) => (
                            <tr
                                key={row.key}
                                className={`transition-colors hover:bg-[#ffdc8b]/20 ${rIdx % 2 === 1 ? "bg-slate-50/60" : "bg-white"
                                    }`}
                            >
                                <td className="py-4 px-6 text-xs sm:text-sm font-bold text-black">
                                    {row.label}
                                </td>

                                {columns.map((col, cIdx) => {
                                    const isSelected = values[row.key] === col;
                                    return (
                                        <td
                                            key={cIdx}
                                            onClick={() => onChange(row.key, col)}
                                            className="py-4 px-3 text-center cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-center">
                                                <div
                                                    className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center transition-all ${isSelected
                                                            ? "bg-[#f7cb46] shadow-[1px_1px_0px_#000]"
                                                            : "bg-white group-hover:bg-[#ffdc8b]/40"
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-black" />
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
