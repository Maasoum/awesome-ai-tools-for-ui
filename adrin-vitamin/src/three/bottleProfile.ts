import * as THREE from 'three'

/**
 * Silhouette of the ADRIN contour glass bottle (330 ml), traced from the campaign key visual.
 * Units: 1 unit ≈ 75 mm. Total height ≈ 3.2 (base → crown cap).
 */
const BODY_CTRL: [number, number][] = [
  [0.0, -1.572],
  [0.2, -1.58],
  [0.36, -1.594],
  [0.452, -1.574],
  [0.505, -1.52],
  [0.53, -1.38],
  [0.54, -1.15],
  [0.528, -0.9],
  [0.5, -0.66],
  [0.476, -0.46],
  [0.482, -0.25],
  [0.506, -0.02],
  [0.515, 0.2],
  [0.505, 0.42],
  [0.47, 0.66],
  [0.41, 0.9],
  [0.34, 1.08],
  [0.28, 1.22],
  [0.246, 1.32],
  [0.233, 1.4],
]

export const BOTTLE = {
  fill: 1.2,
  lipTop: 1.525,
  capTop: 1.592,
  baseY: -1.594,
  steps: 220,
}

const bodyCurve = new THREE.SplineCurve(BODY_CTRL.map(([x, y]) => new THREE.Vector2(x, y)))

function buildLiquidProfile() {
  const pts = bodyCurve.getSpacedPoints(BOTTLE.steps)
  const out: THREE.Vector2[] = []
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    if (p.y <= BOTTLE.fill) {
      out.push(p.clone())
      continue
    }
    const q = pts[i - 1]
    const t = (BOTTLE.fill - q.y) / (p.y - q.y)
    out.push(new THREE.Vector2(THREE.MathUtils.lerp(q.x, p.x, t), BOTTLE.fill))
    break
  }
  // close the liquid surface with the same arc-length step so lathe UVs stay uniform
  const step = out[1].distanceTo(out[0])
  const rFill = out[out.length - 1].x
  const n = Math.max(2, Math.round(rFill / step))
  for (let i = 1; i <= n; i++) out.push(new THREE.Vector2(rFill * (1 - i / n), BOTTLE.fill))
  return out
}

export const LIQUID_PROFILE = buildLiquidProfile()

/** cumulative arc-length parameter (0..1) at the first profile point reaching height y */
export function vAtY(y: number) {
  const P = LIQUID_PROFILE
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1]
    const b = P[i]
    if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) {
      const t = (y - a.y) / (b.y - a.y)
      return (i - 1 + t) / (P.length - 1)
    }
  }
  return y < 0 ? 0 : 1
}

/** outer radius at height y (body section) */
export function rAtY(y: number) {
  const P = LIQUID_PROFILE
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1]
    const b = P[i]
    if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) return THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y))
  }
  return 0.3
}

export function glassNeckProfile() {
  const pts = bodyCurve.getSpacedPoints(BOTTLE.steps).filter((p) => p.y >= 1.06)
  const out = pts.map((p) => new THREE.Vector2(p.x + 0.006, p.y))
  out.push(
    new THREE.Vector2(0.236, 1.44),
    new THREE.Vector2(0.236, 1.455),
    new THREE.Vector2(0.247, 1.47),
    new THREE.Vector2(0.25, 1.5),
    new THREE.Vector2(0.24, 1.522),
    new THREE.Vector2(0.222, BOTTLE.lipTop),
  )
  return out
}

export function capProfile() {
  return [
    new THREE.Vector2(0.236, 1.468),
    new THREE.Vector2(0.256, 1.476),
    new THREE.Vector2(0.258, 1.5),
    new THREE.Vector2(0.257, 1.545),
    new THREE.Vector2(0.252, 1.568),
    new THREE.Vector2(0.24, 1.583),
    new THREE.Vector2(0.215, 1.59),
    new THREE.Vector2(0.12, BOTTLE.capTop),
    new THREE.Vector2(0.0, BOTTLE.capTop),
  ]
}
