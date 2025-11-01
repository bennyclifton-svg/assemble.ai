'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, FileText, Sparkles, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GenerationStage =
  | 'idle'
  | 'aggregating'
  | 'generating'
  | 'formatting'
  | 'saving'
  | 'complete'
  | 'error';

interface TenderGenerationProgressProps {
  stage: GenerationStage;
  message?: string;
  progress?: number; // 0-100
  error?: string;
  className?: string;
}

const STAGE_LABELS: Record<GenerationStage, string> = {
  idle: 'Ready to generate',
  aggregating: 'Compiling project data...',
  generating: 'Generating tender content with AI...',
  formatting: 'Formatting tender package...',
  saving: 'Saving tender package...',
  complete: 'Tender package generated successfully!',
  error: 'Generation failed',
};

const STAGE_ICONS: Record<GenerationStage, React.ComponentType<{ className?: string }>> = {
  idle: FileText,
  aggregating: FileText,
  generating: Sparkles,
  formatting: FileText,
  saving: Save,
  complete: CheckCircle2,
  error: XCircle,
};

/**
 * TenderGenerationProgress - Real-time progress indicator for AI tender generation
 *
 * Story 4.2, AC #6: Progress indicator during generation
 *
 * Features:
 * - Shows current generation stage with icon
 * - Displays progress bar (0-100%)
 * - Real-time status messages
 * - Error handling with user-friendly messages
 * - Smooth transitions between stages
 */
export function TenderGenerationProgress({
  stage,
  message,
  progress = 0,
  error,
  className,
}: TenderGenerationProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress bar animation
  useEffect(() => {
    if (progress > displayProgress) {
      const interval = setInterval(() => {
        setDisplayProgress((prev) => {
          const next = prev + 1;
          return next >= progress ? progress : next;
        });
      }, 10);

      return () => clearInterval(interval);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, displayProgress]);

  const Icon = STAGE_ICONS[stage];
  const isActive = stage !== 'idle' && stage !== 'complete' && stage !== 'error';
  const isError = stage === 'error';
  const isComplete = stage === 'complete';

  const displayMessage = message || STAGE_LABELS[stage];

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Stage indicator */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full',
            isError && 'bg-red-100',
            isComplete && 'bg-green-100',
            isActive && 'bg-blue-100',
            stage === 'idle' && 'bg-gray-100'
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5',
              isError && 'text-red-600',
              isComplete && 'text-green-600',
              isActive && 'text-blue-600 animate-pulse',
              stage === 'idle' && 'text-gray-400'
            )}
          />
        </div>

        <div className="flex-1">
          <div
            className={cn(
              'font-medium',
              isError && 'text-red-700',
              isComplete && 'text-green-700',
              isActive && 'text-blue-700',
              stage === 'idle' && 'text-gray-500'
            )}
          >
            {displayMessage}
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 mt-1">
              {error}
            </div>
          )}
        </div>

        {/* Spinner for active stages */}
        {isActive && (
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        )}
      </div>

      {/* Progress bar */}
      {(isActive || isComplete) && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out',
              isComplete && 'bg-green-500',
              isActive && 'bg-blue-500'
            )}
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      )}

      {/* Progress percentage */}
      {(isActive || isComplete) && (
        <div className="text-right text-sm text-gray-500">
          {Math.round(displayProgress)}%
        </div>
      )}
    </div>
  );
}

/**
 * TenderGenerationDialog - Full-screen modal for tender generation
 *
 * Wraps TenderGenerationProgress in a modal overlay for better UX
 */
interface TenderGenerationDialogProps {
  isOpen: boolean;
  stage: GenerationStage;
  message?: string;
  progress?: number;
  error?: string;
  onClose?: () => void;
}

export function TenderGenerationDialog({
  isOpen,
  stage,
  message,
  progress,
  error,
  onClose,
}: TenderGenerationDialogProps) {
  if (!isOpen) return null;

  const canClose = stage === 'complete' || stage === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Generating Tender Package
        </h2>

        <TenderGenerationProgress
          stage={stage}
          message={message}
          progress={progress}
          error={error}
        />

        {/* Close button (only for complete or error states) */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            className={cn(
              'mt-6 w-full px-4 py-3 rounded-lg font-semibold transition-colors',
              stage === 'complete' &&
                'bg-green-600 hover:bg-green-700 text-white',
              stage === 'error' &&
                'bg-gray-600 hover:bg-gray-700 text-white'
            )}
          >
            {stage === 'complete' ? 'View Tender Package' : 'Close'}
          </button>
        )}
      </div>
    </div>
  );
}
