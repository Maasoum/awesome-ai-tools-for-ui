import { useEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Overlay, CloseButton } from './Overlay'
import { useUI } from '../store/ui'
import { flavorById, DEFAULT_FLAVOR, type FlavorId } from '../lib/flavors'
import { ProductThumb } from '../sections/Products'
import { Button } from './Button'
import { scrollToTarget } from '../lib/smoothScroll'

type Weights = Partial<Record<FlavorId, number>>

const QUESTIONS: { q: string; a: { l: string; w: Weights }[] }[] = [
  {
    q: 'Where does your night start?',
    a: [
      { l: 'Rooftop at sunset', w: { mandarin: 2, cactus: 1 } },
      { l: 'Front row at the festival', w: { lime: 2, mandarin: 1 } },
      { l: 'Underground club', w: { pomegranate: 2, sparkling: 1 } },
      { l: 'Pool party', w: { sparkling: 2, cactus: 1 } },
    ],
  },
  {
    q: 'Pick your soundtrack.',
    a: [
      { l: 'Disco & house', w: { cactus: 2, mandarin: 1 } },
      { l: 'Techno till sunrise', w: { pomegranate: 2, sparkling: 1 } },
      { l: 'Festival anthems', w: { lime: 2, mandarin: 1 } },
      { l: 'Chill beats', w: { sparkling: 2, cactus: 1 } },
    ],
  },
  {
    q: 'How do you like it?',
    a: [
      { l: 'Sweet & exotic', w: { cactus: 2, pomegranate: 1 } },
      { l: 'Bright & juicy', w: { mandarin: 2, lime: 1 } },
      { l: 'Sour & zesty', w: { lime: 2, sparkling: 1 } },
      { l: 'Deep & fruity', w: { pomegranate: 2, cactus: 1 } },
    ],
  },
]

export function VibeQuiz() {
  const open = useUI((s) => s.quizOpen)
  const setOpen = useUI((s) => s.setQuizOpen)
  const setFlavor = useUI((s) => s.setFlavor)
  const addToCart = useUI((s) => s.addToCart)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Weights[]>([])

  useEffect(() => {
    if (open) {
      setStep(0)
      setAnswers([])
    }
  }, [open])

  const close = () => setOpen(false)
  const finished = step >= QUESTIONS.length
  const result: FlavorId = (() => {
    const c: Record<FlavorId, number> = { cactus: 0, sparkling: 0, mandarin: 0, pomegranate: 0, lime: 0 }
    answers.forEach((w, i) => (Object.entries(w) as [FlavorId, number][]).forEach(([k, v]) => (c[k] += v * (i === 0 ? 1.1 : 1))))
    return (Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] as FlavorId) ?? DEFAULT_FLAVOR
  })()
  const f = flavorById(result)

  return (
    <Overlay open={open} onClose={close} label="Vibe finder" className="!max-w-3xl">
      <div className="relative p-6 md:p-10" style={finished ? ({ '--accent': f.accent } as CSSProperties) : undefined}>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="eyebrow text-[var(--accent)]">Vibe finder</span>
            <div className="flex gap-1.5" aria-hidden>
              {QUESTIONS.map((_, i) => (
                <span key={i} className={`h-[3px] rounded-full transition-all duration-500 ${i < step ? 'w-6 bg-[var(--accent)]' : i === step ? 'w-6 bg-white/40' : 'w-3 bg-white/15'}`} />
              ))}
            </div>
          </div>
          <CloseButton onClick={close} />
        </div>

        <AnimatePresence mode="wait">
          {!finished ? (
            <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <span className="font-tech text-[0.6rem] tracking-[0.3em] text-steel">QUESTION 0{step + 1} / 03</span>
              <h3 className="display mt-3 text-[clamp(2rem,5vw,3.6rem)]">{QUESTIONS[step].q}</h3>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {QUESTIONS[step].a.map((a, i) => (
                  <button
                    key={a.l}
                    onClick={() => {
                      setAnswers((s) => [...s, a.w])
                      setStep((s) => s + 1)
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left sm:p-5 transition-all duration-500 hover:-translate-y-1 hover:border-glow/60 hover:bg-white/[0.04]"
                  >
                    <span className="font-tech text-[0.55rem] tracking-[0.3em] text-glow">{String.fromCharCode(65 + i)}</span>
                    <span className="mt-4 block pr-5 font-display text-base font-semibold sm:mt-6 sm:text-lg">{a.l}</span>
                    <span className="absolute bottom-5 right-5 text-steel transition-transform group-hover:translate-x-1 group-hover:text-glow">→</span>
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button
                  onClick={() => {
                    setStep((s) => s - 1)
                    setAnswers((s) => s.slice(0, -1))
                  }}
                  className="mt-6 text-xs uppercase tracking-[0.2em] text-steel hover:text-bone"
                >
                  ← Back
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
              <div className="relative mx-auto grid h-64 w-40 place-items-center">
                <div className="absolute inset-0 rounded-full opacity-40 blur-3xl" style={{ background: f.accent }} />
                <ProductThumb flavor={f} className="relative h-64 w-auto" />
              </div>
              <div>
                <span className="font-tech text-[0.6rem] tracking-[0.3em] text-steel">YOUR VIBE IS</span>
                <h3 className="display mt-2 text-[clamp(2.6rem,6vw,4.6rem)]">
                  Adrin <span style={{ color: f.accent }}>{f.short}</span>
                </h3>
                <p className="mt-3 max-w-md text-steel">{f.description}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      setFlavor(f.id)
                      close()
                      window.setTimeout(() => scrollToTarget('#products'), 400)
                    }}
                  >
                    See it in 3D
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      addToCart(f.id, 'four', 1)
                      close()
                    }}
                  >
                    Add a 4-pack
                  </Button>
                </div>
                <button onClick={() => { setStep(0); setAnswers([]) }} className="mt-5 text-xs uppercase tracking-[0.2em] text-steel hover:text-bone">
                  ↺ Retake
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Overlay>
  )
}
