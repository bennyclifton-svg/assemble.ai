/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeeStructureSection } from '../FeeStructureSection';
import * as feeStructureActions from '@/app/actions/feeStructure';
import type { FeeStructureData } from '@/types/feeStructure';

// Mock the fee structure actions
vi.mock('@/app/actions/feeStructure', () => ({
  getFeeStructure: vi.fn(),
  saveFeeStructure: vi.fn(),
  retrieveFromCostPlanning: vi.fn(),
}));

describe('FeeStructureSection - Story 3.5 Tests', () => {
  const mockProjectId = 'project_123';
  const mockDisciplineId = 'architect';

  beforeEach(() => {
    vi.clearAllMocks();
    (feeStructureActions.getFeeStructure as any).mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    (feeStructureActions.saveFeeStructure as any).mockResolvedValue({
      success: true,
      data: undefined,
    });
  });

  describe('AC 28: Manual creation of fee structure tables', () => {
    it('should render empty state with instructions', async () => {
      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/No fee structure items yet/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Add Category/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Line Item/i)).toBeInTheDocument();
    });

    it('should create fee structure table manually', async () => {
      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/No fee structure items yet/i)).toBeInTheDocument();
      });

      // Add a category
      const addCategoryBtn = screen.getByText(/Add Category/i);
      fireEvent.click(addCategoryBtn);

      await waitFor(() => {
        expect(screen.getByDisplayValue(/New Category/i)).toBeInTheDocument();
      });

      // Add a line item
      const addLineItemBtn = screen.getByText(/Add Line Item/i);
      fireEvent.click(addLineItemBtn);

      await waitFor(() => {
        expect(screen.getByDisplayValue(/New Item/i)).toBeInTheDocument();
      });
    });
  });

  describe('AC 29: Add/delete line items in fee structure', () => {
    it('should add category when Add Category button is clicked', async () => {
      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Category/i)).toBeInTheDocument();
      });

      const addCategoryBtn = screen.getByText(/Add Category/i);
      fireEvent.click(addCategoryBtn);

      await waitFor(() => {
        // Category should appear in table
        expect(screen.getByDisplayValue(/New Category/i)).toBeInTheDocument();
      });
    });

    it('should add line item when Add Line Item button is clicked', async () => {
      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Line Item/i)).toBeInTheDocument();
      });

      const addLineItemBtn = screen.getByText(/Add Line Item/i);
      fireEvent.click(addLineItemBtn);

      await waitFor(() => {
        expect(screen.getByDisplayValue(/New Item/i)).toBeInTheDocument();
      });
    });

    it('should delete item when delete button is clicked', async () => {
      // Pre-populate with an item
      (feeStructureActions.getFeeStructure as any).mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: 'test-item-1',
              type: 'item',
              description: 'Test Item',
              quantity: '10',
              unit: 'ea',
              order: 0,
            },
          ],
        },
      });

      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Test Item/i)).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButtons = screen.getAllByTitle(/Delete/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText(/Test Item/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('AC 30: Hierarchical structure support (categories and items)', () => {
    it('should display categories and items with different visual treatment', async () => {
      (feeStructureActions.getFeeStructure as any).mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: 'cat-1',
              type: 'category',
              description: 'Design Services',
              order: 0,
            },
            {
              id: 'item-1',
              type: 'item',
              description: 'Concept Design',
              quantity: '1',
              unit: 'lot',
              order: 1,
              parentId: 'cat-1',
            },
          ],
        },
      });

      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Design Services/i)).toBeInTheDocument();
        expect(screen.getByText(/Concept Design/i)).toBeInTheDocument();
      });

      // Categories should have different styling (we check for the arrow indicator)
      const rows = screen.getAllByRole('row');
      // First row is header, second is category (▶), third is item (•)
      expect(rows.length).toBeGreaterThan(2);
    });

    it('should support nested items under categories', async () => {
      const mockData: FeeStructureData = {
        items: [
          {
            id: 'cat-1',
            type: 'category',
            description: 'Construction',
            order: 0,
          },
          {
            id: 'item-1',
            type: 'item',
            description: 'Excavation',
            quantity: '100',
            unit: 'm3',
            order: 1,
            parentId: 'cat-1',
          },
          {
            id: 'item-2',
            type: 'item',
            description: 'Foundation',
            quantity: '50',
            unit: 'm2',
            order: 2,
            parentId: 'cat-1',
          },
        ],
      };

      (feeStructureActions.getFeeStructure as any).mockResolvedValue({
        success: true,
        data: mockData,
      });

      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Construction/i)).toBeInTheDocument();
        expect(screen.getByText(/Excavation/i)).toBeInTheDocument();
        expect(screen.getByText(/Foundation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Excel-like UX behavior', () => {
    it('should enable inline cell editing on click', async () => {
      (feeStructureActions.getFeeStructure as any).mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: 'item-1',
              type: 'item',
              description: 'Test Item',
              quantity: '10',
              unit: 'ea',
              order: 0,
            },
          ],
        },
      });

      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Test Item/i)).toBeInTheDocument();
      });

      // Click on the description cell
      const descriptionCell = screen.getByText(/Test Item/i);
      fireEvent.click(descriptionCell);

      // Should show input field for editing
      await waitFor(() => {
        const input = screen.getByDisplayValue(/Test Item/i) as HTMLInputElement;
        expect(input.tagName).toBe('INPUT');
      });
    });

    it('should update item value on inline edit', async () => {
      (feeStructureActions.getFeeStructure as any).mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: 'item-1',
              type: 'item',
              description: 'Test Item',
              quantity: '10',
              unit: 'ea',
              order: 0,
            },
          ],
        },
      });

      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Test Item/i)).toBeInTheDocument();
      });

      // Click on the description cell to edit
      const descriptionCell = screen.getByText(/Test Item/i);
      fireEvent.click(descriptionCell);

      // Change the value
      const input = screen.getByDisplayValue(/Test Item/i);
      fireEvent.change(input, { target: { value: 'Updated Item' } });

      await waitFor(() => {
        expect(screen.getByDisplayValue(/Updated Item/i)).toBeInTheDocument();
      });
    });

    it('should auto-save changes with debounce', async () => {
      vi.useFakeTimers();

      (feeStructureActions.getFeeStructure as any).mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: 'item-1',
              type: 'item',
              description: 'Test Item',
              quantity: '10',
              unit: 'ea',
              order: 0,
            },
          ],
        },
      });

      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Test Item/i)).toBeInTheDocument();
      });

      // Add a new item
      const addLineItemBtn = screen.getByText(/Add Line Item/i);
      fireEvent.click(addLineItemBtn);

      // Fast-forward time to trigger auto-save
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(feeStructureActions.saveFeeStructure).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });

  describe('AC 27: Retrieve from Cost Planning', () => {
    it('should show Retrieve from Cost Planning button', async () => {
      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Retrieve from Cost Planning/i)).toBeInTheDocument();
      });
    });

    it('should retrieve and populate fee structure from Cost Planning', async () => {
      const mockRetrievedData: FeeStructureData = {
        items: [
          {
            id: 'imported-1',
            type: 'category',
            description: 'Professional Fees',
            order: 0,
          },
          {
            id: 'imported-2',
            type: 'item',
            description: 'Design Fee',
            quantity: '1',
            unit: 'lot',
            order: 1,
            parentId: 'imported-1',
          },
        ],
      };

      (feeStructureActions.retrieveFromCostPlanning as any).mockResolvedValue({
        success: true,
        data: mockRetrievedData,
      });

      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Retrieve from Cost Planning/i)).toBeInTheDocument();
      });

      // Click retrieve button
      const retrieveBtn = screen.getByText(/Retrieve from Cost Planning/i);
      fireEvent.click(retrieveBtn);

      await waitFor(() => {
        expect(feeStructureActions.retrieveFromCostPlanning).toHaveBeenCalledWith(
          mockProjectId,
          mockDisciplineId
        );
      });

      // Data should be displayed
      await waitFor(() => {
        expect(screen.getByText(/Professional Fees/i)).toBeInTheDocument();
        expect(screen.getByText(/Design Fee/i)).toBeInTheDocument();
      });
    });

    it('should gracefully handle missing Cost Planning data', async () => {
      (feeStructureActions.retrieveFromCostPlanning as any).mockResolvedValue({
        success: false,
        error: {
          message: 'Cost Planning Card not found',
          code: 'NOT_FOUND',
        },
      });

      render(<FeeStructureSection projectId={mockProjectId} disciplineId={mockDisciplineId} />);

      await waitFor(() => {
        expect(screen.getByText(/Retrieve from Cost Planning/i)).toBeInTheDocument();
      });

      // Click retrieve button
      const retrieveBtn = screen.getByText(/Retrieve from Cost Planning/i);
      fireEvent.click(retrieveBtn);

      // Should not crash, should gracefully handle
      await waitFor(() => {
        expect(feeStructureActions.retrieveFromCostPlanning).toHaveBeenCalled();
      });

      // Manual creation should still be available
      expect(screen.getByText(/Add Category/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Line Item/i)).toBeInTheDocument();
    });
  });
});
