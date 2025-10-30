import { create } from 'zustand';
import type { FeeStructureItem } from '@/types/feeStructure';

interface FeeStructureState {
  items: FeeStructureItem[];
  setItems: (items: FeeStructureItem[]) => void;
  appendCategories: (newCategories: FeeStructureItem[]) => void;
  reset: () => void;
}

export const useFeeStructureStore = create<FeeStructureState>((set) => ({
  items: [],

  setItems: (items) => set({ items }),

  appendCategories: (newCategories) => set((state) => {
    const startingOrder = state.items.length;
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      order: startingOrder + index,
    }));
    return { items: [...state.items, ...updatedCategories] };
  }),

  reset: () => set({ items: [] }),
}));
