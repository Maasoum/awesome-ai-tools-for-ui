import { create } from 'zustand'
import { FLAVORS, DEFAULT_FLAVOR, type FlavorId, type PackId, PACKS, flavorById } from '../lib/flavors'

export interface CartItem {
  key: string
  flavor: FlavorId
  pack: PackId
  qty: number
}

interface UIState {
  flavor: FlavorId
  setFlavor: (f: FlavorId) => void
  stepFlavor: (dir: 1 | -1) => void

  loadStage: number // 0..1
  setLoadStage: (v: number) => void
  sceneReady: boolean
  setSceneReady: (v: boolean) => void
  webgl: boolean
  setWebgl: (v: boolean) => void
  canvasPaused: boolean
  setCanvasPaused: (v: boolean) => void

  renders: Partial<Record<FlavorId, string>>
  setRenders: (r: Partial<Record<FlavorId, string>>) => void

  cart: CartItem[]
  addToCart: (flavor: FlavorId, pack: PackId, qty?: number) => void
  updateQty: (key: string, qty: number) => void
  removeItem: (key: string) => void
  clearCart: () => void

  cartOpen: boolean
  setCartOpen: (v: boolean) => void
  productOpen: FlavorId | null
  setProductOpen: (v: FlavorId | null) => void
  quizOpen: boolean
  setQuizOpen: (v: boolean) => void
  toast: string | null
  showToast: (msg: string) => void
}

let toastTimer: number | undefined

export const useUI = create<UIState>((set, get) => ({
  flavor: DEFAULT_FLAVOR,
  setFlavor: (flavor) => set({ flavor }),
  stepFlavor: (dir) => {
    const i = FLAVORS.findIndex((f) => f.id === get().flavor)
    const n = FLAVORS[(i + dir + FLAVORS.length) % FLAVORS.length]
    set({ flavor: n.id })
  },

  loadStage: 0,
  setLoadStage: (v) => set((s) => ({ loadStage: Math.max(s.loadStage, v) })),
  sceneReady: false,
  setSceneReady: (sceneReady) => set({ sceneReady }),
  webgl: true,
  setWebgl: (webgl) => set({ webgl }),
  canvasPaused: false,
  setCanvasPaused: (canvasPaused) => set({ canvasPaused }),

  renders: {},
  setRenders: (r) => set((s) => ({ renders: { ...s.renders, ...r } })),

  cart: [],
  addToCart: (flavor, pack, qty = 1) => {
    const key = `${flavor}-${pack}`
    const cart = [...get().cart]
    const existing = cart.find((c) => c.key === key)
    if (existing) existing.qty = Math.min(99, existing.qty + qty)
    else cart.push({ key, flavor, pack, qty })
    set({ cart })
    get().showToast(`${flavorById(flavor).name} · ${PACKS.find((p) => p.id === pack)!.label} added`)
  },
  updateQty: (key, qty) =>
    set((s) => ({
      cart: qty <= 0 ? s.cart.filter((c) => c.key !== key) : s.cart.map((c) => (c.key === key ? { ...c, qty: Math.min(99, qty) } : c)),
    })),
  removeItem: (key) => set((s) => ({ cart: s.cart.filter((c) => c.key !== key) })),
  clearCart: () => set({ cart: [] }),

  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  productOpen: null,
  setProductOpen: (productOpen) => set({ productOpen }),
  quizOpen: false,
  setQuizOpen: (quizOpen) => set({ quizOpen }),
  toast: null,
  showToast: (toast) => {
    window.clearTimeout(toastTimer)
    set({ toast })
    toastTimer = window.setTimeout(() => set({ toast: null }), 2600)
  },
}))

export function packPrice(flavor: FlavorId, pack: PackId) {
  const f = flavorById(flavor)
  const p = PACKS.find((x) => x.id === pack)!
  return Math.round(f.price * p.count * (1 - p.discount) * 100) / 100
}

export const formatPrice = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(v)
