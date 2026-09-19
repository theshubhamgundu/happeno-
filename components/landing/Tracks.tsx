'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const TRACKS = [
  {
    id: 1,
    number: '01',
    title: 'SaaSum AI',
    category: 'IT & AI',
    desc: 'Build intelligent software solutions leveraging artificial intelligence and modern IT infrastructure.',
  },
  {
    id: 2,
    number: '02',
    title: 'Maceco',
    category: 'Analytics',
    desc: 'Create data-driven solutions with advanced analytics and visualization tools.',
  },
  {
    id: 3,
    number: '03',
    title: 'Tobofu',
    category: 'Marketing',
    desc: 'Innovate marketing technology and customer engagement platforms.',
  },
  {
    id: 4,
    number: '04',
    title: 'Promtal',
    category: 'HR Tech',
    desc: 'Develop human resources technology for talent management and workplace innovation.',
  },
  {
    id: 5,
    number: '05',
    title: 'Skill Tank',
    category: 'EdTech',
    desc: 'Transform education through technology-driven learning platforms and tools.',
  },
  {
    id: 6,
    number: '06',
    title: 'Vriddhi',
    category: 'FinTech',
    desc: 'Build financial technology solutions for banking, payments, and wealth management.',
  },
  {
    id: 7,
    number: '07',
    title: 'Open Innovation',
    category: 'Any Domain',
    desc: 'Bring your own idea and innovate in any domain or technology area of your choice.',
  },
];

interface Track {
  id: number;
  number: string;
  title: string;
  category: string;
  desc: string;
}

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

export default function Tracks() {
  return (
    <section id="tracks" className="relative py-24 sm:py-32 px-6 bg-white">
      <div className="relative max-w-6xl mx-auto">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-[#0f766e] font-semibold">
              02
            </span>
            <span className="h-[1px] w-10 bg-teal-600/40" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-gray-500">
              Problem Statements
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0f172a] leading-tight mb-4">
            Hackathon Tracks
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="font-body text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed mb-14">
            Select one of the six challenge areas below to build your solution. Teams can innovate
            within any track of their choice.
          </p>
        </FadeIn>

        {/* Track cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRACKS.map((track, i) => (
            <FadeIn key={track.id} delay={0.1 + i * 0.08}>
              <div className="pro-card rounded-xl p-7 bg-[#F8F9FA] hover:bg-white border border-gray-200 hover:border-teal-600/60 transition-all duration-300 flex flex-col justify-between min-h-[220px]">
                <div>
                  {/* Track Number Header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-xs font-bold tracking-widest text-[#0f766e] uppercase">
                      Track {track.number}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-teal-600/40" />
                  </div>

                  {/* Title (or placeholder) */}
                  <h3 className="font-display font-bold text-lg text-[#0f172a] mb-2.5">
                    {track.title ? track.title : `Track ${track.number}`}
                  </h3>

                  {/* Description (or placeholder) */}
                  <p className="font-body text-sm text-gray-500 leading-relaxed">
                    {track.desc
                      ? track.desc
                      : 'Problem statement and guidelines will be announced here.'}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-gray-200/80 flex items-center justify-between text-xs font-mono text-gray-500">
                  <span>Open for Submission</span>
                  <span className="text-[#0f766e] font-semibold">Ready</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
