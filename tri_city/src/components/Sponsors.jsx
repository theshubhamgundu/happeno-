import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const SPONSORS = {
  platinum: [
    { name: 'NexaTech' },
    { name: 'CyberPulse' },
    { name: 'VortexAI' },
  ],
  gold: [
    { name: 'DataForge' },
    { name: 'CloudNova' },
    { name: 'ByteShift' },
    { name: 'QuantumStack' },
  ],
  silver: [
    { name: 'CodeHive' },
    { name: 'InfraCore' },
    { name: 'SynthLabs' },
    { name: 'PixelMesh' },
    { name: 'ArcLight' },
    { name: 'ZenDev' },
  ],
}

function PlaceholderLogo({ name, size = 'md' }) {
  const sizeClasses = {
    lg: 'w-44 h-16 text-sm',
    md: 'w-36 h-12 text-xs',
    sm: 'w-28 h-10 text-xs',
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all duration-200 group cursor-default`}
    >
      <span className="font-display font-bold tracking-wider text-gray-600 group-hover:text-[#0f172a] transition-colors">
        {name}
      </span>
    </div>
  )
}

function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
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
  )
}

export default function Sponsors() {
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, margin: '-100px' })

  const allSponsors = [...SPONSORS.platinum, ...SPONSORS.gold, ...SPONSORS.silver]
  const marqueeItems = [...allSponsors, ...allSponsors]

  return (
    <section id="sponsors" className="relative py-24 sm:py-32 px-6 bg-[#F8F9FA]" ref={sectionRef}>
      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-[#0f766e] font-semibold">
              05
            </span>
            <span className="h-[1px] w-10 bg-teal-600/40" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-gray-500">
              Partners
            </span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0f172a] leading-tight mb-4">
            Supported By
          </h2>
          <p className="font-body text-base text-gray-600 max-w-2xl leading-relaxed mb-14">
            Ecosystem partners and regional industry leaders empowering talent across Warangal, Hanamkonda, and Kazipet.
          </p>
        </motion.div>

        {/* Tiered logos */}
        <div className="space-y-10 mb-16">
          <FadeIn delay={0.1}>
            <p className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4 text-center font-medium">
              Platinum Partners
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              {SPONSORS.platinum.map((s) => (
                <PlaceholderLogo key={s.name} {...s} size="lg" />
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4 text-center font-medium">
              Gold Partners
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {SPONSORS.gold.map((s) => (
                <PlaceholderLogo key={s.name} {...s} size="md" />
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4 text-center font-medium">
              Silver Partners
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {SPONSORS.silver.map((s) => (
                <PlaceholderLogo key={s.name} {...s} size="sm" />
              ))}
            </div>
          </FadeIn>
        </div>

        {/* Clean Marquee */}
        <div className="relative overflow-hidden py-4 border-t border-b border-gray-200 bg-white">
          <div className="marquee-track">
            {marqueeItems.map((s, i) => (
              <div key={i} className="mx-8 flex-shrink-0">
                <span className="font-display font-bold text-sm tracking-wider text-gray-400 uppercase">
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
