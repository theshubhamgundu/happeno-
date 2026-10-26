"use client";

import React from "react";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative z-10 flex flex-col items-center">
                {/* Spinner */}
                <div className="relative mb-8">
                    {/* Outer ring */}
                    <div className="w-16 h-16 rounded-full border-2 border-zinc-800" />
                    {/* Spinning arc */}
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-[#ea580c] animate-spin" />
                    {/* Center logo mark */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-md bg-[#ea580c] flex items-center justify-center text-white font-display font-extrabold text-[12px] shadow-sm">
                            H
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h2 className="font-display font-bold text-lg sm:text-xl tracking-tight text-white mb-2 text-center">
                    Happeno
                </h2>

                {/* Subtitle */}
                <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-orange-500 mb-6 font-semibold">
                    Hackathon Operating System
                </p>

                {/* Loading dots */}
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#ea580c] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-[#ea580c] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-[#ea580c] rounded-full animate-bounce" />
                </div>
            </div>
        </div>
    );
}

