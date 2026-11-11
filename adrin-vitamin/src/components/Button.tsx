import { motion, useMotionValue, useSpring } from 'framer-motion'
import type { ReactNode, MouseEvent } from 'react'
import { useRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface Props {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  variant?: Variant
  className?: string
  icon?: boolean
  ariaLabel?: string
  type?: 'button' | 'submit'
  size?: 'md' | 'lg'
  disabled?: boolean
}

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  )
}

/** Magnetic, premium CTA button. */
export function Button({ children, onClick, variant = 'primary', className = '', icon = true, ariaLabel, type = 'button', size = 'md', disabled }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * 0.18)
    y.set((e.clientY - r.top - r.height / 2) * 0.3)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const pad = size === 'lg' ? 'h-16 px-9 text-[0.8rem]' : 'h-13 px-7 text-[0.72rem]'
  const base = `group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full font-display font-semibold uppercase tracking-[0.22em] transition-colors duration-500 disabled:opacity-40 disabled:cursor-not-allowed ${pad}`
  const styles: Record<Variant, string> = {
    primary: 'bg-[var(--accent)] text-on-glow shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_12px_40px_-12px_var(--accent)]',
    secondary: 'text-bone border border-[var(--accent)]/50 hover:border-[var(--accent)] hover:text-[var(--accent)] bg-white/[0.02] backdrop-blur-sm',
    ghost: 'text-bone hover:text-[var(--accent)] px-0',
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {variant === 'primary' && (
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] ease-[var(--ease-expo)] group-hover:translate-x-full"
        />
      )}
      <span className="relative z-10">{children}</span>
      {icon && (
        <span className="relative z-10 inline-flex h-4 w-4 overflow-hidden">
          <Arrow className="absolute transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-5" />
          <Arrow className="absolute -translate-x-5 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0" />
        </span>
      )}
    </motion.button>
  )
}
