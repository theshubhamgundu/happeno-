"use client"

import React from "react";
import {
    FileText,
    ArrowRight,
    Clock,
    MapPin,
    Users,
    ShieldCheck,
    Zap,
    Database,
    Globe,
    Cpu,
    Info,
    AlertCircle,
    Gavel,
    Coffee,
    Truck,
    HeartPulse,
    Construction,
    Terminal,
    Github,
    Lightbulb,
    Target,
    Scale,
    Activity,
    Lock
} from "lucide-react";
import FadeInView from "@/components/FadeInView";

const Section = ({ title, children, id }: { title: string, children: React.ReactNode, id: string }) => (
    <div id={id} className="py-8 border-b border-white/5 last:border-0 group">
        <div className="flex items-baseline gap-4 mb-8">
            <span className="text-[#FFEE00] font-mono text-sm font-bold opacity-40 group-hover:opacity-100 transition-opacity">
                [{id.padStart(2, '0')}]
            </span>
            <h2 className="text-white font-kanit font-bold text-2xl uppercase tracking-wider">{title}</h2>
        </div>
        <div className="pl-0 md:pl-12 text-white/90 leading-relaxed space-y-4 text-base">
            {children}
        </div>
    </div>
);

const DomainItem = ({ title, valid, invalid, desc }: { title: string, valid: string[], invalid: string[], desc: string }) => (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 space-y-6">
        <h3 className="text-[#FFEE00] font-bold text-lg uppercase tracking-wide flex items-center gap-2">
            <ArrowRight size={16} /> {title}
        </h3>
        <p className="text-white/80 italic">{desc}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-green-400/70 border-b border-green-500/10 pb-2">Valid Implementations</p>
                <ul className="space-y-2">
                    {valid.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-white/40">Ã¢â‚¬Â¢</span> {item}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFEE00]/70 border-b border-slate-800/10 pb-2">Will Not Qualify</p>
                <ul className="space-y-2">
                    {invalid.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm opacity-60">
                            <span className="text-white/20">Ãƒâ€”</span> {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

export default function GuidelinesPage() {
    return (
        <div className="min-h-screen bg-[#0B0114] text-white font-sans selection:bg-slate-900 pb-40">

            {/* Header / Intro */}
            <div className="relative pt-32 pb-12 px-6 border-b border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-slate-900/5 to-transparent pointer-events-none" />
                <div className="max-w-5xl mx-auto">
                    <FadeInView>
                        <div className="flex items-center gap-3 text-[#FFEE00] mb-4">
                            <FileText size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Central Protocol V2.0</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-end gap-x-3 gap-y-4 mb-6">
                            <div className="h-16 md:h-20 w-16 md:w-20 flex items-center">
                                <span className="font-kanit font-black italic text-3xl text-[#FFEE00]">T</span>
                            </div>
                            <h1 className="text-4xl md:text-7xl font-kanit font-black italic uppercase tracking-tighter text-[#FFEE00] leading-[0.8] pb-1">
                                GUIDELINES
                            </h1>
                        </div>
                        <p className="text-white/40 text-sm md:text-base max-w-2xl font-kanit italic uppercase tracking-widest leading-relaxed">
                            A comprehensive manual for innovation, technical integrity, and competitive discipline.
                        </p>
                    </FadeInView>
                </div>
            </div>

            {/* Document Flow */}
            <div className="max-w-3xl mx-auto px-6 mt-8">

                {/* 1. Overview */}
                <Section title="Event Overview" id="1">
                    <p>TRI-CITY AI HACKATHON is an 24 hours innovative, multi domain based hackathon conducted over two days.</p>
                    <p>All solutions must be conceptualized, designed, and developed entirely during the official hackathon duration.</p>
                    <p>Development may begin only after the official kickoff announcement.</p>
                </Section>

                {/* 2. Arrival & Presence */}
                <Section title="Mandatory Arrival, Check-In & Presence" id="2">
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-white font-bold mb-3 text-sm italic uppercase tracking-widest">2.1 Arrival & Registration</h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-white/80">
                                <li>All participants must arrive at the campus by 8:45 AM without fail.</li>
                                <li>Teams must complete the initial check-in at the registration desk.</li>
                                <li>Workspace access will be granted only after successful check-in.</li>
                                <li className="text-[#FFEE00] font-bold">Late arrival may affect participation eligibility.</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-3 text-sm italic uppercase tracking-widest">2.2 Mandatory Team Presence</h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-white/80">
                                <li>Team must consist of all registered members.</li>
                                <li>All team members must remain available at the assigned desk/workspace throughout the hackathon.</li>
                                <li>Members may step out only during officially announced break hours.</li>
                                <li>During evaluation rounds, all team members must be present.</li>
                                <li className="text-[#FFEE00] font-bold">Absence during evaluation may impact scoring or eligibility.</li>
                            </ul>
                        </div>
                    </div>
                </Section>

                {/* 3. Problem & Innovation */}
                <Section title="Problem Statement & Innovation Policy" id="3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-8 rounded-2xl">
                        <ul className="list-disc pl-5 space-y-3 text-sm text-white/80">
                            <li>Teams are free to choose their own problem statement.</li>
                            <li>The problem must strictly align with one of the officially declared domains.</li>
                            <li>Irrespective of domain, the idea must demonstrate clear innovation and originality.</li>
                        </ul>
                        <ul className="list-disc pl-5 space-y-3 text-sm text-white/80">
                            <li>Projects must not be clones of existing products without meaningful differentiation.</li>
                            <li>Visible added value must be clearly explained if inspired by existing solutions.</li>
                            <li className="text-[#FFEE00]">Innovation is a primary evaluation parameter.</li>
                        </ul>
                    </div>
                </Section>

                {/* 4. Structure & Rounds */}
                <Section title="Hackathon Structure & Rounds" id="4">
                    <div className="space-y-12">
                        {/* Day 1 */}
                        <div className="space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 border-b border-white/5 pb-2">Day 01 Protocol</p>

                            <div className="relative pl-8 border-l-2 border-[#FFEE00]/20">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0B0114] border-2 border-[#FFEE00]" />
                                <h4 className="text-white font-bold text-sm tracking-widest mb-1 italic">Idea Presentation Ã¢â‚¬Â¢ 10:00 Ã¢â‚¬â€œ 10:30 AM</h4>
                                <p className="text-sm text-white/80">Present initial ideas and form teams. Finalize problem statements.</p>
                            </div>

                            <div className="relative pl-8 border-l-2 border-[#FFEE00]/20">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0B0114] border-2 border-[#FFEE00]" />
                                <h4 className="text-white font-bold text-sm tracking-widest mb-1 italic">First Evaluation Ã¢â‚¬Â¢ 12:30 Ã¢â‚¬â€œ 01:00 PM</h4>
                                <p className="text-sm text-white/80">Initial progress assessment and technical roadmap review.</p>
                            </div>

                            <div className="relative pl-8 border-l-2 border-[#FFEE00]/20">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0B0114] border-2 border-[#FFEE00]" />
                                <h4 className="text-white font-bold text-sm tracking-widest mb-1 italic text-[#FFEE00]">Progress Review Ã¢â‚¬Â¢ 04:00 Ã¢â‚¬â€œ 05:00 PM</h4>
                                <p className="text-sm text-white/80">A second progress review with feedback from evaluators and mentors.</p>
                            </div>

                            <div className="relative pl-8 border-l-2 border-teal-500/20">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0B0114] border-2 border-teal-500" />
                                <h4 className="text-white font-bold text-sm tracking-widest mb-1 italic">Progress Check-in Ã¢â‚¬Â¢ 10:00 Ã¢â‚¬â€œ 11:00 PM</h4>
                                <p className="text-sm text-white/80 italic">Idea suggestions round: Evaluators and mentors will provide guidance and technical feedback.</p>
                            </div>
                        </div>

                        {/* Day 2 */}
                        <div className="space-y-6 pt-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 border-b border-white/5 pb-2">Day 02 Protocol</p>

                            <div className="relative pl-8 border-l-2 border-[#FFEE00]/20">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0B0114] border-2 border-[#FFEE00]" />
                                <h4 className="text-white font-bold text-sm tracking-widest mb-1 italic">Top 10 Selection Ã¢â‚¬Â¢ 06:00 Ã¢â‚¬â€œ 07:00 AM</h4>
                                <p className="text-sm text-white/80">Picking the strongest projects for the grand pitch.</p>
                            </div>

                            <div className="relative pl-8 border-l-2 border-[#FFEE00]/20">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0B0114] border-2 border-[#FFEE00]" />
                                <h4 className="text-white font-bold text-sm tracking-widest mb-1 italic">Final Presentations Ã¢â‚¬Â¢ 07:30 Ã¢â‚¬â€œ 08:30 AM</h4>
                                <p className="text-sm text-white/80">Final live pitch and judge demonstrations.</p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 5. Project Scope & Technical Integrity */}
                <Section title="Project Scope & Technical Integrity" id="5">
                    <p className="mb-10 text-white/60 text-base italic">To maintain technical integrity, projects must demonstrate genuine innovation and working implementations. Superficial branding will not qualify.</p>

                    <div className="space-y-12">
                        <DomainItem
                            title="5.1 General Expectations"
                            desc="All projects must demonstrate a functional prototype with real logic and implementation."
                            valid={[
                                "Working prototype with core functionality",
                                "Clear problem statement and proposed solution",
                                "Structured codebase with meaningful architecture",
                                "Use of relevant APIs, frameworks, or technologies",
                                "Demonstrable innovation or unique approach"
                            ]}
                            invalid={[
                                "UI-only mockups with no backend logic",
                                "Copy-pasted template projects",
                                "Projects that only call a single API without adding value",
                                "Static pages labeled as applications"
                            ]}
                        />
                    </div>

                    <div className="mt-8 p-4 bg-slate-900/10 border border-slate-800/20 rounded-xl flex gap-3 items-center">
                        <AlertCircle className="text-slate-900" size={18} />
                        <p className="text-xs text-slate-900 font-bold uppercase tracking-widest italic">Projects that do not meet the technical bar may be deemed ineligible.</p>
                    </div>
                </Section>

                {/* 6. Repository Policy */}
                <Section title="Central Repository Policy" id="6">
                    <div className="space-y-8">
                        <p>Development must occur strictly within the official forked repository. Development outside the repository will result in disqualification.</p>

                        <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
                            <h4 className="text-white font-bold text-sm tracking-widest mb-6 flex items-center gap-3 italic">
                                6.1 Commit & Contribution Policy
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <ul className="space-y-4 text-sm text-white/80">
                                    <li className="flex gap-2"><span>Ã¢â‚¬Â¢</span> Frequent and meaningful commits are mandatory.</li>
                                    <li className="flex gap-2"><span>Ã¢â‚¬Â¢</span> Commit history will be reviewed during evaluation.</li>
                                    <li className="flex gap-2 text-[#FFEE00]"><span>Ã¢â‚¬Â¢</span> Sudden bulk uploads without progressive history will lead to disqualification.</li>
                                </ul>
                                <ul className="space-y-4 text-sm text-white/50 italic opacity-60">
                                    <li className="flex gap-2 text-[#FFEE00] font-bold"><span>Ã¢â‚¬Â¢</span> No outsourced development or external code.</li>
                                    <li><span>Ã¢â‚¬Â¢</span> No copying from other teams.</li>
                                    <li><span>Ã¢â‚¬Â¢</span> No pre-built complete solutions.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 7. AI Tool Usage */}
                <Section title="AI & Modern Tool Usage" id="7">
                    <p>Use of AI-assisted platforms is encouraged (Antigravity, Windsurf, Cursor, ChatGPT, Claude).</p>
                    <ul className="list-disc pl-5 text-sm text-white/50 space-y-2 mt-4 italic">
                        <li>Major tools used must be disclosed in the repository.</li>
                        <li>Teams must fully understand and explain generated code.</li>
                        <li className="text-[#FFEE00]">Inability to explain implementation will impact scoring.</li>
                    </ul>
                </Section>

                {/* 8. APIs */}
                <Section title="API & Third-Party Service Disclosure" id="8">
                    <p>All APIs and paid tools must be declared in the repository. Teams are responsible for managing their own API credits.</p>
                </Section>

                {/* 9. Technical & Infrastructure */}
                <Section title="Technical & Infrastructure Requirements" id="9">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-white font-bold text-xs uppercase tracking-widest opacity-40">Each team must bring:</h4>
                            <div className="flex flex-wrap gap-2">
                                {["Laptops", "Chargers", "Hardware Components", "USB-to-Ethernet Connector"].map(t => (
                                    <span key={t} className="bg-white/5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/10 uppercase">{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-900/5 p-4 rounded-xl border border-slate-800/10 text-xs text-[#FFEE00] leading-relaxed italic">
                            Internet access and workspace provided. Organizers are not responsible for hardware damage, theft, or data loss.
                        </div>
                    </div>
                </Section>

                {/* 10-12. Stability & Conduct */}
                <Section title="Evaluation Stability & Conduct" id="10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-white font-bold text-sm tracking-widest italic">10. Demo Stability</h4>
                            <p className="text-xs text-white/40 leading-relaxed italic">Projects must function during evaluation. Judges are not responsible for technical failures. Demo failure impacts scoring.</p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-white font-bold text-sm tracking-widest italic">12. Code of Conduct</h4>
                            <p className="text-xs text-white/40 leading-relaxed italic">Professional behavior mandatory. Harassment, plagiarism, or misconduct results in immediate disqualification.</p>
                        </div>
                    </div>
                </Section>

                {/* 13-14. Logistics */}
                <Section title="Facilities, Meals & Transport" id="11">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h4 className="text-white font-extrabold text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                                <Coffee size={14} className="text-[#FFEE00]" /> 13. Meal Provisions
                            </h4>
                            <div className="space-y-3 text-[11px] font-black uppercase tracking-widest text-[#FFEE00]/40">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span>Day 1 Lunch</span>
                                    <span className="text-white">Bring Your Own</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span>Day 1 Snacks & Dinner</span>
                                    <span className="text-white">Provided</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Day 2 Breakfast</span>
                                    <span className="text-white">Provided</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-white font-extrabold text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                                <Truck size={14} className="text-[#FFEE00]" /> 14. Transportation
                            </h4>
                            <div className="space-y-4">
                                <p className="text-sm text-white/80 leading-relaxed italic">
                                    Services available from <span className="text-white font-bold">LB NAGAR</span> to campus. Report strictly on time. Organizers not responsible for delays caused by late arrival.
                                </p>
                                <p className="text-sm text-[#FFEE00] font-bold italic border-l-2 border-[#FFEE00] pl-4 py-1">
                                    Detailed timings along with contact details will be shared before the hackathon  in the official group.
                                </p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 15-17. Venue & Legal */}
                <Section title="Venue & Intellectual Property" id="12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-white/60 text-xs font-black uppercase tracking-widest italic">15. Discipline</h4>
                            <p className="text-sm text-white/50 font-mono italic">Maintain workspace cleanliness. Intentional property damage leads to financial liability.</p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-white/60 text-xs font-black uppercase tracking-widest italic">16. Emergency</h4>
                            <p className="text-sm text-white/50 font-mono italic">Participants responsible for personal health and safety during the event duration.</p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-white/60 text-xs font-black uppercase tracking-widest italic">17. IP Rights</h4>
                            <p className="text-sm text-white/50 font-mono italic">Teams retain ownership. TRI-CITY AI HACKATHON may showcase projects for promotional/reporting purposes.</p>
                        </div>
                    </div>
                </Section>

            </div>

            {/* Sticky Logo / Footer */}
            <div className="relative z-10 text-center py-12 opacity-30">
                <p className="uppercase tracking-[1em] font-black text-xs">TRI-CITY AI HACKATHON PROTOCOL</p>
            </div>

            {/* Fixed Background Branding */}
            <div className="fixed bottom-0 right-0 p-10 opacity-[0.02] pointer-events-none select-none -z-10">
                <span className="font-kanit font-black italic text-8xl">TRICITY</span>
            </div>
        </div>
    );
}
