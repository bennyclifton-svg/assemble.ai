import { describe, it, expect, beforeEach } from 'vitest';
import { useTenderEvaluationStore, EvaluationLineItem, TenderEvaluationTable } from '../tenderEvaluationStore';

describe('TenderEvaluationStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useTenderEvaluationStore.getState().reset();
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation).toBeNull();
      expect(state.shortListedFirms).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.hasUnsavedChanges).toBe(false);
    });
  });

  describe('Evaluation Management', () => {
    it('should set evaluation and reset unsaved changes flag', () => {
      const mockEvaluation = {
        projectId: 'proj1',
        disciplineId: 'arch',
        consultantCardId: 'cons1',
        tables: [],
        grandTotal: 0,
      };

      useTenderEvaluationStore.getState().setEvaluation(mockEvaluation);

      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation).toEqual(mockEvaluation);
      expect(state.hasUnsavedChanges).toBe(false);
    });

    it('should set short-listed firms', () => {
      const firms = [
        { id: 'firm1', name: 'Firm A' },
        { id: 'firm2', name: 'Firm B' },
      ];

      useTenderEvaluationStore.getState().setShortListedFirms(firms);

      const state = useTenderEvaluationStore.getState();
      expect(state.shortListedFirms).toEqual(firms);
    });
  });

  describe('Table Operations', () => {
    beforeEach(() => {
      const mockEvaluation = {
        projectId: 'proj1',
        disciplineId: 'arch',
        tables: [],
        grandTotal: 0,
      };
      useTenderEvaluationStore.getState().setEvaluation(mockEvaluation);
    });

    it('should add a new table', () => {
      const newTable: TenderEvaluationTable = {
        id: 'table1',
        tableNumber: 1,
        tableName: 'Original',
        items: [],
        subTotal: 0,
        sortOrder: 0,
      };

      useTenderEvaluationStore.getState().addTable(newTable);

      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation?.tables).toHaveLength(1);
      expect(state.evaluation?.tables[0]).toEqual(newTable);
      expect(state.hasUnsavedChanges).toBe(true);
    });

    it('should update an existing table', () => {
      const table: TenderEvaluationTable = {
        id: 'table1',
        tableNumber: 1,
        tableName: 'Original',
        items: [],
        subTotal: 0,
        sortOrder: 0,
      };

      useTenderEvaluationStore.getState().addTable(table);
      useTenderEvaluationStore.getState().updateTable('table1', { tableName: 'Updated Name' });

      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation?.tables[0].tableName).toBe('Updated Name');
    });

    it('should delete a table', () => {
      const table: TenderEvaluationTable = {
        id: 'table1',
        tableNumber: 1,
        tableName: 'Original',
        items: [],
        subTotal: 0,
        sortOrder: 0,
      };

      useTenderEvaluationStore.getState().addTable(table);
      useTenderEvaluationStore.getState().deleteTable('table1');

      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation?.tables).toHaveLength(0);
    });
  });

  describe('Line Item Operations', () => {
    beforeEach(() => {
      const mockEvaluation = {
        projectId: 'proj1',
        disciplineId: 'arch',
        tables: [
          {
            id: 'table1',
            tableNumber: 1,
            tableName: 'Original',
            items: [],
            subTotal: 0,
            sortOrder: 0,
          },
        ],
        grandTotal: 0,
      };
      useTenderEvaluationStore.getState().setEvaluation(mockEvaluation);
      useTenderEvaluationStore.getState().setShortListedFirms([
        { id: 'firm1', name: 'Firm A' },
        { id: 'firm2', name: 'Firm B' },
      ]);
    });

    it('should add a line item to root level', () => {
      const item: EvaluationLineItem = {
        id: 'item1',
        description: 'Test Item',
        isCategory: false,
        firmPrices: [
          { firmId: 'firm1', firmName: 'Firm A', amount: 1000 },
          { firmId: 'firm2', firmName: 'Firm B', amount: 1200 },
        ],
        sortOrder: 0,
      };

      useTenderEvaluationStore.getState().addLineItem('table1', item);

      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation?.tables[0].items).toHaveLength(1);
      expect(state.evaluation?.tables[0].items[0]).toEqual(item);
    });

    it('should add a line item as child to category', () => {
      const category: EvaluationLineItem = {
        id: 'cat1',
        description: 'Category',
        isCategory: true,
        firmPrices: [],
        sortOrder: 0,
        children: [],
      };

      const childItem: EvaluationLineItem = {
        id: 'item1',
        description: 'Child Item',
        isCategory: false,
        firmPrices: [],
        sortOrder: 0,
      };

      useTenderEvaluationStore.getState().addLineItem('table1', category);
      useTenderEvaluationStore.getState().addLineItem('table1', childItem, 'cat1');

      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation?.tables[0].items[0].children).toHaveLength(1);
      expect(state.evaluation?.tables[0].items[0].children?.[0]).toEqual(childItem);
    });

    it('should update a line item', () => {
      const item: EvaluationLineItem = {
        id: 'item1',
        description: 'Test Item',
        isCategory: false,
        firmPrices: [],
        sortOrder: 0,
      };

      useTenderEvaluationStore.getState().addLineItem('table1', item);
      useTenderEvaluationStore.getState().updateLineItem('table1', 'item1', {
        description: 'Updated Description',
      });

      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation?.tables[0].items[0].description).toBe('Updated Description');
    });

    it('should delete a line item', () => {
      const item: EvaluationLineItem = {
        id: 'item1',
        description: 'Test Item',
        isCategory: false,
        firmPrices: [],
        sortOrder: 0,
      };

      useTenderEvaluationStore.getState().addLineItem('table1', item);
      useTenderEvaluationStore.getState().deleteLineItem('table1', 'item1');

      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation?.tables[0].items).toHaveLength(0);
    });

    it('should update firm price and trigger recalculation', () => {
      const item: EvaluationLineItem = {
        id: 'item1',
        description: 'Test Item',
        isCategory: false,
        firmPrices: [
          { firmId: 'firm1', firmName: 'Firm A', amount: 1000 },
          { firmId: 'firm2', firmName: 'Firm B', amount: 1200 },
        ],
        sortOrder: 0,
      };

      useTenderEvaluationStore.getState().addLineItem('table1', item);
      useTenderEvaluationStore.getState().updateFirmPrice('table1', 'item1', 'firm1', 1500);

      const state = useTenderEvaluationStore.getState();
      const updatedItem = state.evaluation?.tables[0].items[0];
      const firm1Price = updatedItem?.firmPrices.find((p) => p.firmId === 'firm1');

      expect(firm1Price?.amount).toBe(1500);
      expect(state.hasUnsavedChanges).toBe(true);
    });

    it('should add new firm price if it does not exist', () => {
      const item: EvaluationLineItem = {
        id: 'item1',
        description: 'Test Item',
        isCategory: false,
        firmPrices: [{ firmId: 'firm1', firmName: 'Firm A', amount: 1000 }],
        sortOrder: 0,
      };

      useTenderEvaluationStore.getState().addLineItem('table1', item);
      useTenderEvaluationStore.getState().updateFirmPrice('table1', 'item1', 'firm2', 2000);

      const state = useTenderEvaluationStore.getState();
      const updatedItem = state.evaluation?.tables[0].items[0];

      expect(updatedItem?.firmPrices).toHaveLength(2);
      const firm2Price = updatedItem?.firmPrices.find((p) => p.firmId === 'firm2');
      expect(firm2Price?.amount).toBe(2000);
      expect(firm2Price?.firmName).toBe('Firm B');
    });
  });

  describe('Calculation Operations', () => {
    beforeEach(() => {
      const mockEvaluation = {
        projectId: 'proj1',
        disciplineId: 'arch',
        tables: [
          {
            id: 'table1',
            tableNumber: 1,
            tableName: 'Original',
            items: [],
            subTotal: 0,
            sortOrder: 0,
          },
        ],
        grandTotal: 0,
      };
      useTenderEvaluationStore.getState().setEvaluation(mockEvaluation);
    });

    it('should calculate table subtotals correctly', () => {
      const item1: EvaluationLineItem = {
        id: 'item1',
        description: 'Item 1',
        isCategory: false,
        firmPrices: [
          { firmId: 'firm1', firmName: 'Firm A', amount: 1000 },
          { firmId: 'firm2', firmName: 'Firm B', amount: 1200 },
        ],
        sortOrder: 0,
      };

      const item2: EvaluationLineItem = {
        id: 'item2',
        description: 'Item 2',
        isCategory: false,
        firmPrices: [
          { firmId: 'firm1', firmName: 'Firm A', amount: 500 },
          { firmId: 'firm2', firmName: 'Firm B', amount: 600 },
        ],
        sortOrder: 1,
      };

      useTenderEvaluationStore.getState().addLineItem('table1', item1);
      useTenderEvaluationStore.getState().addLineItem('table1', item2);
      useTenderEvaluationStore.getState().calculateSubTotals('table1');

      const state = useTenderEvaluationStore.getState();
      // Subtotal = (1000 + 1200) + (500 + 600) = 3300
      expect(state.evaluation?.tables[0].subTotal).toBe(3300);
    });

    it('should calculate category subtotals correctly', () => {
      const category: EvaluationLineItem = {
        id: 'cat1',
        description: 'Category 1',
        isCategory: true,
        firmPrices: [],
        sortOrder: 0,
        children: [
          {
            id: 'item1',
            description: 'Item 1',
            isCategory: false,
            firmPrices: [
              { firmId: 'firm1', firmName: 'Firm A', amount: 1000 },
              { firmId: 'firm2', firmName: 'Firm B', amount: 1200 },
            ],
            sortOrder: 0,
          },
          {
            id: 'item2',
            description: 'Item 2',
            isCategory: false,
            firmPrices: [
              { firmId: 'firm1', firmName: 'Firm A', amount: 500 },
              { firmId: 'firm2', firmName: 'Firm B', amount: 600 },
            ],
            sortOrder: 1,
          },
        ],
      };

      useTenderEvaluationStore.getState().addLineItem('table1', category);
      useTenderEvaluationStore.getState().calculateSubTotals('table1');

      const state = useTenderEvaluationStore.getState();
      const categoryItem = state.evaluation?.tables[0].items[0];

      // Category subtotal = (1000 + 1200) + (500 + 600) = 3300
      expect(categoryItem?.categorySubTotal).toBe(3300);
    });

    it('should calculate grand total across multiple tables', () => {
      const table2: TenderEvaluationTable = {
        id: 'table2',
        tableNumber: 2,
        tableName: 'Adds and Subs',
        items: [],
        subTotal: 0,
        sortOrder: 1,
      };

      useTenderEvaluationStore.getState().addTable(table2);

      // Add items to table 1
      useTenderEvaluationStore.getState().addLineItem('table1', {
        id: 'item1',
        description: 'Item 1',
        isCategory: false,
        firmPrices: [{ firmId: 'firm1', firmName: 'Firm A', amount: 1000 }],
        sortOrder: 0,
      });

      // Add items to table 2
      useTenderEvaluationStore.getState().addLineItem('table2', {
        id: 'item2',
        description: 'Item 2',
        isCategory: false,
        firmPrices: [{ firmId: 'firm1', firmName: 'Firm A', amount: 500 }],
        sortOrder: 0,
      });

      useTenderEvaluationStore.getState().calculateSubTotals('table1');
      useTenderEvaluationStore.getState().calculateSubTotals('table2');
      useTenderEvaluationStore.getState().calculateGrandTotal();

      const state = useTenderEvaluationStore.getState();
      // Grand total = 1000 + 500 = 1500
      expect(state.evaluation?.grandTotal).toBe(1500);
    });

    it('should recalculate all tables and grand total', () => {
      const table2: TenderEvaluationTable = {
        id: 'table2',
        tableNumber: 2,
        tableName: 'Adds and Subs',
        items: [
          {
            id: 'item2',
            description: 'Item 2',
            isCategory: false,
            firmPrices: [{ firmId: 'firm1', firmName: 'Firm A', amount: 500 }],
            sortOrder: 0,
          },
        ],
        subTotal: 0,
        sortOrder: 1,
      };

      useTenderEvaluationStore.getState().addTable(table2);
      useTenderEvaluationStore.getState().addLineItem('table1', {
        id: 'item1',
        description: 'Item 1',
        isCategory: false,
        firmPrices: [{ firmId: 'firm1', firmName: 'Firm A', amount: 1000 }],
        sortOrder: 0,
      });

      useTenderEvaluationStore.getState().recalculateAll();

      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation?.tables[0].subTotal).toBe(1000);
      expect(state.evaluation?.tables[1].subTotal).toBe(500);
      expect(state.evaluation?.grandTotal).toBe(1500);
    });
  });

  describe('State Management', () => {
    it('should set loading state', () => {
      useTenderEvaluationStore.getState().setLoading(true);
      expect(useTenderEvaluationStore.getState().isLoading).toBe(true);

      useTenderEvaluationStore.getState().setLoading(false);
      expect(useTenderEvaluationStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      useTenderEvaluationStore.getState().setError('Test error');
      expect(useTenderEvaluationStore.getState().error).toBe('Test error');

      useTenderEvaluationStore.getState().setError(null);
      expect(useTenderEvaluationStore.getState().error).toBeNull();
    });

    it('should set unsaved changes flag', () => {
      useTenderEvaluationStore.getState().setHasUnsavedChanges(true);
      expect(useTenderEvaluationStore.getState().hasUnsavedChanges).toBe(true);

      useTenderEvaluationStore.getState().setHasUnsavedChanges(false);
      expect(useTenderEvaluationStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('should reset to initial state', () => {
      const mockEvaluation = {
        projectId: 'proj1',
        disciplineId: 'arch',
        tables: [],
        grandTotal: 0,
      };

      useTenderEvaluationStore.getState().setEvaluation(mockEvaluation);
      useTenderEvaluationStore.getState().setError('Error');
      useTenderEvaluationStore.getState().setLoading(true);

      useTenderEvaluationStore.getState().reset();

      const state = useTenderEvaluationStore.getState();
      expect(state.evaluation).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.hasUnsavedChanges).toBe(false);
    });
  });
});
