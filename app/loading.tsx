"use client";

import React from "react";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#F8F9FA] via-white to-white flex flex-col items-center justify-center">
            {/* Subtle grid pattern — same as hero */}
            <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative z-10 flex flex-col items-center">
                {/* Spinner */}
                <div className="relative mb-8">
                    {/* Outer ring */}
                    <div className="w-16 h-16 rounded-full border-2 border-gray-200" />
                    {/* Spinning arc */}
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-[#0f766e] animate-spin" />
                    {/* Center logo mark */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-md bg-[#0f172a] flex items-center justify-center text-white font-display font-extrabold text-[10px] shadow-sm">
                            TC
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h2 className="font-display font-bold text-lg sm:text-xl tracking-tight text-[#0f172a] mb-2 text-center">
                    Tri-City Hackathon
                </h2>

                {/* Subtitle */}
                <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-gray-500 mb-6">
                    Warangal · Hanamkonda · Kazipet
                </p>

                {/* Loading dots */}
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#0f766e] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-[#0f766e] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-[#0f766e] rounded-full animate-bounce" />
                </div>
            </div>
        </div>
    );
}

