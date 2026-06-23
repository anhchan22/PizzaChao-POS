import { create } from 'zustand'

export interface CartItemOption {
  optionId: number
  optionName: string
  price: number
}

export interface CartItem {
  id: string // local unique id (e.g. timestamp or uuid)
  productId: number
  productName: string
  sizeId: number
  sizeName: string
  unitPrice: number
  quantity: number
  note?: string
  options: CartItemOption[]
}

interface CartState {
  items: CartItem[]
  customerName: string
  customerPhone: string
  note: string
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  setCustomerInfo: (name: string, phone: string) => void
  setNote: (note: string) => void
  clearCart: () => void
  
  // Computed (accessed via store.getState() or hooks)
  getTotalPrice: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  customerPhone: '',
  note: '',

  addItem: (newItem) => set((state) => {
    // Check if an identical item already exists (same product, size, options, note)
    const existingIndex = state.items.findIndex(item => 
      item.productId === newItem.productId &&
      item.sizeId === newItem.sizeId &&
      item.note === newItem.note &&
      JSON.stringify(item.options.map(o => o.optionId).sort()) === JSON.stringify(newItem.options.map(o => o.optionId).sort())
    )

    if (existingIndex >= 0) {
      const updatedItems = [...state.items]
      updatedItems[existingIndex].quantity += newItem.quantity
      return { items: updatedItems }
    }

    // Add as new item
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9)
    return { items: [...state.items, { ...newItem, id }] }
  }),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    )
  })),

  setCustomerInfo: (customerName, customerPhone) => set({ customerName, customerPhone }),
  
  setNote: (note) => set({ note }),

  clearCart: () => set({ items: [], customerName: '', customerPhone: '', note: '' }),

  getTotalPrice: () => {
    const items = get().items
    return items.reduce((total, item) => {
      const optionsTotal = item.options.reduce((sum, opt) => sum + opt.price, 0)
      const itemTotal = (item.unitPrice + optionsTotal) * item.quantity
      return total + itemTotal
    }, 0)
  }
}))
