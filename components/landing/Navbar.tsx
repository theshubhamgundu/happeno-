'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Platform', href: '#about' },
  { label: 'Capabilities', href: '#features' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-4xl"
      >
        <div className="bg-white border-2 border-black rounded-full px-5 py-2.5 flex items-center justify-between shadow-[3px_3px_0px_#000000]">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#FF5722] border-2 border-black flex items-center justify-center text-white font-black text-sm shadow-[1.5px_1.5px_0px_#000000]">
              Hp
            </div>
            <div className="flex items-baseline">
              <span className="font-display font-black text-xl text-black tracking-tight">
                Happeno<span className="text-[#FF5722]">.</span>
              </span>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-display text-sm font-bold text-neutral-800 hover:text-[#FF5722] transition-colors duration-150"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-white border-2 border-black hover:bg-neutral-50 text-black font-display text-sm font-bold shadow-[2px_2px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            >
              <span>Sign In</span>
            </a>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-full border-2 border-black text-black bg-white shadow-[2px_2px_0px_#000000]"
              aria-label="Toggle menu"
            >
              <span
                className={`block w-4 h-[2px] bg-black transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[5px]' : ''
                  }`}
              />
              <span
                className={`block w-4 h-[2px] bg-black transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''
                  }`}
              />
              <span
                className={`block w-4 h-[2px] bg-black transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[5px]' : ''
                  }`}
              />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-6 px-6"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="font-display text-2xl font-bold text-white hover:text-[#ea580c] transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.a
              href="/login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="btn-primary mt-4 inline-flex items-center gap-2"
              onClick={() => setMobileOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              <span>Login</span>
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
