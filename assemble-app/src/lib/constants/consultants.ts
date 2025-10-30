export interface ConsultantDiscipline {
  id: string;
  name: string;
  category: string;
}

export const consultantCategories = [
  'Planning',
  'Design',
  'Engineering',
  'Site Investigation',
  'Compliance',
  'Project Management',
  'Infrastructure',
] as const;

export type ConsultantCategory = typeof consultantCategories[number];

export const consultantDisciplines: ConsultantDiscipline[] = [
  // Planning & Compliance
  { id: 'access', name: 'Access', category: 'Planning' },
  { id: 'acoustic', name: 'Acoustic', category: 'Planning' },
  { id: 'arborist', name: 'Arborist', category: 'Planning' },
  { id: 'asp3', name: 'ASP3', category: 'Planning' },
  { id: 'basix', name: 'BASIX', category: 'Planning' },
  { id: 'bushfire', name: 'Bushfire', category: 'Planning' },
  { id: 'ecology', name: 'Ecology', category: 'Planning' },
  { id: 'flood', name: 'Flood', category: 'Planning' },
  { id: 'traffic', name: 'Traffic', category: 'Planning' },
  { id: 'waste-management', name: 'Waste Management', category: 'Planning' },

  // Design Team
  { id: 'architect', name: 'Architect', category: 'Design' },
  { id: 'interior-designer', name: 'Interior Designer', category: 'Design' },
  { id: 'landscape', name: 'Landscape', category: 'Design' },

  // Engineering
  { id: 'civil', name: 'Civil', category: 'Engineering' },
  { id: 'electrical', name: 'Electrical', category: 'Engineering' },
  { id: 'facade', name: 'Facade', category: 'Engineering' },
  { id: 'fire-engineering', name: 'Fire Engineering', category: 'Engineering' },
  { id: 'fire-services', name: 'Fire Services', category: 'Engineering' },
  { id: 'hydraulic', name: 'Hydraulic', category: 'Engineering' },
  { id: 'mechanical', name: 'Mechanical', category: 'Engineering' },
  { id: 'structural', name: 'Structural', category: 'Engineering' },

  // Site Investigation
  { id: 'geotech', name: 'Geotech', category: 'Site Investigation' },
  { id: 'hazmat', name: 'Hazmat', category: 'Site Investigation' },
  { id: 'site-investigation', name: 'Site Investigation', category: 'Site Investigation' },
  { id: 'survey', name: 'Survey', category: 'Site Investigation' },

  // Compliance & Certification
  { id: 'building-certifier', name: 'Building Certifier', category: 'Compliance' },
  { id: 'building-code-advice', name: 'Building Code Advice', category: 'Compliance' },
  { id: 'esd', name: 'ESD', category: 'Compliance' },
  { id: 'passive-fire', name: 'Passive Fire', category: 'Compliance' },
  { id: 'roof-access', name: 'Roof Access', category: 'Compliance' },

  // Project Management
  { id: 'cost-planning', name: 'Cost Planning', category: 'Project Management' },

  // Infrastructure
  { id: 'nbn', name: 'NBN', category: 'Infrastructure' },
  { id: 'stormwater', name: 'Stormwater', category: 'Infrastructure' },
  { id: 'wastewater', name: 'Wastewater', category: 'Infrastructure' },
  { id: 'waterproofing', name: 'Waterproofing', category: 'Infrastructure' },
];

export interface ConsultantStatuses {
  brief: boolean;
  tender: boolean;
  rec: boolean;
  award: boolean;
}

export interface ConsultantStatus {
  disciplineId: string;
  isActive: boolean;
  statuses: ConsultantStatuses;
}

export type StatusKey = keyof ConsultantStatuses;

export const statusConfig = [
  { key: 'brief' as StatusKey, label: 'Brief', color: 'blue' },
  { key: 'tender' as StatusKey, label: 'Tender', color: 'orange' },
  { key: 'rec' as StatusKey, label: 'Rec.', color: 'purple' },
  { key: 'award' as StatusKey, label: 'Award', color: 'green' },
] as const;
