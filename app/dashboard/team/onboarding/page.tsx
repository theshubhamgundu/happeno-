"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
    Users,
    School,
    Lightbulb,
    CheckCircle2,
    AlertCircle,
    FileText,
    ShieldCheck,
    Github,
    Linkedin,
    ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function TeamOnboarding() {
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);
    const [formData, setFormData] = useState({
        teamName: "The Code Breakers",
        university: "",
        track: "",
        github: "",
        linkedin: ""
    });

    const handleComplete = () => {
        if (!agreed) return;

        // In a real app, you'd validate and push to DB here
        console.log("Onboarding Data:", formData);

        // Simulate Success
        toast.success("Welcome to TRI-CITY AI HACKATHON! Your profile is set.");
        router.push("/dashboard/team");
    };

    return (
        <DashboardLayout type="team" title="Team Onboarding">
            <div className="max-w-4xl mx-auto pb-20">
                <div className="mb-12">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Complete your Profile</h2>
                    <p className="text-white/40 font-medium">Please provide accurate information for verification and certificate generation.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Form Section */}
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-3">Team Name</label>
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:border-purple-500/50 transition-all">
                                <Users size={20} className="text-white/20" />
                                <input
                                    type="text"
                                    value={formData.teamName}
                                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                                    className="bg-transparent border-none outline-none w-full text-white font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-3">College / University</label>
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:border-purple-500/50 transition-all">
                                <School size={20} className="text-white/20" />
                                <input
                                    type="text"
                                    placeholder="Enter University Name"
                                    value={formData.university}
                                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                    className="bg-transparent border-none outline-none w-full text-white font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-3">Captain's Github</label>
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:border-purple-500/50 transition-all">
                                <Github size={20} className="text-white/20" />
                                <input
                                    type="text"
                                    placeholder="github.com/username"
                                    value={formData.github}
                                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                    className="bg-transparent border-none outline-none w-full text-white font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-3">Captain's LinkedIn</label>
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:border-purple-500/50 transition-all">
                                <Linkedin size={20} className="text-white/20" />
                                <input
                                    type="text"
                                    placeholder="linkedin.com/in/username"
                                    value={formData.linkedin}
                                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                    className="bg-transparent border-none outline-none w-full text-white font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-3">Project Theme</label>
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:border-purple-500/50 transition-all">
                                <Lightbulb size={20} className="text-white/20" />
                                <input
                                    type="text"
                                    placeholder="e.g. Healthcare, Education, Sustainability..."
                                    value={formData.track}
                                    onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                                    className="bg-transparent border-none outline-none w-full text-white font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rules Section */}
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md h-fit">
                        <h3 className="text-xl font-bold flex items-center gap-3 mb-6 italic">
                            <FileText className="text-purple-400" />
                            Code of Conduct
                        </h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar mb-8">
                            {[
                                "Follow the event instructions shared by the organizers. No late submissions will be accepted.",
                                "Direct copy-pasting of code from AI/Internet without modification is prohibited.",
                                "Team collaboration is mandatory. Solo hacks are not eligible for prizes.",
                                "Respect other participants and volunteers. Zero tolerance for harassment.",
                                "Keep your work area clean and return distributed equipment after use."
                            ].map((rule, i) => (
                                <div key={i} className="flex gap-4">
                                    <span className="text-purple-500 font-bold">0{i + 1}.</span>
                                    <p className="text-xs text-white/60 leading-relaxed font-poppins">{rule}</p>
                                </div>
                            ))}
                        </div>

                        <div
                            onClick={() => setAgreed(!agreed)}
                            className="flex items-center gap-4 cursor-pointer group select-none"
                        >
                            <div
                                className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${agreed ? 'bg-purple-600 border-purple-600 shadow-[0_0_15px_#9333ea]' : 'border-white/10 group-hover:border-purple-500/50'
                                    }`}
                            >
                                {agreed && <CheckCircle2 size={16} className="text-white" />}
                            </div>
                            <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors italic">
                                I agree to the TRI-CITY AI HACKATHON Hackathon Rules
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-8 border-t border-white/10">
                    <button
                        onClick={handleComplete}
                        disabled={!agreed}
                        className={`flex items-center gap-3 px-12 py-4 rounded-2xl font-black italic uppercase italic transition-all active:scale-95 ${agreed
                            ? 'bg-[#FFEE00] text-black shadow-[8px_8px_0_#9E00F9] hover:-translate-y-1 hover:-translate-x-1'
                            : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                            }`}
                    >
                        Complete Onboarding
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
