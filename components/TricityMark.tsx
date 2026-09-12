type TricityMarkProps = {
  className?: string;
  compact?: boolean;
};

export default function TricityMark({ className = "", compact = false }: TricityMarkProps) {
  return (
    <span className={`inline-flex flex-col leading-none font-kanit font-black italic uppercase ${className}`}>
      <span className="tracking-tight text-[#FFEE00]">TRICITY</span>
      {!compact && <span className="mt-1 text-[0.32em] tracking-[0.28em] text-white/80">AI Hackathon</span>}
    </span>
  );
}
