import * as THREE from 'three'

export interface Pose {
  /** horizontal position as a fraction of the half-viewport width */
  x: number
  /** vertical position as a fraction of the half-viewport height */
  y: number
  scale: number
  /** roll (z) */
  tilt: number
  /** pitch (x) */
  tiltX: number
  /** scripted rotation around Y (radians) */
  turn: number
  camZ: number
  particles: number
  swirl: number
  drops: number
  bigType: number
  /** idle spin speed, rad/s. 0 => settle facing camera */
  spin: number
  glow: number
  /** stage light beams intensity */
  beams: number
  /** crowd silhouette opacity */
  crowd: number
  /** confetti density */
  confetti: number
}

const TAU = Math.PI * 2

const BASE: Pose[] = [
  // 0 hero
  { x: 0.06, y: -0.03, scale: 1, tilt: -0.08, tiltX: 0.06, turn: -0.06, camZ: 9, particles: 0.45, swirl: 0, drops: 1, bigType: 0, spin: 0, glow: 0.75, beams: 0.9, crowd: 1, confetti: 0.6 },
  // 1 formula — closer, full 360 turn on the way in
  { x: 0, y: -0.12, scale: 1, tilt: 0, tiltX: 0.02, turn: TAU, camZ: 7.1, particles: 0.75, swirl: 0, drops: 0.5, bigType: 0, spin: 0.1, glow: 0.95, beams: 0.45, crowd: 0.35, confetti: 0.25 },
  // 2 power — liquid burst
  { x: 0.34, y: 0.0, scale: 1, tilt: 0.3, tiltX: 0.12, turn: TAU - Math.PI + 0.6, camZ: 7.6, particles: 1, swirl: 1, drops: 0, bigType: 0, spin: 0.55, glow: 1.25, beams: 1, crowd: 0.6, confetti: 0.9 },
  // 3 products
  { x: 0, y: -0.04, scale: 0.9, tilt: 0, tiltX: 0.05, turn: TAU * 1.5 - 0.22, camZ: 8.4, particles: 0.4, swirl: 0, drops: 0.35, bigType: 0, spin: 0, glow: 1, beams: 0.6, crowd: 0.35, confetti: 0.3 },
  // 4 story — bottle lifts out of frame as the editorial page covers it
  { x: 0, y: 1.45, scale: 0.9, tilt: 0.05, tiltX: 0.05, turn: TAU * 1.5 + 0.4, camZ: 8.4, particles: 0.2, swirl: 0, drops: 0, bigType: 0, spin: 0, glow: 1, beams: 0.3, crowd: 0.2, confetti: 0.2 },
  // 5 final shot
  { x: 0, y: -0.06, scale: 1.02, tilt: -0.07, tiltX: 0.06, turn: TAU * 1.5 - 0.38, camZ: 7.8, particles: 0.75, swirl: 0, drops: 0.7, bigType: 1, spin: 0, glow: 1.15, beams: 1, crowd: 1, confetti: 1 },
]

/**
 * Note: the formula section adds a scrubbed half turn (π) that persists afterwards,
 * so the poses after it are expressed with a −π offset to keep the logo facing camera.
 */
/** where a pose is entered from, when it should not interpolate from the previous one */
export const ENTER_FROM: Partial<Record<number, Partial<Pose>>> = {
  5: { y: -1.5, tilt: 0.2, turn: TAU * 1.5 - 1.6 },
}

export function getPoses(aspect: number): Pose[] {
  if (aspect < 0.78) {
    // phones (portrait)
    const o: Partial<Pose>[] = [
      { x: 0, y: -0.16, scale: 0.52, tilt: -0.06, turn: 0 },
      { x: 0, y: -0.04, scale: 0.5, camZ: 6.6 },
      { x: 0.02, y: -0.08, scale: 0.46, tilt: 0.22 },
      { x: 0, y: 0.1, scale: 0.5 },
      { x: 0, y: 1.6, scale: 0.5 },
      { x: 0, y: -0.02, scale: 0.6 },
    ]
    return BASE.map((p, i) => ({ ...p, ...o[i] }))
  }
  if (aspect < 1.3) {
    // tablets / square windows
    const o: Partial<Pose>[] = [
      { x: 0.16, y: -0.08, scale: 0.82 },
      { scale: 0.88 },
      { x: 0.3, scale: 0.8 },
      { scale: 0.74, y: 0.02 },
      { scale: 0.74 },
      { scale: 0.85 },
    ]
    return BASE.map((p, i) => ({ ...p, ...o[i] }))
  }
  return BASE
}

export function lerpPose(a: Pose, b: Pose, t: number, out: Pose): Pose {
  for (const k of Object.keys(a) as (keyof Pose)[]) out[k] = THREE.MathUtils.lerp(a[k], b[k], t)
  return out
}

/** Live values consumed by the satellite effects (particles, liquid, etc.). */
export const rig = {
  particles: 0.4,
  swirl: 0,
  drops: 1,
  bigType: 0,
  glow: 1,
  burst: 0,
  accent: new THREE.Color('#FF4A1C'),
  accent2: new THREE.Color('#FFB020'),
  beams: 1,
  crowd: 1,
  confetti: 0.6,
  productWorld: new THREE.Vector3(),
  halfW: 4,
  halfH: 2,
}
