'use client'
import { create } from 'zustand'

interface CartUIState {
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

export const useCartUIStore = create<CartUIState>()((set) => ({
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}))
