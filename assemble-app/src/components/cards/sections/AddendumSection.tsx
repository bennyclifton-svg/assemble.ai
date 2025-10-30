'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, FileText } from 'lucide-react';
// Date formatting helper
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
import {
  getAddendumsAction,
  createAddendumAction,
  updateAddendumTitleAction,
  toggleAddendumReleasedAction,
  updateAddendumDateAction,
  deleteAddendumAction,
  uploadAddendumDocumentAction,
} from '@/app/actions/addendum';

interface AddendumSectionProps {
  firmId: string;
  firmName: string;
  cardType: 'consultant' | 'contractor';
}

type AddendumData = {
  id: string;
  title: string;
  dateReleased: Date | null;
  isReleased: boolean;
  documentPath: string | null;
  displayOrder: number;
};

export function AddendumSection({ firmId, firmName, cardType }: AddendumSectionProps) {
  const [addendums, setAddendums] = useState<AddendumData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Load Addendums on mount
  useEffect(() => {
    loadAddendums();
  }, [firmId]);

  async function loadAddendums() {
    setIsLoading(true);
    const result = await getAddendumsAction(firmId);
    if (result.success) {
      // Ensure we always have at least 3 placeholders
      const addendumsData = result.data as AddendumData[];
      const addendumsWithPlaceholders = [...addendumsData];

      // Add default placeholders if needed
      for (let i = addendumsData.length; i < 3; i++) {
        addendumsWithPlaceholders.push({
          id: `placeholder-${i}`,
          title: `Addendum ${String(i + 1).padStart(2, '0')}`,
          dateReleased: null,
          isReleased: false,
          documentPath: null,
          displayOrder: i + 1,
        });
      }

      setAddendums(addendumsWithPlaceholders);
    }
    setIsLoading(false);
  }

  async function handleAddAddendum() {
    const nextNumber = addendums.filter(a => !a.id.startsWith('placeholder')).length + 1;
    const title = `Addendum ${String(nextNumber).padStart(2, '0')}`;

    const result = await createAddendumAction(firmId, title);
    if (result.success) {
      await loadAddendums();
    }
  }

  async function handleToggleReleased(addendum: AddendumData) {
    if (addendum.id.startsWith('placeholder')) {
      // Convert placeholder to real Addendum
      await handleAddAddendum();
      return;
    }

    const result = await toggleAddendumReleasedAction(addendum.id, !addendum.isReleased);
    if (result.success) {
      await loadAddendums();
    }
  }

  async function handleDeleteAddendum(addendumId: string) {
    if (addendumId.startsWith('placeholder')) return;

    if (confirm('Delete this Addendum?')) {
      const result = await deleteAddendumAction(addendumId);
      if (result.success) {
        await loadAddendums();
      }
    }
  }

  async function handleTitleDoubleClick(addendum: AddendumData) {
    if (addendum.id.startsWith('placeholder')) return;
    setEditingId(addendum.id);
    setEditTitle(addendum.title);
  }

  async function handleTitleSave(addendumId: string) {
    if (editTitle.trim() === '') return;

    const result = await updateAddendumTitleAction(addendumId, editTitle);
    if (result.success) {
      setEditingId(null);
      await loadAddendums();
    }
  }

  async function handleTitleKeyDown(e: React.KeyboardEvent, addendumId: string) {
    if (e.key === 'Enter') {
      await handleTitleSave(addendumId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  }

  async function handleDateChange(addendumId: string, date: string) {
    if (addendumId.startsWith('placeholder')) return;

    const result = await updateAddendumDateAction(addendumId, date ? new Date(date) : null);
    if (result.success) {
      await loadAddendums();
    }
  }

  async function handleDocumentUpload(addendumId: string, file: File) {
    if (addendumId.startsWith('placeholder')) {
      // Create Addendum first, then upload
      const result = await createAddendumAction(firmId, `Addendum ${String(addendums.length + 1).padStart(2, '0')}`);
      if (result.success) {
        const newAddendumId = result.data.id;
        await uploadDocument(newAddendumId, file);
      }
      return;
    }

    await uploadDocument(addendumId, file);
  }

  async function uploadDocument(addendumId: string, file: File) {
    // Construct document path: Documents/[Consultant or Contractor]/[Firm Name]/filename.pdf
    const basePath = cardType === 'consultant' ? 'Consultant' : 'Contractor';
    const documentPath = `Documents/${basePath}/${firmName}/${file.name}`;

    const result = await uploadAddendumDocumentAction(addendumId, documentPath);
    if (result.success) {
      await loadAddendums();
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading Addendums...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Addendums</h4>
        <button
          onClick={handleAddAddendum}
          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Addendum
        </button>
      </div>

      <div className="space-y-1">
        {addendums.map((addendum) => {
          const isPlaceholder = addendum.id.startsWith('placeholder');
          const isGhosted = isPlaceholder || !addendum.isReleased;

          return (
            <div
              key={addendum.id}
              className={`flex items-center gap-2 p-2 border rounded-md ${
                isGhosted
                  ? 'bg-gray-50 opacity-50 border-gray-200'
                  : 'bg-green-50 border-green-300'
              }`}
            >
              {/* Toggle released status */}
              <button
                onClick={() => handleToggleReleased(addendum)}
                className={`w-5 h-5 rounded border-2 flex-shrink-0 ${
                  addendum.isReleased
                    ? 'bg-green-500 border-green-500'
                    : 'bg-white border-gray-300 hover:border-green-400'
                }`}
                title={addendum.isReleased ? 'Mark as not released' : 'Mark as released'}
              >
                {addendum.isReleased && (
                  <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Title */}
              <div className="flex-1 min-w-0">
                {editingId === addendum.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleTitleSave(addendum.id)}
                    onKeyDown={(e) => handleTitleKeyDown(e, addendum.id)}
                    className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <div
                    onDoubleClick={() => handleTitleDoubleClick(addendum)}
                    className={`text-sm truncate ${
                      isPlaceholder ? 'text-gray-400 italic' : 'text-gray-900 cursor-pointer'
                    }`}
                    title={isPlaceholder ? 'Double-click to edit (after creating)' : 'Double-click to edit'}
                  >
                    {addendum.title}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="flex-shrink-0">
                {!isPlaceholder && (
                  <input
                    type="date"
                    value={addendum.dateReleased ? formatDateToISO(new Date(addendum.dateReleased)) : ''}
                    onChange={(e) => handleDateChange(addendum.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Document upload */}
              <label className="flex-shrink-0 cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDocumentUpload(addendum.id, file);
                    e.target.value = ''; // Reset input
                  }}
                  className="hidden"
                />
                <div
                  className={`p-1 rounded ${
                    addendum.documentPath
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={addendum.documentPath || 'Upload document'}
                >
                  {addendum.documentPath ? <FileText className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                </div>
              </label>

              {/* Delete */}
              {!isPlaceholder && (
                <button
                  onClick={() => handleDeleteAddendum(addendum.id)}
                  className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete Addendum"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
