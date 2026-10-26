import React from 'react';
import Link from 'next/link';
import { verifyCertificateById, getCertificateConfig } from '@/lib/certificate';
import { ShieldCheck, ShieldAlert, Award, Calendar, CheckCircle2, Copy, ArrowLeft } from 'lucide-react';
import HappenoMark from '@/components/HappenoMark';

export const dynamic = 'force-dynamic';

export default async function CertificateVerificationPage({
    params
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const record = await verifyCertificateById(id);
    const config = await getCertificateConfig();

    return (
        <main className="min-h-screen bg-[#F8F9FA] text-[#0f172a] font-sans selection:bg-teal-100 flex flex-col justify-between">
            {/* Top Navbar */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0f766e] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            H
                        </div>
                        <HappenoMark compact className="text-lg" />
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            Credential Registry
                        </span>
                    </div>
                </div>
            </header>

            {/* Content Body */}
            <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
                {record ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)] overflow-hidden">
                        {/* Status Banner */}
                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 px-8 py-6 text-white flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                                    <ShieldCheck size={26} className="text-emerald-300" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.2em] text-emerald-200">
                                        Happeno Verified Credential
                                    </span>
                                    <h1 className="text-xl font-black tracking-tight text-white">
                                        Official Certificate of Participation
                                    </h1>
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-300/30 text-emerald-100 text-xs font-bold">
                                <CheckCircle2 size={14} className="text-emerald-300" /> Authentic
                            </div>
                        </div>

                        {/* Credential Details */}
                        <div className="p-8 sm:p-10 space-y-8">
                            <div className="text-center py-4 border-b border-slate-100">
                                <span className="text-xs uppercase font-mono tracking-widest text-slate-400 font-bold block mb-2">
                                    This certifies that
                                </span>
                                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
                                    {record.member_name}
                                </h2>
                                <p className="text-sm text-teal-800 font-bold mt-2">
                                    Team: <span className="text-slate-800 font-semibold">{record.team_name}</span> ({record.team_id})
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
                                <div>
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        Event
                                    </span>
                                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Award size={16} className="text-teal-600 shrink-0" />
                                        {config.event_title}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        Issue Date
                                    </span>
                                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Calendar size={16} className="text-teal-600 shrink-0" />
                                        {config.issue_date}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        Issued By
                                    </span>
                                    <p className="text-sm font-bold text-slate-900">
                                        {config.issuer_name}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        Role
                                    </span>
                                    <p className="text-sm font-bold text-slate-900">
                                        {record.role || 'Participant'}
                                    </p>
                                </div>
                            </div>

                            {/* Verification Identifiers */}
                            <div className="space-y-3 pt-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-xs font-mono">
                                    <span className="text-slate-500 font-semibold">Certificate ID:</span>
                                    <span className="font-bold text-slate-900 selection:bg-teal-200">{record.certificate_id}</span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-xs font-mono">
                                    <span className="text-slate-500 font-semibold">SHA-256 Hash:</span>
                                    <span className="font-mono text-[11px] text-slate-600 truncate max-w-xs">{record.verification_hash}</span>
                                </div>
                            </div>

                            <div className="text-center pt-4">
                                <p className="text-xs text-slate-400">
                                    This credential was cryptographically stamped and registered by Happeno Hackathon Operating System.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-rose-200 p-10 text-center shadow-lg space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100">
                            <ShieldAlert size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                Credential Not Verified
                            </h2>
                            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                                The certificate ID <code className="bg-slate-100 px-2 py-0.5 rounded text-rose-600 font-mono font-bold">{id}</code> could not be located in our verifiable registry. Please verify the link or QR code scanned.
                            </p>
                        </div>
                        <div>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition"
                            >
                                <ArrowLeft size={16} /> Return to Happeno Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
                Happeno • Cryptographic Credential & Evaluation Platform • support@happeno.in
            </footer>
        </main>
    );
}
