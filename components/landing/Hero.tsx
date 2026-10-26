'use client';

import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[100svh] pt-28 pb-16 sm:pt-36 sm:pb-20 flex flex-col items-center justify-center bg-[#FAF9F5] overflow-hidden"
    >
      {/* Polka dot grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#b8b5ab 1.25px, transparent 1.25px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Soft Pastel Background Blobs */}
      <div className="absolute top-12 -left-20 w-80 h-80 rounded-full bg-[#EDE9FE] blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[340px] rounded-[100px] bg-[#FEF3C7] blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full bg-[#DCFCE7] blur-3xl opacity-70 pointer-events-none" />

      {/* ───── Left Floating Neo-Brutalist Widgets (Desktop) ───── */}
      <div className="hidden xl:flex flex-col items-start gap-3 absolute left-8 top-32 z-20 pointer-events-none select-none">
        {/* Retro Bot Card */}
        <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-[3px_3px_0px_#000000] w-36">
          <div className="bg-neutral-900 rounded-lg p-2 font-mono text-[9px] text-emerald-400 leading-tight">
            <span className="text-neutral-500">•••</span>
            <div className="text-emerald-400 font-bold">&gt;_ prompt</div>
            <div className="w-2 h-3 bg-emerald-400 animate-pulse mt-0.5 inline-block" />
          </div>
          <div className="mt-2 text-center text-xs">
            <span className="text-xl">🤖</span>
            <div className="text-[10px] font-bold font-mono text-neutral-800">happeno-ai</div>
          </div>
        </div>

        {/* System Prompt Pill */}
        <div className="bg-[#FF5722] text-white border-2 border-black rounded-xl px-3 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_#000000] mt-1">
          [SYSTEM PROMPT]
        </div>

        {/* Temperature Pill */}
        <div className="bg-[#FBBF24] text-black border-2 border-black rounded-full px-3.5 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_#000000]">
          temperature: 0.9
        </div>

        {/* Few-shot Pill */}
        <div className="bg-[#34D399] text-black border-2 border-black rounded-full px-3 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_#000000]">
          few-shot: 3
        </div>

        {/* Top_p Pill */}
        <div className="bg-white text-black border-2 border-black rounded-full px-3.5 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_#000000]">
          top_p: 0.95
        </div>

        {/* Doodle star */}
        <div className="text-orange-500 text-2xl font-black mt-2 ml-4">
          ★
        </div>
      </div>

      {/* ───── Right Floating Neo-Brutalist Widgets (Desktop) ───── */}
      <div className="hidden xl:flex flex-col items-end gap-3 absolute right-8 top-32 z-20 pointer-events-none select-none">
        {/* Doodle Wand / Pencil */}
        <div className="text-2xl mr-4">
          ✏️
        </div>

        {/* Chaos Pill */}
        <div className="bg-[#C084FC] text-black border-2 border-black rounded-full px-3.5 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_#000000]">
          --chaos 50
        </div>

        {/* Chain-of-thought Pill */}
        <div className="bg-[#34D399] text-black border-2 border-black rounded-full px-3.5 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_#000000]">
          chain-of-thought
        </div>

        {/* Context Pill */}
        <div className="bg-[#FF5722] text-white border-2 border-black rounded-full px-3.5 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_#000000]">
          context: 128k
        </div>

        {/* Mini Terminal Box */}
        <div className="bg-[#12131A] text-white border-2 border-black rounded-xl p-3 shadow-[3px_3px_0px_#000000] w-40 text-[10px] font-mono mt-1">
          <div className="text-neutral-500 text-[9px] uppercase tracking-wider mb-1.5 font-bold">
            PROMPT PARAMS
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-neutral-400">model</span>
            <span className="bg-purple-900/60 text-purple-300 px-1.5 rounded text-[9px]">claude-3-5</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-neutral-400">strategy</span>
            <span className="bg-emerald-900/60 text-emerald-300 px-1.5 rounded text-[9px]">zero-shot</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-neutral-400">format</span>
            <span className="bg-amber-900/60 text-amber-300 px-1.5 rounded text-[9px]">markdown</span>
          </div>
        </div>

        {/* Yellow Star Doodle */}
        <div className="text-yellow-400 text-3xl font-black mr-6 mt-1 drop-shadow-[2px_2px_0px_#000]">
          ★
        </div>
      </div>

      {/* ───── Center Content ───── */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center">
        {/* Eyebrow Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6 px-5 py-1.5 rounded-full bg-[#FBBF24] border-2 border-black shadow-[2px_2px_0px_#000000]"
        >
          <span className="text-xs">⚡</span>
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-black">
            AI & DATA EXCELLENCE CLUB PRESENTS
          </span>
        </motion.div>

        {/* Giant Pop-Art Neo-Brutalist 3D Headline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col items-center leading-[0.9] select-none"
        >
          <h1 className="font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-[#FF5722] [text-shadow:_4px_4px_0_#000] uppercase [-webkit-text-stroke:_2px_#000]">
            PROMPT TO
          </h1>
          <h1 className="font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-[#8B5CF6] [text-shadow:_4px_4px_0_#000] uppercase [-webkit-text-stroke:_2px_#000] -mt-2 sm:-mt-4">
            REALITY
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-neutral-800 text-base sm:text-lg md:text-xl font-medium max-w-xl mx-auto mt-6 mb-8 leading-relaxed"
        >
          Master AI communication. Turn prompts into code, art, and logic at a <strong className="font-bold text-black">prompt engineering event</strong>.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#FF5722] text-white font-black text-sm uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] transition-all"
          >
            <span>REGISTER SQUAD →</span>
          </a>
          <a
            href="#about"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black font-black text-sm uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] transition-all"
          >
            <span>VIEW RULES</span>
          </a>
        </motion.div>

        {/* Steps Breadcrumb */}
        <div className="font-mono text-xs text-neutral-500 font-semibold mt-6 tracking-wider">
          01 Design &nbsp;——&nbsp; 02 Engineer &nbsp;——&nbsp; 03 Deploy
        </div>

        {/* Mini Prompt Window Illustration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8 w-full max-w-xl bg-[#0F1117] border-2 border-black rounded-2xl p-4 text-left shadow-[4px_4px_0px_#000000] overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-neutral-300 font-bold">promptify-engine v2.6</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <span>temp: 0.8</span>
              <span>top_p: 0.95</span>
              <span>max_tokens: 2048</span>
            </div>
          </div>
          <div className="mt-3 font-mono text-[11px] space-y-1.5 leading-relaxed">
            <div className="text-neutral-400">
              <span className="text-amber-400 font-bold">SYSTEM</span> You are a world-class prompt engineer competing at Promptify 2026.
            </div>
            <div className="text-neutral-300">
              <span className="text-orange-400 font-bold">USER</span> Design a zero-shot prompt that turns a vague idea into production code.
            </div>
          </div>
        </motion.div>

        {/* ───── 3 Bottom Event Cards ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-6 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {/* Card 1: DATE */}
          <div className="bg-[#34D399] border-2 border-black rounded-2xl p-3 flex items-center gap-3 shadow-[3px_3px_0px_#000000]">
            <div className="w-9 h-9 rounded-xl bg-white/70 border border-black/30 flex items-center justify-center text-lg">
              📅
            </div>
            <div className="text-left">
              <div className="text-[10px] font-mono font-bold uppercase text-emerald-950 tracking-wider">
                DATE
              </div>
              <div className="text-sm font-black text-black">
                TBA
              </div>
            </div>
          </div>

          {/* Card 2: VENUE */}
          <div className="bg-[#C084FC] border-2 border-black rounded-2xl p-3 flex items-center gap-3 shadow-[3px_3px_0px_#000000]">
            <div className="w-9 h-9 rounded-xl bg-white/70 border border-black/30 flex items-center justify-center text-lg">
              📍
            </div>
            <div className="text-left">
              <div className="text-[10px] font-mono font-bold uppercase text-purple-950 tracking-wider">
                VENUE
              </div>
              <div className="text-xs sm:text-sm font-black text-black">
                VITS, HYDERABAD
              </div>
            </div>
          </div>

          {/* Card 3: PRIZES */}
          <div className="bg-[#FBBF24] border-2 border-black rounded-2xl p-3 flex items-center gap-3 shadow-[3px_3px_0px_#000000]">
            <div className="w-9 h-9 rounded-xl bg-white/70 border border-black/30 flex items-center justify-center text-lg">
              🏆
            </div>
            <div className="text-left">
              <div className="text-[10px] font-mono font-bold uppercase text-amber-950 tracking-wider">
                PRIZES
              </div>
              <div className="text-sm font-black text-black">
                TBA
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
