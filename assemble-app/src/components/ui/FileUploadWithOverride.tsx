'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, FolderOpen, Edit2, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { uploadDocumentsWithContext } from '@/app/actions/document';
import { autoFilerClient, FilingContext } from '@/services/autoFilerClient';

interface FileUploadWithOverrideProps {
  projectId: string;
  context: FilingContext;
  onUploadComplete?: (documents: any[]) => void;
  className?: string;
  maxFiles?: number;
  maxSize?: number;
}

interface FilePreview {
  file: File;
  suggestedPath: string;
  suggestedDisplayName: string;
  customPath?: string;
  customDisplayName?: string;
  isEditingPath: boolean;
  isEditingName: boolean;
  error?: string;
}

/**
 * File Upload Component with Manual Override (AC10)
 *
 * Features:
 * - Drag-and-drop file upload
 * - Preview suggested auto-filing path and display name
 * - Manual override for path and filename (AC10)
 * - "Add to Documents" toggle (default ON) (AC7)
 * - Visual feedback during upload
 */
export function FileUploadWithOverride({
  projectId,
  context,
  onUploadComplete,
  className,
  maxFiles = 10,
  maxSize = 15 * 1024 * 1024, // 15MB
}: FileUploadWithOverrideProps) {
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [addToDocuments, setAddToDocuments] = useState(context.addToDocuments !== false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDropAccepted = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null);

    // Generate suggested paths for each file using preview mode (client-safe)
    const previews = await Promise.all(
      acceptedFiles.map(async (file) => {
        try {
          const { path, displayName } = await autoFilerClient.previewFilingPath(
            file.name,
            context
          );

          return {
            file,
            suggestedPath: path,
            suggestedDisplayName: displayName,
            isEditingPath: false,
            isEditingName: false,
          };
        } catch (error) {
          return {
            file,
            suggestedPath: 'Plan/Misc',
            suggestedDisplayName: file.name,
            isEditingPath: false,
            isEditingName: false,
            error: 'Failed to determine filing path',
          };
        }
      })
    );

    setFilePreviews(previews);
  }, [context]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    maxFiles,
    maxSize,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
    },
  });

  const handleRemoveFile = useCallback((index: number) => {
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleToggleEditPath = useCallback((index: number) => {
    setFilePreviews((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, isEditingPath: !p.isEditingPath } : p
      )
    );
  }, []);

  const handleToggleEditName = useCallback((index: number) => {
    setFilePreviews((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, isEditingName: !p.isEditingName } : p
      )
    );
  }, []);

  const handlePathChange = useCallback((index: number, newPath: string) => {
    setFilePreviews((prev) =>
      prev.map((p, i) => (i === index ? { ...p, customPath: newPath } : p))
    );
  }, []);

  const handleDisplayNameChange = useCallback((index: number, newName: string) => {
    setFilePreviews((prev) =>
      prev.map((p, i) => (i === index ? { ...p, customDisplayName: newName } : p))
    );
  }, []);

  const handleUpload = useCallback(async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('addToDocuments', String(addToDocuments));
      formData.append('uploadLocation', context.uploadLocation);

      if (context.cardType) formData.append('cardType', context.cardType);
      if (context.disciplineOrTrade) formData.append('disciplineOrTrade', context.disciplineOrTrade);
      if (context.sectionName) formData.append('sectionName', context.sectionName);
      if (context.firmName) formData.append('firmName', context.firmName);

      // Add files and any manual overrides
      filePreviews.forEach((preview, index) => {
        formData.append('files', preview.file);

        // If user overrode path or name, add override data
        if (preview.customPath || preview.customDisplayName) {
          formData.append(
            `override_${index}`,
            JSON.stringify({
              path: preview.customPath || preview.suggestedPath,
              displayName: preview.customDisplayName || preview.suggestedDisplayName,
            })
          );
        }
      });

      const result = await uploadDocumentsWithContext(formData);

      if (result.success) {
        onUploadComplete?.(result.data || []);
        setFilePreviews([]);
      } else {
        setUploadError(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [projectId, context, filePreviews, addToDocuments, onUploadComplete]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      {filePreviews.length === 0 && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
            isDragActive && 'border-blue-500 bg-blue-50',
            !isDragActive && 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          )}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-3">
            <Upload
              className={cn(
                'w-10 h-10',
                isDragActive ? 'text-blue-500' : 'text-gray-400'
              )}
            />

            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="text-gray-600">Drag & drop files here, or click to select</p>
                <p className="text-sm text-gray-500">
                  Max {maxFiles} files, {formatFileSize(maxSize)} each
                </p>
                <p className="text-xs text-gray-400">
                  Supported: PDF, Images, Word, Excel, Text, ZIP
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* File Previews with Path Override (AC10) */}
      {filePreviews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Files to Upload ({filePreviews.length})
            </h3>

            {/* AC7: Add to Documents toggle */}
            <label className="flex items-center gap-2">
              <Checkbox
                checked={addToDocuments}
                onCheckedChange={(checked) => setAddToDocuments(!!checked)}
              />
              <span className="text-sm text-gray-700">Add to Documents</span>
            </label>
          </div>

          <div className="space-y-3">
            {filePreviews.map((preview, index) => (
              <div
                key={`${preview.file.name}-${index}`}
                className="border rounded-lg p-4 space-y-3 bg-white shadow-sm"
              >
                {/* File info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <File className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {preview.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(preview.file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Error indicator */}
                {preview.error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs">{preview.error}</span>
                  </div>
                )}

                {/* Suggested/Custom Path (AC10) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">Filing Path:</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEditPath(index)}
                      className="h-6 px-2 text-xs"
                    >
                      {preview.isEditingPath ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Done
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-3 h-3 mr-1" />
                          Override
                        </>
                      )}
                    </Button>
                  </div>

                  {preview.isEditingPath ? (
                    <Input
                      value={preview.customPath || preview.suggestedPath}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePathChange(index, e.target.value)}
                      placeholder="e.g., Consultants/Architecture"
                      className="text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded">
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-900 font-medium">
                        {preview.customPath || preview.suggestedPath}
                      </span>
                      {preview.customPath && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Custom
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Suggested/Custom Display Name (AC10) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">Display Name:</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEditName(index)}
                      className="h-6 px-2 text-xs"
                    >
                      {preview.isEditingName ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Done
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-3 h-3 mr-1" />
                          Override
                        </>
                      )}
                    </Button>
                  </div>

                  {preview.isEditingName ? (
                    <Input
                      value={preview.customDisplayName || preview.suggestedDisplayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDisplayNameChange(index, e.target.value)}
                      placeholder="e.g., FirmName_Invoice_001.PDF"
                      className="text-sm"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded">
                      <span className="text-sm text-gray-900">
                        {preview.customDisplayName || preview.suggestedDisplayName}
                      </span>
                      {preview.customDisplayName && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Custom
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload error */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{uploadError}</p>
            </div>
          )}

          {/* Upload button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {filePreviews.length} {filePreviews.length === 1 ? 'File' : 'Files'}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilePreviews([])}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
