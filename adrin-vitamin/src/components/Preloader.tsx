import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUI } from '../store/ui'
import { LogoMark } from './Logo'

export function Preloader() {
  const stage = useUI((s) => s.loadStage)
  const ready = useUI((s) => s.sceneReady)
  const [shown, setShown] = useState(0)
  const [gone, setGone] = useState(false)
  const raf = useRef(0)
  const value = useRef(0)

  useEffect(() => {
    const tick = () => {
      const target = stage * 100
      value.current += (target - value.current) * 0.08 + (value.current < target ? 0.25 : 0)
      if (value.current > target) value.current = target
      setShown(Math.round(value.current))
      if (ready && value.current >= 99.5) {
        window.setTimeout(() => setGone(true), 250)
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [stage, ready])

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
          role="status"
          aria-live="polite"
          aria-label={`Loading ADRIN experience ${shown}%`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--accent)_8%,transparent),transparent_60%)]" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="relative flex flex-col items-center">
            <LogoMark className="mb-6 h-24 w-auto drop-shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_55%,transparent)] sm:h-28" />
            <div className="font-tech text-5xl font-black tracking-[0.3em] text-bone sm:text-6xl">ADRIN</div>
            <div className="eyebrow mt-3 text-steel">Warming up the party</div>
          </motion.div>
          <div className="absolute bottom-12 left-1/2 w-[min(420px,80vw)] -translate-x-1/2">
            <div className="mb-3 flex items-end justify-between font-tech text-[0.62rem] tracking-[0.3em] text-steel">
              <span>SOUNDCHECK</span>
              <span className="text-xl font-bold tracking-normal text-glow tabular-nums">{String(shown).padStart(3, '0')}%</span>
            </div>
            <div className="h-px w-full bg-white/10">
              <div className="h-px bg-glow shadow-[0_0_12px_var(--accent)]" style={{ width: `${shown}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
