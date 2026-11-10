import * as THREE from 'three'
import type { Flavor } from '../lib/flavors'
import { getLogoImage } from '../lib/brand'
import { LIQUID_PROFILE, vAtY, rAtY } from './bottleProfile'

/* ------------------------------------------------------------------ */
/*  Bottle label: full-colour canvas mapped onto the lathe UVs.        */
/*  u = around the bottle (canvas centre = front),                     */
/*  v = arc length along the silhouette (bottom row = base centre).    */
/* ------------------------------------------------------------------ */

export const LABEL_W = 1600
export const LABEL_H = 2048

const ARC_LEN = (() => {
  let L = 0
  for (let i = 1; i < LIQUID_PROFILE.length; i++) L += LIQUID_PROFILE[i].distanceTo(LIQUID_PROFILE[i - 1])
  return L
})()

/** canvas row for a bottle height */
const rowAt = (y: number) => (1 - vAtY(y)) * LABEL_H
/** horizontal squash so artwork keeps its proportions on the curved surface at height y */
const sxAt = (y: number) => LABEL_W / (Math.PI * 2 * rAtY(y)) / (LABEL_H / ARC_LEN)
/** canvas px per world unit (vertical) */
const PXV = LABEL_H / ARC_LEN

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function spacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: 'left' | 'center' = 'left') {
  const chars = [...text]
  const widths = chars.map((c) => ctx.measureText(c).width)
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1)
  let cx = align === 'center' ? x - total / 2 : x
  const prev = ctx.textAlign
  ctx.textAlign = 'left'
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y)
    cx += widths[i] + spacing
  })
  ctx.textAlign = prev
  return total
}

export function drawLabel(flavor: Flavor): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = LABEL_W
  c.height = LABEL_H
  const ctx = c.getContext('2d')!
  const W = LABEL_W
  const H = LABEL_H
  const cx = W / 2

  // --- two-tone liquid, soft split slightly below the shoulder (as on the key visual)
  const yTop = rowAt(1.2)
  const yBot = rowAt(-1.58)
  const g = ctx.createLinearGradient(0, yBot, 0, yTop)
  g.addColorStop(0, flavor.bottom)
  g.addColorStop(0.34, flavor.bottom)
  g.addColorStop(0.56, flavor.top)
  g.addColorStop(1, flavor.top)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // gentle wave along the colour split
  ctx.save()
  ctx.globalAlpha = 0.32
  ctx.fillStyle = flavor.bottom
  ctx.beginPath()
  const split = rowAt(-0.32)
  ctx.moveTo(0, H)
  for (let x = 0; x <= W; x += 20) ctx.lineTo(x, split + Math.sin((x / W) * Math.PI * 6) * 26 + Math.sin((x / W) * Math.PI * 14) * 9)
  ctx.lineTo(W, H)
  ctx.closePath()
  ctx.filter = 'blur(28px)'
  ctx.fill()
  ctx.restore()

  // darker, denser liquid toward the heel and a lighter core
  const depth = ctx.createLinearGradient(0, rowAt(-1.6), 0, rowAt(-0.9))
  depth.addColorStop(0, 'rgba(0,0,0,0.38)')
  depth.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = depth
  ctx.fillRect(0, 0, W, H)

  // fine carbonation: tiny bright bubbles with a faint shadow
  const rand = rng(flavor.id.length * 977 + 13)
  for (let i = 0; i < 240; i++) {
    const x = rand() * W
    const y = rowAt(-1.5 + rand() * 2.65)
    const r = 0.8 + Math.pow(rand(), 3) * 3.2
    ctx.fillStyle = `rgba(255,255,255,${0.05 + rand() * 0.13})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // --- ADRIN logo, front centre on the upper body
  const logo = getLogoImage()
  const logoY = 0.16
  if (logo) {
    const sx = sxAt(logoY)
    const wU = 0.8 // world width
    const hU = wU * (logo.naturalHeight / logo.naturalWidth)
    const wPx = wU * PXV * sx
    const hPx = hU * PXV
    const yC = rowAt(logoY)
    ctx.save()
    // soft white halo so the silver deer reads on every colour
    const halo = ctx.createRadialGradient(cx, yC, 0, cx, yC, hPx * 0.75)
    halo.addColorStop(0, 'rgba(255,255,255,0.16)')
    halo.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = halo
    ctx.setTransform(sx * 1.1, 0, 0, 1, cx * (1 - sx * 1.1), 0)
    ctx.fillRect(cx - hPx, yC - hPx, hPx * 2, hPx * 2)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 6
    ctx.drawImage(logo, cx - wPx / 2, yC - hPx / 2, wPx, hPx)
    ctx.restore()
  } else {
    ctx.fillStyle = '#fff'
    ctx.font = `900 120px Orbitron, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('ADRIN', cx, rowAt(logoY))
  }

  // --- flavour name, white bold, front centre on the lower bulge
  const lines = flavor.labelLines
  const nameY = lines.length > 1 ? -0.96 : -1.02
  const sxN = sxAt(nameY)
  const maxW = 0.8 * PXV // world units → px (before squash)
  let size = lines.length > 1 ? 200 : 250
  ctx.font = `700 ${size}px "Space Grotesk Variable", sans-serif`
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width + l.length * size * 0.02))
  if (widest > maxW) size *= maxW / widest
  ctx.save()
  ctx.translate(cx, rowAt(nameY))
  ctx.scale(sxN, 1)
  ctx.font = `700 ${size}px "Space Grotesk Variable", sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 6
  const lh = size * 0.98
  lines.forEach((l, i) => spacedText(ctx, l, 0, (i - (lines.length - 1) / 2) * lh, size * 0.02, 'center'))
  ctx.shadowColor = 'transparent'
  // small descriptor under the name
  ctx.font = `600 ${Math.round(size * 0.2)}px "Space Grotesk Variable", sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.86)'
  spacedText(ctx, 'VITAMIN DRINK  ·  330 ML', 0, ((lines.length - 1) / 2) * lh + size * 0.66, size * 0.05, 'center')
  ctx.restore()

  // --- back panel: nutrition + barcode (centred on the u = 0/1 seam = back)
  const back = (x: number) => {
    const by = rowAt(-0.15)
    ctx.save()
    ctx.translate(x, 0)
    ctx.scale(sxAt(-0.6), 1)
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.font = `700 34px "Space Grotesk Variable", sans-serif`
    ctx.fillText('NUTRITION / 100 ML', -170, by)
    ctx.fillRect(-170, by + 16, 340, 3)
    ctx.font = `500 25px "Space Grotesk Variable", sans-serif`
    const rows = [
      ['Energy', '25 kJ / 6 kcal'],
      ['Sugars', '0 g'],
      ['Vitamin C', '24 mg (30%)'],
      ['Niacin B3', '4.8 mg'],
      ['Vitamin B6', '0.4 mg'],
      ['Vitamin B12', '0.75 µg'],
      ['Caffeine', '24 mg'],
    ]
    rows.forEach(([k, v], i) => {
      const yy = by + 62 + i * 42
      ctx.textAlign = 'left'
      ctx.fillText(k, -170, yy)
      ctx.textAlign = 'right'
      ctx.fillText(v, 170, yy)
      ctx.fillRect(-170, yy + 12, 340, 1)
    })
    ctx.textAlign = 'left'
    const bcY = rowAt(-0.95)
    ctx.fillStyle = '#fff'
    ctx.fillRect(-120, bcY - 20, 240, 170)
    ctx.fillStyle = '#111'
    let px = -100
    let seed = 11
    for (let i = 0; i < 40; i++) {
      seed = (seed * 9301 + 49297) % 233280
      const w = 2 + Math.floor((seed / 233280) * 5)
      if (i % 2 === 0) ctx.fillRect(px, bcY, w, 100)
      px += w + 2
    }
    ctx.font = `500 18px Orbitron, sans-serif`
    ctx.fillText('6 260512 330019', -100, bcY + 128)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = `500 19px "Space Grotesk Variable", sans-serif`
    ctx.fillText('CARBONATED VITAMIN DRINK. CONTAINS CAFFEINE.', -170, bcY + 200)
    ctx.fillText('SERVE CHILLED · ADRIN VITAMIN CO.', -170, bcY + 226)
    ctx.restore()
  }
  back(0)
  back(W)

  // glass shoulder band of embossed ticks near the base (heel stippling)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  const heel = rowAt(-1.48)
  for (let x = 0; x < W; x += 16) ctx.fillRect(x, heel, 6, 30)

  return c
}

export function makeLabelTexture(flavor: Flavor, anisotropy = 16) {
  const t = new THREE.CanvasTexture(drawLabel(flavor))
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.offset.x = 0.5 // canvas centre → front of the bottle
  t.anisotropy = anisotropy
  t.colorSpace = THREE.SRGBColorSpace
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.needsUpdate = true
  return t
}

/* ------------------------------------------------------------------ */
/*  Condensation: procedural height field -> normal map + coat mask    */
/* ------------------------------------------------------------------ */

export function makeCondensationMaps(size = 1024, seed = 42) {
  const N = size
  const h = new Float32Array(N * N)
  const rand = rng(seed)

  const stamp = (cx: number, cy: number, rx: number, ry: number, amp: number) => {
    const x0 = Math.floor(cx - rx - 1)
    const x1 = Math.ceil(cx + rx + 1)
    const y0 = Math.floor(cy - ry - 1)
    const y1 = Math.ceil(cy + ry + 1)
    for (let y = y0; y <= y1; y++) {
      const yy = ((y % N) + N) % N
      const dy = (y - cy) / ry
      for (let x = x0; x <= x1; x++) {
        const dx = (x - cx) / rx
        const d2 = dx * dx + dy * dy
        if (d2 >= 1) continue
        const xx = ((x % N) + N) % N
        const v = Math.sqrt(1 - d2) * amp
        const i = yy * N + xx
        if (v > h[i]) h[i] = v
      }
    }
  }

  // micro mist
  for (let i = 0; i < 1800; i++) {
    const r = 1 + rand() * 2.2
    stamp(rand() * N, rand() * N, r, r, r * 0.55)
  }
  // small droplets
  for (let i = 0; i < 900; i++) {
    const r = 2.5 + rand() * 5
    stamp(rand() * N, rand() * N, r, r * (0.9 + rand() * 0.25), r * 0.6)
  }
  // medium
  for (let i = 0; i < 170; i++) {
    const r = 7 + rand() * 9
    stamp(rand() * N, rand() * N, r * (0.9 + rand() * 0.2), r * (0.95 + rand() * 0.3), r * 0.55)
  }
  // large, slightly elongated by gravity
  for (let i = 0; i < 26; i++) {
    const r = 15 + rand() * 12
    stamp(rand() * N, rand() * N, r, r * 1.25, r * 0.5)
  }
  // running drips: a trail of shrinking beads ending in a heavy drop
  for (let i = 0; i < 14; i++) {
    const x = rand() * N
    const y = rand() * N
    const len = 80 + rand() * 220
    for (let k = 0; k < len; k += 2) {
      const w = 2.2 + (k / len) * 4.5
      stamp(x + Math.sin(k * 0.05 + i) * 2, y + k, w, w, w * 0.45)
    }
    stamp(x, y + len + 6, 9 + rand() * 4, 12 + rand() * 4, 6)
  }

  const normal = new Uint8Array(N * N * 4)
  const mask = new Uint8Array(N * N * 4)
  const at = (x: number, y: number) => h[(((y % N) + N) % N) * N + (((x % N) + N) % N)]
  const strength = 1.6
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      let nx = -dx
      let ny = dy
      let nz = 2
      const l = Math.hypot(nx, ny, nz)
      nx /= l
      ny /= l
      nz /= l
      const i = (y * N + x) * 4
      normal[i] = (nx * 0.5 + 0.5) * 255
      normal[i + 1] = (ny * 0.5 + 0.5) * 255
      normal[i + 2] = (nz * 0.5 + 0.5) * 255
      normal[i + 3] = 255
      const hv = h[y * N + x]
      const m = hv > 0.05 ? 255 : 34 // 34 = faint satin coat everywhere
      mask[i] = m
      mask[i + 1] = m
      mask[i + 2] = m
      mask[i + 3] = 255
    }
  }

  const mk = (data: Uint8Array) => {
    const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.magFilter = THREE.LinearFilter
    t.minFilter = THREE.LinearMipmapLinearFilter
    t.generateMipmaps = true
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }
  return { normal: mk(normal), mask: mk(mask) }
}

/* ------------------------------------------------------------------ */
/*  Smoke sprite (fbm value noise with radial falloff)                 */
/* ------------------------------------------------------------------ */

export function makeSmokeTexture(size = 256, seed = 3) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  const rand = rng(seed)
  const G = 16
  const grid = Array.from({ length: (G + 1) * (G + 1) }, () => rand())
  const g = (x: number, y: number) => grid[(y % G) * (G + 1) + (x % G)]
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const u = xf * xf * (3 - 2 * xf)
    const v = yf * yf * (3 - 2 * yf)
    const a = g(xi, yi)
    const b = g(xi + 1, yi)
    const cc = g(xi, yi + 1)
    const d = g(xi + 1, yi + 1)
    return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let f = 0
      let amp = 0.5
      let fr = 3 / size
      for (let o = 0; o < 5; o++) {
        f += noise(x * fr * G * 0.25 + o * 7.1, y * fr * G * 0.25 + o * 3.3) * amp
        amp *= 0.5
        fr *= 2
      }
      const dx = x / size - 0.5
      const dy = y / size - 0.5
      const r = Math.sqrt(dx * dx + dy * dy) * 2
      const fall = Math.max(0, 1 - r)
      const a = Math.pow(Math.max(0, f - 0.25) * 1.6, 1.6) * Math.pow(fall, 1.8)
      const i = (y * size + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255
      img.data[i + 3] = Math.min(255, a * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* ------------------------------------------------------------------ */
/*  Giant background wordmark for the final shot                       */
/* ------------------------------------------------------------------ */

export function makeBigTypeTexture() {
  const W = 2048
  const H = 720
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = 600
  ctx.font = `900 ${size}px Orbitron, sans-serif`
  size *= (W * 0.88) / ctx.measureText('ADRIN').width
  ctx.font = `900 ${size}px Orbitron, sans-serif`
  const ty = H / 2 + size * 0.03
  // faint filled body
  const grad = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.95)
  grad.addColorStop(0, 'rgba(255,255,255,0.10)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillText('ADRIN', W / 2, ty)
  // neon tube: wide soft glow + bright core (tinted by the material colour)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 14
  ctx.shadowColor = 'rgba(255,255,255,0.9)'
  ctx.shadowBlur = 40
  ctx.strokeText('ADRIN', W / 2, ty)
  ctx.shadowBlur = 0
  ctx.lineWidth = 4
  ctx.strokeStyle = 'rgba(255,255,255,1)'
  ctx.strokeText('ADRIN', W / 2, ty)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return { texture: t, aspect: W / H }
}
