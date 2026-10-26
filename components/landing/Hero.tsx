'use client';

import { motion } from 'framer-motion';

/* ───── hackathonFeature Badges ───── */
function PlatformHighlights() {
  const highlights = [
    { title: 'Stage-Gate Pipeline', sub: 'Sprint Management' },
    { title: 'Sub-Second QR', sub: 'Passes & Meal Claims' },
    { title: 'Normalized Rubrics', sub: 'Fair-Play Judging' },
    { title: 'Team Workspaces', sub: 'GitHub Sync & Roles' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-3xl mx-auto">
      {highlights.map((h) => (
        <div
          key={h.title}
          className="flex flex-col items-center bg-white border border-gray-200 hover:border-orange-500 rounded-lg p-3 text-center transition-all duration-200 shadow-sm"
        >
          <span className="font-display font-bold text-xs sm:text-sm text-[#0f172a]">
            {h.title}
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-orange-600 mt-0.5 font-semibold">
            {h.sub}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[100svh] pt-24 pb-16 sm:pt-32 sm:pb-24 flex items-center justify-center bg-gradient-to-b from-[#F8F9FA] via-white to-white overflow-hidden"
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Date & Location Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-5 sm:mb-6 px-3 sm:px-4 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-orange-950"
        >
          <span className="w-2 h-2 shrink-0 rounded-full bg-orange-500 animate-pulse" />
          <span className="font-mono text-[10px] sm:text-xs tracking-wider uppercase font-semibold text-center leading-snug">
            HAPPENO · HMS
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-display font-extrabold text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl leading-[1.08] tracking-tight text-[#0f172a] mb-4 sm:mb-6"
        >
          Happeno
          <span className="block text-lg sm:text-3xl md:text-4xl font-semibold text-[#ea580c] tracking-normal mt-1 sm:mt-2">
            The Modern Hackathon Operating System
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="font-body text-sm sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2 sm:px-0"
        >
          End-to-end competition management engineered for tech fests, universities, and builder communities. Stage-wise pipelines, sub-second QR entry passes, transparent judge rubrics, and team workspaces.
        </motion.p>

        {/* Platform Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 sm:mb-10"
        >
          <PlatformHighlights />
        </motion.div>

        {/* Buttons: Login Button with user icon + Learn More */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
        >
          <a href="/login" className="btn-primary w-full sm:w-auto">
            {/* User / Login Icon */}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>Open Workspace</span>
          </a>
          <a href="#about" className="btn-ghost w-full sm:w-auto text-center">
            <span>Explore Platform</span>
          </a>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-10 pt-8 sm:mt-16 sm:pt-12 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
        >
          {[
            { value: '5000+', label: 'Active Builders' },
            { value: '24h', label: 'Continuous Sprints' },
            { value: '< 200ms', label: 'QR Scan Speed' },
            { value: '100%', label: 'Real-Time Scoring' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-[#0f172a]">
                {stat.value}
              </div>
              <div className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
