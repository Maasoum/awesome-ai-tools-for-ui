import { useEffect, useState, type CSSProperties } from 'react'
import { Overlay, CloseButton } from './Overlay'
import { useUI, packPrice, formatPrice } from '../store/ui'
import { flavorById, FLAVORS, DEFAULT_FLAVOR, PACKS, type PackId } from '../lib/flavors'
import { ProductThumb } from '../sections/Products'
import { Button } from './Button'

export function ProductModal() {
  const open = useUI((s) => s.productOpen)
  const setOpen = useUI((s) => s.setProductOpen)
  const addToCart = useUI((s) => s.addToCart)
  const setCartOpen = useUI((s) => s.setCartOpen)
  const [pack, setPack] = useState<PackId>('four')
  const [qty, setQty] = useState(1)
  const [last, setLast] = useState(open)

  useEffect(() => {
    if (open) {
      setLast(open)
      setQty(1)
    }
  }, [open])

  const f = flavorById(open ?? last ?? DEFAULT_FLAVOR)
  const close = () => setOpen(null)
  const total = packPrice(f.id, pack) * qty

  return (
    <Overlay open={!!open} onClose={close} label={`${f.name} details`}>
      <div className="grid md:grid-cols-2" style={{ '--accent': f.accent } as CSSProperties}>
        <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-ink md:min-h-[600px]">
          <div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[80px]" style={{ background: f.accent }} />
          <div aria-hidden className="absolute inset-0 grid place-items-center font-tech text-[9rem] font-black text-white/[0.03] md:text-[14rem]">
            {f.index}
          </div>
          <ProductThumb flavor={f} className="relative h-[260px] w-auto drop-shadow-[0_40px_60px_rgba(0,0,0,0.8)] md:h-[480px]" />
          <div className="absolute bottom-5 left-5 font-tech text-[0.55rem] tracking-[0.3em] text-steel">330ML · {f.lightLabel.toUpperCase()}</div>
        </div>
        <div className="relative p-6 md:p-10">
          <CloseButton onClick={close} className="absolute right-5 top-5" />
          <span className="font-tech text-[0.6rem] tracking-[0.3em]" style={{ color: f.accent }}>
            {f.index} / {String(FLAVORS.length).padStart(2, '0')}
          </span>
          <h2 className={`display mt-3 ${f.short.length > 9 ? 'text-4xl md:text-5xl' : 'text-5xl md:text-6xl'}`}>
            Adrin <span style={{ color: f.accent }}>{f.short}</span>
          </h2>
          <p className="mt-4 font-display text-lg text-bone">{f.tagline}</p>
          <p className="mt-3 text-sm leading-relaxed text-steel">{f.description}</p>

          <dl className="mt-6 grid grid-cols-4 gap-3 border-y border-white/10 py-5">
            {[
              ['Vit C', f.vitaminC],
              ['Sugar', f.sugar],
              ['Kcal', f.calories],
              ['Caffeine', '80mg'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-tech text-[0.5rem] tracking-[0.25em] text-steel">{k.toUpperCase()}</dt>
                <dd className="display mt-1 text-xl">{v}</dd>
              </div>
            ))}
          </dl>

          <fieldset className="mt-6">
            <legend className="eyebrow mb-3 text-steel">Pack size</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PACKS.map((p) => (
                <label
                  key={p.id}
                  className={`cursor-pointer rounded-xl border p-3 text-center transition-colors ${pack === p.id ? 'bg-white/[0.06]' : 'border-white/10 hover:border-white/25'}`}
                  style={{ borderColor: pack === p.id ? f.accent : undefined }}
                >
                  <input type="radio" name="pack" value={p.id} checked={pack === p.id} onChange={() => setPack(p.id)} className="sr-only" />
                  <span className="block font-display text-sm font-semibold">{p.label}</span>
                  <span className="mt-1 block font-tech text-[0.6rem] tracking-[0.1em] text-steel">{formatPrice(packPrice(f.id, p.id))}</span>
                  {p.discount > 0 && (
                    <span className="mt-1 block text-[0.6rem] font-semibold" style={{ color: f.accent }}>
                      −{Math.round(p.discount * 100)}%
                    </span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex h-13 items-center rounded-full border border-white/10" role="group" aria-label="Quantity">
              <button className="h-full w-12 text-lg text-bone hover:text-[var(--accent)]" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                −
              </button>
              <span className="w-8 text-center font-tech text-sm tabular-nums" aria-live="polite">
                {qty}
              </span>
              <button className="h-full w-12 text-lg text-bone hover:text-[var(--accent)]" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity">
                +
              </button>
            </div>
            <Button
              className="flex-1"
              onClick={() => {
                addToCart(f.id, pack, qty)
                close()
                window.setTimeout(() => setCartOpen(true), 450)
              }}
            >
              Add to cart · {formatPrice(total)}
            </Button>
          </div>
          <p className="mt-4 text-xs text-steel/70">Free shipping over €30 · Ships in recyclable aluminium-friendly packaging.</p>
        </div>
      </div>
    </Overlay>
  )
}
