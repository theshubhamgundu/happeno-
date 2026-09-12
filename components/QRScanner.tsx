"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Camera, AlertCircle, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
    onScan: (data: string) => boolean; // Returns true if valid, false if wrong
    onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
    const [error, setError] = useState<string | null>(null);
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('scanning');
    const [manualId, setManualId] = useState("");
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scanCooldown = useRef(false);

    useEffect(() => {
        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode("scanner-viewport");
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (scanCooldown.current) return;
                        handleVerification(decodedText);
                    },
                    (errorMessage) => {
                        // Silently handle scan failures (common when no QR is in frame)
                    }
                );
            } catch (err: any) {
                const errorStr = (err?.message || err || "").toString();
                const isPermissionError = err?.name === "NotAllowedError" || errorStr.includes("Permission denied");
                const isNotFoundError = err?.name === "NotFoundError" || errorStr.includes("NotFoundError");

                if (isPermissionError) {
                    setError("PERMISSION_DENIED");
                } else if (isNotFoundError) {
                    setError("NO_CAMERA_FOUND");
                } else {
                    console.error("Scanner Hardware Error:", err);
                    setError("HARDWARE_ERROR");
                }
                setScanState('idle');
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const handleVerification = async (data: string) => {
        scanCooldown.current = true;
        setScanState('scanning');

        // Simulating a small network/processing delay for "Verification" feel
        await new Promise(r => setTimeout(r, 600));

        const isValid = onScan(data);

        if (isValid) {
            setScanState('success');
            // Scanner will be closed by parent's state change if valid
            // but we keep success state UI for a brief moment
        } else {
            setScanState('error');
            // Reset to scanning after 2 seconds so they can try again
            setTimeout(() => {
                setScanState('scanning');
                scanCooldown.current = false;
            }, 2000);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualId.trim()) {
            handleVerification(manualId.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 sm:p-4 bg-[#06000D]/95 backdrop-blur-2xl">
            <div className="bg-[#06000D] sm:bg-[#0B0114] border-0 sm:border-2 border-white/10 rounded-none sm:rounded-[3rem] w-full h-full sm:h-auto sm:max-w-lg overflow-hidden relative shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col">

                {/* Status Indicator Bar */}
                <div className={`h-2 transition-all duration-500 ${scanState === 'success' ? 'bg-green-500 shadow-[0_0_20px_#22c55e]' :
                    scanState === 'error' ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' :
                        'bg-purple-600 shadow-[0_0_20px_#9333ea]'
                    }`} />

                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all duration-500 ${scanState === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-400' :
                            scanState === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-500' :
                                'bg-purple-600/10 border-purple-500/20 text-purple-400'
                            }`}>
                            {scanState === 'success' ? <ShieldCheck size={20} className="sm:size-[24px]" /> :
                                scanState === 'error' ? <ShieldAlert size={20} className="sm:size-[24px]" /> :
                                    <Camera size={20} className="sm:size-[24px]" />}
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white">
                                {scanState === 'success' ? 'Verified!' :
                                    scanState === 'error' ? 'Invalid Code' :
                                        'Ops Scan'}
                            </h3>
                            <p className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                {scanState === 'error' ? 'Unknown ticket' : 'Ready for capture'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-white/20 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Scanner Viewport */}
                <div className="aspect-square bg-black relative flex items-center justify-center overflow-hidden">
                    {error ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-10 text-center space-y-6 bg-[#0B0114]">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 mb-2">
                                <ShieldAlert size={40} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black italic uppercase tracking-tight text-white">
                                    {error === "PERMISSION_DENIED" ? "Camera Blocked" :
                                        error === "NO_CAMERA_FOUND" ? "No Camera Detected" :
                                            "Hardware Error"}
                                </h4>
                                <p className="text-sm text-white/40 font-medium leading-relaxed max-w-xs mx-auto">
                                    {error === "PERMISSION_DENIED" ?
                                        "Please allow camera access in your browser settings and refresh the page to use the QR scanner." :
                                        error === "NO_CAMERA_FOUND" ?
                                            "We couldn't find a camera on this device. Please use the manual entry below." :
                                            "Something went wrong with your camera hardware. Manual entry is recommended."}
                                </p>
                            </div>
                            {error === "PERMISSION_DENIED" && (
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60 hover:text-white transition-all transform hover:scale-105"
                                >
                                    Refresh & Retry
                                </button>
                            )}
                        </div>
                    ) : (
                        <div id="scanner-viewport" className="w-full h-full" />
                    )}

                    {/* Overlay Elements */}
                    {!error && (
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Scanning Box */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`w-64 h-64 border-2 rounded-[2.5rem] relative transition-all duration-500 ${scanState === 'success' ? 'border-green-500 scale-110' :
                                    scanState === 'error' ? 'border-red-500 animate-shake' :
                                        'border-purple-500/50'
                                    }`}>
                                    {/* Corner Accents */}
                                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-inherit rounded-tl-2xl" />
                                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-inherit rounded-tr-2xl" />
                                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-inherit rounded-bl-2xl" />
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-inherit rounded-br-2xl" />

                                    {scanState === 'scanning' && (
                                        <div className="absolute top-0 left-0 w-full h-[2px] bg-purple-500 shadow-[0_0_15px_#9333ea] animate-scan" />
                                    )}
                                </div>
                            </div>

                            {/* State Feedback Overlays */}
                            {scanState === 'scanning' && scanCooldown.current && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Loader2 size={48} className="text-purple-500 animate-spin" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer / Manual Entry */}
                <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 bg-gradient-to-b from-[#0B0114] to-black mt-auto">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-grow bg-white/5" />
                        <span className="text-[8px] sm:text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Manual Override</span>
                        <div className="h-[1px] flex-grow bg-white/5" />
                    </div>

                    <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
                            placeholder="VH-101"
                            className="flex-grow bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-purple-500 transition-all uppercase italic tracking-wider shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={scanState !== 'scanning' || scanCooldown.current}
                            className="w-full sm:w-auto bg-[#FFEE00] text-black font-black uppercase italic py-4 sm:px-10 rounded-xl hover:scale-105 transition-all active:scale-95 shadow-[0_10px_30px_rgba(255,238,0,0.1) disabled:opacity-50"
                        >
                            Verify
                        </button>
                    </form>
                </div>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 3;
                }
                #scanner-viewport video {
                    object-fit: cover !important;
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 0 !important;
                }
            `}</style>
        </div>
    );
};
