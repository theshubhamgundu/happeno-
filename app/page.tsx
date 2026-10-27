"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LogIn, Globe, Phone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans selection:bg-[#9f1239]/10 selection:text-[#9f1239]">
      {/* ── Top Navbar ── */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/happeno-H-logo.png"
            alt="Happeno Logo"
            width={34}
            height={34}
            className="h-8 w-auto object-contain"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-slate-900">Happeno</span>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9f1239] hover:bg-[#881337] text-white text-xs font-semibold shadow-md shadow-[#9f1239]/20 transition-all active:scale-95"
        >
          <span>Sign In</span>
          <LogIn size={13} />
        </Link>
      </header>

      {/* ── Hero Center ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Centered Rounded App Icon Card */}
          <div className="mx-auto w-24 h-24 rounded-[2rem] bg-gradient-to-b from-[#fdf2f4] to-[#fce7eb] border border-[#fbcfe8]/40 shadow-sm flex items-center justify-center">
            <Image
              src="/happeno-H-logo.png"
              alt="Happeno App Icon"
              width={56}
              height={56}
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            Happeno
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-normal max-w-lg mx-auto">
            Next-generation Hackathon Management System — Stage-wise pipelines, live rubric scoring, sub-second QR entry, and team management.
          </p>

          {/* Primary Action Button */}
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#9f1239] hover:bg-[#881337] text-white text-sm font-semibold shadow-lg shadow-[#9f1239]/25 hover:shadow-xl hover:shadow-[#9f1239]/30 transition-all active:scale-95"
            >
              <span>Launch Platform & Dashboard</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer Credits ── */}
      <footer className="w-full pb-10 px-6">
        <div className="w-full max-w-2xl mx-auto border-t border-slate-100 pt-6 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-xs text-slate-600 flex items-center justify-center gap-1.5 flex-wrap">
            <Globe size={13} className="text-[#9f1239]" />
            <span>This platform is developed by</span>
            <a
              href="https://shubhamgundu.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#9f1239] hover:underline"
            >
              shubhamgundu.in
            </a>
          </p>

          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Phone size={12} className="text-slate-400" />
            <span>For business enquiries contact:</span>
            <a href="tel:8698846796" className="font-bold text-slate-800 hover:text-black">
              8698846796
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
