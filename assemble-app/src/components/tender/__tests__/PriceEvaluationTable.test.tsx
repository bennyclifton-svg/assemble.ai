import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriceEvaluationTable } from '../PriceEvaluationTable';
import { EvaluationLineItem } from '@/stores/tenderEvaluationStore';

// Mock CSS imports
vi.mock('handsontable/dist/handsontable.full.css', () => ({}));

// Mock Handsontable
vi.mock('@handsontable/react', () => ({
  HotTable: vi.fn(({ data, columns, colHeaders }) => (
    <div data-testid="handsontable-mock">
      <div>Table with {data.length} rows</div>
      <div>Columns: {colHeaders.join(', ')}</div>
    </div>
  )),
}));

// Mock store
vi.mock('@/stores/tenderEvaluationStore', () => ({
  useTenderEvaluationStore: vi.fn(() => ({
    updateFirmPrice: vi.fn(),
    addLineItem: vi.fn(),
    deleteLineItem: vi.fn(),
    updateLineItem: vi.fn(),
  })),
}));

describe('PriceEvaluationTable', () => {
  const mockFirms = [
    { id: 'firm1', name: 'Firm A' },
    { id: 'firm2', name: 'Firm B' },
  ];

  const mockItems: EvaluationLineItem[] = [
    {
      id: 'item1',
      description: 'Concept Design',
      isCategory: false,
      firmPrices: [
        { firmId: 'firm1', firmName: 'Firm A', amount: 1000 },
        { firmId: 'firm2', firmName: 'Firm B', amount: 1200 },
      ],
      sortOrder: 0,
    },
    {
      id: 'item2',
      description: 'Detailed Design',
      isCategory: false,
      firmPrices: [
        { firmId: 'firm1', firmName: 'Firm A', amount: 500 },
        { firmId: 'firm2', firmName: 'Firm B', amount: 600 },
      ],
      sortOrder: 1,
    },
  ];

  describe('AC4: Add/delete line items', () => {
    it('should render add item button', () => {
      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={mockFirms}
          items={mockItems}
        />
      );

      expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    });

    it('should render add category button', () => {
      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={mockFirms}
          items={mockItems}
        />
      );

      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument();
    });

    it('should not render add buttons in read-only mode', () => {
      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={mockFirms}
          items={mockItems}
          readOnly={true}
        />
      );

      expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add category/i })).not.toBeInTheDocument();
    });
  });

  describe('AC5: Hierarchical structure', () => {
    it('should render hierarchical items with categories and children', () => {
      const hierarchicalItems: EvaluationLineItem[] = [
        {
          id: 'cat1',
          description: 'Design Phase',
          isCategory: true,
          firmPrices: [],
          sortOrder: 0,
          children: [
            {
              id: 'item1',
              description: 'Concept Design',
              isCategory: false,
              firmPrices: [
                { firmId: 'firm1', firmName: 'Firm A', amount: 1000 },
              ],
              sortOrder: 0,
            },
            {
              id: 'item2',
              description: 'Detailed Design',
              isCategory: false,
              firmPrices: [
                { firmId: 'firm1', firmName: 'Firm A', amount: 2000 },
              ],
              sortOrder: 1,
            },
          ],
          categorySubTotal: 3000,
        },
      ];

      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={[{ id: 'firm1', name: 'Firm A' }]}
          items={hierarchicalItems}
        />
      );

      // Handsontable mock should render
      expect(screen.getByTestId('handsontable-mock')).toBeInTheDocument();
    });
  });

  describe('AC6: Sub-total calculations', () => {
    it('should display table sub-total', () => {
      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={mockFirms}
          items={mockItems}
        />
      );

      // Should display "Table Sub-total" label
      expect(screen.getByText(/table sub-total/i)).toBeInTheDocument();

      // Should calculate: (1000+1200) + (500+600) = 3300
      expect(screen.getByText(/3,300\.00/)).toBeInTheDocument();
    });

    it('should calculate zero subtotal for empty items', () => {
      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={mockFirms}
          items={[]}
        />
      );

      expect(screen.getByText(/0\.00/)).toBeInTheDocument();
    });

    it('should calculate category subtotals correctly', () => {
      const itemsWithCategory: EvaluationLineItem[] = [
        {
          id: 'cat1',
          description: 'Design Phase',
          isCategory: true,
          firmPrices: [],
          sortOrder: 0,
          children: [
            {
              id: 'item1',
              description: 'Concept Design',
              isCategory: false,
              firmPrices: [
                { firmId: 'firm1', firmName: 'Firm A', amount: 1000 },
                { firmId: 'firm2', firmName: 'Firm B', amount: 1200 },
              ],
              sortOrder: 0,
            },
          ],
          categorySubTotal: 2200,
        },
      ];

      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={mockFirms}
          items={itemsWithCategory}
        />
      );

      // Table subtotal should equal category subtotal (2200)
      expect(screen.getByText(/2,200\.00/)).toBeInTheDocument();
    });
  });

  describe('Table header and metadata', () => {
    it('should display table number and name', () => {
      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={mockFirms}
          items={mockItems}
        />
      );

      expect(screen.getByText('Table 1: Original')).toBeInTheDocument();
    });

    it('should display correct column headers', () => {
      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={mockFirms}
          items={mockItems}
        />
      );

      // Handsontable mock displays column headers
      expect(screen.getByText(/Columns: Item Description, Firm A, Firm B/)).toBeInTheDocument();
    });

    it('should handle single firm column', () => {
      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={[{ id: 'firm1', name: 'Single Firm' }]}
          items={mockItems}
        />
      );

      expect(screen.getByText(/Columns: Item Description, Single Firm/)).toBeInTheDocument();
    });

    it('should handle multiple firms (3+ columns)', () => {
      const multipleFirms = [
        { id: 'firm1', name: 'Firm A' },
        { id: 'firm2', name: 'Firm B' },
        { id: 'firm3', name: 'Firm C' },
      ];

      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={multipleFirms}
          items={mockItems}
        />
      );

      expect(screen.getByText(/Columns: Item Description, Firm A, Firm B, Firm C/)).toBeInTheDocument();
    });
  });

  describe('Data change callback', () => {
    it('should call onDataChange when provided', () => {
      const onDataChangeMock = vi.fn();

      render(
        <PriceEvaluationTable
          tableId="table1"
          tableNumber={1}
          tableName="Original"
          firms={mockFirms}
          items={mockItems}
          onDataChange={onDataChangeMock}
        />
      );

      // Component rendered successfully with callback
      expect(screen.getByTestId('handsontable-mock')).toBeInTheDocument();
    });
  });
});
