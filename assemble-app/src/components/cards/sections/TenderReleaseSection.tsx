'use client';

interface TenderReleaseSectionProps {
  projectId: string;
  disciplineId: string;
}

export function TenderReleaseSection({ projectId, disciplineId }: TenderReleaseSectionProps) {
  return (
    <div className="text-sm text-gray-500">
      <p className="mb-2">Tender release and submission tracking coming soon.</p>
      <p className="text-xs text-gray-400">
        Story 3.8 will implement tender release dates and submission tracking.
      </p>
    </div>
  );
}
