import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CardType } from '@prisma/client';

export interface WorkspaceStore {
  // State
  activeCards: CardType[];
  collapsedNav: boolean;

  // Actions
  openCard: (type: CardType, replace?: boolean) => void;
  closeCard: (type: CardType) => void;
  replaceCards: (types: CardType[]) => void;
  toggleNavigation: () => void;
  isCardActive: (type: CardType) => boolean;
  canAddCard: () => boolean;
}

const MAX_CARDS = 3;

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activeCards: [],
      collapsedNav: false,

      // Open a card
      openCard: (type: CardType, replace = false) => {
        const { activeCards } = get();

        // If card is already active, do nothing
        if (activeCards.includes(type)) {
          return;
        }

        // If replace mode, close all and open this one
        if (replace) {
          set({ activeCards: [type] });
          return;
        }

        // If max cards reached, don't add
        if (activeCards.length >= MAX_CARDS) {
          console.warn(`Cannot open more than ${MAX_CARDS} cards simultaneously`);
          return;
        }

        // Add card to active cards
        set({ activeCards: [...activeCards, type] });
      },

      // Close a card
      closeCard: (type: CardType) => {
        const { activeCards } = get();
        set({ activeCards: activeCards.filter((card) => card !== type) });
      },

      // Replace all active cards
      replaceCards: (types: CardType[]) => {
        if (types.length > MAX_CARDS) {
          console.warn(`Cannot open more than ${MAX_CARDS} cards. Truncating.`);
          set({ activeCards: types.slice(0, MAX_CARDS) });
          return;
        }
        set({ activeCards: types });
      },

      // Toggle navigation collapsed state
      toggleNavigation: () => {
        set((state) => ({ collapsedNav: !state.collapsedNav }));
      },

      // Check if a card is active
      isCardActive: (type: CardType) => {
        return get().activeCards.includes(type);
      },

      // Check if another card can be added
      canAddCard: () => {
        return get().activeCards.length < MAX_CARDS;
      },
    }),
    {
      name: 'workspace-storage', // localStorage key
    }
  )
);
