'use client';

import { TextField } from '../fields/TextField';
import { updateItemAction } from '@/app/actions/card';

interface DetailsSectionProps {
  projectId: string;
}

// Mock data structure - in a real app, this would come from the database
const mockDetailsData = [
  { id: '1', label: 'Project Name', value: '', type: 'text', required: true },
  { id: '2', label: 'Address', value: '', type: 'text', required: true },
  { id: '3', label: 'Legal Address', value: '', type: 'text', required: false },
  { id: '4', label: 'Zoning', value: '', type: 'text', required: false },
  { id: '5', label: 'Jurisdiction', value: '', type: 'text', required: false },
  { id: '6', label: 'Lot Area', value: '', type: 'number', required: false, unit: 'm²' },
  { id: '7', label: 'Number of Stories', value: '', type: 'number', required: false },
  { id: '8', label: 'Building Class', value: '', type: 'text', required: false },
];

export function DetailsSection({ projectId }: DetailsSectionProps) {
  const handleFieldChange = async (itemId: string, value: string) => {
    // Update the item in the database
    const result = await updateItemAction(itemId, {
      value,
      label: mockDetailsData.find((f) => f.id === itemId)?.label || '',
    });

    if (!result.success) {
      throw new Error(result.error.message);
    }
  };

  return (
    <div className="space-y-1">
      {mockDetailsData.map((field) => (
        <TextField
          key={field.id}
          label={field.label}
          value={field.value}
          onChange={(value) => handleFieldChange(field.id, value)}
          required={field.required}
          unit={field.unit}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      ))}
    </div>
  );
}
