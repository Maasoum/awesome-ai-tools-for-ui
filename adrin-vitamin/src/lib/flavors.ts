export type FlavorId = 'cactus' | 'sparkling' | 'mandarin' | 'pomegranate' | 'lime'

export interface Flavor {
  id: FlavorId
  index: string
  name: string
  short: string
  /** label lines printed on the bottle */
  labelLines: string[]
  tagline: string
  description: string
  notes: string[]
  /** main glow colour — drives every light in the experience */
  accent: string
  /** secondary glow colour for beams, bokeh and confetti */
  accent2: string
  /** text colour on accent-filled buttons (defaults to ink) */
  onAccent?: string
  /** liquid colour, top half of the bottle */
  top: string
  /** liquid colour, bottom half of the bottle */
  bottom: string
  vitaminC: string
  sugar: string
  calories: string
  price: number
  lightLabel: string
}

export const FLAVORS: Flavor[] = [
  {
    id: 'cactus',
    index: '01',
    name: 'ADRIN CACTUS',
    short: 'CACTUS',
    labelLines: ['CACTUS'],
    tagline: 'Desert bloom, after dark.',
    description: 'Juicy prickly pear and cactus water with a pink, sparkling finish. Light, exotic and made for the first song of the night.',
    notes: ['Prickly pear', 'Cactus water', 'Pink sparkle'],
    accent: '#FF2FB0',
    accent2: '#8B5CFF',
    top: '#F27AAE',
    bottom: '#D4169B',
    vitaminC: '100%',
    sugar: '0g',
    calories: '18',
    price: 2.49,
    lightLabel: 'Neon pink',
  },
  {
    id: 'sparkling',
    index: '02',
    name: 'ADRIN SPARKLING',
    short: 'SPARKLING',
    labelLines: ['SPARKLING'],
    tagline: 'Pure fizz. Pure focus.',
    description: 'Crisp mineral sparkle with a cool blue citrus edge. Clean, bright and built for nights that keep on going.',
    notes: ['Mineral fizz', 'Blue citrus', 'Ice-cold finish'],
    accent: '#22D3FF',
    accent2: '#C9D2E3',
    top: '#C3C8D2',
    bottom: '#2FC2E6',
    vitaminC: '100%',
    sugar: '0g',
    calories: '6',
    price: 2.49,
    lightLabel: 'Electric cyan',
  },
  {
    id: 'mandarin',
    index: '03',
    name: 'ADRIN MANDARIN',
    short: 'MANDARIN',
    labelLines: ['MANDARIN'],
    tagline: 'The original party starter.',
    description: 'Sun-ripe mandarin bursting with natural vitamin C and a vivid orange sparkle. Bold, bright and impossible to put down.',
    notes: ['Sun-ripe mandarin', 'Blood orange', 'Vitamin C boost'],
    accent: '#FF4A1C',
    accent2: '#FFB020',
    top: '#FF4B33',
    bottom: '#EF331C',
    vitaminC: '120%',
    sugar: '0g',
    calories: '22',
    price: 2.49,
    lightLabel: 'Fire orange',
  },
  {
    id: 'pomegranate',
    index: '04',
    name: 'ADRIN POMEGRANATE',
    short: 'POMEGRANATE',
    labelLines: ['POMEGRANATE'],
    tagline: 'Deep, dark and electric.',
    description: 'Ruby pomegranate and wild berries with an antioxidant kick. Rich, tangy and dressed in midnight purple.',
    notes: ['Ruby pomegranate', 'Wild berries', 'Antioxidants'],
    accent: '#A91C8E',
    accent2: '#FF2E7E',
    onAccent: '#FFFFFF',
    top: '#8A2584',
    bottom: '#B5206B',
    vitaminC: '100%',
    sugar: '0g',
    calories: '20',
    price: 2.49,
    lightLabel: 'Deep magenta',
  },
  {
    id: 'lime',
    index: '05',
    name: 'ADRIN SPARKLING LIME',
    short: 'SPARKLING LIME',
    labelLines: ['SPARKLING', 'LIME'],
    tagline: 'Zest that hits the drop.',
    description: 'Sharp lime and lemon zest over a fizzing green base. Tangy, loud and the brightest bottle in the room.',
    notes: ['Key lime', 'Lemon zest', 'Extra fizz'],
    accent: '#9BFF1A',
    accent2: '#FFE81A',
    top: '#E6F41E',
    bottom: '#3DBE3C',
    vitaminC: '100%',
    sugar: '0g',
    calories: '14',
    price: 2.49,
    lightLabel: 'Acid lime',
  },
]

export const DEFAULT_FLAVOR: FlavorId = 'mandarin'

export const flavorById = (id: FlavorId) => FLAVORS.find((f) => f.id === id)!

export const PACKS = [
  { id: 'single', label: 'Single bottle', count: 1, discount: 0 },
  { id: 'four', label: '4-pack', count: 4, discount: 0.05 },
  { id: 'twelve', label: '12-pack', count: 12, discount: 0.12 },
  { id: 'twentyfour', label: '24-crate', count: 24, discount: 0.18 },
] as const

export type PackId = (typeof PACKS)[number]['id']

/** hue (deg) of a hex colour — used to re-tint photographic layers per flavour */
export function hexHue(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return 0
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h *= 60
  return h < 0 ? h + 360 : h
}
