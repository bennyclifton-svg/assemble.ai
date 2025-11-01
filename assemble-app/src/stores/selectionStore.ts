import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TenderSelection {
  documents: string[];
  sections: {
    plan: string[];
    consultant: Record<string, string[]>;
    contractor: Record<string, string[]>;
  };
}

// Context-specific selection data
interface ContextSelection {
  selectedDocuments: Set<string>;
  lastSelectedDocument: string | null;
  allDocuments: Array<{ id: string }>;
  selectedSections: {
    consultant: Map<string, Set<string>>;
    contractor: Map<string, Set<string>>;
  };
  documentScheduleSelected: boolean;
}

export interface SelectionStore {
  // Context-based selections (keyed by discipline/trade ID)
  selectionsByContext: Map<string, ContextSelection>;

  // Active context (current discipline/trade being edited)
  activeContext: string | null;

  // Global Plan Card selections (shared across all disciplines)
  selectedPlanSections: Set<string>;

  // Context management
  setActiveContext: (contextId: string) => void;
  getActiveContext: () => string | null;

  // Get current context's selection data (getters)
  getSelectedDocuments: () => Set<string>;
  getLastSelectedDocument: () => string | null;
  getAllDocuments: () => Array<{ id: string }>;
  getSelectedSections: () => {
    consultant: Map<string, Set<string>>;
    contractor: Map<string, Set<string>>;
  };

  // Document selection actions
  setAllDocuments: (documents: Array<{ id: string }>) => void;
  toggleDocument: (id: string, shiftKey: boolean, ctrlKey: boolean) => void;
  selectAllDocuments: () => void;
  clearDocuments: () => void;

  // Section selection actions
  toggleSection: (cardType: 'plan' | 'consultant' | 'contractor', discipline: string, sectionId: string) => void;
  clearSections: () => void;

  // Document Schedule checkbox
  getDocumentScheduleSelected: () => boolean;
  toggleDocumentSchedule: () => void;

  // Global actions
  clearSelection: () => void;
  getSelectionForTender: () => TenderSelection;
}

// Create default context selection
const createDefaultContextSelection = (): ContextSelection => ({
  selectedDocuments: new Set(),
  lastSelectedDocument: null,
  allDocuments: [],
  selectedSections: {
    consultant: new Map(),
    contractor: new Map(),
  },
  documentScheduleSelected: false,
});

// Helper functions for serialization (Sets/Maps not JSON-serializable)
const serializeContextSelection = (ctx: ContextSelection) => ({
  selectedDocuments: Array.from(ctx.selectedDocuments),
  lastSelectedDocument: ctx.lastSelectedDocument,
  allDocuments: ctx.allDocuments,
  selectedSections: {
    consultant: Object.fromEntries(
      Array.from(ctx.selectedSections.consultant.entries()).map(([k, v]) => [k, Array.from(v)])
    ),
    contractor: Object.fromEntries(
      Array.from(ctx.selectedSections.contractor.entries()).map(([k, v]) => [k, Array.from(v)])
    ),
  },
  documentScheduleSelected: ctx.documentScheduleSelected,
});

const deserializeContextSelection = (serialized: any): ContextSelection => ({
  selectedDocuments: new Set(serialized.selectedDocuments || []),
  lastSelectedDocument: serialized.lastSelectedDocument || null,
  allDocuments: serialized.allDocuments || [],
  selectedSections: {
    consultant: new Map(
      Object.entries(serialized.selectedSections?.consultant || {}).map(([k, v]: [string, any]) => [
        k,
        new Set(v),
      ])
    ),
    contractor: new Map(
      Object.entries(serialized.selectedSections?.contractor || {}).map(([k, v]: [string, any]) => [
        k,
        new Set(v),
      ])
    ),
  },
  documentScheduleSelected: serialized.documentScheduleSelected || false,
});

const serializeState = (state: SelectionStore) => ({
  selectionsByContext: Object.fromEntries(
    Array.from(state.selectionsByContext.entries()).map(([contextId, ctx]) => [
      contextId,
      serializeContextSelection(ctx),
    ])
  ),
  activeContext: state.activeContext,
  selectedPlanSections: Array.from(state.selectedPlanSections),
});

const deserializeState = (serialized: any): Partial<SelectionStore> => {
  // Validate Plan section IDs - they should be UUIDs, not lowercase names
  const planSections = serialized.selectedPlanSections || [];
  const validPlanSections = planSections.filter((id: string) => {
    // UUID format check (loose - just check if it's not a lowercase word like 'details')
    return id.length > 20 && id.includes('-');
  });

  // If we filtered out invalid sections, log a warning
  if (planSections.length !== validPlanSections.length) {
    console.warn('⚠️ Clearing invalid Plan section selections from localStorage (found lowercase names instead of UUIDs)');
    console.warn('Invalid sections:', planSections.filter((id: string) => !validPlanSections.includes(id)));
  }

  return {
    selectionsByContext: new Map(
      Object.entries(serialized.selectionsByContext || {}).map(([contextId, ctx]: [string, any]) => [
        contextId,
        deserializeContextSelection(ctx),
      ])
    ),
    activeContext: serialized.activeContext || null,
    selectedPlanSections: new Set(validPlanSections),
  };
};

export const useSelectionStore = create<SelectionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      selectionsByContext: new Map(),
      activeContext: null,
      selectedPlanSections: new Set(),

      // Set active context (discipline/trade)
      setActiveContext: (contextId: string) => {
        set({ activeContext: contextId });

        // Initialize context if it doesn't exist
        const state = get();
        if (!state.selectionsByContext.has(contextId)) {
          const newMap = new Map(state.selectionsByContext);
          newMap.set(contextId, createDefaultContextSelection());
          set({ selectionsByContext: newMap });
        }
      },

      // Get active context
      getActiveContext: () => {
        return get().activeContext;
      },

      // Get current context's data (with fallback)
      getSelectedDocuments: () => {
        const state = get();
        if (!state.activeContext) return new Set();
        const ctx = state.selectionsByContext.get(state.activeContext);
        return ctx?.selectedDocuments || new Set();
      },

      getLastSelectedDocument: () => {
        const state = get();
        if (!state.activeContext) return null;
        const ctx = state.selectionsByContext.get(state.activeContext);
        return ctx?.lastSelectedDocument || null;
      },

      getAllDocuments: () => {
        const state = get();
        if (!state.activeContext) return [];
        const ctx = state.selectionsByContext.get(state.activeContext);
        return ctx?.allDocuments || [];
      },

      getSelectedSections: () => {
        const state = get();
        if (!state.activeContext) {
          return {
            consultant: new Map(),
            contractor: new Map(),
          };
        }
        const ctx = state.selectionsByContext.get(state.activeContext);
        return ctx?.selectedSections || {
          consultant: new Map(),
          contractor: new Map(),
        };
      },

      // Set all documents for range selection
      setAllDocuments: (documents) => {
        const state = get();
        if (!state.activeContext) return;

        const newMap = new Map(state.selectionsByContext);
        const ctx = newMap.get(state.activeContext) || createDefaultContextSelection();
        ctx.allDocuments = documents;
        newMap.set(state.activeContext, ctx);
        set({ selectionsByContext: newMap });
      },

      // Toggle document selection with multi-select support
      toggleDocument: (id, shiftKey, ctrlKey) => {
        const state = get();
        if (!state.activeContext) return;

        const ctx = state.selectionsByContext.get(state.activeContext) || createDefaultContextSelection();
        const newSelection = new Set(ctx.selectedDocuments);

        if (shiftKey && ctx.lastSelectedDocument && ctx.allDocuments.length > 0) {
          // Range selection
          const startIdx = ctx.allDocuments.findIndex((d) => d.id === ctx.lastSelectedDocument);
          const endIdx = ctx.allDocuments.findIndex((d) => d.id === id);

          if (startIdx !== -1 && endIdx !== -1) {
            const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

            for (let i = from; i <= to; i++) {
              newSelection.add(ctx.allDocuments[i].id);
            }
          }
        } else if (ctrlKey) {
          // Toggle individual selection
          if (newSelection.has(id)) {
            newSelection.delete(id);
          } else {
            newSelection.add(id);
          }
        } else {
          // Single selection (replace all)
          newSelection.clear();
          newSelection.add(id);
        }

        const newMap = new Map(state.selectionsByContext);
        newMap.set(state.activeContext, {
          ...ctx,
          selectedDocuments: newSelection,
          lastSelectedDocument: id,
        });
        set({ selectionsByContext: newMap });
      },

      // Select all documents
      selectAllDocuments: () => {
        const state = get();
        if (!state.activeContext) return;

        const ctx = state.selectionsByContext.get(state.activeContext) || createDefaultContextSelection();
        const allIds = new Set(ctx.allDocuments.map((d) => d.id));

        const newMap = new Map(state.selectionsByContext);
        newMap.set(state.activeContext, {
          ...ctx,
          selectedDocuments: allIds,
        });
        set({ selectionsByContext: newMap });
      },

      // Clear document selection for current context
      clearDocuments: () => {
        const state = get();
        if (!state.activeContext) return;

        const ctx = state.selectionsByContext.get(state.activeContext) || createDefaultContextSelection();
        const newMap = new Map(state.selectionsByContext);
        newMap.set(state.activeContext, {
          ...ctx,
          selectedDocuments: new Set(),
          lastSelectedDocument: null,
        });
        set({ selectionsByContext: newMap });
      },

      // Toggle section selection
      toggleSection: (cardType, discipline, sectionId) => {
        const state = get();

        if (cardType === 'plan') {
          // Plan sections are global (not context-specific)
          const newPlanSections = new Set(state.selectedPlanSections);
          if (newPlanSections.has(sectionId)) {
            newPlanSections.delete(sectionId);
          } else {
            newPlanSections.add(sectionId);
          }
          set({ selectedPlanSections: newPlanSections });
        } else {
          // Consultant/Contractor sections are context-specific
          if (!state.activeContext) return;

          const ctx = state.selectionsByContext.get(state.activeContext) || createDefaultContextSelection();
          const sections = {
            consultant: new Map(ctx.selectedSections.consultant),
            contractor: new Map(ctx.selectedSections.contractor),
          };

          if (cardType === 'consultant') {
            const disciplineSections = new Set(sections.consultant.get(discipline) || []);
            if (disciplineSections.has(sectionId)) {
              disciplineSections.delete(sectionId);
            } else {
              disciplineSections.add(sectionId);
            }
            sections.consultant.set(discipline, disciplineSections);
          } else if (cardType === 'contractor') {
            const tradeSections = new Set(sections.contractor.get(discipline) || []);
            if (tradeSections.has(sectionId)) {
              tradeSections.delete(sectionId);
            } else {
              tradeSections.add(sectionId);
            }
            sections.contractor.set(discipline, tradeSections);
          }

          const newMap = new Map(state.selectionsByContext);
          newMap.set(state.activeContext, {
            ...ctx,
            selectedSections: sections,
          });
          set({ selectionsByContext: newMap });
        }
      },

      // Clear section selection for current context
      clearSections: () => {
        const state = get();

        // Clear global Plan sections
        set({ selectedPlanSections: new Set() });

        // Clear context-specific sections
        if (!state.activeContext) return;

        const ctx = state.selectionsByContext.get(state.activeContext) || createDefaultContextSelection();
        const newMap = new Map(state.selectionsByContext);
        newMap.set(state.activeContext, {
          ...ctx,
          selectedSections: {
            consultant: new Map(),
            contractor: new Map(),
          },
        });
        set({ selectionsByContext: newMap });
      },

      // Clear all selections for current context
      clearSelection: () => {
        const state = get();
        if (!state.activeContext) return;

        const newMap = new Map(state.selectionsByContext);
        newMap.set(state.activeContext, createDefaultContextSelection());
        set({ selectionsByContext: newMap });
      },

      // Get Document Schedule checkbox state
      getDocumentScheduleSelected: () => {
        const state = get();
        if (!state.activeContext) return false;
        const ctx = state.selectionsByContext.get(state.activeContext);
        return ctx?.documentScheduleSelected || false;
      },

      // Toggle Document Schedule checkbox
      toggleDocumentSchedule: () => {
        const state = get();
        if (!state.activeContext) return;

        const ctx = state.selectionsByContext.get(state.activeContext) || createDefaultContextSelection();
        const newMap = new Map(state.selectionsByContext);
        newMap.set(state.activeContext, {
          ...ctx,
          documentScheduleSelected: !ctx.documentScheduleSelected,
        });
        set({ selectionsByContext: newMap });
      },

      // Get selection formatted for tender package (current context)
      getSelectionForTender: () => {
        const state = get();
        if (!state.activeContext) {
          return {
            documents: [],
            sections: {
              plan: Array.from(state.selectedPlanSections), // Use global Plan sections
              consultant: {},
              contractor: {},
            },
          };
        }

        const ctx = state.selectionsByContext.get(state.activeContext) || createDefaultContextSelection();
        return {
          documents: Array.from(ctx.selectedDocuments),
          sections: {
            plan: Array.from(state.selectedPlanSections), // Use global Plan sections
            consultant: Object.fromEntries(
              Array.from(ctx.selectedSections.consultant.entries()).map(([discipline, sections]) => [
                discipline,
                Array.from(sections),
              ])
            ),
            contractor: Object.fromEntries(
              Array.from(ctx.selectedSections.contractor.entries()).map(([trade, sections]) => [
                trade,
                Array.from(sections),
              ])
            ),
          },
        };
      },
    }),
    {
      name: 'tender-selection-storage', // localStorage key
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: deserializeState(state),
          };
        },
        setItem: (name, value) => {
          const serialized = serializeState(value.state as SelectionStore);
          localStorage.setItem(
            name,
            JSON.stringify({
              state: serialized,
            })
          );
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
