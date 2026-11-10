import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Overlay, CloseButton } from './Overlay'
import { useUI, packPrice, formatPrice } from '../store/ui'
import { flavorById, PACKS } from '../lib/flavors'
import { ProductThumb } from '../sections/Products'
import { Button } from './Button'
import { scrollToTarget } from '../lib/smoothScroll'

const FREE = 30

export function CartDrawer() {
  const open = useUI((s) => s.cartOpen)
  const setOpen = useUI((s) => s.setCartOpen)
  const cart = useUI((s) => s.cart)
  const updateQty = useUI((s) => s.updateQty)
  const removeItem = useUI((s) => s.removeItem)
  const clearCart = useUI((s) => s.clearCart)
  const [done, setDone] = useState(false)
  const close = () => {
    setOpen(false)
    window.setTimeout(() => setDone(false), 600)
  }

  const subtotal = cart.reduce((a, c) => a + packPrice(c.flavor, c.pack) * c.qty, 0)
  const progress = Math.min(1, subtotal / FREE)

  return (
    <Overlay open={open} onClose={close} label="Shopping cart" side="right">
      <div className="flex min-h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/[0.07] p-6">
          <div>
            <span className="eyebrow text-steel">Your cart</span>
            <div className="display mt-1 text-3xl">
              {cart.reduce((a, c) => a + c.qty, 0)} <span className="text-volt">items</span>
            </div>
          </div>
          <CloseButton onClick={close} />
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full border border-volt text-volt shadow-[0_0_40px_-5px_#B6FF00]">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 12l5 5L20 6" />
              </svg>
            </div>
            <h3 className="display mt-6 text-3xl">Order charged.</h3>
            <p className="mt-2 text-sm text-steel">This is a demo checkout — no payment was taken. Thanks for feeling the voltage.</p>
            <Button className="mt-8" onClick={close}>
              Keep exploring
            </Button>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="font-tech text-6xl font-black text-white/[0.06]">0V</div>
            <h3 className="display mt-4 text-2xl">Running on empty.</h3>
            <p className="mt-2 text-sm text-steel">Your cart has no voltage yet.</p>
            <Button
              className="mt-8"
              onClick={() => {
                close()
                window.setTimeout(() => scrollToTarget('#products'), 350)
              }}
            >
              Shop the lineup
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b border-white/[0.07] px-6 py-4">
              <div className="mb-2 text-xs text-steel">
                {progress >= 1 ? <span className="text-volt">Free shipping unlocked ⚡</span> : <>Add {formatPrice(FREE - subtotal)} for free shipping</>}
              </div>
              <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-volt" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            </div>
            <ul className="flex-1 divide-y divide-white/[0.06] px-6">
              <AnimatePresence initial={false}>
                {cart.map((c) => {
                  const f = flavorById(c.flavor)
                  const p = PACKS.find((x) => x.id === c.pack)!
                  return (
                    <motion.li key={c.key} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30, height: 0 }} className="flex gap-4 py-5">
                      <div className="relative grid h-24 w-16 shrink-0 place-items-center rounded-xl bg-ink">
                        <div className="absolute inset-2 rounded-full opacity-30 blur-xl" style={{ background: f.accent }} />
                        <ProductThumb flavor={f} className="relative h-20 w-auto" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-display text-sm font-bold uppercase tracking-[0.06em]">{f.name}</div>
                            <div className="text-xs text-steel">{p.label}</div>
                          </div>
                          <div className="font-tech text-sm">{formatPrice(packPrice(c.flavor, c.pack) * c.qty)}</div>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex h-9 items-center rounded-full border border-white/10" role="group" aria-label={`Quantity for ${f.name}`}>
                            <button className="h-full w-9 hover:text-volt" onClick={() => updateQty(c.key, c.qty - 1)} aria-label="Decrease">
                              −
                            </button>
                            <span className="w-6 text-center font-tech text-xs tabular-nums">{c.qty}</span>
                            <button className="h-full w-9 hover:text-volt" onClick={() => updateQty(c.key, c.qty + 1)} aria-label="Increase">
                              +
                            </button>
                          </div>
                          <button onClick={() => removeItem(c.key)} className="text-xs uppercase tracking-[0.18em] text-steel hover:text-red-400">
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
            <div className="sticky bottom-0 border-t border-white/[0.07] bg-char p-6">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-steel">Subtotal</span>
                <span className="display text-3xl">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-steel/70">Taxes included. Shipping calculated at checkout.</p>
              <Button
                className="mt-5 w-full"
                onClick={() => {
                  clearCart()
                  setDone(true)
                }}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  )
}
