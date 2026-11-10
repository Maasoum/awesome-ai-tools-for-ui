import type { Flavor } from '../lib/flavors'

/** Vector packshot used when WebGL is unavailable. Mirrors the 3D can's art direction. */
export function StaticCan({ flavor, className = '' }: { flavor: Flavor; className?: string }) {
  const id = `c-${flavor.id}`
  return (
    <svg viewBox="0 0 200 460" className={className} role="img" aria-label={`${flavor.name} can`}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" x2="1">
          <stop offset="0" stopColor="#050606" />
          <stop offset="0.18" stopColor="#2a2f2f" />
          <stop offset="0.32" stopColor="#0d1010" />
          <stop offset="0.7" stopColor="#0a0c0c" />
          <stop offset="0.86" stopColor={flavor.accent} stopOpacity="0.35" />
          <stop offset="1" stopColor="#050606" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" x2="1">
          <stop offset="0" stopColor="#6b7272" />
          <stop offset="0.25" stopColor="#f2f5f5" />
          <stop offset="0.5" stopColor="#9aa1a1" />
          <stop offset="0.8" stopColor="#d9dede" />
          <stop offset="1" stopColor="#5d6464" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M38 30 Q40 12 60 10 H140 Q160 12 162 30 L170 56 V404 L162 432 Q158 448 140 450 H60 Q42 448 38 432 L30 404 V56 Z" fill={`url(#${id}-metal)`} />
      <rect x="30" y="56" width="140" height="348" fill={`url(#${id}-body)`} />
      <rect x="30" y="66" width="140" height="2.5" fill={flavor.accent} />
      <rect x="30" y="392" width="140" height="2.5" fill={flavor.accent} />
      <text x="100" y="230" transform="rotate(-90 100 230)" textAnchor="middle" dominantBaseline="middle" fontFamily="Orbitron, sans-serif" fontWeight="900" fontSize="88" fill={flavor.accent} filter={`url(#${id}-glow)`}>
        VOLT
      </text>
      <text x="58" y="230" transform="rotate(-90 58 230)" textAnchor="middle" fontFamily="Space Grotesk Variable, sans-serif" fontWeight="600" fontSize="11" letterSpacing="4" fill="#f5f5f5">
        ENERGY DRINK
      </text>
      <text x="146" y="230" transform="rotate(-90 146 230)" textAnchor="middle" fontFamily="Orbitron, sans-serif" fontWeight="800" fontSize="11" letterSpacing="4" fill={flavor.accent}>
        {flavor.short}
      </text>
      <rect x="44" y="56" width="10" height="348" fill="#fff" opacity="0.08" />
    </svg>
  )
}
