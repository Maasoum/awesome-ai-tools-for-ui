import * as THREE from 'three'
import { FLAVORS, type FlavorId } from '../lib/flavors'
import { makeCondensationMaps, makeLabelTexture, makeSmokeTexture, makeBigTypeTexture } from './textures'

interface Assets {
  labels: Record<FlavorId, THREE.Texture>
  condensation: { normal: THREE.Texture; mask: THREE.Texture }
  smoke: THREE.Texture
  bigType: { texture: THREE.Texture; aspect: number }
}

let cache: Assets | null = null

/** Fonts must be loaded before calling this (labels are drawn with canvas text). */
export function getAssets(): Assets {
  if (cache) return cache
  const labels = Object.fromEntries(FLAVORS.map((f) => [f.id, makeLabelTexture(f)])) as unknown as Record<FlavorId, THREE.Texture>
  cache = {
    labels,
    condensation: makeCondensationMaps(1024),
    smoke: makeSmokeTexture(256),
    bigType: makeBigTypeTexture(),
  }
  return cache
}
