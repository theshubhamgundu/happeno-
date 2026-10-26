'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      className="relative py-20 sm:py-28 px-6 bg-[#FAF9F5] border-t-2 border-black"
      ref={ref}
    >
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-[#FBBF24] border-2 border-black shadow-[2px_2px_0px_#000]">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="font-mono text-xs tracking-wider uppercase font-bold text-black">
              Happeno · The Modern Hackathon OS
            </span>
          </div>

          <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-black leading-tight mb-4 tracking-tight">
            Build with the <span className="text-[#FF5722] [text-shadow:_3px_3px_0_#000]">Happeno Community</span>
          </h2>

          <p className="text-base sm:text-lg text-neutral-700 max-w-xl mx-auto leading-relaxed mb-4 font-medium">
            Join thousands of developers, organizers, and mentors executing world-class hackathons with zero chaos.
          </p>

          <p className="font-mono text-xs text-neutral-500 mb-8 font-bold">
            Stage Pipelines · Live Rubrics · Sub-Second QR Passes
          </p>

          {/* Login Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-[#FF5722] text-white font-black text-sm uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>ACCESS WORKSPACE →</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
