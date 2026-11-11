import { useUI } from '../store/ui'
import { Button } from '../components/Button'
import { SplitReveal, FadeIn } from '../components/SplitReveal'
import { StaticBottle } from '../components/StaticBottle'
import { flavorById } from '../lib/flavors'

export function FinalCTA() {
  const setQuizOpen = useUI((s) => s.setQuizOpen)
  const webgl = useUI((s) => s.webgl)
  const flavor = useUI((s) => s.flavor)

  return (
    <section id="vibe" aria-label="What's your vibe" className="relative h-[100svh] min-h-[680px] overflow-hidden">
      {!webgl && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div aria-hidden className="text-outline absolute font-tech text-[30vw] font-black">ADRIN</div>
          <StaticBottle flavor={flavorById(flavor)} className="animate-float-can relative h-[56vh]" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-ink to-transparent" />

      <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto] px-5 pb-10 pt-24 sm:px-8 md:grid-cols-2 md:grid-rows-1 md:items-end md:pb-16 lg:px-12">
        <div className="md:self-center">
          <span className="eyebrow mb-5 flex items-center gap-3 text-glow">
            <span className="h-px w-10 bg-glow" /> Last call
          </span>
          <SplitReveal as="h2" className="display drop-deep text-[clamp(3rem,12vw,5rem)] md:text-[clamp(3rem,5vw,6.6rem)]">
            What&rsquo;s your <br />
            <span className="text-glow">vibe?</span>
          </SplitReveal>
        </div>
        <div className="md:hidden" />
        <FadeIn className="flex flex-col items-start gap-6 md:items-end md:text-right">
          <p className="text-shadow-deep max-w-xs font-display text-xl font-medium text-bone md:text-2xl">Your night starts here.</p>
          <Button size="lg" onClick={() => setQuizOpen(true)}>
            Find your flavour
          </Button>
          <span className="font-tech text-[0.55rem] tracking-[0.3em] text-steel">30-SECOND VIBE FINDER</span>
        </FadeIn>
      </div>
    </section>
  )
}
