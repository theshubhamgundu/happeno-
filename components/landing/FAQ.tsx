'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: 'Who can participate in the Tri-City Hackathon?',
    a: 'Any student or professional residing or studying across Warangal, Hanamkonda, Kazipet, and neighboring regions in Telangana. All engineering, design, and domain enthusiasts are welcome.',
  },
  {
    q: 'How does team formation work for the tri-city format?',
    a: 'Teams can comprise 2 to 4 members. You can form teams with peers from your college or collaborate cross-institutionally across the tri-cities.',
  },
  {
    q: 'What should I bring to the hackathon?',
    a: 'Your laptop, chargers, identity cards, Wi-Fi, power points, and workspace are provided.',
  },
  {
    q: 'Are there any registration fees?',
    a: 'Yes.',
  },
  {
    q: 'What are the evaluation criteria?',
    a: 'Projects are evaluated based on Problem Relevance & Innovation (30%), Technical Implementation (30%), Scalability & Practical Utility (25%), and Presentation & Demo (15%).',
  },
  {
    q: 'Can we use pre-existing code?',
    a: 'You can use open-source frameworks, packages, and public APIs. However, core project architecture and custom features must be developed during the 24-hour hackathon window.',
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
      className="border-b border-gray-200 last:border-b-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3.5">
          <span className="font-mono text-xs text-[#0f766e] font-semibold mt-1 flex-shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-display font-semibold text-base text-[#0f172a] group-hover:text-[#0f766e] transition-colors">
            {faq.q}
          </span>
        </div>
        <span
          className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 text-sm transition-all duration-200 ${
            open ? 'rotate-45 border-[#0f766e] text-[#0f766e] bg-teal-50' : ''
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
            <p className="pl-9 pr-6 pb-5 font-body text-sm sm:text-base text-gray-600 leading-relaxed">
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
    <section id="faq" className="relative py-24 sm:py-32 px-6 bg-white" ref={sectionRef}>
      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-[#0f766e] font-semibold">
              06
            </span>
            <span className="h-[1px] w-10 bg-teal-600/40" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-gray-500">
              Questions
            </span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0f172a] leading-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="font-body text-base text-gray-600 max-w-xl leading-relaxed mb-10">
            Key details for participants joining across Warangal, Hanamkonda, and Kazipet.
          </p>
        </motion.div>

        <div className="pro-card rounded-xl p-6 sm:p-8 bg-[#F8F9FA] border border-gray-200">
          {FAQS.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
