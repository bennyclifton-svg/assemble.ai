'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, Sparkles } from 'lucide-react';
import { TextField } from '../fields/TextField';
import { updateItemAction, getSectionItemsAction, initializeDetailsSectionAction, extractProjectDetailsFromText, extractProjectDetailsFromFile } from '@/app/actions/card';

interface DetailsSectionProps {
  projectId: string;
}

interface FieldData {
  label: string;
  value: string;
  type: string;
  required?: boolean;
  unit?: string;
}

export function DetailsSection({ projectId }: DetailsSectionProps) {
  const [fields, setFields] = useState<Array<{ id: string; data: FieldData }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadFields = async () => {
      setIsLoading(true);

      // Try to get existing fields
      const result = await getSectionItemsAction(projectId, 'details');

      if (result.success && result.data.length > 0) {
        // Map database items to fields
        setFields(result.data.map(item => ({
          id: item.id,
          data: item.data as FieldData,
        })));
      } else {
        // Initialize with default fields
        await initializeDetailsSectionAction(projectId);

        // Reload fields
        const reloadResult = await getSectionItemsAction(projectId, 'details');
        if (reloadResult.success) {
          setFields(reloadResult.data.map(item => ({
            id: item.id,
            data: item.data as FieldData,
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

  // Map extracted data field names to our field labels
  const fieldMapping: Record<string, string> = {
    'projectName': 'Project Name',
    'address': 'Address',
    'legalAddress': 'Legal Address',
    'zoning': 'Zoning',
    'jurisdiction': 'Jurisdiction',
    'lotArea': 'Lot Area',
    'numberOfStories': 'Number of Stories',
    'buildingClass': 'Building Class',
  };

  // Handle file drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    await processFile(file);
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await processFile(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process uploaded file
  const processFile = async (file: File) => {
    setIsExtracting(true);

    try {
      // Check if PDF - not yet supported
      if (file.name.toLowerCase().endsWith('.pdf')) {
        alert('PDF support coming soon! For now, please use text files (.txt) or paste text directly.\n\nTip: You can copy text from the PDF and paste it directly into the form.');
        setIsExtracting(false);
        return;
      }

      const content = await file.text();
      const result = await extractProjectDetailsFromFile(content, file.name);

      if (result.success && result.data) {
        populateFields(result.data);
      } else {
        alert(result.error?.message || 'Failed to extract project details');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to read file');
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle paste
  const handlePaste = async (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText || pastedText.length < 20) return; // Ignore short pastes

    e.preventDefault();
    setIsExtracting(true);

    try {
      const result = await extractProjectDetailsFromText(pastedText);

      if (result.success && result.data) {
        populateFields(result.data);
      } else {
        alert(result.error?.message || 'Failed to extract project details');
      }
    } catch (error) {
      console.error('Error processing pasted text:', error);
      alert('Failed to process pasted content');
    } finally {
      setIsExtracting(false);
    }
  };

  // Populate form fields from extracted data
  const populateFields = (data: any) => {
    const populated = new Set<string>();

    // Iterate through the extracted data and match to our fields
    Object.keys(data).forEach((key) => {
      const labelToMatch = fieldMapping[key];
      if (!labelToMatch || !data[key]) return;

      // Find the field with this label
      const fieldIndex = fields.findIndex(f => f.data.label === labelToMatch);
      if (fieldIndex === -1) return;

      const field = fields[fieldIndex];

      // Update the field value
      setFields(prev => prev.map((f, idx) =>
        idx === fieldIndex
          ? { ...f, data: { ...f.data, value: data[key] } }
          : f
      ));

      // Save to database
      updateItemAction(field.id, {
        ...field.data,
        value: data[key],
      });

      populated.add(field.id);
    });

    setAutoPopulated(populated);

    // Clear auto-populated indicators after 5 seconds
    setTimeout(() => setAutoPopulated(new Set()), 5000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-3 relative"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
          setIsDragOver(false);
        }
      }}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Drag-drop overlay */}
      {(isDragOver || isExtracting) && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-95 flex items-center justify-center z-10 border-2 border-dashed border-blue-400 rounded-lg">
          <div className="text-center">
            {isExtracting ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-blue-700 font-medium">Extracting project details...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <p className="text-blue-700 font-medium">Drop file to auto-populate</p>
                <p className="text-blue-600 text-sm mt-1">Supports text files, Word docs, etc.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          disabled={isExtracting}
        >
          <Upload className="w-3 h-3" />
          Upload or drop file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.doc,.docx,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-xs text-gray-600">or paste project details into any field</p>
      </div>

      {/* Fields */}
      <div className="space-y-1">
        {fields.map((field) => {
          const isAIPopulated = autoPopulated.has(field.id);
          return (
            <div key={field.id} className="relative">
              <TextField
                label={field.data.label}
                value={field.data.value}
                onChange={(value) => handleFieldChange(field.id, value)}
                required={field.data.required}
                unit={field.data.unit}
                placeholder={`Enter ${field.data.label.toLowerCase()}`}
              />
              {isAIPopulated && (
                <div className="absolute top-1 right-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
