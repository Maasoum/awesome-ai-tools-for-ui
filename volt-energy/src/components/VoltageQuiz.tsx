import { useEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Overlay, CloseButton } from './Overlay'
import { useUI } from '../store/ui'
import { flavorById, type FlavorId } from '../lib/flavors'
import { ProductThumb } from '../sections/Products'
import { Button } from './Button'
import { scrollToTarget } from '../lib/smoothScroll'

const QUESTIONS: { q: string; a: { l: string; f: FlavorId }[] }[] = [
  {
    q: 'When do you need the charge?',
    a: [
      { l: 'Training & competition', f: 'original' },
      { l: 'Sun-soaked weekends', f: 'tropical' },
      { l: 'Late-night deep work', f: 'ice' },
    ],
  },
  {
    q: 'Pick your temperature.',
    a: [
      { l: 'Electric', f: 'original' },
      { l: 'Red hot', f: 'tropical' },
      { l: 'Ice cold', f: 'ice' },
    ],
  },
  {
    q: 'How do you move?',
    a: [
      { l: 'Relentless', f: 'original' },
      { l: 'Bold & loud', f: 'tropical' },
      { l: 'Precise & calm', f: 'ice' },
    ],
  },
]

export function VoltageQuiz() {
  const open = useUI((s) => s.quizOpen)
  const setOpen = useUI((s) => s.setQuizOpen)
  const setFlavor = useUI((s) => s.setFlavor)
  const addToCart = useUI((s) => s.addToCart)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<FlavorId[]>([])

  useEffect(() => {
    if (open) {
      setStep(0)
      setAnswers([])
    }
  }, [open])

  const close = () => setOpen(false)
  const finished = step >= QUESTIONS.length
  const result: FlavorId = (() => {
    const c: Record<FlavorId, number> = { original: 0, tropical: 0, ice: 0 }
    answers.forEach((a, i) => (c[a] += i === 0 ? 1.1 : 1))
    return (Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] as FlavorId) ?? 'original'
  })()
  const f = flavorById(result)

  return (
    <Overlay open={open} onClose={close} label="Voltage finder" className="!max-w-3xl">
      <div className="relative p-6 md:p-10" style={{ '--accent': finished ? f.accent : '#B6FF00' } as CSSProperties}>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="eyebrow text-[var(--accent)]">Voltage finder</span>
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
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {QUESTIONS[step].a.map((a, i) => (
                  <button
                    key={a.l}
                    onClick={() => {
                      setAnswers((s) => [...s, a.f])
                      setStep((s) => s + 1)
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 p-5 text-left transition-all duration-500 hover:-translate-y-1 hover:border-volt/60 hover:bg-white/[0.04]"
                  >
                    <span className="font-tech text-[0.55rem] tracking-[0.3em] text-volt">{String.fromCharCode(65 + i)}</span>
                    <span className="mt-6 block font-display text-lg font-semibold">{a.l}</span>
                    <span className="absolute bottom-5 right-5 text-steel transition-transform group-hover:translate-x-1 group-hover:text-volt">→</span>
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
                <span className="font-tech text-[0.6rem] tracking-[0.3em] text-steel">YOUR VOLTAGE IS</span>
                <h3 className="display mt-2 text-[clamp(2.6rem,6vw,4.6rem)]">
                  Volt <span style={{ color: f.accent }}>{f.short}</span>
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
