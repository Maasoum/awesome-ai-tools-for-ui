import { useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sceneState } from '../lib/sceneState'
import { SplitReveal } from '../components/SplitReveal'
import { prefersReducedMotion } from '../lib/env'
import { useUI } from '../store/ui'
import { flavorById, hexHue } from '../lib/flavors'

const CARDS = [
  { n: '01', t: 'Instant energy', d: 'Natural caffeine and B-vitamins to keep the night moving.', m: 98, icon: 'bolt' },
  { n: '02', t: 'Extreme focus', d: 'Stay sharp. Stay focused. Stay unstoppable.', m: 92, icon: 'focus' },
  { n: '03', t: 'Pure intensity', d: 'Real fruit, loud flavour and a sparkling, electric finish.', m: 100, icon: 'flame' },
] as const

function Icon({ k }: { k: string }) {
  if (k === 'bolt')
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
      </svg>
    )
  if (k === 'focus')
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" />
    </svg>
  )
}

function Card({ c, on, idx }: { c: (typeof CARDS)[number]; on: boolean; idx: number }) {
  return (
    <article
      className={`glass group relative overflow-hidden rounded-2xl p-5 transition-all duration-[1200ms] ease-[var(--ease-expo)] hover:-translate-y-1 hover:border-glow/40 lg:p-6 ${
        on ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      }`}
      style={{ transitionDelay: on ? `${idx * 60}ms` : '0ms' }}
    >
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glow to-transparent opacity-60" />
      <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-glow/10 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <span className="font-tech text-xs font-bold tracking-[0.3em] text-glow">{c.n}</span>
        <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-glow transition-colors group-hover:border-glow/60">
          <Icon k={c.icon} />
        </span>
      </div>
      <h3 className="display mt-6 text-[clamp(1.25rem,1.7vw,1.7rem)] tracking-[-0.03em]">{c.t}</h3>
      <p className="mt-2 text-sm leading-relaxed text-steel">{c.d}</p>
      <div className="mt-5 flex items-center gap-3 font-tech text-[0.55rem] tracking-[0.25em] text-steel">
        <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-glow2 to-glow shadow-[0_0_10px_var(--accent)] transition-[width] delay-300 duration-[1600ms] ease-[var(--ease-expo)]"
            style={{ width: on ? `${c.m}%` : '0%' }}
          />
        </div>
        <span className="tabular-nums text-bone">{c.m}%</span>
      </div>
    </article>
  )
}

export function Power() {
  const ref = useRef<HTMLElement>(null)
  const splash = useRef<HTMLDivElement>(null)
  const bigWord = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const flavor = useUI((s) => s.flavor)
  // the macro splash photo is re-tinted to the selected flavour colour
  const splashHue = Math.round(hexHue(flavorById(flavor).accent) - 82)

  const streaks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        top: 8 + ((i * 37) % 84),
        w: 80 + ((i * 53) % 240),
        delay: (i * 0.37) % 3.2,
        dur: 1.4 + ((i * 0.29) % 1.6),
        green: i % 3 !== 0,
      })),
    [],
  )

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          sceneState.power = self.progress
          const n = self.progress < 0.08 ? 0 : self.progress < 0.3 ? 1 : self.progress < 0.52 ? 2 : 3
          setActive((a) => (a === n ? a : n))
        },
        onRefresh: (self) => (sceneState.power = self.progress),
      })
      if (prefersReducedMotion()) return
      // liquid splash layer: rises and blooms as the burst builds
      gsap.fromTo(
        splash.current,
        { yPercent: 30, scale: 0.75, autoAlpha: 0 },
        { yPercent: 0, scale: 1.08, autoAlpha: 0.9, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 60%', end: '45% bottom', scrub: 1 } },
      )
      // fade the splash before the pinned frame un-sticks so no hard clip edge shows
      gsap.to(splash.current, { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'bottom 135%', end: 'bottom 95%', scrub: true } })
      gsap.fromTo(bigWord.current, { xPercent: 8 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } })
    },
    { scope: ref },
  )

  return (
    <section id="power" ref={ref} aria-label="Feel the power" className="relative h-[280vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* layered depth: giant outline word, streaks, liquid splash */}
        <div ref={bigWord} aria-hidden className="text-outline pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 whitespace-nowrap font-display text-[34vw] font-bold leading-none tracking-[-0.06em]">
          POWER POWER
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {streaks.map((s, i) => (
            <span
              key={i}
              className={`absolute left-0 h-px ${s.green ? 'bg-gradient-to-r from-transparent via-glow to-transparent' : 'bg-gradient-to-r from-transparent via-white/70 to-transparent'}`}
              style={{
                top: `${s.top}%`,
                width: s.w,
                animation: `streak ${s.dur}s cubic-bezier(.5,0,.2,1) ${s.delay}s infinite`,
                opacity: active > 0 ? 0.8 : 0,
                transition: 'opacity 1s',
              }}
            />
          ))}
        </div>
        <div
          ref={splash}
          aria-hidden
          className="pointer-events-none absolute bottom-[-14vh] left-1/2 w-[130vw] -translate-x-1/2 mix-blend-screen md:left-[67%] md:w-[min(62vw,1000px)]"
          style={{ maskImage: 'radial-gradient(ellipse 55% 60% at 50% 62%, #000 45%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 55% 60% at 50% 62%, #000 45%, transparent 75%)' }}
        >
          <img src="/images/macro.webp" srcSet="/images/macro-sm.webp 900w, /images/macro.webp 1800w" sizes="(min-width: 768px) 62vw, 130vw" alt="" loading="lazy" decoding="async" className="w-full opacity-80 transition-[filter] duration-1000" style={{ filter: `hue-rotate(${splashHue}deg) saturate(1.15)` }} />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between px-5 pb-8 pt-24 sm:px-8 md:pb-10 md:pt-28 lg:px-12">
          <div className="max-w-[min(92vw,52rem)] md:max-w-[56vw]">
            <span className="eyebrow mb-5 flex items-center gap-3 text-glow">
              <span className="h-px w-10 bg-glow" /> Flavour explosion
            </span>
            <SplitReveal as="h2" type="chars" className="display drop-deep text-[clamp(3.4rem,11.5vw,11rem)] leading-[0.82]">
              Feel the <br />
              <span className="text-glow">power.</span>
            </SplitReveal>
            <p className="text-shadow-deep mt-6 max-w-md text-steel">
              One bottle. A full day of vitamin C, real fruit and a sparkling rush built to last from the first track to the final encore. This is what a good night tastes like.
            </p>
          </div>

          {/* desktop cards */}
          <div className="hidden grid-cols-3 gap-4 md:grid md:max-w-[60vw] lg:max-w-[58vw]">
            {CARDS.map((c, i) => (
              <Card key={c.n} c={c} on={active > i} idx={i} />
            ))}
          </div>

          {/* mobile: the latest card */}
          <div className="md:hidden">
            <div className="relative min-h-[190px]">
              {CARDS.map((c, i) => (
                <div key={c.n} className={`absolute inset-x-0 bottom-0 transition-opacity duration-700 ${Math.max(1, active) - 1 === i ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
                  <Card c={c} on={active > i} idx={0} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-2" aria-hidden>
              {CARDS.map((c, i) => (
                <span key={c.n} className={`h-[3px] rounded-full transition-all duration-500 ${active > i ? 'w-8 bg-glow' : 'w-3 bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
