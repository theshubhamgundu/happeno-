'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface Phase {
  date: string;
  title: string;
  desc: string;
  icon: string;
  status: 'completed' | 'active' | 'upcoming';
}

const PHASES: Phase[] = [
  {
    date: 'Sept 5',
    title: 'Registration Opens',
    desc: 'Sign up as an individual or team across Warangal, Hanamkonda, or Kazipet.',
    icon: '📋',
    status: 'completed',
  },
  {
    date: 'Oct 9',
    title: 'Registration Closes (11:59 PM)',
    desc: 'Final deadline for team registration and problem track selection.',
    icon: '🔒',
    status: 'completed',
  },
  {
    date: 'Oct 10',
    title: 'Opening Ceremony & Keynote',
    desc: 'Official launch event, briefing, and mentoring orientation across tri-city centers.',
    icon: '🎤',
    status: 'active',
  },
  {
    date: 'Oct 10, 12:00 PM',
    title: '24-Hour Hacking Begins',
    desc: 'The timer starts. Continuous development sprint with on-site mentor reviews.',
    icon: '🚀',
    status: 'upcoming',
  },
  {
    date: 'Oct 11, 11:59 AM',
    title: 'Code Submissions Due',
    desc: 'Final commits pushed, video demos submitted, and evaluation setup.',
    icon: '📦',
    status: 'upcoming',
  },
  {
    date: 'Oct 11, 12:00 PM',
    title: 'Presentations & Closing Ceremony',
    desc: 'Project presentations before judging panels, felicitation, and valedictory.',
    icon: '🏆',
    status: 'upcoming',
  },
];

interface TimelineItemProps {
  phase: Phase;
  index: number;
}

function TimelineItem({ phase, index }: TimelineItemProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const isLeft = index % 2 === 0;

  const statusStyles: Record<Phase['status'], string> = {
    completed: 'bg-emerald-600 border-emerald-600 text-white',
    active: 'bg-[#0f766e] border-[#0f766e] ring-4 ring-teal-100 text-white',
    upcoming: 'bg-white border-gray-300 text-gray-400',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.8, 0.25, 1] }}
      className={`relative flex items-center gap-6 md:gap-0 ${
        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
      } mb-8 md:mb-12`}
    >
      {/* Card */}
      <div className={`flex-1 ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
        <div className="pro-card rounded-xl p-6 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300">
          <div
            className={`flex items-center gap-2.5 mb-2.5 ${isLeft ? 'md:flex-row-reverse' : ''}`}
          >
            <span className="text-xl">{phase.icon}</span>
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-[#0f766e]">
              {phase.date}
            </span>
          </div>
          <h3 className="font-display font-bold text-base sm:text-lg text-[#0f172a] mb-1.5">
            {phase.title}
          </h3>
          <p className="font-body text-sm text-gray-600 leading-relaxed">{phase.desc}</p>
        </div>
      </div>

      {/* Center dot — desktop */}
      <div className="hidden md:flex flex-col items-center z-10">
        <div
          className={`w-4 h-4 rounded-full border-2 ${statusStyles[phase.status]} shadow-sm transition-all`}
        />
      </div>

      {/* Mobile dot */}
      <div className="md:hidden absolute -left-1 top-6">
        <div className={`w-3.5 h-3.5 rounded-full border-2 ${statusStyles[phase.status]}`} />
      </div>

      <div className="hidden md:block flex-1" />
    </motion.div>
  );
}

export default function Timeline() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="timeline" className="relative py-24 sm:py-32 px-6 bg-[#F8F9FA]" ref={ref}>
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-[#0f766e] font-semibold">
              03
            </span>
            <span className="h-[1px] w-10 bg-teal-600/40" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-gray-500">
              Schedule
            </span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0f172a] leading-tight mb-16">
            Event Timeline
          </h2>
        </motion.div>

        {/* Timeline container */}
        <div className="relative pl-6 md:pl-0">
          {/* Vertical line — mobile */}
          <div className="md:hidden absolute left-0.5 top-0 bottom-0 w-[2px] bg-gray-200" />

          {/* Vertical line — desktop center */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-gray-200" />

          {PHASES.map((phase, i) => (
            <TimelineItem key={phase.title} phase={phase} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
