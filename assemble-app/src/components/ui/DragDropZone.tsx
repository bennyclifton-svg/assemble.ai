'use client';

import { useCallback, useState } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface DragDropZoneProps {
  onDrop: (files: File[]) => void | Promise<void>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Accept;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DragDropZone({
  onDrop,
  maxFiles = 10,
  maxSize = 15 * 1024 * 1024, // 15MB default
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  },
  multiple = true,
  disabled = false,
  className
}: DragDropZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Array<{ name: string; progress: number; status: 'uploading' | 'completed' | 'error'; error?: string }>>([]);

  const onDropAccepted = useCallback(async (acceptedFiles: File[]) => {
    // Initialize upload progress for each file
    const initialProgress = acceptedFiles.map(file => ({
      name: file.name,
      progress: 0,
      status: 'uploading' as const
    }));
    setUploadingFiles(initialProgress);

    try {
      await onDrop(acceptedFiles);

      // Mark all files as completed
      setUploadingFiles(prev =>
        prev.map(file => ({ ...file, progress: 100, status: 'completed' }))
      );

      // Clear after 3 seconds
      setTimeout(() => {
        setUploadingFiles([]);
      }, 3000);
    } catch (error) {
      // Mark files as error
      setUploadingFiles(prev =>
        prev.map(file => ({
          ...file,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        }))
      );
    }
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDropAccepted,
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    accept,
    multiple,
    disabled
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          isDragActive && !disabled && 'border-blue-500 bg-blue-50',
          !isDragActive && !disabled && 'border-gray-300 hover:border-gray-400',
          disabled && 'cursor-not-allowed opacity-50 bg-gray-50',
          uploadingFiles.length > 0 && 'mb-4'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <Upload className={cn(
            'w-10 h-10',
            isDragActive ? 'text-blue-500' : 'text-gray-400'
          )} />

          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop the files here...</p>
          ) : (
            <>
              <p className="text-gray-600">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                {multiple
                  ? `Max ${maxFiles} files, ${formatFileSize(maxSize)} each`
                  : `Single file, max ${formatFileSize(maxSize)}`}
              </p>
              <p className="text-xs text-gray-400">
                Supported: PDF, Images, Word, Excel
              </p>
            </>
          )}
        </div>
      </div>

      {/* File rejection errors */}
      {fileRejections.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{file.name}</p>
                <p className="text-xs text-red-600">
                  {errors.map(e => e.message).join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <UploadProgress
              key={file.name}
              fileName={file.name}
              progress={file.progress}
              status={file.status}
              error={file.error}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

function UploadProgress({ fileName, progress, status, error }: UploadProgressProps) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <File className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
        </div>
        <span className="text-sm text-gray-500">
          {status === 'completed' && '✓'}
          {status === 'error' && <X className="w-4 h-4 text-red-500" />}
          {status === 'uploading' && `${progress}%`}
        </span>
      </div>

      <Progress
        value={progress}
        className={cn(
          'h-2',
          status === 'error' && 'bg-red-100'
        )}
      />

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}