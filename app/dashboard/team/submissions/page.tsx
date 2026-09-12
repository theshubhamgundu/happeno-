"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    Github,
    Video,
    Presentation,
    Globe,
    Lock
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import { useState, useEffect, useMemo } from "react";

export default function TeamSubmissions() {
    const { user } = useAuth();
    const { projects, isSubmissionLocked } = useHackathon();

    // State for form data
    const [submissionData, setSubmissionData] = useState({
        repo: "",
        video: "",
        presentation: "",
        demo: ""
    });

    const activeTeam = useMemo(() => {
        if (!user?.teamId) return null;
        const found = projects.find(p => p.teamId === user.teamId);
        return found || null;
    }, [projects, user]);

    const [isTimeLocked, setIsTimeLocked] = useState(true);

    useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            // Setting lock time to Feb 27, 2026 at 9:30 AM
            const lockTime = new Date("2026-02-27T09:30:00+05:30");
            setIsTimeLocked(now < lockTime);
        };
        checkTime();
        const interval = setInterval(checkTime, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTeam?.submission) {
            setSubmissionData({
                repo: activeTeam.submission.github || "",
                video: activeTeam.submission.demo || "",
                presentation: activeTeam.submission.presentation || "",
                demo: activeTeam.submission.deployment || ""
            });
        }
    }, [activeTeam]);

    const handleIndividualSubmit = async (field: string) => {
        if (!activeTeam) return;

        const fieldMap: Record<string, string> = {
            repo: 'github',
            presentation: 'presentation',
            video: 'demo',
            demo: 'deployment'
        };

        const apiField = fieldMap[field];
        const value = (submissionData as any)[field];

        try {
            const res = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: activeTeam.id,
                    submission: { [apiField]: value }
                })
            });

            if (res.ok) {
                toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} submitted!`);
            } else {
                throw new Error("API Error");
            }
        } catch (err) {
            toast.error("Submission failed. Please try again.");
        }
    };

    return (
        <DashboardLayout type="team" title="Submission Center">
            <div className="max-w-5xl mx-auto space-y-8">


                {/* Submission Form */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-md relative overflow-hidden">
                    {isTimeLocked || isSubmissionLocked ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Lock className="text-purple-500 mb-6 animate-pulse" size={48} />
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">Submission Locked</h3>
                            <p className="text-white/40 max-w-md mx-auto text-sm font-medium italic">
                                Submission portal is currently closed. Student coordinators will inform you when to begin your submissions.
                            </p>
                            <div className="mt-8 px-6 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 font-mono text-xs uppercase tracking-widest font-bold">
                                Locked
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-10">
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Build Details</h3>
                                <p className="text-white/40 text-sm italic">Update each component as you finalize your modules.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-3">GitHub Repository</label>
                                        <div className="flex gap-4">
                                            <div className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:border-purple-500/50 transition-all group flex-grow">
                                                <Github size={20} className="text-white/20 group-focus-within:text-white transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="https://github.com/team/repo"
                                                    value={submissionData.repo}
                                                    onChange={(e) => setSubmissionData({ ...submissionData, repo: e.target.value })}
                                                    className="bg-transparent border-none outline-none w-full text-white font-bold placeholder:text-white/10"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleIndividualSubmit('repo')}
                                                className="px-6 py-4 bg-purple-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-purple-700 active:scale-95 transition-all shadow-lg"
                                            >
                                                Submit
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-3">Demo Video Link (Drive/Loom/YouTube)</label>
                                        <div className="flex gap-4">
                                            <div className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:border-purple-500/50 transition-all group flex-grow">
                                                <Video size={20} className="text-white/20 group-focus-within:text-white transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="https://youtube.com/watch?v=..."
                                                    value={submissionData.video}
                                                    onChange={(e) => setSubmissionData({ ...submissionData, video: e.target.value })}
                                                    className="bg-transparent border-none outline-none w-full text-white font-bold placeholder:text-white/10"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleIndividualSubmit('video')}
                                                className="px-6 py-4 bg-purple-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-purple-700 active:scale-95 transition-all shadow-lg"
                                            >
                                                Submit
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-3">Project Presentation (Cloud Storage Link)</label>
                                        <div className="flex gap-4">
                                            <div className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:border-purple-500/50 transition-all group flex-grow">
                                                <Presentation size={20} className="text-white/20 group-focus-within:text-white transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="https://canva.com/design/..."
                                                    value={submissionData.presentation}
                                                    onChange={(e) => setSubmissionData({ ...submissionData, presentation: e.target.value })}
                                                    className="bg-transparent border-none outline-none w-full text-white font-bold placeholder:text-white/10"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleIndividualSubmit('presentation')}
                                                className="px-6 py-4 bg-purple-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-purple-700 active:scale-95 transition-all shadow-lg"
                                            >
                                                Submit
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-3">Live Deployment URL (Optional)</label>
                                        <div className="flex gap-4">
                                            <div className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:border-purple-500/50 transition-all group flex-grow">
                                                <Globe size={20} className="text-white/20 group-focus-within:text-white transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="https://tricity-demo.vercel.app"
                                                    value={submissionData.demo}
                                                    onChange={(e) => setSubmissionData({ ...submissionData, demo: e.target.value })}
                                                    className="bg-transparent border-none outline-none w-full text-white font-bold placeholder:text-white/10"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleIndividualSubmit('demo')}
                                                className="px-6 py-4 bg-purple-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-purple-700 active:scale-95 transition-all shadow-lg"
                                            >
                                                Submit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
