/**
 * Fee Structure Utilities
 * Helper functions for transforming and managing fee structure data
 */

import type { FeeStructureItem } from '@/types/feeStructure';

/**
 * Transform stage names from Plan Card into fee structure category items
 * Each stage becomes a top-level category in the fee structure
 *
 * @param stageNames - Array of stage names from Plan Card
 * @param startingOrder - Starting order number for the new categories (to append to existing data)
 * @returns Array of FeeStructureItem category objects
 */
export function transformStagesToCategories(
  stageNames: string[],
  startingOrder: number = 0
): FeeStructureItem[] {
  return stageNames.map((stageName, index) => ({
    id: `stage-cat-${Date.now()}-${index}`,
    type: 'category' as const,
    description: stageName,
    order: startingOrder + index,
  }));
}

/**
 * Append new categories to existing fee structure data
 * Preserves existing data and adds new categories at the end
 *
 * @param existingData - Current fee structure items
 * @param newCategories - New category items to append
 * @returns Combined array with updated order numbers
 */
export function appendCategoriesToFeeStructure(
  existingData: FeeStructureItem[],
  newCategories: FeeStructureItem[]
): FeeStructureItem[] {
  const startingOrder = existingData.length;

  // Update the order of new categories based on existing data length
  const updatedCategories = newCategories.map((cat, index) => ({
    ...cat,
    order: startingOrder + index,
  }));

  return [...existingData, ...updatedCategories];
}
