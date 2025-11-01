'use client';

import { useState, useEffect } from 'react';
import { getFirmsAction } from '@/app/actions/firm';
import { Building2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirmSelectorProps {
  projectId: string;
  disciplineId: string;
  selectedFirms: string[];
  onSelectionChange: (firmIds: string[], firms: Firm[]) => void;
}

interface Firm {
  id: string;
  entity: string;
  shortListed: boolean;
}

/**
 * FirmSelector - Dropdown to select which firm(s) to generate tender for
 *
 * Features:
 * - AC5: Part of the prominent generation interface
 * - Allows single or multiple firm selection
 * - Shows shortlisted firms prominently
 * - Supports batch generation workflow
 * - Retrieves firms from Consultant Firms section
 */
export function FirmSelector({
  projectId,
  disciplineId,
  selectedFirms,
  onSelectionChange,
}: FirmSelectorProps) {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFirms = async () => {
      setIsLoading(true);

      try {
        const result = await getFirmsAction(projectId, disciplineId, 'consultant');

        if (result.success && result.data) {
          setFirms(result.data as Firm[]);
        } else {
          console.error('Failed to load firms:', result.error);
          setFirms([]);
        }
      } catch (error) {
        console.error('Error loading firms:', error);
        setFirms([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFirms();
  }, [projectId, disciplineId]);

  const toggleFirm = (firmId: string) => {
    const newSelection = selectedFirms.includes(firmId)
      ? selectedFirms.filter((id) => id !== firmId)
      : [...selectedFirms, firmId];
    onSelectionChange(newSelection, firms);
  };

  const selectAll = () => {
    onSelectionChange(firms.map((f) => f.id), firms);
  };

  const clearAll = () => {
    onSelectionChange([], firms);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg bg-white p-4">
        <p className="text-sm text-gray-500">Loading firms...</p>
      </div>
    );
  }

  if (firms.length === 0) {
    return (
      <div className="border rounded-lg bg-gray-50 p-6 text-center">
        <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 font-medium">No firms available</p>
        <p className="text-xs text-gray-500 mt-1">
          Add firms in the Firms section to generate tender packages
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">
          Select Firm(s)
        </label>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={clearAll}
            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="border rounded-lg bg-white divide-y">
        {firms.map((firm) => {
          const isSelected = selectedFirms.includes(firm.id);
          return (
            <button
              key={firm.id}
              onClick={() => toggleFirm(firm.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                isSelected && 'bg-blue-50 hover:bg-blue-100'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              )}>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  )}>
                    {firm.entity}
                  </span>
                  {firm.shortListed && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Shortlisted
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedFirms.length > 0 && (
        <p className="text-sm text-gray-600 mt-2">
          {selectedFirms.length} firm{selectedFirms.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
