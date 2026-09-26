'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const CITIES = [
  {
    name: 'Warangal',
    tag: 'Historical & Cultural Capital',
    desc: 'The historic heart of Kakatiya heritage, bringing together passionate engineers, innovative thinkers, and researchers.',
    bgImage: '/images/hanamkonda.jpg'
  },
  {
    name: 'Hanamkonda',
    tag: 'Education & Commercial Hub',
    desc: 'The educational powerhouse with premier institutes fostering young minds in deep tech, software development, and design.',
    bgImage: '/images/warangal.jpeg'
  },
  {
    name: 'Kazipet',
    tag: 'Connectivity & Logistics Core',
    desc: 'The key junction connecting Telangana to the nation, representing infrastructure, systems integration, and IoT networks.',
    bgImage: '/images/kazipet.webp'
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

export default function About() {
  return (
    <section id="about" className="relative py-24 sm:py-32 px-6 bg-[#F8F9FA]">
      <div className="relative max-w-6xl mx-auto">
        {/* Section label */}
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-[#0f766e] font-semibold">
              01
            </span>
            <span className="h-[1px] w-10 bg-teal-600/40" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-gray-500">
              The Mission
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0f172a] leading-tight mb-6">
            Connecting Three Cities.{' '}
            <span className="text-[#0f766e]">Igniting Tech Talent.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="font-body text-base sm:text-lg text-gray-600 max-w-3xl leading-relaxed mb-6">
            The <strong className="text-gray-900 font-semibold">Tri-City Hackathon</strong> is a
            premier regional initiative bringing together student developers, designers, and
            innovators from across
            <span className="text-gray-900 font-medium"> Warangal</span>,{' '}
            <span className="text-gray-900 font-medium">Hanamkonda</span>, and{' '}
            <span className="text-gray-900 font-medium">Kazipet</span>.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="font-body text-base sm:text-lg text-gray-600 max-w-3xl leading-relaxed mb-16">
            What makes it truly &quot;Tri-City&quot; is the synergy of our region: the academic
            strength of top regional universities, the rich cultural heritage of Warangal, and the
            engineering dynamism of Kazipet. Teams collaborate under common problem statements to
            engineer impactful, real-world solutions.
          </p>
        </FadeIn>

        {/* City cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CITIES.map((city, i) => (
            <FadeIn key={city.name} delay={0.2 + i * 0.1}>
              <div 
                className="pro-card rounded-xl p-8 h-full flex flex-col justify-between border border-gray-200 hover:border-teal-600 transition-all duration-300 relative overflow-hidden group"
                style={{
                  backgroundImage: `url(${city.bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Black overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/75 group-hover:from-black/60 group-hover:via-black/50 group-hover:to-black/65 transition-all duration-300" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="inline-block px-3 py-1 rounded text-[11px] font-mono font-medium tracking-wide uppercase bg-teal-500/80 text-white mb-4 backdrop-blur-sm">
                    {city.tag}
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white mb-3 drop-shadow-lg">
                    {city.name}
                  </h3>
                  <p className="font-body text-sm text-gray-200 leading-relaxed drop-shadow-md">{city.desc}</p>
                </div>
                <div className="pt-6 mt-6 border-t border-white/20 flex items-center justify-between text-xs font-mono text-gray-300 relative z-10">
                  <span>Telangana</span>
                  <span className="text-teal-400 font-semibold">Tri-City Hub</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
