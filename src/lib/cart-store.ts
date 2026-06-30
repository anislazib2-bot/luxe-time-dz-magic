import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  max_stock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.product_id === item.product_id);
          if (existing) {
            const newQty = Math.min(existing.quantity + qty, item.max_stock);
            return {
              items: s.items.map((i) =>
                i.product_id === item.product_id ? { ...i, quantity: newQty } : i
              ),
              isOpen: true,
            };
          }
          return { items: [...s.items, { ...item, quantity: Math.min(qty, item.max_stock) }], isOpen: true };
        }),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.product_id !== id) })),
      updateQuantity: (id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.product_id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.max_stock)) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: "luxe-time-cart" }
  )
);
