// Fee Structure Types for Story 3.5

export type FeeStructureItemType = 'category' | 'item';

export interface FeeStructureItem {
  id: string;
  type: FeeStructureItemType;
  description: string;
  quantity?: string;
  unit?: string;
  order: number;
  parentId?: string; // For hierarchical structure
}

export interface FeeStructureData {
  items: FeeStructureItem[];
}

// For Cost Planning integration (AC 27)
export interface Tier3CostItem {
  id: string;
  description: string;
  quantity?: string;
  unit?: string;
  categoryId?: string;
}

export interface Tier2Section {
  id: string;
  name: string; // "Consultants" or "Construction"
  tier3Items: Tier3CostItem[];
}
