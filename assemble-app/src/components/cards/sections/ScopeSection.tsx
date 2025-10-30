'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Upload, Loader2, Save } from 'lucide-react';
import { generateScopeAction, getDisciplineData, updateScopeAction } from '@/app/actions/consultant';
import type { ProjectContext } from '@/lib/ai/scopeGeneratorPrompts';

interface ScopeSectionProps {
  projectId: string;
  disciplineId: string;
}

export function ScopeSection({ projectId, disciplineId }: ScopeSectionProps) {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load discipline data when component mounts or discipline changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const result = await getDisciplineData(projectId, disciplineId);
      if (result.success) {
        setContent(result.data.scope || '');
      }
      setIsLoading(false);
    };

    loadData();
  }, [projectId, disciplineId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (content && content.trim() && !isLoading) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(async () => {
        if (!content.trim()) return;
        setSaveStatus('saving');
        const result = await updateScopeAction(projectId, disciplineId, content);
        if (result.success) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('idle');
          console.error('Failed to save scope:', result.error.message);
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [content, projectId, disciplineId, isLoading]);

  // Save on component unmount
  useEffect(() => {
    return () => {
      const currentContent = content;
      if (currentContent && currentContent.trim()) {
        // Use a synchronous approach for unmount save
        updateScopeAction(projectId, disciplineId, currentContent);
      }
    };
  }, [content, projectId, disciplineId]);

  const handleSave = async () => {
    if (!content.trim()) return;

    setSaveStatus('saving');

    const result = await updateScopeAction(projectId, disciplineId, content);

    if (result.success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('idle');
      console.error('Failed to save scope:', result.error.message);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // Gather context
      // TODO: Fetch actual project context from Plan Card
      const context: ProjectContext = {
        discipline: disciplineId, // This would be the actual discipline name
        existingScope: content || undefined,
        documentContent: documentContent || undefined,
      };

      const result = await generateScopeAction(context);

      if (result.success) {
        setContent(result.data);
      } else {
        alert(result.error?.message || 'Failed to generate scope');
      }
    } catch (error) {
      console.error('Error generating scope:', error);
      alert('Failed to generate scope');
    } finally {
      setIsGenerating(false);
    }
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading scope...</p>
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

      {/* Text Editor */}
      <div
        className="relative"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
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

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Define the scope of work here. Use bullet points or paragraphs. Click 'AI Generate' for AI-assisted content."
          className="w-full h-96 px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none font-mono"
        />
      </div>

      <p className="text-xs text-gray-500">
        Content auto-saves every 30 seconds. All content is fully editable.
      </p>
    </div>
  );
}
