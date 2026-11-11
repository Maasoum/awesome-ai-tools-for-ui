import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FLAVORS, flavorById, type Flavor } from '../lib/flavors'
import { useUI, formatPrice } from '../store/ui'
import { Button } from '../components/Button'
import { StaticBottle } from '../components/StaticBottle'
import { SplitReveal } from '../components/SplitReveal'

const ease = [0.16, 1, 0.3, 1] as const

export function ProductThumb({ flavor, className = '' }: { flavor: Flavor; className?: string }) {
  const render = useUI((s) => s.renders[flavor.id])
  if (render) return <img src={render} alt={`${flavor.name} bottle`} className={`object-contain ${className}`} draggable={false} />
  return <StaticBottle flavor={flavor} className={className} />
}

function SelectorCard({ f, active, onSelect }: { f: Flavor; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Select ${f.name}`}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-2 pr-4 text-left transition-all duration-500 ease-[var(--ease-expo)] ${
        active ? 'border-[var(--accent)]/70 bg-[var(--accent)]/[0.08]' : 'border-[var(--accent)]/[0.14] bg-white/[0.015] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/[0.05]'
      }`}
    >
      <span
        className="pointer-events-none absolute -left-8 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-[var(--accent)] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-60"
        style={{ opacity: active ? 0.35 : undefined }}
      />
      <span className="relative grid h-14 w-10 shrink-0 place-items-center">
        <ProductThumb flavor={f} className="h-14 w-auto transition-transform duration-700 ease-[var(--ease-expo)] group-hover:-translate-y-1 group-hover:-rotate-6 group-hover:scale-110" />
      </span>
      <span className="relative flex-1">
        <span className="font-tech text-[0.55rem] tracking-[0.3em] text-[var(--accent)]">
          {f.index}
        </span>
        <span className="mt-0.5 block font-display text-[0.8rem] font-bold uppercase tracking-[0.08em] text-bone">{f.name}</span>
        <span className="block text-[0.7rem] text-steel">{f.notes.slice(0, 2).join(' · ')}</span>
      </span>
      <span
        className={`relative h-2 w-2 rounded-full bg-[var(--accent)] transition-all duration-500 ${active ? 'scale-100 shadow-[0_0_14px_var(--accent)]' : 'scale-50 opacity-40'}`}
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
    >
      {/* accent light pool under the bottle */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[80%] h-[18vh] w-[46vh] -translate-x-1/2 rounded-[50%] opacity-50 mix-blend-screen blur-3xl transition-colors duration-1000 md:top-[79%]"
        style={{ background: 'var(--accent)' }}
      />
      {!webgl && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <AnimatePresence mode="wait">
            <motion.div key={flavor.id} initial={{ opacity: 0, y: 30, rotate: -8 }} animate={{ opacity: 1, y: 0, rotate: -4 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.7, ease }}>
              <StaticBottle flavor={flavor} className="h-[42vh] md:h-[60vh]" />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <div className="relative z-10 mx-auto grid min-h-[100svh] grid-rows-[auto_1fr_auto] gap-6 px-5 pb-8 pt-24 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-1 md:items-center md:pb-12 md:pt-28 lg:grid-cols-[minmax(0,26rem)_1fr_minmax(0,21rem)] lg:px-12">
        {/* product copy */}
        <div className="relative">
          <SplitReveal as="span" type="words" className="eyebrow mb-4 block text-[var(--accent)] transition-colors duration-700">
            The lineup · 5 flavours
          </SplitReveal>
          <div className="mb-3 flex items-center gap-3 font-tech text-[0.6rem] tracking-[0.3em] text-steel">
            <span className="text-[var(--accent)] transition-colors duration-700">{flavor.index}</span>
            <span className="h-px w-8 bg-white/20" />
            <span>{String(FLAVORS.length).padStart(2, '0')}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={flavor.id} initial="hide" animate="show" exit="exit">
              <h2 className={`display drop-deep overflow-hidden ${flavor.short.length > 9 ? 'text-[clamp(2.2rem,9vw,3.4rem)] md:text-[clamp(2.4rem,3.6vw,4rem)]' : 'text-[clamp(2.8rem,11vw,4rem)] md:text-[clamp(3rem,5vw,5.6rem)]'}`}>
                <motion.span className="block" variants={{ hide: { y: '105%' }, show: { y: 0 }, exit: { y: '-105%' } }} transition={{ duration: 0.8, ease }}>
                  Adrin
                </motion.span>
                <motion.span
                  className="block"
                  style={{ color: 'var(--accent)' }}
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
                    <li key={n} className="rounded-full border border-[var(--accent)]/30 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.14em] text-steel">
                      {n}
                    </li>
                  ))}
                </ul>
                <dl className="mt-6 hidden max-w-sm grid-cols-3 gap-4 border-t border-white/10 pt-5 md:grid">
                  {[
                    ['Vit C', flavor.vitaminC],
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
        <div className="flex flex-col gap-3 self-end md:self-center">
          <div className="hidden items-center justify-between md:flex">
            <span className="eyebrow text-[var(--accent)]">Select flavor</span>
            <div className="flex gap-2">
              {([-1, 1] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => stepFlavor(d)}
                  aria-label={d < 0 ? 'Previous flavor' : 'Next flavor'}
                  className="grid h-10 w-10 place-items-center rounded-full border border-[var(--accent)]/45 text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-on-glow"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" className={d < 0 ? 'rotate-180' : ''} aria-hidden>
                    <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" fill="none" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div className="hidden flex-col gap-2 md:flex">
            {FLAVORS.map((f) => (
              <SelectorCard key={f.id} f={f} active={f.id === flavorId} onSelect={() => setFlavor(f.id)} />
            ))}
          </div>
          <div className="hidden items-center gap-3 font-tech text-[0.55rem] tracking-[0.28em] text-steel md:flex">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
            ACCENT LIGHT · {flavor.lightLabel.toUpperCase()}
          </div>

          {/* mobile selector */}
          <div className="md:hidden">
            <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Select flavor">
              {FLAVORS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFlavor(f.id)}
                  aria-pressed={f.id === flavorId}
                  className={`flex flex-col items-center rounded-xl border px-1 pb-1.5 pt-1 transition-colors ${f.id === flavorId ? 'border-[var(--accent)] bg-[var(--accent)]/[0.08]' : 'border-[var(--accent)]/20'}`}
                >
                  <ProductThumb flavor={f} className="h-14 w-auto" />
                  <span className="mt-1 text-center font-tech text-[0.42rem] leading-tight tracking-[0.12em] text-[var(--accent)]">
                    {f.short.replace('SPARKLING ', '')}
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
