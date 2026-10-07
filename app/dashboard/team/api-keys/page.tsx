"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Key, ExternalLink, Code, Lock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useHackathon } from "@/context/HackathonContext";

export default function ApiKeysPage() {
    const { isSubmissionLocked } = useHackathon();
    const IS_HACKATHON_STARTED = new Date() >= new Date('2026-10-10T08:00:00+05:30');
    const locked = isSubmissionLocked || !IS_HACKATHON_STARTED;

    return (
        <DashboardLayout type="team" title="Sponsor APIs" subtitle="Access tools and credits provided by our partners">
            {locked && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm flex items-start gap-3">
                    <Lock size={18} className="text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-800">API Keys are locked</h4>
                        <p className="text-xs text-amber-700 mt-1">Sponsor credits will unlock automatically when the hackathon officially begins on October 10th.</p>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Mobbin Card */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-indigo-50/50">
                        <div className="flex items-start justify-between">
                            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white border border-slate-100 text-[#141414] mb-4 shadow-sm">
                                <svg className="w-8 h-auto" viewBox="0 0 139 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M84.3504 64H48.1695V47.315L32.569 63.9989L0 63.9841V29.9515L28.31 0H67.4439V15.9214L82.6881 0H116.593V26.1874H139V64H99.1163V48.208L84.3504 64Z" fill="currentColor" />
                                </svg>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                Pro Access
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Mobbin</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            World's largest UI/UX reference library. Use this key to unlock pro features for your design phase.
                        </p>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-end">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                            Your Access Key
                        </label>
                        <div className="flex items-center gap-2 relative">
                            <code className={`flex-1 block rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-mono ${locked ? 'text-slate-300 blur-sm select-none' : 'text-slate-700 select-all'}`}>
                                MOBBIN-TRI2026-X9A2
                            </code>
                            {locked && <div className="absolute inset-0 flex items-center justify-center"><Lock size={16} className="text-slate-500" /></div>}
                        </div>
                        <button 
                            disabled={locked}
                            onClick={() => { 
                                navigator.clipboard.writeText('MOBBIN-TRI2026-X9A2'); 
                                toast.success('Mobbin key copied to clipboard!'); 
                            }} 
                            className="w-full mt-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            {locked ? "Locked" : "Copy Key"}
                        </button>
                    </div>
                </div>

                {/* n8n Card */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-teal-50/50">
                        <div className="flex items-start justify-between">
                            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white border border-slate-100 text-[#FF6D5A] mb-4 shadow-sm">
                                <svg className="w-8 h-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 121.3 512.1 269.6">
                                    <path d="M458.1 229.1c-25.1 0-46.2-17.2-52.2-40.4h-61.8c-13.2 0-24.4 9.5-26.6 22.5l-2.2 13.3c-2 12.2-8.2 23.4-17.5 31.6 9.3 8.2 15.5 19.3 17.5 31.6l2.2 13.3c2.2 13 13.4 22.5 26.6 22.5h7.9c6-23.2 27.1-40.4 52.2-40.4 29.8 0 53.9 24.1 53.9 53.9s-24.1 53.9-53.9 53.9c-25.1 0-46.2-17.2-52.2-40.4h-7.9c-26.3 0-48.8-19-53.2-45l-2.2-13.3c-2.2-13-13.4-22.5-26.6-22.5h-21.4c-6 23.2-27.1 40.4-52.2 40.4s-46.2-17.2-52.2-40.4H106c-6 23.2-27.1 40.4-52.2 40.4C24.1 309.9 0 285.8 0 256s24.1-53.9 53.9-53.9c25.1 0 46.2 17.2 52.2 40.4h30.3c6-23.2 27.1-40.4 52.2-40.4s46.2 17.2 52.2 40.4h21.4c13.2 0 24.4-9.5 26.6-22.5l2.2-13.3c4.3-26 26.8-45 53.2-45H406c6-23.2 27.1-40.4 52.2-40.4 29.8 0 53.9 24.1 53.9 53.9s-24.2 53.9-54 53.9m0-27c14.9 0 26.9-12.1 26.9-26.9s-12.1-26.9-26.9-26.9-26.9 12.1-26.9 26.9 12 26.9 26.9 26.9M53.9 282.9c14.9 0 26.9-12.1 26.9-26.9s-12.1-26.9-26.9-26.9-27 12-27 26.9 12.1 26.9 27 26.9M215.6 256c0 14.9-12.1 26.9-26.9 26.9s-26.9-12.1-26.9-26.9 12.1-26.9 26.9-26.9 26.9 12 26.9 26.9m215.6 80.8c0 14.9-12.1 26.9-26.9 26.9-14.9 0-26.9-12.1-26.9-26.9s12.1-26.9 26.9-26.9 26.9 12.1 26.9 26.9" fillRule="evenodd" clipRule="evenodd" fill="#ea4b71" />
                                </svg>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                Cloud Credits
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">n8n</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Advanced workflow automation tool. Use these credits to power your backend integrations instantly.
                        </p>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-end">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                            Your Promo Code
                        </label>
                        <div className="flex items-center gap-2 relative">
                            <code className={`flex-1 block rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-mono ${locked ? 'text-slate-300 blur-sm select-none' : 'text-slate-700 select-all'}`}>
                                N8N-TRI2026-B7C4
                            </code>
                            {locked && <div className="absolute inset-0 flex items-center justify-center"><Lock size={16} className="text-slate-500" /></div>}
                        </div>
                        <button 
                            disabled={locked}
                            onClick={() => { 
                                navigator.clipboard.writeText('N8N-TRI2026-B7C4'); 
                                toast.success('n8n code copied to clipboard!'); 
                            }} 
                            className="w-full mt-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            {locked ? "Locked" : "Copy Code"}
                        </button>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
