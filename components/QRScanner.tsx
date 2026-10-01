"use client";

import React, { useCallback, useEffect, useRef, useState, useId } from "react";
import { X, Camera, ShieldCheck, ShieldAlert, Loader2, Zap, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export interface QRScannerProps {
    onScan: (data: string) => boolean | Promise<boolean>;
    onClose?: () => void;
    showCloseButton?: boolean;
    continuous?: boolean;
    autoResetMs?: number;
    soundEnabled?: boolean;
    onToggleSound?: () => void;
    embedded?: boolean;
    title?: string;
    subtitle?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
    onScan,
    onClose,
    showCloseButton = true,
    continuous = false,
    autoResetMs = 1400,
    soundEnabled = true,
    onToggleSound,
    embedded = false,
    title,
    subtitle
}) => {
    const rawId = useId();
    const viewportId = `scanner-viewport-${rawId.replace(/:/g, '')}`;
    const [error, setError] = useState<string | null>(null);
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('scanning');
    const [isProcessing, setIsProcessing] = useState(false);
    const [manualId, setManualId] = useState("");
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [torchOn, setTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scanCooldown = useRef(false);
    const mountedRef = useRef(true);

    // Audio cue synthesis using Web Audio API (zero external assets)
    const playAudio = useCallback((type: 'success' | 'warning' | 'error') => {
        if (!soundEnabled) return;
        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
                osc.start(now);
                osc.stop(now + 0.32);
            } else if (type === 'warning') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(370, now + 0.1);
                gain.gain.setValueAtTime(0.16, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.start(now);
                osc.stop(now + 0.28);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.setValueAtTime(130, now + 0.12);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            }
        } catch {
            // Audio context silently fails if user hasn't interacted with page yet
        }
    }, [soundEnabled]);

    const handleVerification = useCallback(async (data: string) => {
        if (scanCooldown.current) return;
        scanCooldown.current = true;
        setIsProcessing(true);
        setScanState('scanning');

        let isValid = false;
        try {
            isValid = await onScan(data);
        } catch (scanError) {
            console.error('QR scan processing failed:', scanError);
            isValid = false;
        }

        if (!mountedRef.current) return;

        if (isValid) {
            playAudio('success');
            setScanState('success');
            if (continuous) {
                setTimeout(() => {
                    if (!mountedRef.current) return;
                    setScanState('scanning');
                    setIsProcessing(false);
                    scanCooldown.current = false;
                }, autoResetMs);
            } else {
                setIsProcessing(false);
            }
        } else {
            playAudio('error');
            setScanState('error');
            setTimeout(() => {
                if (!mountedRef.current) return;
                setScanState('scanning');
                setIsProcessing(false);
                scanCooldown.current = false;
            }, continuous ? 1100 : 2000);
        }
    }, [onScan, continuous, autoResetMs, playAudio]);

    // Initialize or switch camera
    useEffect(() => {
        mountedRef.current = true;
        let activeInstance: Html5Qrcode | null = null;

        const startScanner = async () => {
            try {
                // Ensure previous instance is stopped before creating new one
                if (scannerRef.current && scannerRef.current.isScanning) {
                    try {
                        await scannerRef.current.stop();
                    } catch { }
                }

                const html5QrCode = new Html5Qrcode(viewportId);
                scannerRef.current = html5QrCode;
                activeInstance = html5QrCode;

                const config = {
                    fps: 15,
                    qrbox: { width: 260, height: 260 },
                    aspectRatio: 1.0
                };

                await html5QrCode.start(
                    { facingMode },
                    config,
                    (decodedText) => {
                        if (scanCooldown.current) return;
                        void handleVerification(decodedText);
                    },
                    () => {
                        // Silent frame scan miss
                    }
                );

                // Detect torch capability on mobile devices
                try {
                    const capabilities = html5QrCode.getRunningTrackCapabilities();
                    if (capabilities && 'torch' in capabilities) {
                        setHasTorch(true);
                    }
                } catch { }

                setError(null);
                setScanState('scanning');
            } catch (err: unknown) {
                const errorInfo = err && typeof err === 'object'
                    ? err as { message?: unknown; name?: unknown }
                    : {};
                const errorStr = String(errorInfo.message || err || '');
                const isPermissionError = errorInfo.name === "NotAllowedError" || errorStr.includes("Permission denied");
                const isNotFoundError = errorInfo.name === "NotFoundError" || errorStr.includes("NotFoundError");

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

        const timer = setTimeout(startScanner, 100);

        return () => {
            mountedRef.current = false;
            clearTimeout(timer);
            if (activeInstance && activeInstance.isScanning) {
                activeInstance.stop().catch(() => { });
            }
        };
    }, [viewportId, facingMode, handleVerification]);

    const toggleTorch = async () => {
        try {
            if (!scannerRef.current || !hasTorch) return;
            const next = !torchOn;
            await scannerRef.current.applyVideoConstraints({
                // @ts-expect-error torch is valid on mobile MediaTrackConstraints
                advanced: [{ torch: next }]
            });
            setTorchOn(next);
        } catch (e) {
            console.warn('Torch toggle failed:', e);
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === "environment" ? "user" : "environment");
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualId.trim()) {
            handleVerification(manualId.trim());
            setManualId("");
        }
    };

    const scannerContent = (
        <div className="w-full h-full flex flex-col overflow-hidden relative">
            {/* Status Indicator Bar */}
            <div className={`h-2 transition-all duration-500 shrink-0 ${scanState === 'success' ? 'bg-green-500 shadow-[0_0_20px_#22c55e]' :
                scanState === 'error' ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' :
                    'bg-[#14b8a6] shadow-[0_0_20px_#14b8a6]'
                }`} />

            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all duration-500 ${scanState === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-400' :
                        scanState === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-400' :
                            'bg-[#14b8a6]/10 border-[#14b8a6]/20 text-[#14b8a6]'
                        }`}>
                        {scanState === 'success' ? <ShieldCheck size={20} /> :
                            scanState === 'error' ? <ShieldAlert size={20} /> :
                                <Camera size={20} />}
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-black italic uppercase tracking-tighter text-white">
                            {title || (scanState === 'success' ? 'Verified!' :
                                scanState === 'error' ? 'Scan Failed' :
                                    continuous ? 'Rapid Scanner' : 'Gate Scanner')}
                        </h3>
                        <p className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                            {subtitle || (scanState === 'error' ? 'Unknown or duplicate' :
                                continuous ? 'Continuous feed active' : 'Point camera at badge')}
                        </p>
                    </div>
                </div>

                {/* Header Controls */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {onToggleSound && (
                        <button
                            type="button"
                            onClick={onToggleSound}
                            title={soundEnabled ? "Mute audio beeps" : "Unmute audio beeps"}
                            className="p-2 sm:p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                        >
                            {soundEnabled ? <Volume2 size={16} className="text-[#14b8a6]" /> : <VolumeX size={16} className="text-white/30" />}
                        </button>
                    )}
                    {hasTorch && (
                        <button
                            type="button"
                            onClick={toggleTorch}
                            title="Toggle Flashlight"
                            className={`p-2 sm:p-2.5 rounded-xl border transition-colors ${torchOn ? 'bg-amber-400/20 border-amber-400 text-amber-300' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
                        >
                            <Zap size={16} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={toggleCamera}
                        title="Flip Camera"
                        className="p-2 sm:p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                    >
                        <RefreshCw size={16} />
                    </button>
                    {showCloseButton && onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 sm:p-2.5 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
                            aria-label="Close scanner"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Scanner Viewport */}
            <div className="relative aspect-square sm:aspect-auto sm:h-[340px] bg-black flex items-center justify-center overflow-hidden">
                {error ? (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-[#0B0114]">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                            <ShieldAlert size={32} />
                        </div>
                        <div className="space-y-1 max-w-xs">
                            <h4 className="text-base font-black italic uppercase tracking-tight text-white">
                                {error === "PERMISSION_DENIED" ? "Camera Access Denied" :
                                    error === "NO_CAMERA_FOUND" ? "No Camera Found" :
                                        "Hardware Camera Error"}
                            </h4>
                            <p className="text-xs text-white/40 font-medium leading-relaxed">
                                {error === "PERMISSION_DENIED" ?
                                    "Please allow camera access in browser permissions or use the manual search below." :
                                    "Use the manual check-in search below to find and check in participants."}
                            </p>
                        </div>
                        {error === "PERMISSION_DENIED" && (
                            <button
                                onClick={() => window.location.reload()}
                                className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60 hover:text-white transition-all"
                            >
                                Reload
                            </button>
                        )}
                    </div>
                ) : (
                    <div id={viewportId} className="w-full h-full" />
                )}

                {/* Overlay Elements */}
                {!error && (
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Scanning Box Target */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-56 h-56 sm:w-64 sm:h-64 border-2 rounded-[2rem] relative transition-all duration-300 ${scanState === 'success' ? 'border-green-500 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.3)]' :
                                scanState === 'error' ? 'border-red-500 animate-shake shadow-[0_0_30px_rgba(239,68,68,0.3)]' :
                                    'border-[#14b8a6]/40'
                                }`}>
                                {/* Corner Accents */}
                                <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-inherit rounded-tl-xl" />
                                <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-inherit rounded-tr-xl" />
                                <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-inherit rounded-bl-xl" />
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-inherit rounded-br-xl" />

                                {scanState === 'scanning' && !isProcessing && (
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-[#14b8a6] shadow-[0_0_15px_#14b8a6] animate-scan" />
                                )}
                            </div>
                        </div>

                        {/* State Feedback Indicator */}
                        {scanState === 'scanning' && isProcessing && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                                <Loader2 size={36} className="text-[#14b8a6] animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#14b8a6]">Verifying Pass...</span>
                            </div>
                        )}

                        {scanState === 'success' && (
                            <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-green-500/90 text-white font-black italic uppercase text-xs text-center shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95">
                                Verified Successfully ✓
                            </div>
                        )}

                        {scanState === 'error' && (
                            <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-red-500/90 text-white font-black italic uppercase text-xs text-center shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95">
                                Scan Rejected or Duplicate ✕
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer / Quick Manual Entry */}
            <div className="p-4 sm:p-5 bg-gradient-to-b from-[#0B0114] to-black mt-auto border-t border-white/5 shrink-0">
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder="Manual Pass or Team ID (e.g. TRI26002)"
                        className="flex-grow bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-bold outline-none focus:border-[#14b8a6] transition-all uppercase italic tracking-wider placeholder:text-white/20"
                    />
                    <button
                        type="submit"
                        disabled={isProcessing || !manualId.trim()}
                        className="bg-[#14b8a6] text-black font-black uppercase italic px-4 py-2.5 rounded-xl hover:bg-[#0d9488] active:scale-95 transition-all text-xs tracking-wider disabled:opacity-40 shrink-0"
                    >
                        Verify
                    </button>
                </form>
            </div>
        </div>
    );

    if (embedded) {
        return (
            <div className="relative w-full rounded-[2rem] border border-white/10 bg-[#0B0114] overflow-hidden shadow-2xl flex flex-col">
                {scannerContent}
                <style jsx global>{`
                    @keyframes scan {
                        0% { top: 0; }
                        100% { top: 100%; }
                    }
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-8px); }
                        75% { transform: translateX(8px); }
                    }
                    .animate-scan {
                        animation: scan 2s linear infinite;
                    }
                    .animate-shake {
                        animation: shake 0.25s ease-in-out 0s 2;
                    }
                    #${viewportId} video {
                        object-fit: cover !important;
                        width: 100% !important;
                        height: 100% !important;
                        border-radius: 0 !important;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 sm:p-4 bg-[#06000D]/95 backdrop-blur-2xl">
            <div className="bg-[#06000D] sm:bg-[#0B0114] border-0 sm:border-2 border-white/10 rounded-none sm:rounded-[3rem] w-full h-full sm:h-auto sm:max-w-lg overflow-hidden relative shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col">
                {scannerContent}
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
                .animate-shake {
                    animation: shake 0.25s ease-in-out 0s 2;
                }
                #${viewportId} video {
                    object-fit: cover !important;
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 0 !important;
                }
            `}</style>
        </div>
    );
};
