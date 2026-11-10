export function Bolt({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 32" fill="currentColor" aria-hidden>
      <path d="M15 0 2 18h8.4L7.6 32 22 12.6h-8.6z" />
    </svg>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Bolt className="h-5 w-4 text-volt drop-shadow-[0_0_10px_rgba(182,255,0,0.6)]" />
      <span className="font-tech text-[1.15rem] font-black tracking-[0.18em] text-bone">VOLT</span>
    </span>
  )
}
