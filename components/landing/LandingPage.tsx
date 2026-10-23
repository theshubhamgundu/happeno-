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
    <div className="relative min-h-screen bg-white text-[#1A1A1A]">
      <Navbar />
      <main>
        <Hero />
        <div className="section-divider-line" />
        <About />
        <div className="section-divider-line" />
        <Features />
        <div className="section-divider-line" />
        <FAQ />
        <div className="section-divider-line" />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
