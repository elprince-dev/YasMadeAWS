import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (product) => {
        const items = get().items;
        const existingItem = items.find(item => item.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + product.quantity }
                : item
            )
          });
        } else {
          set({ items: [...items, product] });
        }
      },
      removeFromCart: (productId) => {
        set({
          items: get().items.filter(item => item.id !== productId)
        });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(productId);
        } else {
          set({
            items: get().items.map(item =>
              item.id === productId
                ? { ...item, quantity }
                : item
            )
          });
        }
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + (item.price * item.quantity),
          0
        );
      },
      getItemCount: () => {
        return get().items.reduce(
          (count, item) => count + item.quantity,
          0
        );
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);