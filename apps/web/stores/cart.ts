'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  cartItemId: string
  productId: string
  slug: string
  name: string
  image: string
  price: number
  color?: string
  colorHex?: string
  storage?: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, qty: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (item) =>
        set((s) => {
          const exists = s.items.find((i) => i.cartItemId === item.cartItemId)
          if (exists) {
            return {
              items: s.items.map((i) =>
                i.cartItemId === item.cartItemId ? { ...i, quantity: i.quantity + 1 } : i
              ),
              isOpen: true,
            }
          }
          return { items: [...s.items, { ...item, quantity: 1 }], isOpen: true }
        }),
      removeItem: (cartItemId) =>
        set((s) => ({ items: s.items.filter((i) => i.cartItemId !== cartItemId) })),
      updateQuantity: (cartItemId, qty) =>
        set((s) => {
          if (qty < 1) return { items: s.items.filter((i) => i.cartItemId !== cartItemId) }
          return {
            items: s.items.map((i) =>
              i.cartItemId === cartItemId ? { ...i, quantity: qty } : i
            ),
          }
        }),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'ap-cart' }
  )
)

export const useCartTotal = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0))

export const useCartCount = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
