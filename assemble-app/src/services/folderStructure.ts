// Default folder structure for document repository
export const CONSULTANT_DISCIPLINES = [
  'Access', 'Acoustic', 'Arborist', 'Architect', 'ASP3', 'BASIX',
  'Building Code Advice', 'Bushfire', 'Building Certifier', 'Civil',
  'Cost Planning', 'Ecology', 'Electrical', 'ESD', 'Facade',
  'Fire Engineering', 'Fire Services', 'Flood', 'Geotech', 'Hazmat',
  'Hydraulic', 'Interior Designer', 'Landscape', 'Mechanical', 'NBN',
  'Passive Fire', 'Roof Access', 'Site Investigation', 'Stormwater',
  'Structural', 'Survey', 'Traffic', 'Vertical Transport',
  'Waste Management', 'Wastewater', 'Waterproofing'
] as const;

export const CONTRACTOR_TRADES = [
  'Earthworks', 'Concrete', 'Masonry', 'Carpenter', 'Steel Fixer',
  'Roofer', 'Plumber', 'Electrician', 'HVAC Technician',
  'Insulation Installer', 'Drywaller', 'Plasterer', 'Tiler',
  'Flooring Installer', 'Painter', 'Glazier', 'Cabinetmaker',
  'Mason', 'Welder', 'Scaffolder', 'Landscaper'
] as const;

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  fileCount?: number;
  isExpandable: boolean;
}

export function getDefaultFolderStructure(
  activeDisciplines?: string[],
  activeTrades?: string[]
): string[] {
  const folders: string[] = [];

  // Use active disciplines/trades if provided, otherwise use all
  const disciplinesToUse = activeDisciplines && activeDisciplines.length > 0
    ? activeDisciplines
    : CONSULTANT_DISCIPLINES as readonly string[] as string[];

  const tradesToUse = activeTrades && activeTrades.length > 0
    ? activeTrades
    : CONTRACTOR_TRADES as readonly string[] as string[];

  // Plan (Order: 1) - Design phase documents
  folders.push(
    'Plan',
    'Plan/Feasibility',
    'Plan/Environmental',
    'Plan/Technical',
    'Plan/Title and Survey',
    'Plan/Planning',
    'Plan/Misc'
  );

  // Scheme (Order: 2) - Scheme design by discipline
  if (disciplinesToUse.length > 0) {
    folders.push('Scheme');
    disciplinesToUse.forEach(discipline => {
      folders.push(`Scheme/${discipline}`);
    });
  }

  // Detail (Order: 3) - Detailed design by discipline
  if (disciplinesToUse.length > 0) {
    folders.push('Detail');
    disciplinesToUse.forEach(discipline => {
      folders.push(`Detail/${discipline}`);
    });
  }

  // Procure (Order: 4) - Procurement and tender documents
  folders.push(
    'Procure',
    'Procure/Procurement Strategy',
    'Procure/Tender Conditions',
    'Procure/Tender Schedules',
    'Procure/PPR & Preliminaries',
    'Procure/Contract',
    'Procure/Tender Pack',
    'Procure/Tender RFI and Addendum',
    'Procure/Tender Submission',
    'Procure/Tender Recommendation Report'
  );

  // Delivery (Order: 5) - Construction delivery phase
  folders.push('Delivery');

  // Consultants (Order: 6) - Consultant engagement documents
  if (disciplinesToUse.length > 0) {
    folders.push('Consultants');
    disciplinesToUse.forEach(discipline => {
      folders.push(`Consultants/${discipline}`);
    });
  }

  // Contractors (Order: 7) - Contractor engagement documents
  if (tradesToUse.length > 0) {
    folders.push('Contractors');
    tradesToUse.forEach(trade => {
      folders.push(`Contractors/${trade}`);
    });
  }

  // Admin (Order: 8) - Administrative documents
  folders.push(
    'Admin',
    'Admin/Fee and Approval',
    'Admin/Reports',
    'Admin/Misc'
  );

  // Finance (Order: 9) - Financial documents
  folders.push(
    'Finance',
    'Finance/Invoices',
    'Finance/Payments',
    'Finance/Budget'
  );

  return folders;
}

export function buildFolderTree(folders: string[], documents: any[] = []): FolderNode {
  const root: FolderNode = {
    name: 'Documents',
    path: '',
    children: [],
    isExpandable: true
  };

  // Count documents per folder
  const documentCounts = new Map<string, number>();
  documents.forEach(doc => {
    const count = documentCounts.get(doc.path) || 0;
    documentCounts.set(doc.path, count + 1);
  });

  // Build tree structure
  folders.forEach(folderPath => {
    const parts = folderPath.split('/');
    let currentNode = root;

    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/');

      let childNode = currentNode.children.find(child => child.name === part);

      if (!childNode) {
        childNode = {
          name: part,
          path: path,
          children: [],
          fileCount: documentCounts.get(path) || 0,
          isExpandable: index < parts.length - 1 || documentCounts.has(path)
        };
        currentNode.children.push(childNode);
      }

      currentNode = childNode;
    });
  });

  return root;
}

export function filterEmptyFolders(node: FolderNode): FolderNode | null {
  // Filter children recursively
  const filteredChildren = node.children
    .map(child => filterEmptyFolders(child))
    .filter(child => child !== null) as FolderNode[];

  // Keep node if it has files or has children with files
  if ((node.fileCount && node.fileCount > 0) || filteredChildren.length > 0) {
    return {
      ...node,
      children: filteredChildren
    };
  }

  return null;
}

export function sortFolders(folders: string[]): string[] {
  const tierOrder = [
    'Plan',
    'Scheme',
    'Detail',
    'Procure',
    'Delivery',
    'Consultants',
    'Contractors',
    'Admin',
    'Finance'
  ];

  return folders.sort((a, b) => {
    const aTier = a.split('/')[0];
    const bTier = b.split('/')[0];

    const aIndex = tierOrder.indexOf(aTier);
    const bIndex = tierOrder.indexOf(bTier);

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return a.localeCompare(b);
  });
}