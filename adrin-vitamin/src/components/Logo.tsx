import { BRAND } from '../lib/brand'

/** The ADRIN deer mark (raster artwork supplied by the brand). */
export function LogoMark({ className = '' }: { className?: string }) {
  return <img src={BRAND.logo} alt="" aria-hidden draggable={false} className={`select-none object-contain ${className}`} />
}

/** Small glowing dot that inherits the current flavour colour. */
export function GlowDot({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full bg-glow shadow-[0_0_10px_var(--accent)] ${className}`} />
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-auto drop-shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_45%,transparent)]" />
      <span className="font-tech text-[1.15rem] font-black tracking-[0.18em] text-bone">ADRIN</span>
    </span>
  )
}
