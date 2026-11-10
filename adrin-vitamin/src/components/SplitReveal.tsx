import { useRef, type ElementType, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/env'

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP)

interface Props {
  as?: ElementType
  children: ReactNode
  className?: string
  type?: 'lines' | 'words' | 'chars'
  delay?: number
  stagger?: number
  /** start immediately (e.g. hero) instead of on scroll */
  immediate?: boolean
  /** wait until this is true before animating */
  ready?: boolean
  start?: string
}

/** Masked line/word/char reveal powered by GSAP SplitText + ScrollTrigger. */
export function SplitReveal({ as: Tag = 'div', children, className = '', type = 'lines', delay = 0, stagger, immediate = false, ready = true, start = 'top 85%' }: Props) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1 })
        return
      }
      if (!ready) {
        gsap.set(el, { autoAlpha: 0 })
        return
      }
      gsap.set(el, { autoAlpha: 1 })
      const split = SplitText.create(el, {
        type: type === 'chars' ? 'chars,lines' : type === 'words' ? 'words,lines' : 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          const targets = type === 'chars' ? self.chars : type === 'words' ? self.words : self.lines
          return gsap.from(targets, {
            yPercent: 115,
            rotate: type === 'lines' ? 2 : 0,
            duration: type === 'chars' ? 1.1 : 1.3,
            ease: 'expo.out',
            stagger: stagger ?? (type === 'chars' ? 0.035 : type === 'words' ? 0.06 : 0.11),
            delay,
            scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
          })
        },
      })
      return () => split.revert()
    },
    { dependencies: [ready], scope: ref },
  )

  return (
    <Tag ref={ref} className={className} style={{ visibility: 'hidden' }}>
      {children}
    </Tag>
  )
}

/** Simple fade/slide reveal for non-text blocks. */
export function FadeIn({ children, className = '', delay = 0, y = 40, start = 'top 88%' }: { children: ReactNode; className?: string; delay?: number; y?: number; start?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return
      gsap.from(ref.current, { y, autoAlpha: 0, duration: 1.4, ease: 'expo.out', delay, scrollTrigger: { trigger: ref.current, start, once: true } })
    },
    { scope: ref },
  )
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
