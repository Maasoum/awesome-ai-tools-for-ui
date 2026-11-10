import { useEffect, useRef, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FLAVORS, flavorById, type Flavor } from '../lib/flavors'
import { useUI, formatPrice } from '../store/ui'
import { Button } from '../components/Button'
import { StaticCan } from '../components/StaticCan'
import { SplitReveal } from '../components/SplitReveal'

const ease = [0.16, 1, 0.3, 1] as const

export function ProductThumb({ flavor, className = '' }: { flavor: Flavor; className?: string }) {
  const render = useUI((s) => s.renders[flavor.id])
  if (render) return <img src={render} alt={`${flavor.name} can`} className={`object-contain ${className}`} draggable={false} />
  return <StaticCan flavor={flavor} className={className} />
}

function SelectorCard({ f, active, onSelect }: { f: Flavor; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Select ${f.name}`}
      style={{ '--c': f.accent } as CSSProperties}
      className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-3 pr-5 text-left transition-all duration-500 ease-[var(--ease-expo)] ${
        active ? 'border-[var(--c)]/60 bg-white/[0.05]' : 'border-white/[0.07] bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.04]'
      }`}
    >
      <span
        className="pointer-events-none absolute -left-8 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-60"
        style={{ background: f.accent, opacity: active ? 0.35 : undefined }}
      />
      <span className="relative grid h-20 w-14 shrink-0 place-items-center">
        <ProductThumb flavor={f} className="h-20 w-auto transition-transform duration-700 ease-[var(--ease-expo)] group-hover:-translate-y-1 group-hover:-rotate-6 group-hover:scale-110" />
      </span>
      <span className="relative flex-1">
        <span className="font-tech text-[0.55rem] tracking-[0.3em]" style={{ color: f.accent }}>
          {f.index}
        </span>
        <span className="mt-1 block font-display text-sm font-bold uppercase tracking-[0.08em] text-bone">{f.name}</span>
        <span className="mt-0.5 block text-xs text-steel">{f.notes.slice(0, 2).join(' · ')}</span>
      </span>
      <span
        className={`relative h-2 w-2 rounded-full transition-all duration-500 ${active ? 'scale-100' : 'scale-50 opacity-40'}`}
        style={{ background: f.accent, boxShadow: active ? `0 0 14px ${f.accent}` : 'none' }}
      />
    </button>
  )
}

export function Products() {
  const flavorId = useUI((s) => s.flavor)
  const setFlavor = useUI((s) => s.setFlavor)
  const stepFlavor = useUI((s) => s.stepFlavor)
  const setProductOpen = useUI((s) => s.setProductOpen)
  const webgl = useUI((s) => s.webgl)
  const flavor = flavorById(flavorId)
  const ref = useRef<HTMLElement>(null)

  // keyboard arrows while the showcase is on screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!ref.current) return
      const r = ref.current.getBoundingClientRect()
      const inView = r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (!inView || tag === 'input' || tag === 'textarea') return
      if (e.key === 'ArrowRight') stepFlavor(1)
      if (e.key === 'ArrowLeft') stepFlavor(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stepFlavor])

  return (
    <section
      id="products"
      ref={ref}
      aria-label="Products"
      className="relative min-h-[100svh] w-full overflow-hidden"
      style={{ '--accent': flavor.accent } as CSSProperties}
    >
      {/* accent light pool under the can */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[80%] h-[18vh] w-[46vh] -translate-x-1/2 rounded-[50%] opacity-50 mix-blend-screen blur-3xl transition-colors duration-1000 md:top-[79%]"
        style={{ background: flavor.accent }}
      />
      {!webgl && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <AnimatePresence mode="wait">
            <motion.div key={flavor.id} initial={{ opacity: 0, y: 30, rotate: -8 }} animate={{ opacity: 1, y: 0, rotate: -4 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.7, ease }}>
              <StaticCan flavor={flavor} className="h-[42vh] md:h-[60vh]" />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <div className="relative z-10 mx-auto grid min-h-[100svh] grid-rows-[auto_1fr_auto] gap-6 px-5 pb-8 pt-24 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-1 md:items-center md:pb-12 md:pt-28 lg:grid-cols-[minmax(0,26rem)_1fr_minmax(0,21rem)] lg:px-12">
        {/* product copy */}
        <div className="relative">
          <SplitReveal as="span" type="words" className="eyebrow mb-4 block text-[var(--accent)] transition-colors duration-700">
            The lineup · 3 flavors
          </SplitReveal>
          <div className="mb-3 flex items-center gap-3 font-tech text-[0.6rem] tracking-[0.3em] text-steel">
            <span className="text-[var(--accent)] transition-colors duration-700">{flavor.index}</span>
            <span className="h-px w-8 bg-white/20" />
            <span>03</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={flavor.id} initial="hide" animate="show" exit="exit">
              <h2 className="display drop-deep overflow-hidden text-[clamp(2.8rem,11vw,4rem)] md:text-[clamp(3rem,5.4vw,6rem)]">
                <motion.span className="block" variants={{ hide: { y: '105%' }, show: { y: 0 }, exit: { y: '-105%' } }} transition={{ duration: 0.8, ease }}>
                  Volt
                </motion.span>
                <motion.span
                  className="block"
                  style={{ color: flavor.accent }}
                  variants={{ hide: { y: '105%' }, show: { y: 0 }, exit: { y: '-105%' } }}
                  transition={{ duration: 0.8, delay: 0.06, ease }}
                >
                  {flavor.short}
                </motion.span>
              </h2>
              <motion.div variants={{ hide: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } }} transition={{ duration: 0.7, delay: 0.15, ease }}>
                <p className="mt-5 font-display text-lg font-medium text-bone">{flavor.tagline}</p>
                <p className="mt-3 hidden max-w-sm text-sm leading-relaxed text-steel sm:block">{flavor.description}</p>
                <ul className="mt-5 hidden flex-wrap gap-2 md:flex">
                  {flavor.notes.map((n) => (
                    <li key={n} className="rounded-full border border-white/10 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.14em] text-steel">
                      {n}
                    </li>
                  ))}
                </ul>
                <dl className="mt-6 hidden max-w-sm grid-cols-3 gap-4 border-t border-white/10 pt-5 md:grid">
                  {[
                    ['Caffeine', flavor.caffeine],
                    ['Sugar', flavor.sugar],
                    ['Kcal', flavor.calories],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-tech text-[0.52rem] tracking-[0.28em] text-steel">{k.toUpperCase()}</dt>
                      <dd className="display mt-1 text-2xl">{v}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-7 hidden items-center gap-5 md:flex">
            <Button onClick={() => setProductOpen(flavor.id)}>Explore product</Button>
            <span className="font-tech text-sm tracking-[0.1em] text-bone">{formatPrice(flavor.price)}</span>
          </div>
        </div>

        <div className="hidden lg:block" />

        {/* selector */}
        <div className="flex flex-col gap-4 self-end md:self-center">
          <div className="hidden items-center justify-between md:flex">
            <span className="eyebrow text-steel">Select flavor</span>
            <div className="flex gap-2">
              {([-1, 1] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => stepFlavor(d)}
                  aria-label={d < 0 ? 'Previous flavor' : 'Next flavor'}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-bone transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" className={d < 0 ? 'rotate-180' : ''} aria-hidden>
                    <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" fill="none" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div className="hidden flex-col gap-3 md:flex">
            {FLAVORS.map((f) => (
              <SelectorCard key={f.id} f={f} active={f.id === flavorId} onSelect={() => setFlavor(f.id)} />
            ))}
          </div>
          <div className="hidden items-center gap-3 font-tech text-[0.55rem] tracking-[0.28em] text-steel md:flex">
            <span className="h-2 w-2 rounded-full transition-colors duration-700" style={{ background: flavor.accent, boxShadow: `0 0 10px ${flavor.accent}` }} />
            ACCENT LIGHT · {flavor.lightLabel.toUpperCase()}
          </div>

          {/* mobile selector */}
          <div className="md:hidden">
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Select flavor">
              {FLAVORS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFlavor(f.id)}
                  aria-pressed={f.id === flavorId}
                  className={`flex flex-col items-center rounded-xl border px-2 pb-2 pt-1 transition-colors ${f.id === flavorId ? 'bg-white/[0.06]' : 'border-white/10'}`}
                  style={{ borderColor: f.id === flavorId ? f.accent : undefined }}
                >
                  <ProductThumb flavor={f} className="h-16 w-auto" />
                  <span className="mt-1 font-tech text-[0.5rem] tracking-[0.2em]" style={{ color: f.accent }}>
                    {f.short}
                  </span>
                </button>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={() => setProductOpen(flavor.id)}>
              Explore product
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
