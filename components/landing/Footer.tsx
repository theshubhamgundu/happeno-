export default function Footer() {
  return (
    <footer className="relative border-t border-zinc-800 bg-black text-white py-8">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="font-mono text-xs text-zinc-500">
          © {new Date().getFullYear()} Happeno. The Modern Hackathon Operating System.
        </p>
      </div>
    </footer>
  );
}
