"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { MessageCircle, Bell } from "lucide-react";

export default function CommunicationsPage() {
    return (
        <DashboardLayout type="team" title="Event Communications">
            <div className="max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Updates & Communications</h1>
                    <p className="text-slate-500 mt-2">Join our official WhatsApp groups to receive live announcements, schedule changes, and direct communication from the organizing team during the hackathon.</p>
                </div>

                <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-100 text-green-600">
                                    <MessageCircle size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Official WhatsApp Groups</h2>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                                Join our official WhatsApp group for live announcements and schedule updates. Please join <strong>Group 1</strong> first. If it is full, you can join <strong>Group 2</strong> instead (the exact same updates will be posted in both).
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                            <a 
                                href="https://chat.whatsapp.com/GIqgewH9WgiH0GgPWHxxl7?s=cl&p=a&ilr=4&iam=0" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="group flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-700"
                            >
                                Join Group 1
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </a>
                            <a 
                                href="https://chat.whatsapp.com/Ly1AucjZzZUAel5HH2w9CA" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="group flex items-center justify-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-200 hover:text-slate-900"
                            >
                                Join Group 2
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
