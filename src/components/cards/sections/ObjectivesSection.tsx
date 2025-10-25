'use client';

import { TextAreaField } from '../fields/TextAreaField';
import { updateItemAction } from '@/app/actions/card';

interface ObjectivesSectionProps {
  projectId: string;
}

// Mock data structure - in a real app, this would come from the database
const mockObjectivesData = [
  {
    id: '9',
    label: 'Functional',
    value: '',
    placeholder: 'Define functional objectives (e.g., space utilization, operational efficiency)...',
  },
  {
    id: '10',
    label: 'Quality',
    value: '',
    placeholder: 'Define quality objectives (e.g., finishes, sustainability standards)...',
  },
  {
    id: '11',
    label: 'Budget',
    value: '',
    placeholder: 'Define budget objectives (e.g., target cost, cost per sqm)...',
  },
  {
    id: '12',
    label: 'Program',
    value: '',
    placeholder: 'Define program objectives (e.g., project timeline, key milestones)...',
  },
];

export function ObjectivesSection({ projectId }: ObjectivesSectionProps) {
  const handleFieldChange = async (itemId: string, value: string) => {
    // Update the item in the database
    const result = await updateItemAction(itemId, {
      value,
      label: mockObjectivesData.find((f) => f.id === itemId)?.label || '',
    });

    if (!result.success) {
      throw new Error(result.error.message);
    }
  };

  return (
    <div className="space-y-3">
      {mockObjectivesData.map((field) => (
        <TextAreaField
          key={field.id}
          label={field.label}
          value={field.value}
          onChange={(value) => handleFieldChange(field.id, value)}
          placeholder={field.placeholder}
          rows={3}
        />
      ))}
    </div>
  );
}
