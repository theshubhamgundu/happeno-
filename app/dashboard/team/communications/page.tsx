"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { MessageCircle, Bell } from "lucide-react";

export default function CommunicationsPage() {
    return (
        <DashboardLayout type="team" title="Event Communications">
            <div className="max-w-3xl text-black">
                <div className="mb-6">
                    <span className="inline-block rounded-md border-2 border-black bg-[#99e885] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_#000] mb-2">
                        LIVE BROADCASTS
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Updates & Announcements</h1>
                    <p className="text-neutral-700 font-semibold text-xs mt-1 leading-relaxed">
                        Join our official broadcast channels to receive live schedule announcements, mentor callouts, and direct alerts during the hackathon.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border-3 border-black bg-white p-6 md:p-8 shadow-[6px_6px_0px_#000] overflow-hidden">
                        <div className="bg-[#99e885] p-4 -m-6 md:-m-8 mb-6 border-b-2 border-black flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-black text-white font-black text-sm shadow-[1.5px_1.5px_0px_#000]">
                                    <MessageCircle size={18} />
                                </span>
                                <h2 className="text-sm font-black uppercase tracking-wider text-black">Official WhatsApp Groups</h2>
                            </div>
                            <span className="rounded bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_#000]">
                                LIVE CHANNEL
                            </span>
                        </div>

                        <p className="text-xs text-neutral-800 font-bold leading-relaxed">
                            Join our official WhatsApp group for live announcements and schedule updates. Please join <strong>Group 1</strong> first. If it is full, you can join <strong>Group 2</strong> instead (the exact same updates will be posted in both).
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-5 border-t-2 border-black">
                            <a 
                                href="https://chat.whatsapp.com/GIqgewH9WgiH0GgPWHxxl7?s=cl&p=a&ilr=4&iam=0" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="group flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#99e885] hover:bg-[#85df70] border-2 border-black px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_#000] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
                            >
                                Join Group 1
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </a>
                            <a 
                                href="https://chat.whatsapp.com/Ly1AucjZzZUAel5HH2w9CA" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="group flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#c0f7fe] hover:bg-[#a6f2fd] border-2 border-black px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_#000] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
                            >
                                Join Group 2
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
