"use client";

import React, { useRef, useState, useEffect } from "react";
import { Download, Printer, Copy, Check, QrCode, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface CertificatePreviewProps {
    certificateId: string;
    recipientName: string;
    teamName: string;
    teamId: string;
    role: string;
    eventTitle: string;
    issuerName: string;
    issueDate: string;
    signatory1Name: string;
    signatory1Title: string;
    signatory2Name: string;
    signatory2Title: string;
    customSubtitle: string;
    verificationHash?: string;
}

export default function CertificatePreview({
    certificateId,
    recipientName,
    teamName,
    teamId,
    role,
    eventTitle,
    issuerName,
    issueDate,
    signatory1Name,
    signatory1Title,
    signatory2Name,
    signatory2Title,
    customSubtitle,
    verificationHash
}: CertificatePreviewProps) {
    const certRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [verificationUrl, setVerificationUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setVerificationUrl(`${window.location.origin}/verify/${certificateId}`);
        }
    }, [certificateId]);

    const handleCopyLink = () => {
        if (!verificationUrl) return;
        navigator.clipboard.writeText(verificationUrl);
        setCopied(true);
        toast.success("Verification link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPNG = async () => {
        if (!certRef.current) return;
        setIsDownloading(true);

        try {
            // Draw onto canvas at 2x resolution for ultra-sharp 300 DPI print quality
            const element = certRef.current;
            const width = 1200;
            const height = 850;

            const canvas = document.createElement("canvas");
            canvas.width = width * 2;
            canvas.height = height * 2;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                toast.error("Could not initialize canvas context.");
                setIsDownloading(false);
                return;
            }

            ctx.scale(2, 2);

            // Background fill
            ctx.fillStyle = "#FAF9F6";
            ctx.fillRect(0, 0, width, height);

            // Outer decorative borders
            ctx.strokeStyle = "#0F172A";
            ctx.lineWidth = 8;
            ctx.strokeRect(20, 20, width - 40, height - 40);

            ctx.strokeStyle = "#EA580C";
            ctx.lineWidth = 2;
            ctx.strokeRect(30, 30, width - 60, height - 60);

            // Corner ornamental accents
            const drawCorner = (x: number, y: number) => {
                ctx.fillStyle = "#EA580C";
                ctx.fillRect(x, y, 12, 12);
            };
            drawCorner(26, 26);
            drawCorner(width - 38, 26);
            drawCorner(26, height - 38);
            drawCorner(width - 38, height - 38);

            // Brand Header
            ctx.fillStyle = "#EA580C";
            ctx.font = "bold 13px 'Space Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText("HAPPENO • HACKATHON OPERATING SYSTEM", width / 2, 80);

            // Main Title
            ctx.fillStyle = "#0F172A";
            ctx.font = "bold 38px 'Georgia', serif";
            ctx.fillText("Certificate of Participation", width / 2, 140);

            // Subtitle
            ctx.fillStyle = "#64748B";
            ctx.font = "14px 'Segoe UI', sans-serif";
            ctx.fillText("THIS IS PROUDLY PRESENTED TO", width / 2, 190);

            // Recipient Name
            ctx.fillStyle = "#0F172A";
            ctx.font = "bold 44px 'Georgia', serif";
            ctx.fillText(recipientName.toUpperCase(), width / 2, 255);

            // Decorative underline below name
            ctx.strokeStyle = "#EA580C";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width / 2 - 160, 275);
            ctx.lineTo(width / 2 + 160, 275);
            ctx.stroke();

            // Statement / Body
            ctx.fillStyle = "#334155";
            ctx.font = "16px 'Segoe UI', sans-serif";
            ctx.fillText(
                `in recognition of exceptional contribution and competitive engineering as ${role}`,
                width / 2,
                320
            );
            ctx.fillText(
                `under Team "${teamName}" (ID: ${teamId}) in ${eventTitle}.`,
                width / 2,
                350
            );

            ctx.fillStyle = "#64748B";
            ctx.font = "italic 13px 'Georgia', serif";
            ctx.fillText(
                customSubtitle || "For dedication, technical craftsmanship, and successful sprint execution.",
                width / 2,
                390
            );

            // Golden Seal representation in center
            ctx.beginPath();
            ctx.arc(width / 2, 490, 48, 0, Math.PI * 2);
            ctx.fillStyle = "#FEF3C7";
            ctx.fill();
            ctx.strokeStyle = "#D97706";
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = "#92400E";
            ctx.font = "bold 11px 'Segoe UI', sans-serif";
            ctx.fillText("VERIFIED", width / 2, 485);
            ctx.font = "bold 13px 'Segoe UI', sans-serif";
            ctx.fillText("HONOR", width / 2, 503);

            // Signatories Left & Right
            // Left: Signatory 1
            ctx.strokeStyle = "#94A3B8";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(140, 640);
            ctx.lineTo(340, 640);
            ctx.stroke();

            ctx.fillStyle = "#0F172A";
            ctx.font = "bold 14px 'Segoe UI', sans-serif";
            ctx.fillText(signatory1Name, 240, 665);
            ctx.fillStyle = "#64748B";
            ctx.font = "11px 'Segoe UI', sans-serif";
            ctx.fillText(signatory1Title, 240, 682);

            // Right: Signatory 2
            ctx.beginPath();
            ctx.moveTo(width - 340, 640);
            ctx.lineTo(width - 140, 640);
            ctx.stroke();

            ctx.fillStyle = "#0F172A";
            ctx.font = "bold 14px 'Segoe UI', sans-serif";
            ctx.fillText(signatory2Name, width - 240, 665);
            ctx.fillStyle = "#64748B";
            ctx.font = "11px 'Segoe UI', sans-serif";
            ctx.fillText(signatory2Title, width - 240, 682);

            // Footer meta & verification identifiers
            ctx.fillStyle = "#64748B";
            ctx.font = "11px 'Space Mono', monospace";
            ctx.textAlign = "left";
            ctx.fillText(`ID: ${certificateId}`, 60, height - 55);
            ctx.fillText(`ISSUED: ${issueDate}`, 60, height - 38);

            ctx.textAlign = "right";
            ctx.fillText(`VERIFY: ${verificationUrl}`, width - 60, height - 55);
            ctx.fillText(issuerName.toUpperCase(), width - 60, height - 38);

            // Export to PNG
            const dataUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `Happeno_Certificate_${recipientName.replace(/\s+/g, "_")}_${certificateId}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            toast.success("Certificate downloaded in high-resolution!");
        } catch (err) {
            console.error("Canvas export failed:", err);
            toast.error("Failed to generate download image.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900">Certificate for {recipientName}</p>
                        <p className="text-[10px] font-mono text-slate-500 font-medium">{certificateId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleCopyLink}
                        type="button"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                        title="Copy public verification link"
                    >
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        {copied ? "Copied" : "Verification Link"}
                    </button>

                    <button
                        onClick={handlePrint}
                        type="button"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                    >
                        <Printer size={14} /> Print / PDF
                    </button>

                    <button
                        onClick={handleDownloadPNG}
                        disabled={isDownloading}
                        type="button"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                        <Download size={14} />
                        {isDownloading ? "Generating..." : "Download High-Res PNG"}
                    </button>
                </div>
            </div>

            {/* Certificate Display Card */}
            <div
                ref={certRef}
                id="printable-certificate"
                className="relative w-full aspect-[1.414/1] max-w-4xl mx-auto bg-[#FAF9F6] text-[#0F172A] rounded-2xl border-4 border-[#0F172A] p-8 sm:p-12 shadow-2xl flex flex-col justify-between overflow-hidden select-none"
            >
                {/* Secondary inner border */}
                <div className="absolute inset-3 border border-orange-600 pointer-events-none" />

                {/* Corner Accents */}
                <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 bg-orange-600" />
                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-600" />
                <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 bg-orange-600" />
                <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 bg-orange-600" />

                {/* Certificate Header */}
                <div className="text-center pt-2 relative z-10">
                    <p className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-orange-700 mb-2">
                        HAPPENO • HACKATHON OPERATING SYSTEM
                    </p>
                    <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Certificate of Participation
                    </h1>
                    <p className="text-[11px] sm:text-xs uppercase font-sans tracking-widest text-slate-400 mt-2 font-semibold">
                        This is proudly presented to
                    </p>
                </div>

                {/* Recipient Block */}
                <div className="text-center my-4 relative z-10">
                    <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight underline decoration-orange-600 decoration-2 underline-offset-8">
                        {recipientName}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-4 max-w-xl mx-auto leading-relaxed">
                        in recognition of exceptional dedication, competitive problem-solving, and active engineering as <strong>{role}</strong> of <strong>Team &ldquo;{teamName}&rdquo; ({teamId})</strong> in <strong>{eventTitle}</strong>.
                    </p>
                    <p className="text-[10px] sm:text-xs font-serif italic text-slate-400 mt-2 max-w-md mx-auto">
                        &ldquo;{customSubtitle || "For technical craftsmanship, innovation, and successful sprint execution."}&rdquo;
                    </p>
                </div>

                {/* Seal in Middle */}
                <div className="flex justify-center my-1 relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 border-2 border-amber-600 flex flex-col items-center justify-center text-amber-900 shadow-sm">
                        <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase">OFFICIAL</span>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">SEAL</span>
                        <span className="text-[7px] text-amber-700 font-mono">2026</span>
                    </div>
                </div>

                {/* Signatories & Footer */}
                <div className="relative z-10 pt-4 border-t border-slate-200/80">
                    <div className="flex items-end justify-between gap-4">
                        {/* Signatory 1 */}
                        <div className="text-center w-40 sm:w-48">
                            <div className="h-9 flex items-center justify-center">
                                <span className="font-serif italic text-lg sm:text-xl text-orange-700 opacity-80">
                                    {signatory1Name.split(" ")[0]}
                                </span>
                            </div>
                            <div className="border-t border-slate-300 pt-1">
                                <p className="text-[11px] sm:text-xs font-bold text-slate-900">{signatory1Name}</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-400">{signatory1Title}</p>
                            </div>
                        </div>

                        {/* Middle QR Code / Identifier */}
                        <div className="text-center hidden sm:block">
                            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                                ID: {certificateId}
                            </p>
                            <p className="font-mono text-[8px] text-slate-400 mt-0.5">
                                Issued: {issueDate} • {issuerName}
                            </p>
                        </div>

                        {/* Signatory 2 */}
                        <div className="text-center w-40 sm:w-48">
                            <div className="h-9 flex items-center justify-center">
                                <span className="font-serif italic text-lg sm:text-xl text-teal-800 opacity-80">
                                    {signatory2Name.split(" ")[0]}
                                </span>
                            </div>
                            <div className="border-t border-slate-300 pt-1">
                                <p className="text-[11px] sm:text-xs font-bold text-slate-900">{signatory2Name}</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-400">{signatory2Title}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Stylesheet Hook */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-certificate, #printable-certificate * {
                        visibility: visible;
                    }
                    #printable-certificate {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100vw !important;
                        height: 100vh !important;
                        max-width: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 24mm !important;
                        page-break-inside: avoid;
                    }
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                }
            `}</style>
        </div>
    );
}
