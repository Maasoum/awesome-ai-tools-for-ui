import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sceneState } from '../lib/sceneState'
import { SplitReveal } from '../components/SplitReveal'

const ITEMS = [
  { v: '100', u: '%', k: 'Vitamin C', d: 'Your full daily dose of vitamin C in every bottle, from real citrus.' },
  { v: 'B3·B6', u: '·B12', k: 'Vitamin complex', d: 'Contributes to the reduction of tiredness and fatigue.' },
  { v: '80', u: 'MG', k: 'Natural caffeine', d: 'A gentle lift from green tea — enough for the encore, no jitters.' },
  { v: '0', u: 'G', k: 'Added sugar', d: 'Zero added sugar. All the flavour, none of the crash.' },
  { v: '200', u: 'MG', k: 'Electrolytes', d: 'Magnesium and potassium to keep you hydrated on the dance floor.' },
  { v: '12', u: '%', k: 'Real fruit', d: 'Pressed fruit juice for a bright, honest taste in every sip.' },
]

function Callout({ item, i, side, on }: { item: (typeof ITEMS)[number]; i: number; side: 'l' | 'r'; on: boolean }) {
  return (
    <div
      className={`relative flex flex-col transition-all duration-[1100ms] ease-[var(--ease-expo)] ${side === 'l' ? 'items-end text-right' : 'items-start text-left'} ${
        on ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-6 opacity-0 blur-sm'
      }`}
    >
      <div className={`flex items-baseline gap-3 ${side === 'l' ? 'flex-row-reverse' : ''}`}>
        <span className="font-tech text-[0.6rem] tracking-[0.3em] text-glow">0{i + 1}</span>
        <span className="display text-[clamp(2rem,3.4vw,3.6rem)] text-bone">
          {item.v}
          <span className="text-glow">{item.u}</span>
        </span>
      </div>
      <span className="eyebrow mt-2 text-bone">{item.k}</span>
      <p className="mt-2 max-w-[17rem] text-sm leading-relaxed text-steel">{item.d}</p>
      {/* leader line towards the bottle */}
      <span
        aria-hidden
        className={`absolute top-6 hidden h-px w-[min(9vw,140px)] lg:block ${side === 'l' ? 'left-[calc(100%+1.5rem)] origin-left' : 'right-[calc(100%+1.5rem)] origin-right'} bg-gradient-to-r ${
          side === 'l' ? 'from-glow/70 to-transparent' : 'from-transparent to-glow/70'
        } transition-transform delay-200 duration-1000 ${on ? 'scale-x-100' : 'scale-x-0'}`}
      >
        <span className={`absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-glow shadow-[0_0_10px_var(--accent)] ${side === 'l' ? '-left-0.5' : '-right-0.5'}`} />
      </span>
    </div>
  )
}


export function Formula() {
  const ref = useRef<HTMLElement>(null)
  const degRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(0)

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const p = self.progress
          sceneState.formula = p
          const n = Math.min(ITEMS.length, Math.floor(p * 1.25 * ITEMS.length + 0.6))
          setRevealed((r) => (r === n ? r : n))
          if (degRef.current) degRef.current.textContent = String(Math.round(360 + p * 180)).padStart(3, '0')
          if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
        },
        onRefresh: (self) => (sceneState.formula = self.progress),
      })
    },
    { scope: ref },
  )

  const left = ITEMS.slice(0, 3)
  const right = ITEMS.slice(3)
  const mobileIdx = Math.max(0, revealed - 1)

  return (
    <section id="ingredients" ref={ref} aria-label="The formula" className="relative h-[320vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-5 pb-8 pt-24 sm:px-8 lg:px-12">
        <div className="relative z-10 flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <span className="eyebrow mb-4 block text-glow">The formula · Ingredients</span>
            <SplitReveal as="h2" type="words" className="display drop-deep text-[clamp(2.4rem,9vw,4rem)] md:text-[clamp(2.4rem,4.4vw,4.8rem)]">
              Engineered <br className="hidden md:block" />
              <span className="text-glow">vitality.</span>
            </SplitReveal>
          </div>
          <p className="text-shadow-deep mt-3 max-w-[18rem] text-sm text-steel md:mt-0 md:text-right">
            Six active ingredients, precisely dosed. Keep scrolling to break down every bottle.
          </p>
        </div>

        {/* desktop callouts */}
        <div className="relative hidden flex-1 grid-cols-[1fr_minmax(220px,26vw)_1fr] items-center gap-6 md:grid">
          <div className="flex flex-col items-end gap-[6vh]">
            {left.map((it, i) => (
              <Callout key={it.k} item={it} i={i} side="l" on={i < revealed} />
            ))}
          </div>
          <div />
          <div className="flex flex-col items-start gap-[6vh]">
            {right.map((it, i) => (
              <Callout key={it.k} item={it} i={i + 3} side="r" on={i + 3 < revealed} />
            ))}
          </div>
        </div>

        {/* mobile: one detail at a time */}
        <div className="flex-1 md:hidden" />
        <div className="glass relative z-10 rounded-2xl p-5 md:hidden" aria-live="polite">
          <div key={mobileIdx} className={`transition-opacity duration-500 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-baseline justify-between">
              <span className="display text-4xl">
                {ITEMS[mobileIdx].v}
                <span className="text-glow">{ITEMS[mobileIdx].u}</span>
              </span>
              <span className="font-tech text-[0.6rem] tracking-[0.3em] text-glow">0{mobileIdx + 1}/06</span>
            </div>
            <div className="eyebrow mt-2">{ITEMS[mobileIdx].k}</div>
            <p className="mt-1 text-sm text-steel">{ITEMS[mobileIdx].d}</p>
          </div>
        </div>

        {/* readout */}
        <div className="relative z-10 mt-6 flex items-center gap-5 font-tech text-[0.58rem] tracking-[0.3em] text-steel">
          <span>
            ROTATION <span ref={degRef} className="text-glow tabular-nums">360</span>°
          </span>
          <div className="relative h-px flex-1 bg-white/10">
            <div ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-glow" />
          </div>
          <span>
            {String(revealed).padStart(2, '0')} / 06 ACTIVE
          </span>
        </div>
      </div>
    </section>
  )
}
