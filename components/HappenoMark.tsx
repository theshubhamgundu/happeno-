type HappenoMarkProps = {
  className?: string;
  compact?: boolean;
};

export default function HappenoMark({ className = "", compact = false }: HappenoMarkProps) {
  return (
    <span className={`inline-flex flex-col leading-none font-sans font-black uppercase ${className}`}>
      <span className="tracking-tight text-white font-bold">HAPPENO<span className="text-orange-500">.</span></span>
      {!compact && <span className="mt-1 text-[0.32em] tracking-[0.28em] text-orange-400 font-mono">Hackathon</span>}
    </span>
  );
}

export { HappenoMark as HappenoMark };
