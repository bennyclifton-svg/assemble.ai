'use client';

import { useMemo } from 'react';
import { StatusIcon } from '../fields/StatusIcon';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  consultantDisciplines,
  statusConfig,
  type StatusKey,
} from '@/lib/constants/consultants';

interface ConsultantListSectionProps {
  projectId: string;
}

export function ConsultantListSection({ projectId }: ConsultantListSectionProps) {
  // Get state and actions from Zustand store
  const {
    toggleConsultant,
    updateConsultantStatus,
    getConsultantStatus,
    consultantStatuses: allStatuses,
  } = useWorkspaceStore();

  const projectStatuses = allStatuses[projectId] || {};

  const handleToggleConsultant = (disciplineId: string) => {
    toggleConsultant(projectId, disciplineId);
    // TODO: Call Server Action to persist to database
  };

  const handleToggleStatus = (disciplineId: string, statusKey: StatusKey) => {
    const currentStatus = getConsultantStatus(projectId, disciplineId);
    if (!currentStatus) return;

    updateConsultantStatus(projectId, disciplineId, {
      statuses: {
        ...currentStatus.statuses,
        [statusKey]: !currentStatus.statuses[statusKey],
      },
    });
    // TODO: Call Server Action to persist to database
  };

  // Sort disciplines alphabetically
  const sortedDisciplines = useMemo(() => {
    return [...consultantDisciplines].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const activeCount = useMemo(() => {
    return Object.values(projectStatuses).filter((s) => s.isActive).length;
  }, [projectStatuses]);

  return (
    <div className="space-y-3">
      {/* Active Count */}
      <div className="text-xs text-gray-600">
        <span>{activeCount} of {consultantDisciplines.length} active</span>
      </div>

      {/* Consultant List */}
      <div className="max-h-96 overflow-y-auto pr-1">
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {sortedDisciplines.map((discipline) => {
            const status = getConsultantStatus(projectId, discipline.id) || {
              disciplineId: discipline.id,
              isActive: false,
              statuses: { brief: false, tender: false, rec: false, award: false },
            };

            return (
              <div
                key={discipline.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggleConsultant(discipline.id)}
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

                {/* Discipline Name */}
                <span
                  className={`flex-1 text-sm ${
                    status.isActive ? 'text-gray-900 font-medium' : 'text-gray-600'
                  }`}
                >
                  {discipline.name}
                </span>

                {/* Status Icons */}
                <div className="flex items-center gap-1">
                  {statusConfig.map((config) => (
                    <StatusIcon
                      key={config.key}
                      type={config.key}
                      isActive={status.statuses[config.key]}
                      onClick={() => handleToggleStatus(discipline.id, config.key)}
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
