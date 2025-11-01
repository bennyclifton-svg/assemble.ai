import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface FirmPriceData {
  firmId: string;
  firmName: string;
  amount: number;
}

export interface EvaluationLineItem {
  id: string;
  description: string;
  isCategory: boolean;
  parentCategoryId?: string;
  firmPrices: FirmPriceData[];
  categorySubTotal?: number;
  sortOrder: number;
  children?: EvaluationLineItem[]; // For hierarchical display
}

export interface TenderEvaluationTable {
  id: string;
  tableNumber: number;
  tableName: string;
  items: EvaluationLineItem[];
  subTotal: number;
  sortOrder: number;
}

export interface TenderEvaluation {
  id?: string;
  consultantCardId?: string;
  contractorCardId?: string;
  projectId: string;
  disciplineId: string;
  tables: TenderEvaluationTable[];
  grandTotal: number;
}

interface TenderEvaluationStore {
  // State
  evaluation: TenderEvaluation | null;
  shortListedFirms: Array<{ id: string; name: string }>;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;

  // Actions
  setEvaluation: (evaluation: TenderEvaluation) => void;
  setShortListedFirms: (firms: Array<{ id: string; name: string }>) => void;

  // Table operations
  addTable: (table: TenderEvaluationTable) => void;
  updateTable: (tableId: string, updates: Partial<TenderEvaluationTable>) => void;
  deleteTable: (tableId: string) => void;

  // Line item operations
  addLineItem: (tableId: string, item: EvaluationLineItem, parentId?: string) => void;
  updateLineItem: (tableId: string, itemId: string, updates: Partial<EvaluationLineItem>) => void;
  deleteLineItem: (tableId: string, itemId: string) => void;
  updateFirmPrice: (tableId: string, itemId: string, firmId: string, amount: number) => void;

  // Calculation operations
  calculateSubTotals: (tableId: string) => void;
  calculateGrandTotal: () => void;
  recalculateAll: () => void;

  // Data retrieval
  retrieveFromFeeStructure: (feeStructureData: any) => void;
  retrieveFromTenderSchedules: (tenderData: any) => void;

  // Persistence
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  evaluation: null,
  shortListedFirms: [],
  isLoading: false,
  error: null,
  hasUnsavedChanges: false,
};

export const useTenderEvaluationStore = create<TenderEvaluationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setEvaluation: (evaluation) => set({ evaluation, hasUnsavedChanges: false }),

      setShortListedFirms: (firms) => set({ shortListedFirms: firms }),

      addTable: (table) => set((state) => {
        if (!state.evaluation) return state;
        return {
          evaluation: {
            ...state.evaluation,
            tables: [...state.evaluation.tables, table],
          },
          hasUnsavedChanges: true,
        };
      }),

      updateTable: (tableId, updates) => set((state) => {
        if (!state.evaluation) return state;
        return {
          evaluation: {
            ...state.evaluation,
            tables: state.evaluation.tables.map((table) =>
              table.id === tableId ? { ...table, ...updates } : table
            ),
          },
          hasUnsavedChanges: true,
        };
      }),

      deleteTable: (tableId) => set((state) => {
        if (!state.evaluation) return state;
        return {
          evaluation: {
            ...state.evaluation,
            tables: state.evaluation.tables.filter((table) => table.id !== tableId),
          },
          hasUnsavedChanges: true,
        };
      }),

      addLineItem: (tableId, item, parentId) => set((state) => {
        if (!state.evaluation) return state;

        const addItemToTable = (items: EvaluationLineItem[]): EvaluationLineItem[] => {
          if (!parentId) {
            // Add to root level
            return [...items, item];
          }

          // Add as child to parent category
          return items.map((existingItem) => {
            if (existingItem.id === parentId && existingItem.isCategory) {
              return {
                ...existingItem,
                children: [...(existingItem.children || []), item],
              };
            }
            if (existingItem.children) {
              return {
                ...existingItem,
                children: addItemToTable(existingItem.children),
              };
            }
            return existingItem;
          });
        };

        return {
          evaluation: {
            ...state.evaluation,
            tables: state.evaluation.tables.map((table) =>
              table.id === tableId
                ? { ...table, items: addItemToTable(table.items) }
                : table
            ),
          },
          hasUnsavedChanges: true,
        };
      }),

      updateLineItem: (tableId, itemId, updates) => set((state) => {
        if (!state.evaluation) return state;

        const updateItemInList = (items: EvaluationLineItem[]): EvaluationLineItem[] => {
          return items.map((item) => {
            if (item.id === itemId) {
              return { ...item, ...updates };
            }
            if (item.children) {
              return {
                ...item,
                children: updateItemInList(item.children),
              };
            }
            return item;
          });
        };

        return {
          evaluation: {
            ...state.evaluation,
            tables: state.evaluation.tables.map((table) =>
              table.id === tableId
                ? { ...table, items: updateItemInList(table.items) }
                : table
            ),
          },
          hasUnsavedChanges: true,
        };
      }),

      deleteLineItem: (tableId, itemId) => set((state) => {
        if (!state.evaluation) return state;

        const deleteItemFromList = (items: EvaluationLineItem[]): EvaluationLineItem[] => {
          return items
            .filter((item) => item.id !== itemId)
            .map((item) => {
              if (item.children) {
                return {
                  ...item,
                  children: deleteItemFromList(item.children),
                };
              }
              return item;
            });
        };

        return {
          evaluation: {
            ...state.evaluation,
            tables: state.evaluation.tables.map((table) =>
              table.id === tableId
                ? { ...table, items: deleteItemFromList(table.items) }
                : table
            ),
          },
          hasUnsavedChanges: true,
        };
      }),

      updateFirmPrice: (tableId, itemId, firmId, amount) => set((state) => {
        if (!state.evaluation) return state;

        const updatePriceInItem = (items: EvaluationLineItem[]): EvaluationLineItem[] => {
          return items.map((item) => {
            if (item.id === itemId) {
              const updatedPrices = item.firmPrices.map((price) =>
                price.firmId === firmId ? { ...price, amount } : price
              );

              // If firm price doesn't exist, add it
              if (!updatedPrices.some((p) => p.firmId === firmId)) {
                const firm = state.shortListedFirms.find((f) => f.id === firmId);
                if (firm) {
                  updatedPrices.push({
                    firmId,
                    firmName: firm.name,
                    amount,
                  });
                }
              }

              return { ...item, firmPrices: updatedPrices };
            }
            if (item.children) {
              return {
                ...item,
                children: updatePriceInItem(item.children),
              };
            }
            return item;
          });
        };

        const newState = {
          evaluation: {
            ...state.evaluation,
            tables: state.evaluation.tables.map((table) =>
              table.id === tableId
                ? { ...table, items: updatePriceInItem(table.items) }
                : table
            ),
          },
          hasUnsavedChanges: true,
        };

        // Trigger recalculation after price update
        set(newState);
        get().calculateSubTotals(tableId);
        get().calculateGrandTotal();

        return newState;
      }),

      calculateSubTotals: (tableId) => set((state) => {
        if (!state.evaluation) return state;

        const calculateItemSubTotals = (items: EvaluationLineItem[]): EvaluationLineItem[] => {
          return items.map((item) => {
            if (item.isCategory && item.children) {
              // Calculate category subtotal from children
              const childrenWithSubTotals = calculateItemSubTotals(item.children);
              const categorySubTotal = childrenWithSubTotals.reduce((sum, child) => {
                if (child.isCategory && child.categorySubTotal) {
                  return sum + child.categorySubTotal;
                } else if (!child.isCategory) {
                  // Sum all firm prices for this line item
                  const itemTotal = child.firmPrices.reduce((itemSum, price) => itemSum + price.amount, 0);
                  return sum + itemTotal;
                }
                return sum;
              }, 0);

              return {
                ...item,
                children: childrenWithSubTotals,
                categorySubTotal,
              };
            }
            return item;
          });
        };

        return {
          evaluation: {
            ...state.evaluation,
            tables: state.evaluation.tables.map((table) => {
              if (table.id === tableId) {
                const updatedItems = calculateItemSubTotals(table.items);

                // Calculate table subtotal
                const tableSubTotal = updatedItems.reduce((sum, item) => {
                  if (item.isCategory && item.categorySubTotal) {
                    return sum + item.categorySubTotal;
                  } else if (!item.isCategory) {
                    const itemTotal = item.firmPrices.reduce((itemSum, price) => itemSum + price.amount, 0);
                    return sum + itemTotal;
                  }
                  return sum;
                }, 0);

                return {
                  ...table,
                  items: updatedItems,
                  subTotal: tableSubTotal,
                };
              }
              return table;
            }),
          },
        };
      }),

      calculateGrandTotal: () => set((state) => {
        if (!state.evaluation) return state;

        const grandTotal = state.evaluation.tables.reduce((sum, table) => sum + table.subTotal, 0);

        return {
          evaluation: {
            ...state.evaluation,
            grandTotal,
          },
        };
      }),

      recalculateAll: () => {
        const state = get();
        if (!state.evaluation) return;

        // Calculate subtotals for all tables
        state.evaluation.tables.forEach((table) => {
          state.calculateSubTotals(table.id);
        });

        // Calculate grand total
        state.calculateGrandTotal();
      },

      retrieveFromFeeStructure: (feeStructureData) => set((state) => {
        if (!state.evaluation) return state;

        // Transform fee structure data to evaluation line items
        // This will be implemented based on the actual fee structure format
        const transformedItems: EvaluationLineItem[] = [];

        // Initialize Table 1 with fee structure items (descriptions only, no prices)
        const table1 = state.evaluation.tables.find((t) => t.tableNumber === 1);
        if (table1) {
          return {
            evaluation: {
              ...state.evaluation,
              tables: state.evaluation.tables.map((table) =>
                table.tableNumber === 1
                  ? { ...table, items: transformedItems }
                  : table
              ),
            },
            hasUnsavedChanges: true,
          };
        }

        return state;
      }),

      retrieveFromTenderSchedules: (tenderData) => set((state) => {
        if (!state.evaluation) return state;

        // Populate Table 1 prices from tender submission data
        // This will be implemented based on the actual tender data format

        return {
          evaluation: state.evaluation,
          hasUnsavedChanges: true,
        };
      }),

      setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'tender-evaluation-store',
    }
  )
);