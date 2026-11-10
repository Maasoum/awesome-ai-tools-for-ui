import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUI } from '../store/ui'
import { Bolt } from './Logo'

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
          aria-label={`Loading VOLT experience ${shown}%`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(182,255,0,0.08),transparent_60%)]" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="relative flex flex-col items-center">
            <Bolt className="mb-6 h-14 w-11 text-volt drop-shadow-[0_0_24px_rgba(182,255,0,0.7)]" />
            <div className="font-tech text-5xl font-black tracking-[0.3em] text-bone sm:text-6xl">VOLT</div>
            <div className="eyebrow mt-3 text-steel">Charging the experience</div>
          </motion.div>
          <div className="absolute bottom-12 left-1/2 w-[min(420px,80vw)] -translate-x-1/2">
            <div className="mb-3 flex items-end justify-between font-tech text-[0.62rem] tracking-[0.3em] text-steel">
              <span>VOLTAGE</span>
              <span className="text-xl font-bold tracking-normal text-volt tabular-nums">{String(shown).padStart(3, '0')}%</span>
            </div>
            <div className="h-px w-full bg-white/10">
              <div className="h-px bg-volt shadow-[0_0_12px_#B6FF00]" style={{ width: `${shown}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
