import * as THREE from 'three'
import { FLAVORS, type FlavorId } from '../lib/flavors'
import { buildCan } from './buildCan'
import { createStudioEnv } from './studioEnv'
import type { getAssets } from './assets'

/**
 * Renders a studio packshot of every flavour using the same procedural can,
 * in a short-lived offscreen renderer. Returns data URLs for use in the UI.
 */
export function renderProductShots(assets: ReturnType<typeof getAssets>): Partial<Record<FlavorId, string>> {
  const W = 480
  const H = 800
  const canvas = document.createElement('canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(W, H, false)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const env = createStudioEnv(renderer)
  scene.environment = env

  const camera = new THREE.PerspectiveCamera(24, W / H, 0.1, 50)
  camera.position.set(0, 0.35, 9.2)
  camera.lookAt(0, 0.02, 0)

  const key = new THREE.DirectionalLight('#ffffff', 1.2)
  key.position.set(-4, 3, 5)
  scene.add(key, new THREE.AmbientLight('#ffffff', 0.15))
  const rimL = new THREE.PointLight('#ffffff', 34)
  rimL.position.set(-3.2, 1.4, -2.6)
  const rimR = new THREE.PointLight('#ffffff', 28)
  rimR.position.set(3.4, 2.2, -2.8)
  scene.add(rimL, rimR)

  const out: Partial<Record<FlavorId, string>> = {}
  for (const f of FLAVORS) {
    const can = buildCan({ labelA: assets.labels[f.id], condensation: assets.condensation, accent: f.accent, quality: 'high' })
    can.uniforms.uRimIntensity.value = 0.5
    can.uniforms.uInkGlow.value = 0.85
    can.group.rotation.set(0.06, -0.38, -0.06)
    rimL.color.set(f.accent)
    rimR.color.set(f.accent)
    scene.add(can.group)
    renderer.render(scene, camera)
    let url = canvas.toDataURL('image/webp', 0.9)
    if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/png')
    out[f.id] = url
    scene.remove(can.group)
    can.dispose()
  }

  env.dispose()
  renderer.dispose()
  renderer.forceContextLoss()
  return out
}
