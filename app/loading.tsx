"use client";

import React from "react";
import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#0B0114] flex flex-col items-center justify-center">
            <div className="relative">
                {/* Animated Glow Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#FFEE00]/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#62009B]/30 rounded-full blur-[100px] animate-pulse delay-700" />

                {/* Logo Container */}
                <div className="relative animate-bounce duration-[2000ms]">
                    <span className="font-kanit font-black italic text-5xl text-[#FFEE00] drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">T</span>
                </div>
            </div>

            {/* Progress Text */}
            <div className="mt-8 flex flex-col items-center gap-2">
                <h2 className="text-white font-kanit font-black text-xl uppercase italic tracking-widest animate-pulse">
                    Initializing <span className="text-[#FFEE00]">TRI-CITY AI HACKATHON</span>
                </h2>
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#FFEE00] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-[#FFEE00] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-[#FFEE00] rounded-full animate-bounce" />
                </div>
            </div>

            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <Image
                    src="/main_page_bg.svg"
                    alt=""
                    fill
                    className="object-cover"
                />
            </div>
        </div>
    );
}
