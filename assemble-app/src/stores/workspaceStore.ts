import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CardType } from '@prisma/client';
import type { ConsultantStatus } from '@/lib/constants/consultants';
import type { ContractorStatus } from '@/lib/constants/contractors';

export interface WorkspaceStore {
  // State
  activeCards: CardType[];
  collapsedNav: boolean;
  collapsedSections: Record<string, Record<string, boolean>>; // projectId -> sectionId -> collapsed

  // Consultant state
  activeConsultants: Record<string, string[]>; // projectId -> disciplineId[]
  consultantStatuses: Record<string, Record<string, ConsultantStatus>>; // projectId -> disciplineId -> status

  // Contractor state
  activeContractors: Record<string, string[]>; // projectId -> tradeId[]
  contractorStatuses: Record<string, Record<string, ContractorStatus>>; // projectId -> tradeId -> status

  // Document navigation state (AC-8: folder tree in sidebar)
  selectedFolderPath: Record<string, string>; // projectId -> folderPath
  expandedFolders: Record<string, string[]>; // projectId -> folderPath[]

  // Tender document selection state (saved documents per discipline/trade)
  savedTenderDocuments: Record<string, Record<string, string[]>>; // projectId -> disciplineId/tradeId -> documentIds[]

  // Document Card selection state (currently selected documents)
  selectedDocuments: Record<string, string[]>; // projectId -> documentIds[]

  // Active tender discipline for green highlighting (which discipline's saved docs to show)
  activeTenderDiscipline: Record<string, string | null>; // projectId -> disciplineId

  // Actions
  openCard: (type: CardType, replace?: boolean) => void;
  closeCard: (type: CardType) => void;
  replaceCards: (types: CardType[]) => void;
  toggleNavigation: () => void;
  isCardActive: (type: CardType) => boolean;
  canAddCard: () => boolean;

  // Section collapse state
  setSectionCollapsed: (projectId: string, sectionId: string, collapsed: boolean) => void;
  toggleSection: (projectId: string, sectionId: string) => void;
  isSectionCollapsed: (projectId: string, sectionId: string) => boolean;

  // Consultant actions
  toggleConsultant: (projectId: string, disciplineId: string) => void;
  updateConsultantStatus: (projectId: string, disciplineId: string, status: Partial<ConsultantStatus>) => void;
  getConsultantStatus: (projectId: string, disciplineId: string) => ConsultantStatus | undefined;
  isConsultantActive: (projectId: string, disciplineId: string) => boolean;

  // Contractor actions
  toggleContractor: (projectId: string, tradeId: string) => void;
  updateContractorStatus: (projectId: string, tradeId: string, status: Partial<ContractorStatus>) => void;
  getContractorStatus: (projectId: string, tradeId: string) => ContractorStatus | undefined;
  isContractorActive: (projectId: string, tradeId: string) => boolean;

  // Document navigation actions
  setSelectedFolder: (projectId: string, folderPath: string) => void;
  getSelectedFolder: (projectId: string) => string;
  toggleFolder: (projectId: string, folderPath: string) => void;
  expandAllFolders: (projectId: string, folderPaths: string[]) => void;
  collapseAllFolders: (projectId: string) => void;
  isFolderExpanded: (projectId: string, folderPath: string) => boolean;

  // Tender document selection actions
  saveTenderDocuments: (projectId: string, disciplineId: string, documentIds: string[]) => void;
  getSavedTenderDocuments: (projectId: string, disciplineId: string) => string[];
  clearSavedTenderDocuments: (projectId: string, disciplineId: string) => void;

  // Document selection actions
  setSelectedDocuments: (projectId: string, documentIds: string[]) => void;
  getSelectedDocuments: (projectId: string) => string[];
  clearSelectedDocuments: (projectId: string) => void;

  // Active tender discipline actions
  setActiveTenderDiscipline: (projectId: string, disciplineId: string | null) => void;
  getActiveTenderDiscipline: (projectId: string) => string | null;
}

const MAX_CARDS = 3;

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activeCards: [],
      collapsedNav: false,
      collapsedSections: {},
      activeConsultants: {},
      consultantStatuses: {},
      activeContractors: {},
      contractorStatuses: {},
      selectedFolderPath: {},
      expandedFolders: {},
      savedTenderDocuments: {},
      selectedDocuments: {},
      activeTenderDiscipline: {},

      // Open a card
      openCard: (type: CardType, replace = false) => {
        const { activeCards } = get();

        // If card is already active, do nothing
        if (activeCards.includes(type)) {
          return;
        }

        // If replace mode, close all and open this one
        if (replace) {
          set({ activeCards: [type] });
          return;
        }

        // If max cards reached, don't add
        if (activeCards.length >= MAX_CARDS) {
          console.warn(`Cannot open more than ${MAX_CARDS} cards simultaneously`);
          return;
        }

        // Add card to active cards
        set({ activeCards: [...activeCards, type] });
      },

      // Close a card
      closeCard: (type: CardType) => {
        const { activeCards } = get();
        set({ activeCards: activeCards.filter((card) => card !== type) });
      },

      // Replace all active cards
      replaceCards: (types: CardType[]) => {
        if (types.length > MAX_CARDS) {
          console.warn(`Cannot open more than ${MAX_CARDS} cards. Truncating.`);
          set({ activeCards: types.slice(0, MAX_CARDS) });
          return;
        }
        set({ activeCards: types });
      },

      // Toggle navigation collapsed state
      toggleNavigation: () => {
        set((state) => ({ collapsedNav: !state.collapsedNav }));
      },

      // Check if a card is active
      isCardActive: (type: CardType) => {
        return get().activeCards.includes(type);
      },

      // Check if another card can be added
      canAddCard: () => {
        return get().activeCards.length < MAX_CARDS;
      },

      // Set section collapsed state
      setSectionCollapsed: (projectId: string, sectionId: string, collapsed: boolean) => {
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [projectId]: {
              ...state.collapsedSections[projectId],
              [sectionId]: collapsed,
            },
          },
        }));
      },

      // Toggle section collapsed state
      toggleSection: (projectId: string, sectionId: string) => {
        const { collapsedSections } = get();
        const currentState = collapsedSections[projectId]?.[sectionId] ?? false;
        get().setSectionCollapsed(projectId, sectionId, !currentState);
      },

      // Check if section is collapsed
      isSectionCollapsed: (projectId: string, sectionId: string) => {
        return get().collapsedSections[projectId]?.[sectionId] ?? false;
      },

      // Toggle consultant active state
      toggleConsultant: (projectId: string, disciplineId: string) => {
        const { activeConsultants, consultantStatuses } = get();
        const projectConsultants = activeConsultants[projectId] || [];
        const isCurrentlyActive = projectConsultants.includes(disciplineId);

        if (isCurrentlyActive) {
          // Remove from active consultants
          set({
            activeConsultants: {
              ...activeConsultants,
              [projectId]: projectConsultants.filter((id) => id !== disciplineId),
            },
          });
        } else {
          // Add to active consultants
          set({
            activeConsultants: {
              ...activeConsultants,
              [projectId]: [...projectConsultants, disciplineId],
            },
          });
        }

        // Initialize or update consultant status
        const projectStatuses = consultantStatuses[projectId] || {};
        const currentStatus = projectStatuses[disciplineId];

        set({
          consultantStatuses: {
            ...consultantStatuses,
            [projectId]: {
              ...projectStatuses,
              [disciplineId]: {
                disciplineId,
                isActive: !isCurrentlyActive,
                statuses: currentStatus?.statuses || {
                  brief: false,
                  tender: false,
                  rec: false,
                  award: false,
                },
              },
            },
          },
        });
      },

      // Update consultant status
      updateConsultantStatus: (projectId: string, disciplineId: string, status: Partial<ConsultantStatus>) => {
        const { consultantStatuses } = get();
        const projectStatuses = consultantStatuses[projectId] || {};
        const currentStatus = projectStatuses[disciplineId];

        set({
          consultantStatuses: {
            ...consultantStatuses,
            [projectId]: {
              ...projectStatuses,
              [disciplineId]: {
                ...currentStatus,
                ...status,
                disciplineId,
              },
            },
          },
        });
      },

      // Get consultant status
      getConsultantStatus: (projectId: string, disciplineId: string) => {
        return get().consultantStatuses[projectId]?.[disciplineId];
      },

      // Check if consultant is active
      isConsultantActive: (projectId: string, disciplineId: string) => {
        return get().activeConsultants[projectId]?.includes(disciplineId) ?? false;
      },

      // Toggle contractor active state
      toggleContractor: (projectId: string, tradeId: string) => {
        const { activeContractors, contractorStatuses } = get();
        const projectContractors = activeContractors[projectId] || [];
        const isCurrentlyActive = projectContractors.includes(tradeId);

        if (isCurrentlyActive) {
          // Remove from active contractors
          set({
            activeContractors: {
              ...activeContractors,
              [projectId]: projectContractors.filter((id) => id !== tradeId),
            },
          });
        } else {
          // Add to active contractors
          set({
            activeContractors: {
              ...activeContractors,
              [projectId]: [...projectContractors, tradeId],
            },
          });
        }

        // Initialize or update contractor status
        const projectStatuses = contractorStatuses[projectId] || {};
        const currentStatus = projectStatuses[tradeId];

        set({
          contractorStatuses: {
            ...contractorStatuses,
            [projectId]: {
              ...projectStatuses,
              [tradeId]: {
                tradeId,
                isActive: !isCurrentlyActive,
                statuses: currentStatus?.statuses || {
                  brief: false,
                  tender: false,
                  rec: false,
                  award: false,
                },
              },
            },
          },
        });
      },

      // Update contractor status
      updateContractorStatus: (projectId: string, tradeId: string, status: Partial<ContractorStatus>) => {
        const { contractorStatuses } = get();
        const projectStatuses = contractorStatuses[projectId] || {};
        const currentStatus = projectStatuses[tradeId];

        set({
          contractorStatuses: {
            ...contractorStatuses,
            [projectId]: {
              ...projectStatuses,
              [tradeId]: {
                ...currentStatus,
                ...status,
                tradeId,
              },
            },
          },
        });
      },

      // Get contractor status
      getContractorStatus: (projectId: string, tradeId: string) => {
        return get().contractorStatuses[projectId]?.[tradeId];
      },

      // Check if contractor is active
      isContractorActive: (projectId: string, tradeId: string) => {
        return get().activeContractors[projectId]?.includes(tradeId) ?? false;
      },

      // Set selected folder path
      setSelectedFolder: (projectId: string, folderPath: string) => {
        set((state) => ({
          selectedFolderPath: {
            ...state.selectedFolderPath,
            [projectId]: folderPath,
          },
        }));
      },

      // Get selected folder path
      getSelectedFolder: (projectId: string) => {
        return get().selectedFolderPath[projectId] || '';
      },

      // Toggle folder expanded state
      toggleFolder: (projectId: string, folderPath: string) => {
        const { expandedFolders } = get();
        const projectFolders = expandedFolders[projectId] || [];
        const isExpanded = projectFolders.includes(folderPath);

        set({
          expandedFolders: {
            ...expandedFolders,
            [projectId]: isExpanded
              ? projectFolders.filter((path) => path !== folderPath)
              : [...projectFolders, folderPath],
          },
        });
      },

      // Expand all folders
      expandAllFolders: (projectId: string, folderPaths: string[]) => {
        set((state) => ({
          expandedFolders: {
            ...state.expandedFolders,
            [projectId]: folderPaths,
          },
        }));
      },

      // Collapse all folders
      collapseAllFolders: (projectId: string) => {
        set((state) => ({
          expandedFolders: {
            ...state.expandedFolders,
            [projectId]: [],
          },
        }));
      },

      // Check if folder is expanded
      isFolderExpanded: (projectId: string, folderPath: string) => {
        return get().expandedFolders[projectId]?.includes(folderPath) ?? false;
      },

      // Save tender documents for a specific discipline/trade
      saveTenderDocuments: (projectId: string, disciplineId: string, documentIds: string[]) => {
        set((state) => ({
          savedTenderDocuments: {
            ...state.savedTenderDocuments,
            [projectId]: {
              ...state.savedTenderDocuments[projectId],
              [disciplineId]: documentIds,
            },
          },
        }));
      },

      // Get saved tender documents for a specific discipline/trade
      getSavedTenderDocuments: (projectId: string, disciplineId: string) => {
        return get().savedTenderDocuments[projectId]?.[disciplineId] ?? [];
      },

      // Clear saved tender documents for a specific discipline/trade
      clearSavedTenderDocuments: (projectId: string, disciplineId: string) => {
        set((state) => {
          const projectDocs = { ...state.savedTenderDocuments[projectId] };
          delete projectDocs[disciplineId];

          return {
            savedTenderDocuments: {
              ...state.savedTenderDocuments,
              [projectId]: projectDocs,
            },
          };
        });
      },

      // Set currently selected documents in Documents Card
      setSelectedDocuments: (projectId: string, documentIds: string[]) => {
        set((state) => ({
          selectedDocuments: {
            ...state.selectedDocuments,
            [projectId]: documentIds,
          },
        }));
      },

      // Get currently selected documents in Documents Card
      getSelectedDocuments: (projectId: string) => {
        return get().selectedDocuments[projectId] ?? [];
      },

      // Clear currently selected documents in Documents Card
      clearSelectedDocuments: (projectId: string) => {
        set((state) => ({
          selectedDocuments: {
            ...state.selectedDocuments,
            [projectId]: [],
          },
        }));
      },

      // Set active tender discipline for green highlighting
      setActiveTenderDiscipline: (projectId: string, disciplineId: string | null) => {
        set((state) => ({
          activeTenderDiscipline: {
            ...state.activeTenderDiscipline,
            [projectId]: disciplineId,
          },
        }));
      },

      // Get active tender discipline
      getActiveTenderDiscipline: (projectId: string) => {
        return get().activeTenderDiscipline[projectId] ?? null;
      },
    }),
    {
      name: 'workspace-storage', // localStorage key
    }
  )
);
