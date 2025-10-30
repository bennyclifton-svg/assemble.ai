import { describe, it, expect, beforeEach } from 'vitest';
import { useFeeStructureStore } from '../feeStructureStore';
import type { FeeStructureItem } from '@/types/feeStructure';

describe('feeStructureStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useFeeStructureStore.getState().reset();
  });

  it('should initialize with empty items', () => {
    const { items } = useFeeStructureStore.getState();
    expect(items).toEqual([]);
  });

  it('should set items', () => {
    const testItems: FeeStructureItem[] = [
      {
        id: 'item-1',
        type: 'category',
        description: 'Test Category',
        order: 0,
      },
      {
        id: 'item-2',
        type: 'item',
        description: 'Test Item',
        order: 1,
      },
    ];

    useFeeStructureStore.getState().setItems(testItems);
    const { items } = useFeeStructureStore.getState();
    expect(items).toEqual(testItems);
  });

  it('should append categories with updated order', () => {
    // Set initial items
    const initialItems: FeeStructureItem[] = [
      {
        id: 'item-1',
        type: 'category',
        description: 'Existing Category',
        order: 0,
      },
    ];
    useFeeStructureStore.getState().setItems(initialItems);

    // Append new categories
    const newCategories: FeeStructureItem[] = [
      {
        id: 'stage-cat-1',
        type: 'category',
        description: 'Stage 1',
        order: 0, // Will be updated
      },
      {
        id: 'stage-cat-2',
        type: 'category',
        description: 'Stage 2',
        order: 1, // Will be updated
      },
    ];

    useFeeStructureStore.getState().appendCategories(newCategories);
    const { items } = useFeeStructureStore.getState();

    expect(items).toHaveLength(3);
    expect(items[0]).toEqual(initialItems[0]);
    expect(items[1]).toEqual({
      id: 'stage-cat-1',
      type: 'category',
      description: 'Stage 1',
      order: 1, // Updated from starting order
    });
    expect(items[2]).toEqual({
      id: 'stage-cat-2',
      type: 'category',
      description: 'Stage 2',
      order: 2, // Updated from starting order
    });
  });

  it('should reset to empty state', () => {
    const testItems: FeeStructureItem[] = [
      {
        id: 'item-1',
        type: 'category',
        description: 'Test Category',
        order: 0,
      },
    ];

    useFeeStructureStore.getState().setItems(testItems);
    expect(useFeeStructureStore.getState().items).toHaveLength(1);

    useFeeStructureStore.getState().reset();
    expect(useFeeStructureStore.getState().items).toEqual([]);
  });
});
