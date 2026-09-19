import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function FinalCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-24 sm:py-32 px-6 bg-[#F8F9FA] border-t border-gray-200" ref={ref}>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }}
        >
          {/* Date Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-[#0f766e]">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span className="font-mono text-xs tracking-wider uppercase font-semibold">
              October 10–11, 2026 · Telangana
            </span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-[#0f172a] leading-tight mb-4">
            Build with the Tri-City Community
          </h2>

          <p className="font-body text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed mb-3">
            Join hundreds of innovators from Warangal, Hanamkonda, and Kazipet
            for 24 hours of creation, mentorship, and building solutions.
          </p>

          <p className="font-mono text-xs text-gray-500 mb-10 font-medium">
            Warangal · Hanamkonda · Kazipet
          </p>

          {/* Login Button with user icon + Sponsor button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://tricity-centle.vercel.app/login"
              className="btn-primary text-sm py-4 px-10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Login</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
