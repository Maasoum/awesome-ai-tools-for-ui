import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SECTION_IDS, sceneState } from './sceneState'
import { useUI } from '../store/ui'

/**
 * Binds the 3D camera/bottle choreography to scroll position.
 * trans[i] goes 0 -> 1 while section i scrolls from the bottom of the viewport to the top.
 */
export function useChoreography(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const triggers: ScrollTrigger[] = []
    SECTION_IDS.forEach((id, i) => {
      if (i === 0) return
      const el = document.getElementById(id)
      if (!el) return
      const set = (self: ScrollTrigger) => (sceneState.trans[i] = self.progress)
      triggers.push(ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'top top', onUpdate: set, onRefresh: set }))
    })
    // pause WebGL while the opaque story section fully covers the viewport
    const story = document.getElementById('story')
    if (story) {
      triggers.push(
        ScrollTrigger.create({
          trigger: story,
          start: 'top top',
          end: 'bottom bottom',
          onToggle: (self) => useUI.getState().setCanvasPaused(self.isActive),
        }),
      )
    }
    const refresh = () => ScrollTrigger.refresh()
    const t = window.setTimeout(refresh, 400)
    document.fonts?.ready.then(refresh)
    return () => {
      window.clearTimeout(t)
      triggers.forEach((tr) => tr.kill())
    }
  }, [enabled])
}
