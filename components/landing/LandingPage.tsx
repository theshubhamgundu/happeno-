'use client';

import Navbar from './Navbar';
import Hero from './Hero';
import About from './About';
import Features from './Features';
import FAQ from './FAQ';
import FinalCTA from './FinalCTA';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#FAF9F5] text-black selection:bg-[#FBBF24] selection:text-black">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Features />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
