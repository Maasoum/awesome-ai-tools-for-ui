import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { SplitReveal, FadeIn } from '../components/SplitReveal'
import { prefersReducedMotion } from '../lib/env'

const STATS = [
  { v: '38', k: 'Countries on the guest list' },
  { v: '120+', k: 'Festivals & club nights' },
  { v: '5', k: 'Flavours. One bottle shape' },
]

function Marquee({ text, reverse = false, outline = false }: { text: string; reverse?: boolean; outline?: boolean }) {
  const row = Array.from({ length: 4 }, () => text).join('')
  return (
    <div className="flex overflow-hidden whitespace-nowrap" aria-hidden>
      <div className="animate-marquee flex shrink-0" style={{ animationDirection: reverse ? 'reverse' : 'normal' }}>
        {[0, 1].map((k) => (
          <span key={k} className={`display shrink-0 pr-8 text-[clamp(3rem,9vw,9rem)] ${outline ? 'text-outline' : 'text-bone'}`}>
            {row}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Story() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const amt = parseFloat(el.dataset.parallax || '10')
        gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
      gsap.utils.toArray<HTMLElement>('[data-clip]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(18% 10% 18% 10% round 24px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 25%', scrub: 1 } },
        )
      })
    },
    { scope: ref },
  )

  return (
    <section id="story" ref={ref} aria-label="Our story" className="grain relative z-20 overflow-hidden bg-ink">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glow/40 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-glow/[0.05] blur-[120px]" />

      <div className="relative py-16 md:py-24">
        <Marquee text="Push beyond limits — Feel the rush — Own every moment — " outline />
      </div>

      <div className="relative px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-12">
            <span className="eyebrow mb-6 flex items-center gap-3 text-glow">
              <span className="h-px w-10 bg-glow" /> Our story
            </span>
            <SplitReveal as="h2" className="display text-[clamp(3.2rem,11vw,12.5rem)] leading-[0.84]">
              Built for the <br />
              <span className="text-glow">unstoppable.</span>
            </SplitReveal>
          </div>
        </div>

        {/* layered imagery */}
        <div className="relative mt-16 md:mt-24">
          <div data-clip className="relative aspect-[16/10] overflow-hidden rounded-3xl sm:aspect-[16/9] lg:w-[78%]">
            <img
              data-parallax="5"
              src="/images/story-first-round.webp"
              srcSet="/images/story-first-round-sm.webp 900w, /images/story-first-round.webp 1800w"
              sizes="(min-width: 1024px) 78vw, 100vw"
              alt="Friends cheering under lasers and confetti, raising ADRIN bottles — Cactus, Mandarin, Pomegranate and Sparkling Lime"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-[114%] w-full -translate-y-[6%] object-cover object-[50%_45%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/20" />
            <div className="absolute bottom-5 left-5 font-tech text-[0.55rem] tracking-[0.3em] text-bone/70 md:bottom-8 md:left-8">
              FRAME 01 · <span className="text-glow">FIRST ROUND</span>
            </div>
          </div>

          <div className="relative -mt-6 ml-auto w-[68%] sm:-mt-24 sm:w-[48%] md:-mt-48 lg:absolute lg:-bottom-96 lg:right-0 lg:mt-0 lg:w-[34%]">
            <div data-clip className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
              <img
                data-parallax="8"
                src="/images/story-dj-set.webp"
                alt="A DJ seen from behind raising an ADRIN Mandarin bottle in his right hand to a festival crowd"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-[124%] w-full -translate-y-[10%] object-cover object-[55%_50%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
              <div className="absolute bottom-4 left-4 font-tech text-[0.55rem] tracking-[0.3em] text-bone/70">FRAME 02 · NO CURFEW</div>
            </div>
          </div>

          <div aria-hidden className="pointer-events-none absolute -left-4 -top-20 hidden font-tech text-[16vw] font-black leading-none text-white/[0.03] lg:block">
            01
          </div>
        </div>

        {/* manifesto */}
        <div className="relative mt-24 grid gap-14 pb-24 md:mt-44 lg:mt-[28rem] lg:grid-cols-12 lg:pb-36">
          <div className="lg:col-span-7">
            <SplitReveal as="p" type="words" stagger={0.025} className="font-display text-[clamp(1.6rem,3.1vw,3rem)] font-medium leading-[1.12] tracking-[-0.025em] text-bone">
              ADRIN is more than a drink. It&rsquo;s the moment the bass drops. Made for the ones who start the party, stay for the encore and{' '}
              <span className="text-glow">never settle for an ordinary night.</span>
            </SplitReveal>
          </div>
          <div className="flex flex-col justify-end lg:col-span-4 lg:col-start-9">
            <FadeIn>
              <p className="text-steel">
                Born backstage in the hours most people sleep through, ADRIN was made with DJs, dancers and festival crews who wanted something brighter than another energy drink. Real
                vitamins, real fruit — and a bottle that looks like the party it belongs to.
              </p>
            </FadeIn>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
          {STATS.map((s, i) => (
            <FadeIn key={s.k} delay={i * 0.1} className="bg-ink p-8 md:p-10">
              <div className="display text-[clamp(3rem,6vw,5.5rem)] text-bone">
                {s.v.replace(/[^0-9]/g, '')}
                <span className="text-glow">{s.v.replace(/[0-9]/g, '')}</span>
              </div>
              <div className="eyebrow mt-3 text-steel">{s.k}</div>
            </FadeIn>
          ))}
        </div>
      </div>

      <div className="relative mt-24 pb-24 md:mt-36 md:pb-32">
        <Marquee text="Adrin vitamin ✦ Party different ✦ " reverse />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
    </section>
  )
}
