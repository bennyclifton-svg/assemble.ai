import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TenderEvaluationSection } from '../TenderEvaluationSection';
import { useTenderEvaluationStore } from '@/stores/tenderEvaluationStore';

// Mock CSS imports
vi.mock('handsontable/dist/handsontable.full.css', () => ({}));

// Mock PriceEvaluationTable to avoid Handsontable DOM issues
vi.mock('@/components/tender/PriceEvaluationTable', () => ({
  PriceEvaluationTable: vi.fn(() => <div data-testid="price-evaluation-table-mock">Price Evaluation Table</div>),
}));

// Mock the store
vi.mock('@/stores/tenderEvaluationStore', () => ({
  useTenderEvaluationStore: vi.fn(),
}));

// Mock server actions
vi.mock('@/app/actions/firm', () => ({
  getFirmsAction: vi.fn(),
}));

vi.mock('@/app/actions/feeStructure', () => ({
  getFeeStructure: vi.fn(),
}));

vi.mock('@/app/actions/tenderEvaluation', () => ({
  getTenderEvaluation: vi.fn(),
  saveTenderEvaluation: vi.fn(),
  retrieveFromTenderSchedules: vi.fn(),
}));

import { getFirmsAction } from '@/app/actions/firm';
import { getFeeStructure } from '@/app/actions/feeStructure';
import { getTenderEvaluation, saveTenderEvaluation, retrieveFromTenderSchedules } from '@/app/actions/tenderEvaluation';

describe('TenderEvaluationSection', () => {
  const mockStoreState = {
    evaluation: null,
    shortListedFirms: [],
    isLoading: false,
    error: null,
    hasUnsavedChanges: false,
    setEvaluation: vi.fn(),
    setShortListedFirms: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    recalculateAll: vi.fn(),
    addTable: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreState);
  });

  describe('AC1: Display short-listed firms side-by-side', () => {
    it('should display only short-listed firms', async () => {
      const mockFirms = [
        { id: 'firm1', entity: 'Firm A', shortListed: true },
        { id: 'firm2', entity: 'Firm B', shortListed: true },
        { id: 'firm3', entity: 'Firm C', shortListed: false },
      ];

      vi.mocked(getFirmsAction).mockResolvedValue({
        success: true,
        data: mockFirms,
      } as any);

      vi.mocked(getTenderEvaluation).mockResolvedValue({
        projectId: 'proj1',
        disciplineId: 'arch',
        tables: [],
        grandTotal: 0,
      });

      const mockStoreWithFirms = {
        ...mockStoreState,
        shortListedFirms: [
          { id: 'firm1', name: 'Firm A' },
          { id: 'firm2', name: 'Firm B' },
        ],
        evaluation: {
          projectId: 'proj1',
          disciplineId: 'arch',
          tables: [],
          grandTotal: 0,
        },
      };

      vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreWithFirms);

      render(<TenderEvaluationSection projectId="proj1" disciplineId="arch" />);

      await waitFor(() => {
        expect(screen.getByText('Firm A')).toBeInTheDocument();
        expect(screen.getByText('Firm B')).toBeInTheDocument();
        expect(screen.queryByText('Firm C')).not.toBeInTheDocument();
      });
    });

    it('should show alert when no short-listed firms exist', async () => {
      vi.mocked(getFirmsAction).mockResolvedValue({
        success: true,
        data: [],
      } as any);

      const mockStoreNoFirms = {
        ...mockStoreState,
        shortListedFirms: [],
      };

      vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreNoFirms);

      render(<TenderEvaluationSection projectId="proj1" disciplineId="arch" />);

      await waitFor(() => {
        expect(screen.getByText(/no short-listed firms found/i)).toBeInTheDocument();
      });
    });
  });

  describe('AC2: Table 1 initialization from Fee Structure', () => {
    it('should initialize Table 1 with line item structure from Fee Structure (descriptions only, amounts blank)', async () => {
      const mockFeeStructure = {
        items: [
          { id: 'item1', description: 'Concept Design', type: 'item' },
          { id: 'item2', description: 'Detailed Design', type: 'item' },
        ],
      };

      const mockFirms = [
        { id: 'firm1', entity: 'Firm A', shortListed: true },
      ];

      vi.mocked(getFirmsAction).mockResolvedValue({ success: true, data: mockFirms } as any);
      vi.mocked(getFeeStructure).mockResolvedValue(mockFeeStructure as any);
      vi.mocked(getTenderEvaluation).mockResolvedValue(null);

      const setEvaluationMock = vi.fn();
      const mockStoreWithSetup = {
        ...mockStoreState,
        shortListedFirms: [{ id: 'firm1', name: 'Firm A' }],
        setEvaluation: setEvaluationMock,
      };

      vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreWithSetup);

      render(<TenderEvaluationSection projectId="proj1" disciplineId="arch" />);

      await waitFor(() => {
        expect(setEvaluationMock).toHaveBeenCalled();
        const evaluationArg = setEvaluationMock.mock.calls[0]?.[0];

        // Verify Table 1 exists
        expect(evaluationArg?.tables).toBeDefined();
        expect(evaluationArg?.tables[0]?.tableNumber).toBe(1);
        expect(evaluationArg?.tables[0]?.tableName).toBe('Original');
      });
    });
  });

  describe('AC2a: Retrieve button populates prices', () => {
    it('should populate Table 1 prices when retrieve button is clicked', async () => {
      const mockFirms = [
        { id: 'firm1', entity: 'Firm A', shortListed: true },
      ];

      const mockEvaluation = {
        projectId: 'proj1',
        disciplineId: 'arch',
        tables: [
          {
            id: 'table1',
            tableNumber: 1,
            tableName: 'Original',
            items: [
              {
                id: 'item1',
                description: 'Concept Design',
                isCategory: false,
                firmPrices: [{ firmId: 'firm1', firmName: 'Firm A', amount: 0 }],
                sortOrder: 0,
              },
            ],
            subTotal: 0,
            sortOrder: 0,
          },
        ],
        grandTotal: 0,
      };

      vi.mocked(getFirmsAction).mockResolvedValue({ success: true, data: mockFirms } as any);
      vi.mocked(getTenderEvaluation).mockResolvedValue(mockEvaluation);

      vi.mocked(retrieveFromTenderSchedules).mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: 'item1',
              description: 'Concept Design',
              isCategory: false,
              firmPrices: [{ firmId: 'firm1', firmName: 'Firm A', amount: 15000 }],
              sortOrder: 0,
            },
          ],
        },
      } as any);

      const setEvaluationMock = vi.fn();
      const recalculateAllMock = vi.fn();

      const mockStoreWithEval = {
        ...mockStoreState,
        evaluation: mockEvaluation,
        shortListedFirms: [{ id: 'firm1', name: 'Firm A' }],
        setEvaluation: setEvaluationMock,
        recalculateAll: recalculateAllMock,
      };

      vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreWithEval);

      render(<TenderEvaluationSection projectId="proj1" disciplineId="arch" />);

      const retrieveButton = await screen.findByRole('button', { name: /retrieve from tender schedules/i });
      fireEvent.click(retrieveButton);

      await waitFor(() => {
        expect(retrieveFromTenderSchedules).toHaveBeenCalledWith('proj1', 'arch', undefined);
        expect(setEvaluationMock).toHaveBeenCalled();
        expect(recalculateAllMock).toHaveBeenCalled();
      });
    });
  });

  describe('AC2b: Verify tender documents exist before populating', () => {
    it('should show error when no tender submission documents found', async () => {
      const mockFirms = [
        { id: 'firm1', entity: 'Firm A', shortListed: true },
      ];

      const mockEvaluation = {
        projectId: 'proj1',
        disciplineId: 'arch',
        tables: [],
        grandTotal: 0,
      };

      vi.mocked(getFirmsAction).mockResolvedValue({ success: true, data: mockFirms } as any);
      vi.mocked(getTenderEvaluation).mockResolvedValue(mockEvaluation);

      vi.mocked(retrieveFromTenderSchedules).mockResolvedValue({
        success: false,
        message: 'No tender submission documents found. Please upload tender documents first.',
      } as any);

      const setErrorMock = vi.fn();
      const mockStoreWithEval = {
        ...mockStoreState,
        evaluation: mockEvaluation,
        shortListedFirms: [{ id: 'firm1', name: 'Firm A' }],
        setError: setErrorMock,
      };

      vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreWithEval);

      render(<TenderEvaluationSection projectId="proj1" disciplineId="arch" />);

      const retrieveButton = await screen.findByRole('button', { name: /retrieve from tender schedules/i });
      fireEvent.click(retrieveButton);

      await waitFor(() => {
        expect(setErrorMock).toHaveBeenCalledWith(
          expect.stringContaining('No tender submission documents found')
        );
      });
    });
  });

  describe('AC3: Table 2 with 3 default items', () => {
    it('should initialize Table 2 (Adds and Subs) with 3 default placeholder items', async () => {
      const mockFirms = [
        { id: 'firm1', entity: 'Firm A', shortListed: true },
      ];

      vi.mocked(getFirmsAction).mockResolvedValue({ success: true, data: mockFirms } as any);
      vi.mocked(getTenderEvaluation).mockResolvedValue(null);

      const setEvaluationMock = vi.fn();
      const mockStoreWithSetup = {
        ...mockStoreState,
        shortListedFirms: [{ id: 'firm1', name: 'Firm A' }],
        setEvaluation: setEvaluationMock,
      };

      vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreWithSetup);

      render(<TenderEvaluationSection projectId="proj1" disciplineId="arch" />);

      await waitFor(() => {
        expect(setEvaluationMock).toHaveBeenCalled();
        const evaluationArg = setEvaluationMock.mock.calls[0]?.[0];

        // Verify Table 2 exists with 3 items
        const table2 = evaluationArg?.tables.find((t: any) => t.tableNumber === 2);
        expect(table2).toBeDefined();
        expect(table2?.tableName).toBe('Adds and Subs');
        expect(table2?.items).toHaveLength(3);

        // Verify items have default descriptions and blank amounts
        table2?.items.forEach((item: any) => {
          expect(item.description).toMatch(/Additional Item \d/);
          expect(item.firmPrices[0]?.amount).toBe(0);
        });
      });
    });
  });

  describe('Save functionality', () => {
    it('should save evaluation when save button is clicked', async () => {
      const mockEvaluation = {
        projectId: 'proj1',
        disciplineId: 'arch',
        tables: [],
        grandTotal: 0,
      };

      const mockFirms = [
        { id: 'firm1', entity: 'Firm A', shortListed: true },
      ];

      vi.mocked(getFirmsAction).mockResolvedValue({ success: true, data: mockFirms } as any);
      vi.mocked(getTenderEvaluation).mockResolvedValue(mockEvaluation);
      vi.mocked(saveTenderEvaluation).mockResolvedValue(undefined);

      const mockStoreWithChanges = {
        ...mockStoreState,
        evaluation: mockEvaluation,
        shortListedFirms: [{ id: 'firm1', name: 'Firm A' }],
        hasUnsavedChanges: true,
      };

      vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreWithChanges);

      render(<TenderEvaluationSection projectId="proj1" disciplineId="arch" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveTenderEvaluation).toHaveBeenCalledWith(mockEvaluation);
      });
    });

    it('should disable save button when no unsaved changes', async () => {
      const mockEvaluation = {
        projectId: 'proj1',
        disciplineId: 'arch',
        tables: [],
        grandTotal: 0,
      };

      const mockFirms = [
        { id: 'firm1', entity: 'Firm A', shortListed: true },
      ];

      vi.mocked(getFirmsAction).mockResolvedValue({ success: true, data: mockFirms } as any);
      vi.mocked(getTenderEvaluation).mockResolvedValue(mockEvaluation);

      const mockStoreNoChanges = {
        ...mockStoreState,
        evaluation: mockEvaluation,
        shortListedFirms: [{ id: 'firm1', name: 'Firm A' }],
        hasUnsavedChanges: false,
      };

      vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreNoChanges);

      render(<TenderEvaluationSection projectId="proj1" disciplineId="arch" />);

      const saveButton = await screen.findByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Loading states', () => {
    it('should show loading indicator while data is loading', () => {
      const mockStoreLoading = {
        ...mockStoreState,
        isLoading: true,
      };

      vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreLoading);

      render(<TenderEvaluationSection projectId="proj1" disciplineId="arch" />);

      expect(screen.getByText(/loading tender evaluation/i)).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should display error message when error state is set', async () => {
      const mockFirms = [
        { id: 'firm1', entity: 'Firm A', shortListed: true },
      ];

      const mockEvaluation = {
        projectId: 'proj1',
        disciplineId: 'arch',
        tables: [],
        grandTotal: 0,
      };

      vi.mocked(getFirmsAction).mockResolvedValue({ success: true, data: mockFirms } as any);
      vi.mocked(getTenderEvaluation).mockResolvedValue(mockEvaluation);

      const mockStoreWithError = {
        ...mockStoreState,
        evaluation: mockEvaluation,
        shortListedFirms: [{ id: 'firm1', name: 'Firm A' }],
        error: 'Test error message',
      };

      vi.mocked(useTenderEvaluationStore).mockReturnValue(mockStoreWithError);

      render(<TenderEvaluationSection projectId="proj1" disciplineId="arch" />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });
});
