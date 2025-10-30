import { describe, it, expect } from 'vitest';
import {
  getDefaultFolderStructure,
  buildFolderTree,
  filterEmptyFolders,
  sortFolders,
  CONSULTANT_DISCIPLINES,
  CONTRACTOR_TRADES,
} from '../folderStructure';

describe('FolderStructure Service - Story 2.1', () => {
  describe('AC-2: Default folder structure', () => {
    it('should include all 9 Tier 1 folders in correct order', () => {
      const folders = getDefaultFolderStructure();

      // Extract Tier 1 folders
      const tier1Folders = folders
        .filter(f => !f.includes('/'))
        .sort((a, b) => folders.indexOf(a) - folders.indexOf(b));

      expect(tier1Folders).toEqual([
        'Admin',
        'Invoices',
        'Plan',
        'Consultants',
        'Scheme',
        'Detail',
        'Procure',
        'Contractors',
        'Delivery'
      ]);
    });

    it('should include all Admin Tier 2 folders', () => {
      const folders = getDefaultFolderStructure();
      const adminFolders = folders.filter(f => f.startsWith('Admin/'));

      expect(adminFolders).toContain('Admin/Fee and Approval');
      expect(adminFolders).toContain('Admin/Reports');
      expect(adminFolders).toContain('Admin/Misc');
    });

    it('should include all Plan Tier 2 folders', () => {
      const folders = getDefaultFolderStructure();
      const planFolders = folders.filter(f => f.startsWith('Plan/'));

      expect(planFolders).toContain('Plan/Feasibility');
      expect(planFolders).toContain('Plan/Environmental');
      expect(planFolders).toContain('Plan/Technical');
      expect(planFolders).toContain('Plan/Title and Survey');
      expect(planFolders).toContain('Plan/Planning');
      expect(planFolders).toContain('Plan/Misc');
    });

    it('should include all Procure Tier 2 folders', () => {
      const folders = getDefaultFolderStructure();
      const procureFolders = folders.filter(f => f.startsWith('Procure/'));

      expect(procureFolders).toContain('Procure/Procurement Strategy');
      expect(procureFolders).toContain('Procure/Tender Conditions');
      expect(procureFolders).toContain('Procure/Tender Schedules');
      expect(procureFolders).toContain('Procure/PPR & Preliminaries');
      expect(procureFolders).toContain('Procure/Contract');
      expect(procureFolders).toContain('Procure/Tender Pack');
      expect(procureFolders).toContain('Procure/Tender RFI and Addendum');
      expect(procureFolders).toContain('Procure/Tender Submission');
      expect(procureFolders).toContain('Procure/Tender Recommendation Report');
    });

    it('should include all consultant disciplines with Misc subfolders', () => {
      const folders = getDefaultFolderStructure();

      CONSULTANT_DISCIPLINES.forEach(discipline => {
        expect(folders).toContain(`Consultants/${discipline}`);
        expect(folders).toContain(`Consultants/${discipline}/Misc`);
      });
    });

    it('should include all consultant disciplines in Scheme', () => {
      const folders = getDefaultFolderStructure();

      CONSULTANT_DISCIPLINES.forEach(discipline => {
        expect(folders).toContain(`Scheme/${discipline}`);
      });
    });

    it('should include all consultant disciplines in Detail', () => {
      const folders = getDefaultFolderStructure();

      CONSULTANT_DISCIPLINES.forEach(discipline => {
        expect(folders).toContain(`Detail/${discipline}`);
      });
    });

    it('should include all contractor trades with Misc subfolders', () => {
      const folders = getDefaultFolderStructure();

      CONTRACTOR_TRADES.forEach(trade => {
        expect(folders).toContain(`Contractors/${trade}`);
        expect(folders).toContain(`Contractors/${trade}/Misc`);
      });
    });

    it('should have all consultant disciplines defined', () => {
      // The disciplines are ordered logically for construction industry, not strictly alphabetically
      expect(CONSULTANT_DISCIPLINES.length).toBe(36);
      expect(CONSULTANT_DISCIPLINES).toContain('Architect');
      expect(CONSULTANT_DISCIPLINES).toContain('Structural');
      expect(CONSULTANT_DISCIPLINES).toContain('Electrical');
    });

    it('should have all contractor trades defined', () => {
      // The trades are ordered logically for construction sequence, not strictly alphabetically
      expect(CONTRACTOR_TRADES.length).toBe(21);
      expect(CONTRACTOR_TRADES).toContain('Carpenter');
      expect(CONTRACTOR_TRADES).toContain('Plumber');
      expect(CONTRACTOR_TRADES).toContain('Electrician');
    });
  });

  describe('AC-1: Two-tier categorization with buildFolderTree', () => {
    it('should build hierarchical tree structure', () => {
      const folders = ['Admin', 'Admin/Reports', 'Admin/Misc', 'Invoices'];
      const tree = buildFolderTree(folders);

      expect(tree.name).toBe('Documents');
      expect(tree.children.length).toBe(2); // Admin and Invoices

      const adminNode = tree.children.find(c => c.name === 'Admin');
      expect(adminNode).toBeDefined();
      expect(adminNode!.children.length).toBe(2); // Reports and Misc
    });

    it('should track document counts per folder', () => {
      const folders = ['Admin', 'Admin/Reports'];
      const documents = [
        { path: 'Admin/Reports', name: 'doc1.pdf' },
        { path: 'Admin/Reports', name: 'doc2.pdf' },
        { path: 'Admin', name: 'doc3.pdf' },
      ];

      const tree = buildFolderTree(folders, documents);

      const adminNode = tree.children.find(c => c.name === 'Admin');
      const reportsNode = adminNode!.children.find(c => c.name === 'Reports');

      expect(adminNode!.fileCount).toBe(1);
      expect(reportsNode!.fileCount).toBe(2);
    });

    it('should handle empty folder tree', () => {
      const tree = buildFolderTree([]);
      expect(tree.name).toBe('Documents');
      expect(tree.children.length).toBe(0);
    });
  });

  describe('AC-3: View mode - filterEmptyFolders', () => {
    it('should filter out folders with no files', () => {
      const folders = ['Admin', 'Admin/Reports', 'Admin/Misc', 'Invoices'];
      const documents = [
        { path: 'Admin/Reports', name: 'doc1.pdf' },
      ];

      const tree = buildFolderTree(folders, documents);
      const filtered = filterEmptyFolders(tree);

      expect(filtered).toBeDefined();
      const adminNode = filtered!.children.find(c => c.name === 'Admin');
      expect(adminNode).toBeDefined();
      expect(adminNode!.children.length).toBe(1); // Only Reports, not Misc
      expect(adminNode!.children[0].name).toBe('Reports');

      // Invoices should be filtered out (no files)
      const invoicesNode = filtered!.children.find(c => c.name === 'Invoices');
      expect(invoicesNode).toBeUndefined();
    });

    it('should keep parent folders if children have files', () => {
      const folders = ['Admin', 'Admin/Reports'];
      const documents = [
        { path: 'Admin/Reports', name: 'doc1.pdf' },
      ];

      const tree = buildFolderTree(folders, documents);
      const filtered = filterEmptyFolders(tree);

      expect(filtered).toBeDefined();
      const adminNode = filtered!.children.find(c => c.name === 'Admin');
      expect(adminNode).toBeDefined(); // Should keep Admin even though it has no files directly
      expect(adminNode!.children[0].name).toBe('Reports');
    });

    it('should return null for completely empty tree', () => {
      const folders = ['Admin', 'Invoices'];
      const documents: any[] = [];

      const tree = buildFolderTree(folders, documents);
      const filtered = filterEmptyFolders(tree);

      expect(filtered).toBeNull();
    });
  });

  describe('sortFolders', () => {
    it('should sort folders by tier order first', () => {
      const folders = [
        'Delivery/test',
        'Admin/test',
        'Consultants/test',
        'Procure/test',
      ];

      const sorted = sortFolders(folders);

      expect(sorted[0]).toContain('Admin');
      expect(sorted[1]).toContain('Consultants');
      expect(sorted[2]).toContain('Procure');
      expect(sorted[3]).toContain('Delivery');
    });

    it('should sort alphabetically within same tier', () => {
      const folders = [
        'Admin/Reports',
        'Admin/Fee and Approval',
        'Admin/Misc',
      ];

      const sorted = sortFolders(folders);

      expect(sorted[0]).toBe('Admin/Fee and Approval');
      expect(sorted[1]).toBe('Admin/Misc');
      expect(sorted[2]).toBe('Admin/Reports');
    });
  });

  describe('Path validation', () => {
    it('should handle paths with special characters', () => {
      const folders = ['Consultants/Building Code Advice', 'Procure/PPR & Preliminaries'];
      const tree = buildFolderTree(folders);

      const consultantsNode = tree.children.find(c => c.name === 'Consultants');
      const bcaNode = consultantsNode!.children.find(c => c.name === 'Building Code Advice');
      expect(bcaNode).toBeDefined();
      expect(bcaNode!.path).toBe('Consultants/Building Code Advice');
    });

    it('should handle multi-level paths correctly', () => {
      const folders = ['Consultants/Architect/Misc'];
      const tree = buildFolderTree(folders);

      const consultantsNode = tree.children.find(c => c.name === 'Consultants');
      const architectNode = consultantsNode!.children.find(c => c.name === 'Architect');
      const miscNode = architectNode!.children.find(c => c.name === 'Misc');

      expect(miscNode!.path).toBe('Consultants/Architect/Misc');
    });
  });
});
