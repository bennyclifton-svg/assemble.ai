'use client';

interface RecommendationReportSectionProps {
  projectId: string;
  disciplineId: string;
}

export function RecommendationReportSection({ projectId, disciplineId }: RecommendationReportSectionProps) {
  return (
    <div className="text-sm text-gray-500">
      <p className="mb-2">Tender recommendation report coming soon.</p>
      <p className="text-xs text-gray-400">
        Future stories will implement recommendation report generation and export.
      </p>
    </div>
  );
}
