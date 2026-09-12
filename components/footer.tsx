import Image from "next/image"
import Link from "next/link"
import TricityMark from "@/components/TricityMark"

export function Footer() {
  return (
    <footer
      className="relative w-full flex flex-col"
      style={{
        backgroundImage: "url(/blackbgFooter.png)",
        backgroundSize: "cover",
      }}
    >
      {/* socials tape */}
      <div className="relative flex flex-col md:flex-row w-full justify-between items-center min-h-[216px] bg-[#62009b] border-white border-t-8 md:border-t-12 border-b-8 md:border-b-12 px-4 md:px-8 py-8 md:py-0">

        {/* Logo Section */}
        <div className="flex justify-center items-center mb-6 md:mb-0 md:ml-12">
          <TricityMark className="text-4xl md:text-6xl drop-shadow-xl hover:scale-105 transition-transform duration-300" />
        </div>

        {/* Content Section */}
        <div className="flex flex-col items-center md:items-end gap-6 md:mr-12 w-full md:w-auto">

          {/* Internal Links */}
          <nav>
            <ul className="flex flex-wrap justify-center md:justify-end gap-6 md:gap-8 text-white font-black font-kanit italic uppercase text-sm md:text-lg tracking-wider">
              <li className="hover:text-[#FFEE00] transition-colors">
                <Link href="/">Home</Link>
              </li>
              <li className="hover:text-[#FFEE00] transition-colors">
                <Link href="/team">Team</Link>
              </li>
              <li className="hover:text-[#FFEE00] transition-colors">
                <Link href="/contact">Contact</Link>
              </li>
              <li className="hover:text-[#FFEE00] transition-colors">
                <Link href="/terms">Terms</Link>
              </li>
              <li className="hover:text-[#FFEE00] transition-colors">
                <Link href="/privacy">Privacy</Link>
              </li>
              <li className="hover:text-[#FFEE00] transition-colors">
                <Link href="/refund">Refund</Link>
              </li>
            </ul>
          </nav>

          {/* Socials Section */}
          <div className="flex flex-col items-center md:items-end gap-4 w-full">
            <p className="text-white text-2xl md:text-5xl font-black font-kanit italic uppercase tracking-tighter">
              Follow our socials
            </p>
            <ul className="flex flex-row gap-4 md:gap-6 justify-center items-center bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/20">
              <SocialIcon src="/linkdin.svg" alt="LinkedIn" />
              <SocialIcon src="/insta.svg" alt="Instagram" />
              <SocialIcon src="/whatsapp.png" alt="WhatsApp" href="https://chat.whatsapp.com/J5Cqelh3gVPLalKt9FEqPp?mode=gi_t" />
            </ul>
          </div>

          {/* Copyright & Legal */}
          <div className="mt-2 text-center md:text-right space-y-2">
            <p className="text-white/40 font-bold text-xs md:text-sm uppercase tracking-[0.2em]">
              &copy; 2026 TRI-CITY AI HACKATHON. ALL RIGHTS RESERVED.
            </p>
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-medium">
              Legal Business Name: <span className="text-white/60">SHUBHAM VASANT GUNDU</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

const SocialIcon = ({ src, alt, href }: { src: string; alt: string; href?: string }) => (
  <li className="hover:scale-110 hover:-translate-y-1 transition-all duration-300">
    {href ? (
      <Link href={href} target="_blank" rel="noopener noreferrer" className="relative block w-6 h-6 md:w-8 md:h-8">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
        />
      </Link>
    ) : (
      <div className="relative w-6 h-6 md:w-8 md:h-8">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
        />
      </div>
    )}
  </li>
)
