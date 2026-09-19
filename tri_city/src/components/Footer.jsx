export default function Footer() {
  return (
    <footer className="relative border-t border-gray-200 bg-white text-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-md bg-[#0f172a] flex items-center justify-center text-white font-display font-extrabold text-[10px]">
                TC
              </div>
              <span className="font-display font-bold text-sm tracking-wider uppercase text-[#0f172a]">
                Tri-City Hackathon
              </span>
            </div>
            <p className="font-body text-xs text-gray-500 leading-relaxed max-w-xs mb-3">
              Empowering student builders and tech innovators across Warangal, Hanamkonda, and Kazipet.
            </p>
            <p className="font-mono text-[11px] text-gray-400">
              © 2026 Tri-City Hackathon. All rights reserved.
            </p>
          </div>

          {/* Links: Event Navigation */}
          <div>
            <h4 className="font-mono text-xs tracking-[0.2em] uppercase text-gray-400 font-semibold mb-4">
              Navigation
            </h4>
            <ul className="space-y-2">
              {['About', 'Tracks', 'Timeline', 'Gallery', 'Sponsors', 'FAQ'].map((l) => (
                <li key={l}>
                  <a
                    href={`#${l.toLowerCase()}`}
                    className="font-body text-sm text-gray-600 hover:text-[#0f766e] transition-colors"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-mono text-xs tracking-[0.2em] uppercase text-gray-400 font-semibold mb-4">
              Connect
            </h4>
            <ul className="space-y-2">
              {['Twitter / X', 'Discord Community', 'LinkedIn', 'Instagram'].map((l) => (
                <li key={l}>
                  <span className="font-body text-sm text-gray-600 hover:text-[#0f766e] transition-colors cursor-pointer">
                    {l}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-gray-500">
            Warangal · Hanamkonda · Kazipet | Telangana, India
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Contact Support'].map((l) => (
              <span
                key={l}
                className="font-mono text-[11px] text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
