'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface Feature {
  id: string;
  number: string;
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    id: 'stage-pipeline',
    number: '01',
    title: 'Stage-Gate Sprint Pipeline',
    category: 'Competition Workflow',
    badge: 'Multi-Round',
    badgeColor: 'bg-[#FBBF24]',
    description:
      'Orchestrate multi-phase hackathons effortlessly. Configure Round 1 ideation checkpoints, mid-way mentor evaluations, and Final Pitch shortlists with automated lock-in timers.',
  },
  {
    id: 'qr-logistics',
    number: '02',
    title: 'Sub-Second QR Logistics',
    category: 'Access & Ticketing',
    badge: '< 200ms Scan',
    badgeColor: 'bg-[#34D399]',
    description:
      'Tamper-proof digital QR participant passes. Streamline venue check-in, eliminate registration queues, and track table and room assignments instantly.',
  },
  {
    id: 'meal-tracking',
    number: '03',
    title: 'Smart Meal & Token Control',
    category: 'On-Ground Logistics',
    badge: 'Zero Fraud',
    badgeColor: 'bg-[#C084FC]',
    description:
      'Prevent duplicate food claims across breakfast, lunch, midnight snacks, and high tea. Live station counters give organizers real-time consumption telemetry.',
  },
  {
    id: 'judging-rubric',
    number: '04',
    title: 'Fair-Play Rubric & Scoring',
    category: 'Evaluation Engine',
    badge: 'Normalized',
    badgeColor: 'bg-[#FF5722] text-white',
    description:
      'Custom multi-parameter weighted rubrics with blind evaluation modes. Automatically normalize scoring across different jury panels to guarantee genuine merit.',
  },
  {
    id: 'team-workspace',
    number: '05',
    title: 'Team Formation & Repo Sync',
    category: 'Builder Experience',
    badge: 'Automated',
    badgeColor: 'bg-[#38BDF8]',
    description:
      'Effortless team building with private invite links, role distribution, and GitHub repository tracking to verify genuine commit history during the sprint window.',
  },
  {
    id: 'role-control',
    number: '06',
    title: 'Granular Multi-Role Access',
    category: 'Security & Ops',
    badge: 'Role-Based',
    badgeColor: 'bg-[#F472B6]',
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
      transition={{ duration: 0.5, delay, ease: [0.25, 0.8, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28 px-6 bg-[#FAF9F5] border-t-2 border-black">
      <div className="relative max-w-6xl mx-auto">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FF5722] text-white border-2 border-black font-mono text-xs font-black shadow-[2px_2px_0px_#000]">
              02 CAPABILITIES
            </span>
            <span className="font-mono text-xs tracking-widest uppercase text-neutral-600 font-bold">
              PLATFORM ARCHITECTURE
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-black leading-tight mb-4 tracking-tight">
            Everything Required to Run a Flawless Hackathon
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-base sm:text-lg text-neutral-700 max-w-2xl leading-relaxed mb-12 font-medium">
            Happeno replaces chaotic spreadsheets, disconnected forms, and manual judging sheets with one cohesive, battle-tested platform.
          </p>
        </FadeIn>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <FadeIn key={feature.id} delay={0.1 + i * 0.06}>
              <div className="bg-white border-2 border-black rounded-2xl p-7 flex flex-col justify-between min-h-[260px] shadow-[3px_3px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#000000] transition-all">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-black tracking-wider text-black uppercase">
                      {feature.number} · {feature.category}
                    </span>
                    <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase border border-black shadow-[1px_1px_0px_#000] ${feature.badgeColor}`}>
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-black text-xl text-black mb-2.5">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t-2 border-neutral-100 flex items-center justify-between text-xs font-mono text-neutral-500 font-bold">
                  <span>Happeno Engine</span>
                  <span className="text-black font-black flex items-center gap-1">
                    Integrated ✓
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
