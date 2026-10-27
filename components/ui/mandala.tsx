/** Gold rosette ornament inspired by the Tazhud logo. Purely decorative. */
export function Mandala({ className = "", petals = 16 }: { className?: string; petals?: number }) {
  const step = 360 / petals;
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden fill="none" stroke="currentColor">
      <g strokeWidth="0.8">
        {Array.from({ length: petals }, (_, i) => (
          <g key={i} transform={`rotate(${i * step} 100 100)`}>
            <path d="M100 8 C112 26 112 44 100 58 C88 44 88 26 100 8 Z" />
            <path d="M100 18 C106 30 106 40 100 48 C94 40 94 30 100 18 Z" opacity="0.7" />
            <circle cx="100" cy="4" r="1.6" />
          </g>
        ))}
        {Array.from({ length: petals }, (_, i) => (
          <path
            key={`o${i}`}
            transform={`rotate(${i * step + step / 2} 100 100)`}
            d="M100 26 C108 40 108 54 100 64 C92 54 92 40 100 26 Z"
            opacity="0.55"
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="40" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="36" strokeWidth="0.6" strokeDasharray="1.5 3" />
      <circle cx="100" cy="100" r="66" strokeWidth="0.6" opacity="0.6" />
    </svg>
  );
}

/** Eight-point star, the classic khatam motif, used as a small divider mark. */
export function Star8({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 1.5 14.6 6.3 20 4 17.7 9.4 22.5 12 17.7 14.6 20 20 14.6 17.7 12 22.5 9.4 17.7 4 20 6.3 14.6 1.5 12 6.3 9.4 4 4 9.4 6.3Z" />
    </svg>
  );
}

export function OrnamentDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-gold ${className}`} aria-hidden>
      <span className="gold-rule flex-1" />
      <Star8 className="size-3" />
      <span className="gold-rule flex-1" />
    </div>
  );
}
