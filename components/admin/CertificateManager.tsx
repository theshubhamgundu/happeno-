"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Award,
    Clock,
    Lock,
    Unlock,
    Download,
    CheckCircle2,
    AlertCircle,
    Star,
    Save,
    RotateCcw,
    FileSpreadsheet,
    MessageSquare,
    Users,
    Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface CertificateManagerProps {
    className?: string;
}

export default function CertificateManager({ className = "" }: CertificateManagerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState<any>({
        is_enabled: false,
        unlock_at: null,
        require_feedback: true,
        require_checkin: true,
        event_title: "Happeno hackathonSprint",
        issuer_name: "Happeno Council of Organizers",
        signatory_1_name: "Organizing Chair",
        signatory_1_title: "Head of Operations",
        signatory_2_name: "Grand Jury Lead",
        signatory_2_title: "Technical Evaluation Council",
        issue_date: "October 2026",
        custom_subtitle: "For exceptional dedication, collaborative engineering, and successful presentation of their project."
    });
    const [windowState, setWindowState] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);

    // Date/time string for input (YYYY-MM-DDTHH:mm)
    const [scheduledDateTime, setScheduledDateTime] = useState("");

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/certificate-settings", { cache: "no-store" });
            const data = await res.json();
            if (data.success) {
                setConfig(data.config);
                setWindowState(data.window);
                setAnalytics(data.analytics);

                if (data.config.unlock_at) {
                    try {
                        const d = new Date(data.config.unlock_at);
                        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setScheduledDateTime(localIso);
                    } catch {
                        setScheduledDateTime("");
                    }
                } else {
                    setScheduledDateTime("");
                }
            } else {
                toast.error(data.error || "Failed to load certificate settings");
            }
        } catch (err) {
            console.error("fetchSettings error:", err);
            toast.error("Failed to fetch certificate settings");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleUnlockNow = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/certificate-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "unlock_now" })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Certificate window opened immediately!");
                fetchSettings();
            } else {
                toast.error(data.error || "Failed to unlock window");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLockNow = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/certificate-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "lock_now" })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Certificate window locked!");
                fetchSettings();
            } else {
                toast.error(data.error || "Failed to lock window");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSchedule = async () => {
        if (!scheduledDateTime) {
            toast.error("Please select a date and time to schedule unlock.");
            return;
        }

        setIsSaving(true);
        try {
            const isoString = new Date(scheduledDateTime).toISOString();
            const res = await fetch("/api/admin/certificate-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    is_enabled: true,
                    unlock_at: isoString
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Window scheduled to open at ${new Date(isoString).toLocaleString()}`);
                fetchSettings();
            } else {
                toast.error(data.error || "Failed to save schedule");
            }
        } catch (err) {
            toast.error("Failed to save schedule");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/certificate-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Certificate configurations updated!");
                fetchSettings();
            } else {
                toast.error(data.error || "Failed to save configuration");
            }
        } catch (err) {
            toast.error("Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportFeedbackCsv = () => {
        window.open("/api/admin/certificate-settings?export=csv", "_blank");
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Certificate Management Hub...</p>
            </div>
        );
    }

    return (
        <div className={`space-y-8 ${className}`}>
            {/* Master Control Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                            <Award size={26} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight font-display">
                                    Certificate Claim Window & Conditions
                                </h2>
                                <span className={`text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full border ${windowState?.is_open
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}>
                                    {windowState?.is_open ? "Window Open" : "Window Locked"}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Set unlock timers, mandate feedback collection, and customize official digital certificates.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {windowState?.is_open ? (
                            <button
                                onClick={handleLockNow}
                                disabled={isSaving}
                                type="button"
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                            >
                                <Lock size={14} /> Lock Window Now
                            </button>
                        ) : (
                            <button
                                onClick={handleUnlockNow}
                                disabled={isSaving}
                                type="button"
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                            >
                                <Unlock size={14} /> Open Window Now
                            </button>
                        )}

                        <button
                            onClick={handleExportFeedbackCsv}
                            type="button"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                        >
                            <FileSpreadsheet size={14} /> Export Feedback CSV
                        </button>
                    </div>
                </div>

                {/* Scheduling & Gates Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Schedule Time Picker */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Clock size={15} className="text-teal-700" /> Timed Auto-Unlock
                            </span>
                            {config.unlock_at && (
                                <span className="text-[10px] font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                    Scheduled: {new Date(config.unlock_at).toLocaleString()}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            Participants will see a live countdown clock until this exact time, after which the portal automatically unlocks.
                        </p>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <input
                                type="datetime-local"
                                value={scheduledDateTime}
                                onChange={(e) => setScheduledDateTime(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                            />
                            <button
                                onClick={handleSaveSchedule}
                                disabled={isSaving || !scheduledDateTime}
                                type="button"
                                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider shrink-0 transition disabled:opacity-50"
                            >
                                Set Schedule
                            </button>
                        </div>
                    </div>

                    {/* Conditions / Gates */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                            Participation Gates & Conditions
                        </span>

                        <div className="space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={Boolean(config.require_feedback)}
                                    onChange={(e) => setConfig({ ...config, require_feedback: e.target.checked })}
                                    className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                                />
                                <div>
                                    <span className="text-xs font-bold text-slate-900 block group-hover:text-teal-700 transition">
                                        Require Hackathon Feedback Form
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        Participants must complete the 5-star evaluation survey before certificate download unlocks.
                                    </span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={Boolean(config.require_checkin)}
                                    onChange={(e) => setConfig({ ...config, require_checkin: e.target.checked })}
                                    className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                                />
                                <div>
                                    <span className="text-xs font-bold text-slate-900 block group-hover:text-teal-700 transition">
                                        Require Venue Check-In
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        Only teams marked as checked-in by event volunteers can generate certificates.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Certificate Template Customizer Form */}
                <form onSubmit={handleSaveConfig} className="pt-4 border-t border-slate-100 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                        Certificate Template & Signatories
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Event Title
                            </label>
                            <input
                                type="text"
                                value={config.event_title || ""}
                                onChange={(e) => setConfig({ ...config, event_title: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Issuer Name
                            </label>
                            <input
                                type="text"
                                value={config.issuer_name || ""}
                                onChange={(e) => setConfig({ ...config, issuer_name: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Issue Date String
                            </label>
                            <input
                                type="text"
                                value={config.issue_date || ""}
                                onChange={(e) => setConfig({ ...config, issue_date: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Signatory 1 Name
                            </label>
                            <input
                                type="text"
                                value={config.signatory_1_name || ""}
                                onChange={(e) => setConfig({ ...config, signatory_1_name: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Signatory 1 Title
                            </label>
                            <input
                                type="text"
                                value={config.signatory_1_title || ""}
                                onChange={(e) => setConfig({ ...config, signatory_1_title: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Signatory 2 Name
                            </label>
                            <input
                                type="text"
                                value={config.signatory_2_name || ""}
                                onChange={(e) => setConfig({ ...config, signatory_2_name: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Signatory 2 Title
                            </label>
                            <input
                                type="text"
                                value={config.signatory_2_title || ""}
                                onChange={(e) => setConfig({ ...config, signatory_2_title: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Custom Subtitle Statement
                            </label>
                            <input
                                type="text"
                                value={config.custom_subtitle || ""}
                                onChange={(e) => setConfig({ ...config, custom_subtitle: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                        >
                            <Save size={14} /> Save Template & Conditions
                        </button>
                    </div>
                </form>
            </div>

            {/* Feedback & Analytics Hub */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">
                            Participant Feedback & Satisfaction Analytics
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Real-time metrics from verified team reviews submitted upon certificate unlock.
                        </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        Total Submissions: {analytics?.totalSubmissions || 0}
                    </span>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <ScoreCard label="Overall Experience" score={analytics?.averageRatings?.overall || 5} />
                    <ScoreCard label="Organization" score={analytics?.averageRatings?.organization || 5} />
                    <ScoreCard label="Mentorship Guidance" score={analytics?.averageRatings?.mentorship || 5} />
                    <ScoreCard label="Jury & Fair-Play" score={analytics?.averageRatings?.judging || 5} />
                    <ScoreCard label="Food & Logistics" score={analytics?.averageRatings?.food || 5} />
                </div>

                {/* Submissions Feed */}
                <div className="space-y-3 pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                        Recent Feedback Submissions ({analytics?.recentFeedbacks?.length || 0})
                    </span>

                    {analytics?.recentFeedbacks && analytics.recentFeedbacks.length > 0 ? (
                        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {analytics.recentFeedbacks.map((item: any, idx: number) => (
                                <div key={idx} className="py-3 text-xs space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{item.submitted_by_name || "Team Lead"}</span>
                                            <span className="text-[10px] text-teal-800 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                                {item.team_name ? `${item.team_name} (${item.team_id})` : item.team_id}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                                            <Star size={13} className="fill-amber-400 text-amber-400" />
                                            <span>{item.rating_overall} / 5</span>
                                        </div>
                                    </div>

                                    {item.highlight && (
                                        <p className="text-slate-700 italic">
                                            &ldquo;{item.highlight}&rdquo;
                                        </p>
                                    )}

                                    {item.feedback_text && (
                                        <p className="text-slate-500">
                                            {item.feedback_text}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                            No feedback submissions recorded yet. Once participants unlock their certificates, responses will appear here live.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
    return (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                {label}
            </span>
            <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{score}</span>
                <span className="text-xs text-slate-400 font-mono">/ 5</span>
            </div>
            <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                        key={s}
                        size={12}
                        className={s <= Math.round(score) ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                    />
                ))}
            </div>
        </div>
    );
}
