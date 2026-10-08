"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { BookOpen, AlertTriangle, Github, Video, Clock, Users, Code, CheckCircle2, MapPin, Laptop, Rocket } from "lucide-react";

export default function RulesPage() {
    return (
        <DashboardLayout type="team" title="Rules & Guidelines" subtitle="Important rules for participation and final submissions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Do's and Don'ts */}
                <section className="rounded-2xl border border-teal-200 bg-white shadow-sm overflow-hidden lg:col-span-2">
                    <div className="p-5 border-b border-teal-100 bg-teal-50 flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-teal-700">
                            <CheckCircle2 size={20} />
                        </span>
                        <div>
                            <h2 className="text-lg font-bold text-teal-800">Event Code of Conduct</h2>
                            <p className="text-xs text-teal-600 mt-0.5">To ensure a safe, fair, and high-energy hackathon, follow these Do's and Don'ts throughout the event.</p>
                        </div>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-base font-bold text-emerald-700 mb-4 flex items-center gap-2">
                                <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">✓</span> 
                                Do's for Students
                            </h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Carry your valid ID and keep your participant QR ready at all times.</li>
                                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Use only approved hackathon zones and follow volunteer instructions immediately.</li>
                                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Maintain discipline during coding hours, mentor sessions, and overnight slots.</li>
                                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Keep your workspace clean and use campus infrastructure responsibly.</li>
                                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Report safety issues, health concerns, or suspicious activity to organizers without delay.</li>
                                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Respect fellow teams, jury members, and campus residents in words and actions.</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-rose-700 mb-4 flex items-center gap-2">
                                <span className="bg-rose-100 text-rose-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">✗</span> 
                                Don'ts for Students
                            </h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span> Do not enter hostels, labs, offices, or any restricted areas.</li>
                                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span> Do not share, forge, or misuse participant credentials or QR cards.</li>
                                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span> Do not create noise, disruptions, or behavior that disturbs the campus environment.</li>
                                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span> Do not litter, damage furniture/equipment, or misuse common facilities.</li>
                                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span> Do not bypass check-in, verification, or security processes at any point.</li>
                                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span> Do not engage in misconduct, harassment, or any non-compliant activity.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* General Rules */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
                            <BookOpen size={20} />
                        </span>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">General Rules</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Standard hackathon guidelines</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <Code size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Fresh Code</h4>
                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">All core code, design, and assets must be created during the hackathon. Using open-source boilerplates and APIs is permitted, but the main logic must be original.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Users size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Team Conduct</h4>
                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">Treat everyone with respect. Harassment of any kind towards participants, mentors, or judges will result in immediate disqualification.</p>
                                </div>
                            </li>

                            <li className="flex items-start gap-3">
                                <Laptop size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Equipment Responsibility</h4>
                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">Please take care of your laptops, chargers, and personal belongings. Organizers are not responsible for any lost or damaged items.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Clock size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Strict Deadlines</h4>
                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">The submission portal will lock exactly at the deadline. Late submissions will not be evaluated under any circumstances.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Originality</h4>
                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">Plagiarism will lead to immediate disqualification. Build something original that solves the problem statement uniquely.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Submission Rules */}
                <section className="rounded-2xl border border-rose-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-rose-100 bg-rose-50 flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-700">
                            <AlertTriangle size={20} />
                        </span>
                        <div>
                            <h2 className="text-lg font-bold text-rose-800">Submission Requirements</h2>
                            <p className="text-xs text-rose-600 mt-0.5">Critical rules to ensure your project gets evaluated</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="mb-6 rounded-lg bg-rose-50 p-4 border border-rose-100">
                            <p className="text-sm font-semibold text-rose-800">If judges cannot access your links, your team will receive a score of zero.</p>
                        </div>
                        
                        <ul className="space-y-6">
                            <li className="flex items-start gap-3">
                                <Github size={20} className="text-slate-700 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">GitHub Repository Rules</h4>
                                    <ul className="mt-2 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-slate-300">
                                        <li>The repository <strong className="text-slate-800">must be set to Public</strong>.</li>
                                        <li><strong className="text-slate-800">All team members</strong> must be added as collaborators or contributors to the repository to verify individual participation.</li>
                                        <li>Your repo <strong className="text-slate-800">must contain a detailed README.md</strong> explaining how to install dependencies and run the project locally.</li>
                                    </ul>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Video size={20} className="text-slate-700 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Drive & Video Links</h4>
                                    <ul className="mt-2 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-slate-300">
                                        <li>Any Google Drive links (for presentations or assets) must have sharing permissions set to <strong className="text-slate-800">"Anyone with the link can view"</strong>.</li>
                                        <li>YouTube or Loom demo videos must be <strong className="text-slate-800">Public or Unlisted</strong>. Private videos cannot be evaluated.</li>
                                        <li>The demo video should be concise and <strong className="text-slate-800">must not exceed 4 minutes</strong> in length.</li>
                                        <li>Double-check all links in an Incognito window before submitting.</li>
                                    </ul>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Rocket size={20} className="text-slate-700 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Live Deployment (Optional)</h4>
                                    <ul className="mt-2 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-slate-300">
                                        <li>While not strictly mandatory, deploying your project live (via Vercel, Render, Netlify, etc.) is <strong className="text-slate-800">highly recommended</strong> and carries extra weight during evaluation.</li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>



            </div>
        </DashboardLayout>
    );
}
