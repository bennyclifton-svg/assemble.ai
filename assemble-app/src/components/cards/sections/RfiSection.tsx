'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, FileText, Loader2 } from 'lucide-react';

// Date formatting helper
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

import {
  getRfisAction,
  createRfiAction,
  updateRfiTitleAction,
  toggleRfiReceivedAction,
  updateRfiDateAction,
  deleteRfiAction,
  uploadRfiDocumentAction,
} from '@/app/actions/rfi';
import {
  getAddendumsAction,
  createAddendumAction,
  updateAddendumTitleAction,
  toggleAddendumReleasedAction,
  updateAddendumDateAction,
  deleteAddendumAction,
  uploadAddendumDocumentAction,
} from '@/app/actions/addendum';
import { getFirmsAction } from '@/app/actions/firm';

// Main container component that displays RFI/Addendum sections for all firms
interface RFISectionProps {
  projectId: string;
  disciplineId: string;
}

// Individual firm column component
interface FirmRfiCardProps {
  firmId: string;
  firmName: string;
  cardType: 'consultant' | 'contractor';
}

type RfiData = {
  id: string;
  title: string;
  dateReceived: Date | null;
  isReceived: boolean;
  documentPath: string | null;
  displayOrder: number;
};

type AddendumData = {
  id: string;
  title: string;
  dateReleased: Date | null;
  isReleased: boolean;
  documentPath: string | null;
  displayOrder: number;
};

// Individual firm card with RFI and Addendum sections
function FirmRfiCard({ firmId, firmName, cardType }: FirmRfiCardProps) {
  const [rfis, setRfis] = useState<RfiData[]>([]);
  const [addendums, setAddendums] = useState<AddendumData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRfiId, setEditingRfiId] = useState<string | null>(null);
  const [editRfiTitle, setEditRfiTitle] = useState('');
  const [editingAddendumId, setEditingAddendumId] = useState<string | null>(null);
  const [editAddendumTitle, setEditAddendumTitle] = useState('');

  // Drag-drop states for RFI section
  const [isDragOverRfi, setIsDragOverRfi] = useState(false);
  const [isExtractingRfi, setIsExtractingRfi] = useState(false);
  const rfiFileInputRef = useRef<HTMLInputElement>(null);

  // Drag-drop states for Addendum section
  const [isDragOverAddendum, setIsDragOverAddendum] = useState(false);
  const [isExtractingAddendum, setIsExtractingAddendum] = useState(false);
  const addendumFileInputRef = useRef<HTMLInputElement>(null);

  // Load RFIs and Addendums on mount
  useEffect(() => {
    loadData();
  }, [firmId]);

  async function loadData() {
    setIsLoading(true);
    await Promise.all([loadRfis(), loadAddendums()]);
    setIsLoading(false);
  }

  async function loadRfis() {
    const result = await getRfisAction(firmId);
    if (result.success) {
      const rfisData = result.data as RfiData[];
      const rfisWithPlaceholders = [...rfisData];

      // Add default placeholders if needed
      for (let i = rfisData.length; i < 3; i++) {
        rfisWithPlaceholders.push({
          id: `placeholder-rfi-${i}`,
          title: `RFI ${String(i + 1).padStart(2, '0')}`,
          dateReceived: null,
          isReceived: false,
          documentPath: null,
          displayOrder: i + 1,
        });
      }

      setRfis(rfisWithPlaceholders);
    }
  }

  async function loadAddendums() {
    const result = await getAddendumsAction(firmId);
    if (result.success) {
      const addendumsData = result.data as AddendumData[];
      const addendumsWithPlaceholders = [...addendumsData];

      // Add default placeholders if needed
      for (let i = addendumsData.length; i < 3; i++) {
        addendumsWithPlaceholders.push({
          id: `placeholder-addendum-${i}`,
          title: `Addendum ${String(i + 1).padStart(2, '0')}`,
          dateReleased: null,
          isReleased: false,
          documentPath: null,
          displayOrder: i + 1,
        });
      }

      setAddendums(addendumsWithPlaceholders);
    }
  }

  // RFI handlers
  async function handleAddRfi() {
    const nextNumber = rfis.filter(r => !r.id.startsWith('placeholder')).length + 1;
    const title = `RFI ${String(nextNumber).padStart(2, '0')}`;

    const result = await createRfiAction(firmId, title);
    if (result.success) {
      await loadRfis();
    }
  }

  async function handleToggleRfiReceived(rfi: RfiData) {
    if (rfi.id.startsWith('placeholder')) {
      await handleAddRfi();
      return;
    }

    const result = await toggleRfiReceivedAction(rfi.id, !rfi.isReceived);
    if (result.success) {
      await loadRfis();
    }
  }

  async function handleDeleteRfi(rfiId: string) {
    if (rfiId.startsWith('placeholder')) return;

    if (confirm('Delete this RFI?')) {
      const result = await deleteRfiAction(rfiId);
      if (result.success) {
        await loadRfis();
      }
    }
  }

  async function handleRfiTitleDoubleClick(rfi: RfiData) {
    if (rfi.id.startsWith('placeholder')) return;
    setEditingRfiId(rfi.id);
    setEditRfiTitle(rfi.title);
  }

  async function handleRfiTitleSave(rfiId: string) {
    if (editRfiTitle.trim() === '') return;

    const result = await updateRfiTitleAction(rfiId, editRfiTitle);
    if (result.success) {
      setEditingRfiId(null);
      await loadRfis();
    }
  }

  async function handleRfiTitleKeyDown(e: React.KeyboardEvent, rfiId: string) {
    if (e.key === 'Enter') {
      await handleRfiTitleSave(rfiId);
    } else if (e.key === 'Escape') {
      setEditingRfiId(null);
    }
  }

  async function handleRfiDateChange(rfiId: string, date: string) {
    if (rfiId.startsWith('placeholder')) return;

    const result = await updateRfiDateAction(rfiId, date ? new Date(date) : null);
    if (result.success) {
      await loadRfis();
    }
  }

  // Addendum handlers
  async function handleAddAddendum() {
    const nextNumber = addendums.filter(a => !a.id.startsWith('placeholder')).length + 1;
    const title = `Addendum ${String(nextNumber).padStart(2, '0')}`;

    const result = await createAddendumAction(firmId, title);
    if (result.success) {
      await loadAddendums();
    }
  }

  async function handleToggleAddendumReleased(addendum: AddendumData) {
    if (addendum.id.startsWith('placeholder')) {
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

  async function handleAddendumTitleDoubleClick(addendum: AddendumData) {
    if (addendum.id.startsWith('placeholder')) return;
    setEditingAddendumId(addendum.id);
    setEditAddendumTitle(addendum.title);
  }

  async function handleAddendumTitleSave(addendumId: string) {
    if (editAddendumTitle.trim() === '') return;

    const result = await updateAddendumTitleAction(addendumId, editAddendumTitle);
    if (result.success) {
      setEditingAddendumId(null);
      await loadAddendums();
    }
  }

  async function handleAddendumTitleKeyDown(e: React.KeyboardEvent, addendumId: string) {
    if (e.key === 'Enter') {
      await handleAddendumTitleSave(addendumId);
    } else if (e.key === 'Escape') {
      setEditingAddendumId(null);
    }
  }

  async function handleAddendumDateChange(addendumId: string, date: string) {
    if (addendumId.startsWith('placeholder')) return;

    const result = await updateAddendumDateAction(addendumId, date ? new Date(date) : null);
    if (result.success) {
      await loadAddendums();
    }
  }

  // RFI drag-drop handlers
  const handleRfiDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverRfi(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    await processRfiFile(file);
  };

  const handleRfiFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await processRfiFile(file);

    if (rfiFileInputRef.current) {
      rfiFileInputRef.current.value = '';
    }
  };

  const processRfiFile = async (file: File) => {
    setIsExtractingRfi(true);

    try {
      // Create a new RFI with the uploaded document
      const nextNumber = rfis.filter(r => !r.id.startsWith('placeholder')).length + 1;
      const title = `RFI ${String(nextNumber).padStart(2, '0')}`;

      const result = await createRfiAction(firmId, title);
      if (result.success) {
        const newRfiId = result.data.id;
        const basePath = cardType === 'consultant' ? 'Consultant' : 'Contractor';
        const documentPath = `Documents/${basePath}/${firmName}/RFI/${file.name}`;

        await uploadRfiDocumentAction(newRfiId, documentPath);
        await loadRfis();
      }
    } catch (error) {
      console.error('Error processing RFI file:', error);
      alert('Failed to upload RFI document');
    } finally {
      setIsExtractingRfi(false);
    }
  };

  // Addendum drag-drop handlers
  const handleAddendumDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverAddendum(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    await processAddendumFile(file);
  };

  const handleAddendumFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await processAddendumFile(file);

    if (addendumFileInputRef.current) {
      addendumFileInputRef.current.value = '';
    }
  };

  const processAddendumFile = async (file: File) => {
    setIsExtractingAddendum(true);

    try {
      // Create a new Addendum with the uploaded document
      const nextNumber = addendums.filter(a => !a.id.startsWith('placeholder')).length + 1;
      const title = `Addendum ${String(nextNumber).padStart(2, '0')}`;

      const result = await createAddendumAction(firmId, title);
      if (result.success) {
        const newAddendumId = result.data.id;
        const basePath = cardType === 'consultant' ? 'Consultant' : 'Contractor';
        const documentPath = `Documents/${basePath}/${firmName}/Addendum/${file.name}`;

        await uploadAddendumDocumentAction(newAddendumId, documentPath);
        await loadAddendums();
      }
    } catch (error) {
      console.error('Error processing Addendum file:', error);
      alert('Failed to upload Addendum document');
    } finally {
      setIsExtractingAddendum(false);
    }
  };

  // Individual document upload handlers
  async function handleRfiDocumentUpload(rfiId: string, file: File) {
    if (rfiId.startsWith('placeholder')) {
      const result = await createRfiAction(firmId, `RFI ${String(rfis.filter(r => !r.id.startsWith('placeholder')).length + 1).padStart(2, '0')}`);
      if (result.success) {
        const newRfiId = result.data.id;
        const basePath = cardType === 'consultant' ? 'Consultant' : 'Contractor';
        const documentPath = `Documents/${basePath}/${firmName}/RFI/${file.name}`;
        await uploadRfiDocumentAction(newRfiId, documentPath);
        await loadRfis();
      }
      return;
    }

    const basePath = cardType === 'consultant' ? 'Consultant' : 'Contractor';
    const documentPath = `Documents/${basePath}/${firmName}/RFI/${file.name}`;
    const result = await uploadRfiDocumentAction(rfiId, documentPath);
    if (result.success) {
      await loadRfis();
    }
  }

  async function handleAddendumDocumentUpload(addendumId: string, file: File) {
    if (addendumId.startsWith('placeholder')) {
      const result = await createAddendumAction(firmId, `Addendum ${String(addendums.filter(a => !a.id.startsWith('placeholder')).length + 1).padStart(2, '0')}`);
      if (result.success) {
        const newAddendumId = result.data.id;
        const basePath = cardType === 'consultant' ? 'Consultant' : 'Contractor';
        const documentPath = `Documents/${basePath}/${firmName}/Addendum/${file.name}`;
        await uploadAddendumDocumentAction(newAddendumId, documentPath);
        await loadAddendums();
      }
      return;
    }

    const basePath = cardType === 'consultant' ? 'Consultant' : 'Contractor';
    const documentPath = `Documents/${basePath}/${firmName}/Addendum/${file.name}`;
    const result = await uploadAddendumDocumentAction(addendumId, documentPath);
    if (result.success) {
      await loadAddendums();
    }
  }

  if (isLoading) {
    return (
      <div className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Firm Header */}
        <div className="pb-3 border-b">
          <h3 className="font-semibold text-gray-900">{firmName}</h3>
        </div>

        {/* RFI Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">RFIs</h4>

          {/* RFI Drag-drop zone */}
          <div
            className="relative"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOverRfi(true);
            }}
            onDragLeave={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const x = e.clientX;
              const y = e.clientY;
              if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                setIsDragOverRfi(false);
              }
            }}
            onDrop={handleRfiDrop}
          >
            {(isDragOverRfi || isExtractingRfi) && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-95 flex items-center justify-center z-10 border-2 border-dashed border-blue-400 rounded">
                <div className="text-center">
                  {isExtractingRfi ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-blue-700 font-medium text-sm">Uploading RFI...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-blue-700 font-medium text-sm">Drop RFI document</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => rfiFileInputRef.current?.click()}
              className="w-full px-3 py-2 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
            >
              <Upload className="w-3 h-3" />
              Upload or drop file
            </button>
            <input
              ref={rfiFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleRfiFileSelect}
              className="hidden"
            />
          </div>

          {/* RFI List */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {rfis.map((rfi) => {
              const isPlaceholder = rfi.id.startsWith('placeholder');
              const isGhosted = isPlaceholder || !rfi.isReceived;

              return (
                <div
                  key={rfi.id}
                  className={`flex items-center gap-2 p-2 border rounded-md ${
                    isGhosted
                      ? 'bg-gray-50 opacity-50 border-gray-200'
                      : 'bg-green-50 border-green-300'
                  }`}
                >
                  <button
                    onClick={() => handleToggleRfiReceived(rfi)}
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 ${
                      rfi.isReceived
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300 hover:border-green-400'
                    }`}
                    title={rfi.isReceived ? 'Mark as not received' : 'Mark as received'}
                  >
                    {rfi.isReceived && (
                      <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {editingRfiId === rfi.id ? (
                      <input
                        type="text"
                        value={editRfiTitle}
                        onChange={(e) => setEditRfiTitle(e.target.value)}
                        onBlur={() => handleRfiTitleSave(rfi.id)}
                        onKeyDown={(e) => handleRfiTitleKeyDown(e, rfi.id)}
                        className="w-full px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div
                        onDoubleClick={() => handleRfiTitleDoubleClick(rfi)}
                        className={`text-xs truncate ${
                          isPlaceholder ? 'text-gray-400 italic' : 'text-gray-900 cursor-pointer'
                        }`}
                        title={isPlaceholder ? 'Double-click to edit (after creating)' : 'Double-click to edit'}
                      >
                        {rfi.title}
                      </div>
                    )}
                  </div>

                  <label className="flex-shrink-0 cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRfiDocumentUpload(rfi.id, file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <div
                      className={`p-0.5 rounded ${
                        rfi.documentPath
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={rfi.documentPath || 'Upload document'}
                    >
                      {rfi.documentPath ? <FileText className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                    </div>
                  </label>

                  {!isPlaceholder && (
                    <button
                      onClick={() => handleDeleteRfi(rfi.id)}
                      className="flex-shrink-0 p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete RFI"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleAddRfi}
            className="w-full text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add RFI
          </button>
        </div>

        {/* Addendum Section */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-700">Addendums</h4>

          {/* Addendum Drag-drop zone */}
          <div
            className="relative"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOverAddendum(true);
            }}
            onDragLeave={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const x = e.clientX;
              const y = e.clientY;
              if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                setIsDragOverAddendum(false);
              }
            }}
            onDrop={handleAddendumDrop}
          >
            {(isDragOverAddendum || isExtractingAddendum) && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-95 flex items-center justify-center z-10 border-2 border-dashed border-blue-400 rounded">
                <div className="text-center">
                  {isExtractingAddendum ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-blue-700 font-medium text-sm">Uploading Addendum...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-blue-700 font-medium text-sm">Drop Addendum document</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => addendumFileInputRef.current?.click()}
              className="w-full px-3 py-2 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
            >
              <Upload className="w-3 h-3" />
              Upload or drop file
            </button>
            <input
              ref={addendumFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleAddendumFileSelect}
              className="hidden"
            />
          </div>

          {/* Addendum List */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
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
                  <button
                    onClick={() => handleToggleAddendumReleased(addendum)}
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 ${
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

                  <div className="flex-1 min-w-0">
                    {editingAddendumId === addendum.id ? (
                      <input
                        type="text"
                        value={editAddendumTitle}
                        onChange={(e) => setEditAddendumTitle(e.target.value)}
                        onBlur={() => handleAddendumTitleSave(addendum.id)}
                        onKeyDown={(e) => handleAddendumTitleKeyDown(e, addendum.id)}
                        className="w-full px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div
                        onDoubleClick={() => handleAddendumTitleDoubleClick(addendum)}
                        className={`text-xs truncate ${
                          isPlaceholder ? 'text-gray-400 italic' : 'text-gray-900 cursor-pointer'
                        }`}
                        title={isPlaceholder ? 'Double-click to edit (after creating)' : 'Double-click to edit'}
                      >
                        {addendum.title}
                      </div>
                    )}
                  </div>

                  <label className="flex-shrink-0 cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAddendumDocumentUpload(addendum.id, file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <div
                      className={`p-0.5 rounded ${
                        addendum.documentPath
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={addendum.documentPath || 'Upload document'}
                    >
                      {addendum.documentPath ? <FileText className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                    </div>
                  </label>

                  {!isPlaceholder && (
                    <button
                      onClick={() => handleDeleteAddendum(addendum.id)}
                      className="flex-shrink-0 p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete Addendum"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleAddAddendum}
            className="w-full text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Addendum
          </button>
        </div>
      </div>
    </div>
  );
}

// Main container component - displays all firms in horizontal scroll layout
export function RFISection({ projectId, disciplineId }: RFISectionProps) {
  const [firms, setFirms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFirms() {
      setIsLoading(true);
      const result = await getFirmsAction(projectId, disciplineId, 'consultant');
      if (result.success) {
        setFirms(result.data);
      }
      setIsLoading(false);
    }
    loadFirms();
  }, [projectId, disciplineId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (firms.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        <p className="mb-2">No firms added yet.</p>
        <p className="text-xs text-gray-400">
          Add firms in the Firms section before managing RFIs and Addendums.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Horizontal scroll container */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {firms.map((firm) => (
          <FirmRfiCard
            key={firm.id}
            firmId={firm.id}
            firmName={firm.entity}
            cardType="consultant"
          />
        ))}
      </div>
    </div>
  );
}
