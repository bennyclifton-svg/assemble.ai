export interface ContractorTrade {
  id: string;
  name: string;
  category: string;
}

export const contractorCategories = [
  'Structure',
  'Envelope',
  'Services',
  'Finishes',
  'Specialist',
  'External',
] as const;

export type ContractorCategory = typeof contractorCategories[number];

export const contractorTrades: ContractorTrade[] = [
  // Structure
  { id: 'concrete-finisher', name: 'Concrete Finisher', category: 'Structure' },
  { id: 'steel-fixer', name: 'Steel Fixer', category: 'Structure' },
  { id: 'scaffolder', name: 'Scaffolder', category: 'Structure' },
  { id: 'carpenter', name: 'Carpenter', category: 'Structure' },

  // Envelope
  { id: 'bricklayer', name: 'Bricklayer', category: 'Envelope' },
  { id: 'roofer', name: 'Roofer', category: 'Envelope' },
  { id: 'glazier', name: 'Glazier', category: 'Envelope' },
  { id: 'waterproofer', name: 'Waterproofer', category: 'Envelope' },

  // Services
  { id: 'plumber', name: 'Plumber', category: 'Services' },
  { id: 'electrician', name: 'Electrician', category: 'Services' },
  { id: 'hvac-technician', name: 'HVAC Technician', category: 'Services' },

  // Finishes
  { id: 'insulation-installer', name: 'Insulation Installer', category: 'Finishes' },
  { id: 'drywaller', name: 'Drywaller', category: 'Finishes' },
  { id: 'plasterer', name: 'Plasterer', category: 'Finishes' },
  { id: 'tiler', name: 'Tiler', category: 'Finishes' },
  { id: 'flooring-installer', name: 'Flooring Installer', category: 'Finishes' },
  { id: 'painter', name: 'Painter', category: 'Finishes' },
  { id: 'cabinetmaker', name: 'Cabinetmaker', category: 'Finishes' },

  // Specialist
  { id: 'mason', name: 'Mason', category: 'Specialist' },
  { id: 'welder', name: 'Welder', category: 'Specialist' },

  // External
  { id: 'landscaper', name: 'Landscaper', category: 'External' },
];

export interface ContractorStatuses {
  brief: boolean;
  tender: boolean;
  rec: boolean;
  award: boolean;
}

export interface ContractorStatus {
  tradeId: string;
  isActive: boolean;
  statuses: ContractorStatuses;
}

export type ContractorStatusKey = keyof ContractorStatuses;

// Reuse the same status config from consultants for consistency
export { statusConfig } from './consultants';
