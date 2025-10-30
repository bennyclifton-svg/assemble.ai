'use client';

import { useMemo } from 'react';
import { StatusIcon } from '../fields/StatusIcon';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  contractorTrades,
  statusConfig,
  type ContractorStatusKey,
} from '@/lib/constants/contractors';

interface ContractorListSectionProps {
  projectId: string;
}

export function ContractorListSection({ projectId }: ContractorListSectionProps) {
  // Get state and actions from Zustand store
  const {
    toggleContractor,
    updateContractorStatus,
    getContractorStatus,
    contractorStatuses: allStatuses,
  } = useWorkspaceStore();

  const projectStatuses = allStatuses[projectId] || {};

  const handleToggleContractor = (tradeId: string) => {
    toggleContractor(projectId, tradeId);
    // TODO: Call Server Action to persist to database
  };

  const handleToggleStatus = (tradeId: string, statusKey: ContractorStatusKey) => {
    const currentStatus = getContractorStatus(projectId, tradeId);
    if (!currentStatus) return;

    updateContractorStatus(projectId, tradeId, {
      statuses: {
        ...currentStatus.statuses,
        [statusKey]: !currentStatus.statuses[statusKey],
      },
    });
    // TODO: Call Server Action to persist to database
  };

  // Sort trades alphabetically
  const sortedTrades = useMemo(() => {
    return [...contractorTrades].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const activeCount = useMemo(() => {
    return Object.values(projectStatuses).filter((s) => s.isActive).length;
  }, [projectStatuses]);

  return (
    <div className="space-y-3">
      {/* Active Count */}
      <div className="text-xs text-gray-600">
        <span>{activeCount} of {contractorTrades.length} active</span>
      </div>

      {/* Contractor List */}
      <div className="max-h-96 overflow-y-auto pr-1">
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {sortedTrades.map((trade) => {
            const status = getContractorStatus(projectId, trade.id) || {
              tradeId: trade.id,
              isActive: false,
              statuses: { brief: false, tender: false, rec: false, award: false },
            };

            return (
              <div
                key={trade.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggleContractor(trade.id)}
                  className={`
                    relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full
                    border-2 border-transparent transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${status.isActive ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-4 w-4 transform rounded-full
                      bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${status.isActive ? 'translate-x-4' : 'translate-x-0'}
                    `}
                  />
                </button>

                {/* Trade Name */}
                <span
                  className={`flex-1 text-sm ${
                    status.isActive ? 'text-gray-900 font-medium' : 'text-gray-600'
                  }`}
                >
                  {trade.name}
                </span>

                {/* Status Icons */}
                <div className="flex items-center gap-1">
                  {statusConfig.map((config) => (
                    <StatusIcon
                      key={config.key}
                      type={config.key}
                      isActive={status.statuses[config.key]}
                      onClick={() => handleToggleStatus(trade.id, config.key)}
                      disabled={!status.isActive}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
