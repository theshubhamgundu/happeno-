'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const PILLARS = [
  {
    name: 'Stage Pipeline Engine',
    tag: 'Stage-Wise Sprints',
    desc: 'Break your hackathon into structured rounds: Ideation, Prototype checkpoint, and Final Demo Day with automatic stage countdowns.',
  },
  {
    name: 'Sub-Second QR Logistics',
    tag: 'Venue & Access Pass',
    desc: 'Fraud-proof digital entry passes, multi-meal tokens (Lunch, Dinner, Midnight Snack), and instant team seat locator.',
  },
  {
    name: 'Live Fair-Play Rubric',
    tag: 'Real-Time Judging',
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
      transition={{ duration: 0.6, delay, ease: [0.25, 0.8, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function About() {
  return (
    <section id="about" className="relative py-24 sm:py-32 px-6 bg-[#F8F9FA]">
      <div className="relative max-w-6xl mx-auto">
        {/* Section label */}
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-[#0f766e] font-semibold">
              01
            </span>
            <span className="h-[1px] w-10 bg-teal-600/40" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-gray-500">
              The Mission
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0f172a] leading-tight mb-6">
            Engineered for Competitions.{' '}
            <span className="text-[#0f766e]">Built for Builders.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="font-body text-base sm:text-lg text-gray-600 max-w-3xl leading-relaxed mb-6">
            The <strong className="text-gray-900 font-semibold">Happeno Hackathon OS</strong> is a
            purpose-built operating system replacing fragmented spreadsheets, manual forms, and WhatsApp groups with a unified platform for hackathons.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="font-body text-base sm:text-lg text-gray-600 max-w-3xl leading-relaxed mb-16">
            From track allocation caps and participant onboarding to sub-second venue badge check-in, real-time rubric evaluations, and automated certificate generation—Happeno elevates every minute of your hackathon.
          </p>
        </FadeIn>

        {/* Pillars cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((pillar, i) => (
            <FadeIn key={pillar.name} delay={0.2 + i * 0.1}>
              <div 
                className="bg-white rounded-xl p-8 h-full flex flex-col justify-between border border-gray-200 hover:border-teal-600 transition-all duration-300 shadow-sm relative group"
              >
                <div>
                  <div className="inline-block px-3 py-1 rounded text-[11px] font-mono font-medium tracking-wide uppercase bg-teal-50 text-teal-800 border border-teal-200 mb-4">
                    {pillar.tag}
                  </div>
                  <h3 className="font-display font-bold text-xl text-[#0f172a] mb-3">
                    {pillar.name}
                  </h3>
                  <p className="font-body text-sm text-gray-600 leading-relaxed">{pillar.desc}</p>
                </div>
                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-500">
                  <span>Happeno Platform</span>
                  <span className="text-teal-600 font-semibold">Core Feature</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
