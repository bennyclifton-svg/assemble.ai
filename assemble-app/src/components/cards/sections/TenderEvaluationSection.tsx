'use client';

interface TenderEvaluationSectionProps {
  projectId: string;
  disciplineId: string;
}

export function TenderEvaluationSection({ projectId, disciplineId }: TenderEvaluationSectionProps) {
  return (
    <div className="text-sm text-gray-500">
      <p className="mb-2">Tender evaluation coming soon.</p>
      <p className="text-xs text-gray-400">
        Future stories will implement tender evaluation matrix and scoring.
      </p>
    </div>
  );
}
