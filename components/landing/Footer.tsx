export default function Footer() {
  return (
    <footer className="relative border-t-2 border-black bg-white text-black py-8">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="font-mono text-xs text-neutral-600 font-bold">
          © {new Date().getFullYear()} Happeno. The Modern Hackathon Operating System. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
