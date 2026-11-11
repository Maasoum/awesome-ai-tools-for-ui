import { motion } from 'framer-motion'
import { useUI } from '../store/ui'
import { Button } from '../components/Button'
import { SplitReveal } from '../components/SplitReveal'
import { GlowDot } from '../components/Logo'
import { scrollToTarget } from '../lib/smoothScroll'
import { StaticBottle } from '../components/StaticBottle'
import { flavorById } from '../lib/flavors'

const ease = [0.16, 1, 0.3, 1] as const

export function Hero() {
  const ready = useUI((s) => s.sceneReady)
  const webgl = useUI((s) => s.webgl)
  const flavor = useUI((s) => s.flavor)
  const show = (d: number) => ({ initial: { opacity: 0, y: 24 }, animate: ready ? { opacity: 1, y: 0 } : {}, transition: { duration: 1.2, delay: d, ease } })

  return (
    <section id="home" aria-label="Introduction" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {!webgl && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[12vh] md:items-center md:pb-0">
          <div className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow/10 blur-[100px]" />
          <StaticBottle flavor={flavorById(flavor)} className="animate-float-can relative h-[46vh] md:h-[66vh]" />
        </div>
      )}

      {/* left: copy */}
      <div className="relative z-10 flex h-full flex-col justify-between px-5 pb-28 pt-28 sm:px-8 md:justify-center md:pb-0 md:pt-0 lg:px-12">
        <div className="max-w-[min(92vw,46rem)] md:max-w-[44vw] lg:max-w-[40vw]">
          <motion.div {...show(0.15)} className="mb-6 flex items-center gap-3">
            <GlowDot />
            <span className="eyebrow text-glow">Unleash the night</span>
            <span className="h-px w-16 bg-gradient-to-r from-glow/70 to-transparent" />
          </motion.div>

          <SplitReveal as="h1" ready={ready} immediate delay={0.25} className="display drop-deep text-[clamp(3.1rem,13vw,5rem)] md:text-[clamp(3.6rem,6.4vw,8.2rem)]">
            <span className="block">Energy</span>
            <span className="block">has a new</span>
            <span className="block text-glow">form.</span>
          </SplitReveal>

          <motion.p {...show(0.75)} className="text-shadow-deep mt-7 max-w-sm text-[0.98rem] leading-relaxed text-steel md:text-[1.05rem]">
            Sparkling vitamins for nights that never end. Feel the rush. <span className="text-bone">Own every moment.</span>
          </motion.p>
        </div>

        <motion.div {...show(0.95)} className="flex flex-wrap items-center gap-3 md:mt-10 md:gap-4">
          <Button onClick={() => scrollToTarget('#products')}>Discover Adrin</Button>
          <Button variant="secondary" onClick={() => scrollToTarget('#ingredients')}>
            Explore the formula
          </Button>
        </motion.div>
      </div>

      {/* right: vertical type + technical details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ duration: 1.6, delay: 0.9 }}
        className="pointer-events-none absolute inset-y-0 right-5 z-10 hidden flex-col items-end justify-center gap-10 sm:right-8 md:flex lg:right-12"
        aria-hidden
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-2 font-tech text-[0.55rem] tracking-[0.3em] text-steel/70">
            <span>SERIES 01</span>
            <span>N 49.45° · E 11.07°</span>
          </div>
          <div className="relative h-14 w-14">
            <svg viewBox="0 0 56 56" className="animate-spin-slow absolute inset-0 text-glow/60">
              <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 5" />
            </svg>
            <div className="absolute inset-[18px] rounded-full border border-glow/80">
              <div className="animate-blink absolute inset-[5px] rounded-full bg-glow" />
            </div>
          </div>
        </div>

        <div className="flex items-stretch gap-5">
          <div className="flex flex-col justify-between py-1 font-tech text-[0.5rem] tracking-[0.2em] text-steel/50">
            {Array.from({ length: 13 }).map((_, i) => (
              <span key={i} className={`block h-px ${i % 4 === 0 ? 'w-4 bg-glow/70' : 'w-2 bg-steel/40'}`} />
            ))}
          </div>
          <div className="flex flex-col gap-6 [writing-mode:vertical-rl]">
            {['Power', 'Performance', 'Energy'].map((w, i) => (
              <span key={w} className={`font-display text-[0.8rem] font-semibold uppercase tracking-[0.5em] ${i === 2 ? 'text-glow' : 'text-bone/80'}`}>
                {w}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-right font-tech text-[0.55rem] tracking-[0.28em] text-steel/70">
          <div>
            <span className="text-glow">100</span>% VITAMIN C
          </div>
          <div>
            <span className="text-glow">0</span>G ADDED SUGAR
          </div>
          <div>330ML / 11.2 FL OZ</div>
        </div>
      </motion.div>

      {/* bottom HUD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ duration: 1.4, delay: 1.2 }}
        className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-5 pb-6 sm:px-8 lg:px-12"
      >
        <span className="hidden font-tech text-[0.55rem] tracking-[0.3em] text-steel/60 md:block">ADRIN VITAMIN · FESTIVAL SEASON 2026</span>
        <button
          onClick={() => scrollToTarget('#ingredients')}
          className="group absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
          aria-label="Scroll to feel the energy"
        >
          <span className="eyebrow hidden text-[0.58rem] text-steel transition-colors group-hover:text-glow md:block">Scroll to feel the energy</span>
          <span className="relative h-8 w-px overflow-hidden bg-white/10 md:h-12">
            <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent to-glow" />
          </span>
          <svg className="animate-arrow-bob text-glow" width="12" height="8" viewBox="0 0 12 8" aria-hidden>
            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
        <span className="hidden font-tech text-[0.55rem] tracking-[0.3em] text-steel/60 md:block">
          SCROLL <span className="text-glow">↓</span> 01 / 06
        </span>
      </motion.div>
    </section>
  )
}
