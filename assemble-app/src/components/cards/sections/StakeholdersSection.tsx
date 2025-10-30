'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, X, User } from 'lucide-react';
import { DocumentDropZone } from '../DocumentDropZone';
import { DocumentSelector } from '../DocumentSelector';
import { TextField } from '../fields/TextField';
import {
  getSectionItemsAction,
  updateItemAction,
  initializeStakeholdersSectionAction,
} from '@/app/actions/card';
import { Button } from '@/components/ui/button';

interface StakeholdersSectionProps {
  projectId: string;
  cardId?: string;
}

interface Stakeholder {
  role: string;
  organization: string;
  name: string;
  email: string;
  mobile: string;
}

interface StakeholderItemData {
  stakeholders: Stakeholder[];
}

/**
 * Stakeholders Section for Plan Card
 * AC4: Supports AI population of stakeholder contact details
 * Displays: role, organization, name, email, mobile
 */
export function StakeholdersSection({ projectId, cardId }: StakeholdersSectionProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemId, setItemId] = useState<string | null>(null);
  const [aiPopulatedIndices, setAiPopulatedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadStakeholders();
  }, [projectId]);

  const loadStakeholders = async () => {
    setIsLoading(true);

    // Try to get existing stakeholders
    const result = await getSectionItemsAction(projectId, 'stakeholders');

    if (result.success && result.data.length > 0) {
      // Stakeholders stored as single item with array
      const item = result.data[0];
      setItemId(item.id);

      const data = item.data as unknown as StakeholderItemData;
      setStakeholders(data.stakeholders || []);

      // Check if any were AI-populated
      const aiPopulated = (item.data as any).aiPopulated;
      if (aiPopulated) {
        // Mark all as AI-populated initially
        setAiPopulatedIndices(new Set(stakeholders.map((_, idx) => idx)));
        // Clear after 5 seconds
        setTimeout(() => setAiPopulatedIndices(new Set()), 5000);
      }
    } else {
      // Initialize section
      await initializeStakeholdersSectionAction(projectId);

      // Reload
      const reloadResult = await getSectionItemsAction(projectId, 'stakeholders');
      if (reloadResult.success && reloadResult.data.length > 0) {
        const item = reloadResult.data[0];
        setItemId(item.id);
        const data = item.data as unknown as StakeholderItemData;
        setStakeholders(data.stakeholders || []);
      }
    }

    setIsLoading(false);
  };

  const handlePopulated = async (fields: Record<string, any>) => {
    // Refresh data after AI population
    await loadStakeholders();

    // If stakeholders were populated, mark them as AI-populated
    if (fields.stakeholders && Array.isArray(fields.stakeholders)) {
      const newIndices = new Set<number>();
      fields.stakeholders.forEach((_, idx) => newIndices.add(idx));
      setAiPopulatedIndices(newIndices);

      // Clear indicators after 5 seconds
      setTimeout(() => setAiPopulatedIndices(new Set()), 5000);
    }
  };

  const updateStakeholders = async (newStakeholders: Stakeholder[]): Promise<void> => {
    setStakeholders(newStakeholders);

    if (itemId) {
      await updateItemAction(itemId, {
        stakeholders: newStakeholders as any,
      });
    }
  };

  const addStakeholder = () => {
    updateStakeholders([
      ...stakeholders,
      { role: '', organization: '', name: '', email: '', mobile: '' },
    ]);
  };

  const removeStakeholder = (index: number) => {
    updateStakeholders(stakeholders.filter((_, i) => i !== index));
  };

  const updateStakeholder = (index: number, field: keyof Stakeholder, value: string) => {
    const updated = [...stakeholders];
    updated[index] = { ...updated[index], [field]: value };
    updateStakeholders(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading stakeholders...</p>
        </div>
      </div>
    );
  }

  if (!cardId) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        <p>Card ID required for AI auto-population.</p>
      </div>
    );
  }

  return (
    <DocumentDropZone
      cardId={cardId}
      sectionName="Stakeholders"
      onPopulated={handlePopulated}
    >
      <div className="space-y-4">
        {/* Header with AI Generate button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Project Stakeholders</h3>
            {stakeholders.length > 0 && (
              <span className="text-xs text-gray-500">({stakeholders.length})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DocumentSelector
              projectId={projectId}
              cardId={cardId}
              sectionName="Stakeholders"
              onPopulated={handlePopulated}
              buttonVariant="outline"
              buttonSize="sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addStakeholder}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Stakeholder
            </Button>
          </div>
        </div>

        {/* Stakeholders list */}
        {stakeholders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No stakeholders yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Add manually or drag a document to auto-populate
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stakeholders.map((stakeholder, index) => {
              const isAIPopulated = aiPopulatedIndices.has(index);

              return (
                <div
                  key={index}
                  className={`
                    relative border rounded-lg p-4 transition-all
                    ${isAIPopulated ? 'ring-2 ring-blue-400 bg-blue-50/30' : 'bg-white'}
                  `}
                >
                  {/* AI indicator */}
                  {isAIPopulated && (
                    <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="font-medium">AI</span>
                    </div>
                  )}

                  {/* Remove button */}
                  {!isAIPopulated && (
                    <button
                      onClick={() => removeStakeholder(index)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      aria-label="Remove stakeholder"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="space-y-3 pr-8">
                    {/* Row 1: Role and Organization */}
                    <div className="grid grid-cols-2 gap-3">
                      <TextField
                        label="Role"
                        value={stakeholder.role}
                        onChange={async (value) => updateStakeholder(index, 'role', value)}
                        placeholder="e.g., Project Manager"
                      />
                      <TextField
                        label="Organization"
                        value={stakeholder.organization}
                        onChange={async (value) => updateStakeholder(index, 'organization', value)}
                        placeholder="e.g., ABC Company"
                      />
                    </div>

                    {/* Row 2: Name */}
                    <TextField
                      label="Name"
                      value={stakeholder.name}
                      onChange={async (value) => updateStakeholder(index, 'name', value)}
                      placeholder="e.g., John Smith"
                    />

                    {/* Row 3: Email and Mobile */}
                    <div className="grid grid-cols-2 gap-3">
                      <TextField
                        label="Email"
                        value={stakeholder.email}
                        onChange={async (value) => updateStakeholder(index, 'email', value)}
                        placeholder="john@example.com"
                      />
                      <TextField
                        label="Mobile"
                        value={stakeholder.mobile}
                        onChange={async (value) => updateStakeholder(index, 'mobile', value)}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help text */}
        <p className="text-xs text-gray-500">
          Tip: Drag a document containing stakeholder information or click "AI Generate" to auto-populate contact details.
        </p>
      </div>
    </DocumentDropZone>
  );
}
