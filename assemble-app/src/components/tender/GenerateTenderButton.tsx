'use client';

import { useState, useEffect } from 'react';
import { Sparkles, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  generateTenderPackageWithAI,
  generateTenderPackageWithoutAI,
  saveTenderPackageConfig,
  loadTenderPackageConfig,
  getTenderPackageForDisplay,
} from '@/app/actions/tender';
import { TenderGenerationDialog, type GenerationStage } from './TenderGenerationProgress';
import { useSelectionStore } from '@/stores/selectionStore';

interface GenerateTenderButtonProps {
  // New API (Story 4.2)
  configId?: string;
  // Legacy API (Story 4.1) - for backward compatibility
  projectId?: string;
  disciplineId?: string;
  // Common
  firmId: string;
  firmName: string;
  onGenerated?: (tenderPackageId: string) => void;
}

/**
 * GenerateTenderButton - Action button component to generate AI-powered tender package
 *
 * Story 4.2: AI Tender Package Generation
 *
 * Features:
 * - AC5: "Generate Tender Package" button prominently displayed with AI icon
 * - AC6: Progress indicator during generation
 * - Shows per-firm generation button
 * - Handles AI-powered generation workflow with real-time progress
 * - Provides visual feedback during generation (< 30s target)
 */
export function GenerateTenderButton({
  configId: providedConfigId,
  projectId,
  disciplineId,
  firmId,
  firmName,
  onGenerated,
}: GenerateTenderButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [configId, setConfigId] = useState<string | undefined>(providedConfigId);

  const { getSelectionForTender, setActiveContext } = useSelectionStore();

  // Load or create config when using legacy API
  useEffect(() => {
    if (!providedConfigId && disciplineId) {
      // Set the active context to this discipline
      setActiveContext(disciplineId);
      loadOrCreateConfig();
    }
  }, [providedConfigId, disciplineId]);

  const loadOrCreateConfig = async () => {
    if (!disciplineId) return;

    try {
      // In this system, disciplineId IS the consultantCardId
      // Each active discipline gets its own consultant card
      const consultantCardId = disciplineId;

      // Try to load existing config
      const loadResult = await loadTenderPackageConfig({
        consultantCardId,
      });

      if (loadResult.success && loadResult.data) {
        setConfigId(loadResult.data.id);
      } else {
        // Create new config with current selections
        const selection = getSelectionForTender();

        // Get card sections (consultant or contractor sections for this discipline)
        const cardSections = selection.sections.consultant[disciplineId] || [];

        const createResult = await saveTenderPackageConfig({
          consultantCardId,
          selectedPlanSections: selection.sections.plan,
          selectedCardSections: cardSections,
        });

        if (createResult.success && createResult.data) {
          setConfigId(createResult.data.id);
        }
      }
    } catch (err) {
      console.error('Failed to load/create config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    }
  };

  const handleGenerate = async (useAI: boolean = true) => {
    setIsGenerating(true);
    setError(undefined);
    setProgress(0);

    try {
      // Ensure we have a configId
      if (!configId) {
        await loadOrCreateConfig();
        if (!configId) {
          throw new Error('Failed to create tender package configuration');
        }
      }

      // CRITICAL FIX: Sync current selections from store to config BEFORE generation
      if (!disciplineId) {
        throw new Error('Discipline ID is required for tender generation');
      }

      const selection = getSelectionForTender();
      const cardSections = selection.sections.consultant[disciplineId] || [];

      console.log('📋 Syncing selections before generation:', {
        planSections: selection.sections.plan,
        cardSections,
        disciplineId,
      });

      // Update the config with current selections from the store
      const updateResult = await saveTenderPackageConfig({
        id: configId,
        consultantCardId: disciplineId,
        selectedPlanSections: selection.sections.plan,
        selectedCardSections: cardSections,
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to save tender package configuration');
      }

      // Stage 1: Aggregating data (0-20%)
      setStage('aggregating');
      setProgress(10);

      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate UI feedback
      setProgress(20);

      // Stage 2: Generating content (20-80%)
      setStage('generating');
      setProgress(30);

      const result = useAI
        ? await generateTenderPackageWithAI({
            configId: configId!,
            firmId,
          })
        : await generateTenderPackageWithoutAI({
            configId: configId!,
            firmId,
          });

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate tender package');
      }

      setProgress(80);

      // Stage 3: Saving (80-100%)
      setStage('saving');
      setProgress(90);

      await new Promise((resolve) => setTimeout(resolve, 300)); // Brief UI feedback
      setProgress(100);

      // Stage 4: Complete
      setStage('complete');

      // Fetch complete package data for display
      if (onGenerated && result.data?.tenderPackageId) {
        const packageData = await getTenderPackageForDisplay(result.data.tenderPackageId);

        if (packageData.success && packageData.data) {
          setTimeout(() => {
            onGenerated(packageData.data);
          }, 1000);
        } else {
          throw new Error(packageData.error || 'Failed to fetch package data for display');
        }
      }
    } catch (err) {
      console.error('Error generating tender package:', err);
      setStage('error');
      setError(err instanceof Error ? err.message : 'Failed to generate tender package');
    }
  };

  const handleClose = () => {
    setIsGenerating(false);
    setStage('idle');
    setProgress(0);
    setError(undefined);
  };

  return (
    <>
      <div className="flex gap-2 w-full">
        {/* AI Generation Button (Primary) */}
        <button
          onClick={() => handleGenerate(true)}
          disabled={isGenerating}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-sm hover:shadow-md',
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate with AI</span>
        </button>

        {/* Manual Generation Button (Secondary) */}
        <button
          onClick={() => handleGenerate(false)}
          disabled={isGenerating}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md',
            isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Generate without AI</span>
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-1">
        For firm: {firmName}
      </p>

      {/* Progress dialog (AC #6) */}
      <TenderGenerationDialog
        isOpen={isGenerating}
        stage={stage}
        progress={progress}
        error={error}
        onClose={stage === 'complete' || stage === 'error' ? handleClose : undefined}
      />
    </>
  );
}
