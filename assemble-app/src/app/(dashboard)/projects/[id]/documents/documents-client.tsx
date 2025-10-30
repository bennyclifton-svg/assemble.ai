'use client';

import { useState } from 'react';
import { DocumentCard } from '@/components/cards/DocumentCard';
import { DragDropZone } from '@/components/ui/DragDropZone';
import { uploadDocumentsToFolder } from '@/app/actions/document';
import { useRouter } from 'next/navigation';
import { DndProvider } from '@/components/providers/DndProvider';

interface DocumentsClientProps {
  projectId: string;
  initialDocuments: any[];
}

export default function DocumentsClient({ projectId, initialDocuments }: DocumentsClientProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);

    try {
      const result = await uploadDocumentsToFolder(projectId, '', files);

      if (result.success) {
        // Add new documents to the list
        setDocuments([...documents, ...result.data]);

        // Refresh to get updated data
        router.refresh();
      } else {
        console.error('Upload failed:', result.error?.message);
        alert(`Upload failed: ${result.error?.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DndProvider>
      <div className="h-full flex flex-col">
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-semibold">Document Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload and organize project documents
          </p>
        </div>

        <div className="flex-1 flex gap-6 p-6">
          {/* Left side - Upload zone */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-medium mb-4">Upload Documents</h2>
              <DragDropZone
                onDrop={handleUpload}
                disabled={isUploading}
              />
              {isUploading && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Uploading files...
                </p>
              )}
            </div>
          </div>

          {/* Right side - Document tree */}
          <div className="flex-1 bg-white rounded-lg border">
            <DocumentCard projectId={projectId} documents={documents} />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}