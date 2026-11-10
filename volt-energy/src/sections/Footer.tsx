import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '../components/Logo'
import { FLAVORS } from '../lib/flavors'
import { useUI } from '../store/ui'
import { scrollToTarget } from '../lib/smoothScroll'

export function Footer() {
  const setFlavor = useUI((s) => s.setFlavor)
  const showToast = useUI((s) => s.showToast)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'error' | 'done'>('idle')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setState('error')
    setState('done')
    setEmail('')
  }

  const pick = (id: (typeof FLAVORS)[number]['id']) => {
    setFlavor(id)
    scrollToTarget('#products')
  }

  return (
    <footer className="grain relative z-20 overflow-hidden border-t border-white/[0.06] bg-char">
      <div className="px-5 pb-10 pt-20 sm:px-8 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo />
            <h3 className="display mt-8 text-[clamp(2rem,4vw,3.4rem)]">
              Stay <span className="text-volt">charged.</span>
            </h3>
            <p className="mt-3 max-w-sm text-sm text-steel">Drops, athlete collabs and limited editions — before anyone else.</p>
            <form onSubmit={submit} noValidate className="mt-6 max-w-md">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className={`flex items-center rounded-full border bg-ink/60 p-1.5 pl-5 transition-colors ${state === 'error' ? 'border-red-500/70' : 'border-white/10 focus-within:border-volt/60'}`}>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state !== 'idle') setState('idle')
                  }}
                  placeholder="your@email.com"
                  className="min-w-0 flex-1 bg-transparent text-sm text-bone placeholder:text-steel/50 focus:outline-none"
                  aria-invalid={state === 'error'}
                  aria-describedby="email-msg"
                />
                <button type="submit" className="h-11 shrink-0 rounded-full bg-volt px-6 font-display text-[0.65rem] font-bold uppercase tracking-[0.24em] text-ink transition-transform hover:scale-[1.03]">
                  Join
                </button>
              </div>
              <div id="email-msg" className="mt-2 h-5 text-xs" aria-live="polite">
                <AnimatePresence mode="wait">
                  {state === 'error' && (
                    <motion.span key="e" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400">
                      Please enter a valid email address.
                    </motion.span>
                  )}
                  {state === 'done' && (
                    <motion.span key="d" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-volt">
                      You&rsquo;re in. Welcome to the voltage.
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            <div>
              <h4 className="eyebrow mb-5 text-steel">Products</h4>
              <ul className="space-y-3">
                {FLAVORS.map((f) => (
                  <li key={f.id}>
                    <button onClick={() => pick(f.id)} className="group flex items-center gap-2 text-sm text-bone transition-colors hover:text-volt">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.accent }} />
                      {f.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="eyebrow mb-5 text-steel">Discover</h4>
              <ul className="space-y-3 text-sm">
                {[
                  ['Our story', '#story'],
                  ['Ingredients', '#ingredients'],
                  ['Feel the power', '#power'],
                  ['Voltage finder', '#voltage'],
                ].map(([l, h]) => (
                  <li key={h}>
                    <button onClick={() => scrollToTarget(h)} className="text-bone transition-colors hover:text-volt">
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="eyebrow mb-5 text-steel">Support</h4>
              <ul className="space-y-3 text-sm">
                {['Shipping', 'Returns', 'Contact', 'Stockists'].map((l) => (
                  <li key={l}>
                    <button onClick={() => showToast(`${l} — available in the full store launch`)} className="text-bone transition-colors hover:text-volt">
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div aria-hidden className="mt-20 select-none font-tech text-[23vw] font-black leading-[0.8] tracking-[0.02em] text-white/[0.035]">VOLT</div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/[0.06] pt-6 text-xs text-steel/70 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} VOLT Energy Co. A fictional brand for a design showcase. High caffeine content.</span>
          <div className="flex gap-5">
            {['Instagram', 'TikTok', 'YouTube', 'X'].map((s) => (
              <button key={s} onClick={() => showToast(`VOLT on ${s} — coming soon`)} className="transition-colors hover:text-volt">
                {s}
              </button>
            ))}
            <button onClick={() => scrollToTarget('#home')} className="text-bone transition-colors hover:text-volt">
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
