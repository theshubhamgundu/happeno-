'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const PILLARS = [
  {
    name: 'Stage Pipeline Engine',
    tag: 'Stage-Wise Sprints',
    tagColor: 'bg-[#FBBF24]',
    desc: 'Break your hackathon into structured rounds: Ideation, Prototype checkpoint, and Final Demo Day with automatic stage countdowns.',
  },
  {
    name: 'Sub-Second QR Logistics',
    tag: 'Venue & Access Pass',
    tagColor: 'bg-[#34D399]',
    desc: 'Fraud-proof digital entry passes, multi-meal tokens (Lunch, Dinner, Midnight Snack), and instant team seat locator.',
  },
  {
    name: 'Live Fair-Play Rubric',
    tag: 'Real-Time Judging',
    tagColor: 'bg-[#C084FC]',
    desc: 'Multi-parameter weighted scoring, offline phone resilience, score normalization, and instant live leaderboards.',
  },
];

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

function FadeIn({ children, delay = 0, className = '' }: FadeInProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.8, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function About() {
  return (
    <section id="about" className="relative py-20 sm:py-28 px-6 bg-[#FAF9F5] border-t-2 border-black">
      <div className="relative max-w-6xl mx-auto">
        {/* Section label */}
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FF5722] text-white border-2 border-black font-mono text-xs font-black shadow-[2px_2px_0px_#000]">
              01 MISSION
            </span>
            <span className="font-mono text-xs tracking-widest uppercase text-neutral-600 font-bold">
              THE PLATFORM
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-black leading-tight mb-6 tracking-tight">
            Engineered for Competitions.{' '}
            <span className="text-[#FF5722] [text-shadow:_2px_2px_0_#000]">Built for Builders.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-base sm:text-lg text-neutral-700 max-w-3xl leading-relaxed mb-6 font-medium">
            The <strong className="text-black font-bold">Happeno Hackathon OS</strong> is a
            purpose-built operating system replacing fragmented spreadsheets, manual forms, and chaotic communication with a unified platform.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="text-base sm:text-lg text-neutral-700 max-w-3xl leading-relaxed mb-14 font-medium">
            From track allocation caps and participant onboarding to sub-second venue badge check-in, real-time rubric evaluations, and automated certificate generation—Happeno elevates every minute of your event.
          </p>
        </FadeIn>

        {/* Pillars cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((pillar, i) => (
            <FadeIn key={pillar.name} delay={0.15 + i * 0.1}>
              <div
                className="bg-white border-2 border-black rounded-2xl p-6 sm:p-8 h-full flex flex-col justify-between shadow-[3px_3px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#000000] transition-all"
              >
                <div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase border-2 border-black text-black shadow-[1.5px_1.5px_0px_#000] mb-4 ${pillar.tagColor}`}>
                    {pillar.tag}
                  </div>
                  <h3 className="font-display font-black text-xl text-black mb-3">
                    {pillar.name}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed font-medium">{pillar.desc}</p>
                </div>
                <div className="pt-6 mt-6 border-t-2 border-neutral-100 flex items-center justify-between text-xs font-mono text-neutral-500 font-bold">
                  <span>Happeno Platform</span>
                  <span className="text-[#FF5722]">0{i + 1}</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
