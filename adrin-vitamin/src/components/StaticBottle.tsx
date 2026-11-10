import type { Flavor } from '../lib/flavors'
import { BRAND } from '../lib/brand'

/*
 * Vector packshot used when WebGL is unavailable (and as a thumbnail until the 3D renders are ready).
 * Same silhouette as the procedural 3D bottle.
 */

const S = 170 // px per world unit
const CX = 100
const toY = (y: number) => 310 - y * S

// right-hand silhouette, base → lip (world units, mirrors three/bottleProfile.ts)
const RIGHT: [number, number][] = [
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
  [0.236, 1.44],
  [0.25, 1.5],
]

/** Catmull-Rom → cubic Bézier through the given points */
function smooth(pts: [number, number][]) {
  let d = ''
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

const right = RIGHT.map(([r, y]) => [CX + r * S, toY(y)] as [number, number])
const left = [...RIGHT].reverse().map(([r, y]) => [CX - r * S, toY(y)] as [number, number])
const OUTLINE = `M${right[0][0]} ${right[0][1]}${smooth(right)} L${left[0][0]} ${left[0][1]}${smooth(left)} Z`

export function StaticBottle({ flavor, className = '' }: { flavor: Flavor; className?: string }) {
  const id = `b-${flavor.id}`
  const fillTop = toY(1.2)
  const name = flavor.labelLines
  return (
    <svg viewBox="0 0 200 620" className={className} role="img" aria-label={`${flavor.name} bottle`}>
      <defs>
        <linearGradient id={`${id}-liquid`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={flavor.bottom} />
          <stop offset="0.36" stopColor={flavor.bottom} />
          <stop offset="0.56" stopColor={flavor.top} />
          <stop offset="1" stopColor={flavor.top} />
        </linearGradient>
        <linearGradient id={`${id}-shade`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="0.16" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.26" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0.05" />
          <stop offset="0.88" stopColor={flavor.accent} stopOpacity="0.35" />
          <stop offset="1" stopColor="#000" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="0" x2="1">
          <stop offset="0" stopColor="#5e0507" />
          <stop offset="0.3" stopColor="#ff4a50" />
          <stop offset="0.55" stopColor="#c10f15" />
          <stop offset="1" stopColor="#4d0406" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={OUTLINE} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        {/* clear glass neck */}
        <rect x="0" y="0" width="200" height={fillTop} fill="#dfe9e8" opacity="0.42" />
        {/* liquid */}
        <rect x="0" y={fillTop} width="200" height={620 - fillTop} fill={`url(#${id}-liquid)`} />
        <image href={BRAND.logo} x={CX - 52} y={toY(0.2) - 47} width="104" height="94" preserveAspectRatio="xMidYMid meet" />
        <text x={CX} y={toY(name.length > 1 ? -0.9 : -1.02)} textAnchor="middle" fontFamily="'Space Grotesk Variable', sans-serif" fontWeight="700" fontSize={name.length > 1 || flavor.short.length > 9 ? 20 : 26} fill="#fff">
          {name.map((l, i) => (
            <tspan key={l} x={CX} dy={i === 0 ? 0 : 22}>
              {l}
            </tspan>
          ))}
        </text>
        <rect x="0" y="0" width="200" height="620" fill={`url(#${id}-shade)`} />
      </g>
      {/* crown cap */}
      <path d={`M${CX - 44} ${toY(1.47)} L${CX - 44} ${toY(1.565)} Q${CX - 42} ${toY(1.592)} ${CX - 30} ${toY(1.592)} H${CX + 30} Q${CX + 42} ${toY(1.592)} ${CX + 44} ${toY(1.565)} L${CX + 44} ${toY(1.47)} Z`} fill={`url(#${id}-cap)`} />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={CX - 40 + i * 10} y={toY(1.55)} width="3" height="12" fill="#000" opacity="0.18" />
      ))}
    </svg>
  )
}
