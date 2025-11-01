'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, Upload, Save } from 'lucide-react';
import { TextAreaField } from '../fields/TextAreaField';
import { updateItemAction, getSectionItemsAction, initializeObjectivesSectionAction, generateObjectivesAction } from '@/app/actions/card';

interface ObjectivesSectionProps {
  projectId: string;
}

interface FieldData {
  label: string;
  value: string;
  placeholder?: string;
}

export function ObjectivesSection({ projectId }: ObjectivesSectionProps) {
  const [fields, setFields] = useState<Array<{ id: string; data: FieldData }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const loadFields = async () => {
      setIsLoading(true);

      // Try to get existing fields
      const result = await getSectionItemsAction(projectId, 'objectives');

      if (result.success && result.data.length > 0) {
        // Map database items to fields
        setFields(result.data.map(item => ({
          id: item.id,
          data: item.data as unknown as FieldData,
        })));
      } else {
        // Initialize with default fields
        await initializeObjectivesSectionAction(projectId);

        // Reload fields
        const reloadResult = await getSectionItemsAction(projectId, 'objectives');
        if (reloadResult.success) {
          setFields(reloadResult.data.map(item => ({
            id: item.id,
            data: item.data as unknown as FieldData,
          })));
        }
      }

      setIsLoading(false);
    };

    loadFields();
  }, [projectId]);

  const handleFieldChange = async (itemId: string, value: string) => {
    const field = fields.find(f => f.id === itemId);
    if (!field) return;

    // Optimistic update
    setFields(prev => prev.map(f =>
      f.id === itemId
        ? { ...f, data: { ...f.data, value } }
        : f
    ));

    // Update in database
    const result = await updateItemAction(itemId, {
      ...field.data,
      value,
    });

    if (!result.success) {
      // Rollback on error
      setFields(prev => prev.map(f =>
        f.id === itemId
          ? { ...f, data: field.data }
          : f
      ));
      throw new Error(result.error.message);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // Gather existing objectives as context
      const existingObjectives = fields
        .map(f => `${f.data.label}: ${f.data.value}`)
        .filter(text => text.includes(':') && text.split(':')[1].trim())
        .join('\n\n');

      // Build context
      const context = {
        projectName: undefined, // TODO: Get from Plan card
        objectives: existingObjectives || undefined,
        documentContent: documentContent || undefined,
      };

      const result = await generateObjectivesAction(projectId, context);

      if (result.success) {
        // Parse the AI response and update fields
        parseAndUpdateObjectives(result.data);
      } else {
        alert(result.error?.message || 'Failed to generate objectives');
      }
    } catch (error) {
      console.error('Error generating objectives:', error);
      alert('Failed to generate objectives');
    } finally {
      setIsGenerating(false);
    }
  };

  const parseAndUpdateObjectives = (aiResponse: string) => {
    // Parse the AI response to extract the 4 objectives
    const sections = ['Functional', 'Quality', 'Budget', 'Program'];

    sections.forEach((sectionName) => {
      const regex = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i');
      const match = aiResponse.match(regex);

      if (match && match[1]) {
        const value = match[1].trim();
        const field = fields.find(f => f.data.label === sectionName);

        if (field) {
          // Update the field
          setFields(prev => prev.map(f =>
            f.id === field.id
              ? { ...f, data: { ...f.data, value } }
              : f
          ));

          // Save to database
          updateItemAction(field.id, {
            ...field.data,
            value,
          });
        }
      }
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    try {
      const text = await file.text();
      setDocumentContent(text);
      alert(`Document "${file.name}" added as context. Click "AI Generate" to use it.`);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read file');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      const text = await file.text();
      setDocumentContent(text);
      alert(`Document "${file.name}" added as context. Click "AI Generate" to use it.`);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read file');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading objectives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              AI Generate
            </>
          )}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Add Document Context
        </button>

        {documentContent && (
          <span className="text-xs text-green-600">Document added</span>
        )}

        {saveStatus !== 'idle' && (
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-600">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Save className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Saved</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Fields with drag-and-drop */}
      <div
        className="relative space-y-3"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX;
          const y = e.clientY;
          // Only set isDragOver to false if mouse actually left the container bounds
          if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            setIsDragOver(false);
          }
        }}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center z-10 border-2 border-dashed border-blue-400 rounded-lg">
            <div className="text-center">
              <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-700 font-medium">Drop document to add context</p>
            </div>
          </div>
        )}

        {fields.map((field) => (
          <TextAreaField
            key={field.id}
            label={field.data.label}
            value={field.data.value}
            onChange={(value) => handleFieldChange(field.id, value)}
            placeholder={field.data.placeholder}
            autoSize={true}
            minRows={4}
          />
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Tip: Fill in any existing objectives, upload a project brief, then click "AI Generate" to enhance them with AI.
      </p>
    </div>
  );
}
