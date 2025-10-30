'use client';

interface TenderPackSectionProps {
  projectId: string;
  disciplineId: string;
}

export function TenderPackSection({ projectId, disciplineId }: TenderPackSectionProps) {
  return (
    <div className="text-sm text-gray-500">
      <p className="mb-2">Tender pack management coming soon.</p>
      <p className="text-xs text-gray-400">
        Future stories will implement tender package selection and organization.
      </p>
    </div>
  );
}
