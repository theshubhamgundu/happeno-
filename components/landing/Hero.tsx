'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

/* ───── Countdown Timer ───── */
function CountdownTimer() {
  const targetDate = useMemo(() => new Date('2026-10-09T00:00:00'), []);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, targetDate.getTime() - now.getTime());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <div className="flex justify-center gap-2 sm:gap-3 md:gap-6">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex flex-col items-center bg-white border border-gray-200 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 min-w-[60px] sm:min-w-[72px] md:min-w-[90px] shadow-sm"
        >
          <span className="font-mono text-xl sm:text-2xl md:text-3xl font-bold text-[#0f172a] tabular-nums">
            {String(u.value).padStart(2, '0')}
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mt-0.5">
            {u.label}
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
          className="inline-flex items-center gap-2 mb-5 sm:mb-6 px-3 sm:px-4 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-900"
        >
          <span className="w-2 h-2 shrink-0 rounded-full bg-teal-600 animate-pulse" />
          <span className="font-mono text-[10px] sm:text-xs tracking-wider uppercase font-medium text-center leading-snug">
            Happeno 2.0 · The Premier Hackathon OS
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
          <span className="block text-lg sm:text-3xl md:text-4xl font-semibold text-[#0f766e] tracking-normal mt-1 sm:mt-2">
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

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 sm:mb-10"
        >
          <CountdownTimer />
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
