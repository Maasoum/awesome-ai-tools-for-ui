/**
 * Mutable, non-reactive state shared between the DOM (GSAP / ScrollTrigger)
 * and the WebGL render loop. Writing here never triggers React renders.
 */
export const SECTION_IDS = ['home', 'ingredients', 'power', 'products', 'story', 'voltage'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export const sceneState = {
  /** transition progress INTO section i (index 0 unused) */
  trans: new Array(SECTION_IDS.length).fill(0) as number[],
  /** progress through pinned sections */
  formula: 0,
  power: 0,
  final: 0,
  pointer: { x: 0, y: 0 },
  reduced: false,
  lowPower: false,
}

/** Continuous "section time": 0 = hero, 1 = formula, ... */
export function sectionTime() {
  let t = 0
  for (let i = 1; i < sceneState.trans.length; i++) t += sceneState.trans[i]
  return t
}
