'use client';

import Navbar from './Navbar';
import Hero from './Hero';
import About from './About';
import Tracks from './Tracks';
import Timeline from './Timeline';
import Gallery from './Gallery';
import Sponsors from './Sponsors';
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
        <Tracks />
        <div className="section-divider-line" />
        <Timeline />
        <div className="section-divider-line" />
        <Gallery />
        <div className="section-divider-line" />
        <Sponsors />
        <div className="section-divider-line" />
        <FAQ />
        <div className="section-divider-line" />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
