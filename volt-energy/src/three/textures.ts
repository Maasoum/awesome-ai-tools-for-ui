import * as THREE from 'three'
import type { Flavor } from '../lib/flavors'

/* ------------------------------------------------------------------ */
/*  Label mask                                                         */
/*  R channel = accent ink, G channel = white/silver ink.              */
/*  Colour is resolved in the shader so flavours can cross-fade.       */
/* ------------------------------------------------------------------ */

export const LABEL_W = 2048
export const LABEL_H = 1288

const ACC = 'rgb(255,0,0)'
const WHT = 'rgb(0,255,0)'
const accA = (a: number) => `rgba(255,0,0,${a})`
const whtA = (a: number) => `rgba(0,255,0,${a})`

function bolt(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath()
  ctx.moveTo(x + 0.18 * s, y)
  ctx.lineTo(x - 0.32 * s, y + 0.58 * s)
  ctx.lineTo(x - 0.02 * s, y + 0.58 * s)
  ctx.lineTo(x - 0.16 * s, y + 1.0 * s)
  ctx.lineTo(x + 0.34 * s, y + 0.38 * s)
  ctx.lineTo(x + 0.04 * s, y + 0.38 * s)
  ctx.closePath()
  ctx.fill()
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

export function drawLabelMask(flavor: Flavor): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = LABEL_W
  c.height = LABEL_H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, LABEL_W, LABEL_H)
  ctx.globalCompositeOperation = 'lighter'
  const W = LABEL_W
  const H = LABEL_H
  const cx = W / 2

  // --- circumferential rings top & bottom
  ctx.fillStyle = ACC
  ctx.fillRect(0, 34, W, 7)
  ctx.fillRect(0, H - 41, W, 7)
  ctx.fillStyle = whtA(0.55)
  ctx.fillRect(0, 56, W, 2)
  ctx.fillRect(0, H - 58, W, 2)

  // --- subtle voltage hatching flanking the logo
  ctx.save()
  ctx.beginPath()
  ctx.rect(cx - 520, 90, 1040, H - 180)
  ctx.clip()
  ctx.strokeStyle = accA(0.09)
  ctx.lineWidth = 3
  for (let i = -40; i < 60; i++) {
    const x0 = cx - 700 + i * 26
    const fade = Math.abs(x0 - cx + 300) < 360 ? 1 : 0.35
    ctx.globalAlpha = fade
    ctx.beginPath()
    ctx.moveTo(x0, H)
    ctx.lineTo(x0 + 600, 0)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.restore()
  // knock the hatching out behind the wordmark
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#000'
  ctx.fillRect(cx - 190, 80, 380, H - 160)
  ctx.globalCompositeOperation = 'lighter'

  // --- giant vertical VOLT wordmark (reads bottom -> top)
  ctx.save()
  ctx.translate(cx + 4, H / 2)
  ctx.rotate(-Math.PI / 2)
  let size = 340
  ctx.font = `900 ${size}px Orbitron, "Space Grotesk Variable", sans-serif`
  const target = H * 0.84
  const m = ctx.measureText('VOLT')
  size = size * (target / m.width)
  ctx.font = `900 ${size}px Orbitron, "Space Grotesk Variable", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = ACC
  ctx.fillText('VOLT', 0, size * 0.04)
  // inner cut line for a machined, premium feel
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#000'
  ctx.fillRect(-target / 2 - 20, size * 0.04 - 3, target + 40, 6)
  ctx.restore()
  ctx.globalCompositeOperation = 'lighter'

  // --- left column: ENERGY DRINK + flavour
  ctx.save()
  ctx.translate(cx - 250, H / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.textBaseline = 'middle'
  ctx.fillStyle = WHT
  ctx.font = `600 54px "Space Grotesk Variable", sans-serif`
  spacedText(ctx, 'ENERGY DRINK', 0, -10, 22, 'center')
  ctx.restore()

  ctx.save()
  ctx.translate(cx - 330, H / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.textBaseline = 'middle'
  ctx.fillStyle = ACC
  ctx.font = `800 46px Orbitron, sans-serif`
  spacedText(ctx, flavor.short, 0, 0, 18, 'center')
  ctx.restore()

  // thin vertical rules
  ctx.fillStyle = whtA(0.5)
  ctx.fillRect(cx - 205, 150, 2, H - 300)
  ctx.fillRect(cx + 205, 150, 2, H - 300)

  // --- right column: bolt, spec text
  ctx.fillStyle = ACC
  bolt(ctx, cx + 290, 150, 150)

  ctx.save()
  ctx.translate(cx + 290, H / 2 + 120)
  ctx.rotate(-Math.PI / 2)
  ctx.textBaseline = 'middle'
  ctx.fillStyle = WHT
  ctx.font = `500 34px "Space Grotesk Variable", sans-serif`
  spacedText(ctx, 'HIGH PERFORMANCE FORMULA', 0, 0, 10, 'center')
  ctx.restore()

  ctx.save()
  ctx.translate(cx + 360, H / 2 + 120)
  ctx.rotate(-Math.PI / 2)
  ctx.textBaseline = 'middle'
  ctx.fillStyle = whtA(0.7)
  ctx.font = `600 26px Orbitron, sans-serif`
  spacedText(ctx, '500 ML · 16.9 FL OZ', 0, 0, 8, 'center')
  ctx.restore()

  // small technical ticks
  ctx.fillStyle = whtA(0.7)
  for (let i = 0; i < 18; i++) {
    const y = H - 150 - i * 14
    ctx.fillRect(cx + 420, y, i % 5 === 0 ? 34 : 18, 2)
  }
  ctx.fillStyle = ACC
  ctx.fillRect(cx - 450, 130, 60, 6)
  ctx.fillRect(cx - 450, 130, 6, 60)

  // --- micro copy around top band (full circumference)
  ctx.fillStyle = whtA(0.8)
  ctx.font = `600 22px "Space Grotesk Variable", sans-serif`
  const band = 'CAFFEINE 160MG  ·  TAURINE 1000MG  ·  B-VITAMINS  ·  ZERO SUGAR  ·  ELECTROLYTES  ·  '
  let bx = 0
  while (bx < W) bx += spacedText(ctx, band, bx, 88, 4) + 4
  ctx.textAlign = 'left'
  let by = 0
  while (by < W) by += spacedText(ctx, 'UNLEASH YOUR ENERGY  ·  VOLT  ·  ', by, H - 72, 6) + 6

  // --- back panel: nutrition + barcode (centered on u = 0 / 1 seam)
  const back = (x: number) => {
    ctx.fillStyle = WHT
    ctx.font = `700 34px "Space Grotesk Variable", sans-serif`
    ctx.fillText('NUTRITION', x - 220, 250)
    ctx.fillStyle = whtA(0.7)
    ctx.fillRect(x - 220, 270, 300, 3)
    ctx.font = `500 24px "Space Grotesk Variable", sans-serif`
    const rows = [
      ['Energy', '42 kJ / 10 kcal'],
      ['Sugars', '0 g'],
      ['Caffeine', '32 mg / 100ml'],
      ['Taurine', '200 mg / 100ml'],
      ['Vitamin B6', '1.6 mg'],
      ['Vitamin B12', '1.2 µg'],
    ]
    rows.forEach(([k, v], i) => {
      ctx.fillText(k, x - 220, 320 + i * 44)
      ctx.textAlign = 'right'
      ctx.fillText(v, x + 80, 320 + i * 44)
      ctx.textAlign = 'left'
      ctx.fillRect(x - 220, 334 + i * 44, 300, 1)
    })
    // barcode
    let px = x - 200
    let seed = 7
    for (let i = 0; i < 46; i++) {
      seed = (seed * 9301 + 49297) % 233280
      const w = 2 + Math.floor((seed / 233280) * 6)
      if (i % 2 === 0) ctx.fillRect(px, H - 330, w, 120)
      px += w + 2
    }
    ctx.font = `500 20px Orbitron, sans-serif`
    ctx.fillText('4 006381 333931', x - 200, H - 185)
    ctx.fillStyle = ACC
    bolt(ctx, x + 40, H - 340, 110)
    ctx.fillStyle = whtA(0.6)
    ctx.font = `500 20px "Space Grotesk Variable", sans-serif`
    ctx.fillText('HIGH CAFFEINE CONTENT. NOT RECOMMENDED FOR', x - 220, 640)
    ctx.fillText('CHILDREN OR PREGNANT WOMEN. VOLT ENERGY CO.', x - 220, 668)
  }
  // drawn twice so the panel wraps seamlessly across the u = 0 / 1 seam
  back(170)
  ctx.save()
  ctx.translate(W, 0)
  back(170)
  ctx.restore()

  return c
}

export function makeLabelTexture(flavor: Flavor, anisotropy = 8) {
  const t = new THREE.CanvasTexture(drawLabelMask(flavor))
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.offset.x = 0.5 // put the canvas centre on the front of the cylinder
  t.anisotropy = anisotropy
  t.colorSpace = THREE.NoColorSpace
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.needsUpdate = true
  return t
}

/* ------------------------------------------------------------------ */
/*  Condensation: procedural height field -> normal map + coat mask    */
/* ------------------------------------------------------------------ */

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

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
  size *= (W * 0.94) / ctx.measureText('VOLT').width
  ctx.font = `900 ${size}px Orbitron, sans-serif`
  const grad = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.95)
  grad.addColorStop(0, 'rgba(255,255,255,0.20)')
  grad.addColorStop(0.55, 'rgba(255,255,255,0.05)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillText('VOLT', W / 2, H / 2 + size * 0.03)
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.strokeText('VOLT', W / 2, H / 2 + size * 0.03)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return { texture: t, aspect: W / H }
}
