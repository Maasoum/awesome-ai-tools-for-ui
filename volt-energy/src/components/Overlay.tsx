import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { lockScroll } from '../lib/smoothScroll'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  label: string
  side?: 'right' | 'center'
  className?: string
}

/** Accessible modal/drawer shell: backdrop, Esc to close, scroll lock, focus handling. */
export function Overlay({ open, onClose, children, label, side = 'center', className = '' }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement
    lockScroll(true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>('[data-autofocus], button')?.focus(), 60)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
      lockScroll(false)
      ;(lastFocus.current as HTMLElement | null)?.focus?.()
    }
  }, [open, onClose])

  const panelMotion =
    side === 'right'
      ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
      : { initial: { opacity: 0, y: 40, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 30, scale: 0.98 } }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={`fixed inset-0 z-[80] flex ${side === 'right' ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-6'}`} initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div
            className="absolute inset-0 bg-ink/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            data-lenis-prevent
            {...panelMotion}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-y-auto overscroll-contain border-white/10 bg-char shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] ${
              side === 'right' ? 'h-full w-full max-w-md border-l' : 'max-h-[92svh] w-full max-w-5xl rounded-t-3xl border sm:rounded-3xl'
            } ${className}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function CloseButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      data-autofocus
      aria-label="Close"
      className={`grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-ink/40 text-bone transition-all hover:rotate-90 hover:border-volt hover:text-volt ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  )
}
