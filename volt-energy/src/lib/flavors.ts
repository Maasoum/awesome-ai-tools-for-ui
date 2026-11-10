export type FlavorId = 'original' | 'tropical' | 'ice'

export interface Flavor {
  id: FlavorId
  index: string
  name: string
  short: string
  tagline: string
  description: string
  notes: string[]
  accent: string
  accentSoft: string
  /** secondary ink used on the can (white/silver details) */
  ink: string
  caffeine: string
  sugar: string
  calories: string
  price: number
  lightLabel: string
}

export const FLAVORS: Flavor[] = [
  {
    id: 'original',
    index: '01',
    name: 'VOLT ORIGINAL',
    short: 'ORIGINAL',
    tagline: 'The voltage that started it all.',
    description:
      'Our signature charge. Sharp citrus, a hint of white grape and an electric finish that hits clean and lasts long. The benchmark of raw energy.',
    notes: ['Electric citrus', 'White grape', 'Clean finish'],
    accent: '#B6FF00',
    accentSoft: '#8CFF00',
    ink: '#F5F5F5',
    caffeine: '160mg',
    sugar: '0g',
    calories: '10',
    price: 3.49,
    lightLabel: 'Electric green',
  },
  {
    id: 'tropical',
    index: '02',
    name: 'VOLT TROPICAL',
    short: 'TROPICAL',
    tagline: 'Heatwave in a can.',
    description:
      'Sun-ripe mango, blood orange and passion fruit, charged with the same high-voltage formula. Warm, bold and dangerously smooth.',
    notes: ['Mango', 'Blood orange', 'Passion fruit'],
    accent: '#FF7A1A',
    accentSoft: '#FFB238',
    ink: '#F5F5F5',
    caffeine: '160mg',
    sugar: '0g',
    calories: '12',
    price: 3.49,
    lightLabel: 'Warm orange',
  },
  {
    id: 'ice',
    index: '03',
    name: 'VOLT ICE',
    short: 'ICE',
    tagline: 'Sub-zero focus.',
    description:
      'Glacier mint and frosted lime with a cooling rush that sharpens every sense. Ice-cold clarity for the moments that demand everything.',
    notes: ['Glacier mint', 'Frosted lime', 'Cooling rush'],
    accent: '#45D4FF',
    accentSoft: '#9BE8FF',
    ink: '#F5F5F5',
    caffeine: '160mg',
    sugar: '0g',
    calories: '8',
    price: 3.49,
    lightLabel: 'Arctic blue',
  },
]

export const flavorById = (id: FlavorId) => FLAVORS.find((f) => f.id === id)!

export const PACKS = [
  { id: 'single', label: 'Single can', count: 1, discount: 0 },
  { id: 'four', label: '4-pack', count: 4, discount: 0.05 },
  { id: 'twelve', label: '12-pack', count: 12, discount: 0.12 },
  { id: 'twentyfour', label: '24-case', count: 24, discount: 0.18 },
] as const

export type PackId = (typeof PACKS)[number]['id']
