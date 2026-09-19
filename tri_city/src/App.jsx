import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Tracks from './components/Tracks'
import Timeline from './components/Timeline'
import Gallery from './components/Gallery'
import Sponsors from './components/Sponsors'
import FAQ from './components/FAQ'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'

export default function App() {
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
  )
}
