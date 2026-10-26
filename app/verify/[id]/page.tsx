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
        <main className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30 flex flex-col justify-between">
            {/* Top Navbar */}
            <header className="border-b border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#ea580c] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            H
                        </div>
                        <HappenoMark compact className="text-lg text-white" />
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                            Credential Registry
                        </span>
                    </div>
                </div>
            </header>

            {/* Content Body */}
            <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
                {record ? (
                    <div className="bg-[#0d0d12] rounded-3xl border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                        {/* Status Banner */}
                        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 px-8 py-6 text-white flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                                    <ShieldCheck size={26} className="text-orange-200" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.2em] text-orange-200">
                                        Happeno Verified Credential
                                    </span>
                                    <h1 className="text-xl font-black tracking-tight text-white">
                                        Official Certificate of Participation
                                    </h1>
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-300/30 text-orange-100 text-xs font-bold">
                                <CheckCircle2 size={14} className="text-orange-200" /> Authentic
                            </div>
                        </div>

                        {/* Credential Details */}
                        <div className="p-8 sm:p-10 space-y-8">
                            <div className="text-center py-4 border-b border-zinc-800">
                                <span className="text-xs uppercase font-mono tracking-widest text-zinc-400 font-bold block mb-2">
                                    This certifies that
                                </span>
                                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-display">
                                    {record.member_name}
                                </h2>
                                <p className="text-sm text-orange-400 font-bold mt-2">
                                    Team: <span className="text-zinc-200 font-semibold">{record.team_name}</span> ({record.team_id})
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-900/60 rounded-2xl p-6 border border-zinc-800">
                                <div>
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                                        Event
                                    </span>
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        <Award size={16} className="text-orange-500 shrink-0" />
                                        {config.event_title}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                                        Issue Date
                                    </span>
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        <Calendar size={16} className="text-orange-500 shrink-0" />
                                        {config.issue_date}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                                        Issued By
                                    </span>
                                    <p className="text-sm font-bold text-white">
                                        {config.issuer_name}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                                        Role
                                    </span>
                                    <p className="text-sm font-bold text-white">
                                        {record.role || 'Participant'}
                                    </p>
                                </div>
                            </div>

                            {/* Verification Identifiers */}
                            <div className="space-y-3 pt-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
                                    <span className="text-zinc-400 font-semibold">Certificate ID:</span>
                                    <span className="font-bold text-orange-400 selection:bg-orange-500/30">{record.certificate_id}</span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
                                    <span className="text-zinc-400 font-semibold">SHA-256 Hash:</span>
                                    <span className="font-mono text-[11px] text-zinc-300 truncate max-w-xs">{record.verification_hash}</span>
                                </div>
                            </div>

                            <div className="text-center pt-4">
                                <p className="text-xs text-zinc-400">
                                    This credential was cryptographically stamped and registered by Happeno Hackathon Operating System.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#0d0d12] rounded-3xl border border-red-500/30 p-10 text-center shadow-lg space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-red-950/40 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                            <ShieldAlert size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                Credential Not Verified
                            </h2>
                            <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                                The certificate ID <code className="bg-zinc-900 px-2 py-0.5 rounded text-red-400 font-mono font-bold border border-zinc-800">{id}</code> could not be located in our verifiable registry. Please verify the link or QR code scanned.
                            </p>
                        </div>
                        <div>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
                            >
                                <ArrowLeft size={16} /> Return to Happeno Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-400">
                Happeno • Cryptographic Credential & Evaluation Platform • support@happeno.in
            </footer>
        </main>
    );
}
