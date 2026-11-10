import { lazy, Suspense, useEffect, useState, Component, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useUI } from './store/ui'
import { hasWebGL, prefersReducedMotion, isTouch } from './lib/env'
import { initSmoothScroll, lockScroll } from './lib/smoothScroll'
import { sceneState } from './lib/sceneState'
import { useChoreography } from './lib/useChoreography'
import { Preloader } from './components/Preloader'
import { Navbar } from './components/Navbar'
import { Hero } from './sections/Hero'
import { Formula } from './sections/Formula'
import { Power } from './sections/Power'
import { Products } from './sections/Products'
import { Story } from './sections/Story'
import { FinalCTA } from './sections/FinalCTA'
import { Footer } from './sections/Footer'
import { ProductModal } from './components/ProductModal'
import { CartDrawer } from './components/CartDrawer'
import { VibeQuiz } from './components/VibeQuiz'
import { Toast } from './components/Toast'
import { loadBrandImages } from './lib/brand'
import { flavorById } from './lib/flavors'

// three.js + R3F are split into their own chunk and loaded after fonts
const Experience = lazy(() =>
  import('./three/Experience').then((m) => {
    useUI.getState().setLoadStage(0.6)
    return m
  }),
)

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.warn('[adrin] WebGL experience failed, using fallback', err)
    const ui = useUI.getState()
    ui.setWebgl(false)
    ui.setLoadStage(1)
    ui.setSceneReady(true)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

async function loadFonts() {
  const faces = ['900 100px Orbitron', '800 50px Orbitron', '600 50px "Space Grotesk Variable"', '700 50px "Space Grotesk Variable"', '400 16px "Inter Variable"']
  try {
    await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 4000))])
  } catch {
    /* fall back to system fonts */
  }
}

export default function App() {
  const [fontsReady, setFontsReady] = useState(false)
  const webgl = useUI((s) => s.webgl)
  const sceneReady = useUI((s) => s.sceneReady)

  useEffect(() => {
    window.scrollTo(0, 0)
    const reduced = prefersReducedMotion()
    sceneState.reduced = reduced
    sceneState.lowPower = (navigator.hardwareConcurrency ?? 8) <= 4 || (isTouch() && window.innerWidth < 900)
    const supported = hasWebGL()
    useUI.getState().setWebgl(supported)
    const destroy = initSmoothScroll(reduced)
    lockScroll(true)
    useUI.getState().setLoadStage(0.1)
    // the flavour colour drives every glow in the UI via the --accent custom properties
    const applyAccent = (id: Parameters<typeof flavorById>[0]) => {
      const f = flavorById(id)
      document.documentElement.style.setProperty('--accent', f.accent)
      document.documentElement.style.setProperty('--accent-2', f.accent2)
      document.documentElement.style.setProperty('--on-accent', f.onAccent ?? '#07050a')
    }
    applyAccent(useUI.getState().flavor)
    const unsubAccent = useUI.subscribe((s, p) => s.flavor !== p.flavor && applyAccent(s.flavor))
    // fonts + logo must be ready before the bottle labels are drawn
    Promise.all([loadFonts(), loadBrandImages()]).then(() => {
      useUI.getState().setLoadStage(0.35)
      setFontsReady(true)
      if (!supported) {
        useUI.getState().setLoadStage(1)
        useUI.getState().setSceneReady(true)
      }
    })

    const onPointer = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      sceneState.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMq = () => (sceneState.reduced = mq.matches)
    window.addEventListener('pointermove', onPointer, { passive: true })
    mq.addEventListener('change', onMq)
    return () => {
      destroy()
      unsubAccent()
      window.removeEventListener('pointermove', onPointer)
      mq.removeEventListener('change', onMq)
    }
  }, [])

  useEffect(() => {
    if (!sceneReady) return
    lockScroll(false)
    ScrollTrigger.refresh()
  }, [sceneReady])

  useChoreography(fontsReady)

  return (
    <MotionConfig reducedMotion="user">
      <Preloader />
      {webgl && fontsReady && (
        <WebGLBoundary>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </WebGLBoundary>
      )}
      {!webgl && <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_srgb,var(--accent)_7%,transparent),transparent_60%)]" aria-hidden />}
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Formula />
        <Power />
        <Products />
        <Story />
        <FinalCTA />
      </main>
      <Footer />
      <ProductModal />
      <CartDrawer />
      <VibeQuiz />
      <Toast />
    </MotionConfig>
  )
}
