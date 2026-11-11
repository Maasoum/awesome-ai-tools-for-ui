import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Logo } from './Logo'
import { scrollToTarget, lockScroll } from '../lib/smoothScroll'
import { useUI } from '../store/ui'

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'products', label: 'Products' },
  { id: 'story', label: 'Our Story' },
  { id: 'ingredients', label: 'Ingredients' },
]

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 4h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9.5" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" />
    </svg>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [active, setActive] = useState('home')
  const [open, setOpen] = useState(false)
  const ready = useUI((s) => s.sceneReady)
  const cartCount = useUI((s) => s.cart.reduce((a, c) => a + c.qty, 0))
  const setCartOpen = useUI((s) => s.setCartOpen)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > window.innerHeight * 0.8)
        last = y
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!ready) return
    const triggers = LINKS.map((l) =>
      ScrollTrigger.create({
        trigger: `#${l.id}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && setActive(l.id),
      }),
    )
    return () => triggers.forEach((t) => t.kill())
  }, [ready])

  const wasOpen = useRef(false)
  useEffect(() => {
    if (open || wasOpen.current) lockScroll(open)
    wasOpen.current = open
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    // allow the menu to unlock scrolling first
    window.setTimeout(() => scrollToTarget(`#${id}`), open ? 350 : 0)
  }

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: ready && (!hidden || open) ? 0 : -110, opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={`mx-auto flex items-center justify-between px-5 transition-all duration-700 ease-[var(--ease-expo)] sm:px-8 lg:px-12 ${
            scrolled && !open ? 'h-[68px] border-b border-white/[0.06] bg-ink/55 backdrop-blur-xl' : 'h-[88px] border-b border-transparent'
          }`}
        >
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault()
              go('home')
            }}
            className="relative z-10"
            aria-label="ADRIN Vitamin — back to top"
          >
            <Logo />
          </a>

          <nav aria-label="Primary" className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <ul className="flex items-center gap-1 rounded-full border border-[var(--accent)]/25 bg-white/[0.025] p-1 backdrop-blur-md transition-colors duration-700">
              {LINKS.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      go(l.id)
                    }}
                    aria-current={active === l.id ? 'true' : undefined}
                    className={`relative block rounded-full px-5 py-2 font-display text-[0.68rem] font-semibold uppercase tracking-[0.24em] transition-colors duration-300 ${
                      active === l.id ? 'text-on-glow' : 'text-steel hover:text-[var(--accent)]'
                    }`}
                  >
                    {active === l.id && (
                      <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-glow" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />
                    )}
                    <span className="relative">{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative grid h-11 w-11 place-items-center rounded-full border border-glow/45 text-glow transition-colors hover:border-glow hover:bg-glow hover:text-on-glow"
              aria-label={`Open cart, ${cartCount} items`}
            >
              <CartIcon />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-glow px-1 font-tech text-[0.58rem] font-bold text-on-glow"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              onClick={() => go('products')}
              className="group relative hidden h-11 items-center gap-2 overflow-hidden rounded-full bg-glow px-6 font-display text-[0.68rem] font-bold uppercase tracking-[0.24em] text-on-glow sm:inline-flex"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Shop Adrin</span>
            </button>
            <button
              onClick={() => setOpen((o) => !o)}
              className="relative grid h-11 w-11 place-items-center rounded-full border border-glow/45 lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <span className="relative block h-3 w-5">
                <motion.span className="absolute left-0 top-0 h-[1.5px] w-5 bg-bone" animate={open ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }} transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }} />
                <motion.span className="absolute bottom-0 left-0 h-[1.5px] w-5 bg-bone" animate={open ? { rotate: -45, y: -5.5, width: 20 } : { rotate: 0, y: 0, width: 13 }} transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }} />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col justify-between bg-ink/95 px-6 pb-10 pt-28 backdrop-blur-2xl lg:hidden"
            initial={{ clipPath: 'circle(0% at calc(100% - 44px) 44px)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 44px) 44px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 44px) 44px)' }}
            transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="pointer-events-none absolute -right-20 bottom-0 font-tech text-[38vw] font-black leading-none text-white/[0.025]">V</div>
            <nav aria-label="Mobile">
              <ul className="space-y-2">
                {LINKS.map((l, i) => (
                  <li key={l.id} className="overflow-hidden">
                    <motion.a
                      href={`#${l.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        go(l.id)
                      }}
                      initial={{ y: '110%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '110%' }}
                      transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      className={`display flex items-baseline gap-4 text-[13vw] sm:text-7xl ${active === l.id ? 'text-glow' : 'text-bone'}`}
                    >
                      <span className="font-tech text-xs tracking-[0.3em] text-steel">0{i + 1}</span>
                      {l.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </nav>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.5 }} className="space-y-6">
              <button onClick={() => go('products')} className="flex h-14 w-full items-center justify-center rounded-full bg-glow font-display text-xs font-bold uppercase tracking-[0.28em] text-on-glow">
                Shop Adrin
              </button>
              <div className="flex justify-between font-tech text-[0.6rem] tracking-[0.3em] text-steel">
                <span>POWER</span>
                <span>PERFORMANCE</span>
                <span>ENERGY</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
