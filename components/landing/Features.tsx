'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface Feature {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  badge: string;
}

const FEATURES: Feature[] = [
  {
    id: 'stage-pipeline',
    number: '01',
    title: 'Stage-Gate Sprint Pipeline',
    category: 'Competition Workflow',
    badge: 'Multi-Round',
    description:
      'Orchestrate multi-phase hackathons effortlessly. Configure Round 1 ideation checkpoints, mid-way mentor evaluations, and Final Pitch shortlists with automated lock-in timers.',
  },
  {
    id: 'qr-logistics',
    number: '02',
    title: 'Sub-Second QR Logistics',
    category: 'Access & Ticketing',
    badge: '< 200ms Scan',
    description:
      'Tamper-proof digital QR participant passes. Streamline venue check-in, eliminate registration queues, and track table and room assignments instantly.',
  },
  {
    id: 'meal-tracking',
    number: '03',
    title: 'Smart Meal & Token Control',
    category: 'On-Ground Logistics',
    badge: 'Zero Fraud',
    description:
      'Prevent duplicate food claims across breakfast, lunch, midnight snacks, and high tea. Live station counters give organizers real-time consumption telemetry.',
  },
  {
    id: 'judging-rubric',
    number: '04',
    title: 'Fair-Play Rubric & Scoring',
    category: 'Evaluation Engine',
    badge: 'Normalized',
    description:
      'Custom multi-parameter weighted rubrics with blind evaluation modes. Automatically normalize scoring across different jury panels to guarantee genuine merit.',
  },
  {
    id: 'team-workspace',
    number: '05',
    title: 'Team Formation & Repo Sync',
    category: 'Builder Experience',
    badge: 'Automated',
    description:
      'Effortless team building with private invite links, role distribution, and GitHub repository tracking to verify genuine commit history during the sprint window.',
  },
  {
    id: 'role-control',
    number: '06',
    title: 'Granular Multi-Role Access',
    category: 'Security & Ops',
    badge: 'Role-Based',
    description:
      'Role-isolated portals for Head Organizers, Volunteer Scanners, Track Mentors, and Grand Jury. Maintain complete operational control without leaking sensitive data.',
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

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32 px-6 bg-black">
      <div className="relative max-w-6xl mx-auto">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-[#ea580c] font-semibold">
              02
            </span>
            <span className="h-[1px] w-10 bg-orange-500/40" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-zinc-500">
              Platform Architecture
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-4">
            Everything Required to Run a Flawless Hackathon
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="font-body text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed mb-14">
            Happeno replaces chaotic spreadsheets, disconnected forms, and manual judging sheets with one cohesive, battle-tested platform.
          </p>
        </FadeIn>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <FadeIn key={feature.id} delay={0.1 + i * 0.07}>
              <div className="pro-card rounded-xl p-7 bg-[#0d0d12] hover:bg-[#13131a] border border-zinc-800 hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between min-h-[260px] group shadow-sm hover:shadow-md">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold tracking-widest text-[#ea580c] uppercase">
                      {feature.number} · {feature.category}
                    </span>
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide uppercase bg-orange-950/40 text-orange-400 border border-orange-500/30">
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-xl text-white mb-2.5 group-hover:text-[#ea580c] transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="font-body text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span>Happeno Engine</span>
                  <span className="text-[#ea580c] font-semibold flex items-center gap-1">
                    Integrated
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
