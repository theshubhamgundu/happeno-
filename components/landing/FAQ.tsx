'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: 'How does Happeno streamline hackathon management?',
    a: 'Happeno replaces multiple disconnected tools (Google Forms, Excel spreadsheets, manual paper lists, and WhatsApp groups) with a unified, real-time HMScovering registration, sub-second QR venue access, meal token logistics, stage pipelines, and live judging.',
  },
  {
    q: 'How do QR passes and meal tracking prevent fraud?',
    a: 'Every participant receives an encrypted digital QR pass on their personal dashboard. Station volunteers scan passes in under 200ms. The platform automatically enforces meal allocations (Breakfast, Lunch, Dinner, Midnight Snack) and eliminates duplicate scans or unverified claims.',
  },
  {
    q: 'Can organizers configure custom stages and sprint deadlines?',
    a: 'Yes. Happeno supports stage-gate sprints: Round 1 ideation checks, mid-way mentor evaluation checkpoints, and Final Round pitch shortlists, each with automated countdown timers and instant submission locks.',
  },
  {
    q: 'How does fair-play score normalization work for judges?',
    a: 'Organizers can create weighted, multi-parameter rubrics across different tracks. The scoring engine aggregates multi-judge evaluations and applies score normalization to eliminate jury bias and deliver transparent, tamper-proof rankings.',
  },
  {
    q: 'How do participants form teams and submit code?',
    a: 'Participants can create or join teams with private invite links, assign member roles, and link their GitHub repository for automated commit tracking and verification during the competition window.',
  },
  {
    q: 'Can universities, tech clubs, or enterprises host events on Happeno?',
    a: 'Yes. Happeno is engineered to scale from college hackathons to enterprise-grade hackathons with thousands of simultaneous builders, multi-track evaluations, and granular role permissions.',
  },
];

interface FAQItemProps {
  faq: FAQ;
  index: number;
}

function FAQItem({ faq, index }: FAQItemProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.25, 0.8, 0.25, 1] }}
      className="border-b border-zinc-800 last:border-b-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3.5">
          <span className="font-mono text-xs text-[#ea580c] font-semibold mt-1 flex-shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-display font-semibold text-base text-white group-hover:text-[#ea580c] transition-colors">
            {faq.q}
          </span>
        </div>
        <span
          className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 text-sm transition-all duration-200 ${open ? 'rotate-45 border-[#ea580c] text-[#ea580c] bg-orange-950/40' : ''
            }`}
        >
          +
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] }}
            className="overflow-hidden"
          >
            <p className="pl-9 pr-6 pb-5 font-body text-sm sm:text-base text-zinc-400 leading-relaxed">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="faq" className="relative py-24 sm:py-32 px-6 bg-black" ref={sectionRef}>
      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-[#ea580c] font-semibold">
              03
            </span>
            <span className="h-[1px] w-10 bg-orange-500/40" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-zinc-500">
              Questions
            </span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="font-body text-base text-zinc-400 max-w-xl leading-relaxed mb-10">
            Key operational details about the Happeno Hackathon Operating System.
          </p>
        </motion.div>

        <div className="pro-card rounded-xl p-6 sm:p-8 bg-[#0d0d12] border border-zinc-800">
          {FAQS.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
