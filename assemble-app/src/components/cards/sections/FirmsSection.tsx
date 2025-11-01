'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { Plus, Trash2, GripVertical, Save, Loader2, Upload, Users } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { firmSchema } from '@/lib/validators/firmValidators';
import { addFirmAction, updateFirmAction, deleteFirmAction, reorderFirmsAction, getFirmsAction } from '@/app/actions/firm';
import { extractFirmDetailsFromText, extractFirmDetailsFromFile } from '@/app/actions/consultant';

interface FirmsSectionProps {
  projectId: string;
  disciplineId: string;
}

type FirmData = {
  id: string;
  entity: string;
  abn?: string | null;
  address?: string | null;
  contact?: string | null;
  email?: string | null;
  mobile?: string | null;
  shortListed: boolean;
  displayOrder: number;
};

const MAX_FIRMS = 10;

function FirmColumn({
  firm,
  projectId,
  disciplineId,
  onUpdate,
  onDelete
}: {
  firm: FirmData;
  projectId: string;
  disciplineId: string;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: firm.id });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    resolver: zodResolver(firmSchema),
    defaultValues: {
      entity: firm.entity,
      abn: firm.abn || '',
      address: firm.address || '',
      contact: firm.contact || '',
      email: firm.email || '',
      mobile: firm.mobile || '',
      shortListed: firm.shortListed,
    },
  });

  // Reset form when firm data changes (e.g., tab switch)
  useEffect(() => {
    reset({
      entity: firm.entity,
      abn: firm.abn || '',
      address: firm.address || '',
      contact: firm.contact || '',
      email: firm.email || '',
      mobile: firm.mobile || '',
      shortListed: firm.shortListed,
    });
  }, [firm.id, firm.entity, firm.abn, firm.address, firm.contact, firm.email, firm.mobile, firm.shortListed, reset]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Debounced auto-save
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const subscription = watch((values) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          const result = await onUpdate(firm.id, values);
          if (result && result.success) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            console.error('Failed to update firm:', result?.error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
          }
        } catch (error) {
          console.error('Error updating firm:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      }, 1500); // Increased from 500ms to 1500ms
    });

    return () => {
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [watch, firm.id, onUpdate]);

  const handleDelete = () => {
    onDelete(firm.id);
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
        alert('PDF support coming soon! For now, please use text files (.txt), vCard (.vcf), or email (.eml) files.\n\nTip: You can also copy text from the PDF and paste it directly into the form.');
        setIsExtracting(false);
        return;
      }

      const content = await file.text();
      const result = await extractFirmDetailsFromFile(content, file.name);

      if (result.success && result.data) {
        populateFields(result.data);
      } else {
        alert(result.error?.message || 'Failed to extract firm details');
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
    if (!pastedText || pastedText.length < 10) return; // Ignore short pastes

    e.preventDefault();
    setIsExtracting(true);

    try {
      const result = await extractFirmDetailsFromText(pastedText);

      if (result.success && result.data) {
        populateFields(result.data);
      } else {
        alert(result.error?.message || 'Failed to extract firm details');
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

    if (data.entity) {
      setValue('entity', data.entity);
      populated.add('entity');
    }
    if (data.abn) {
      setValue('abn', data.abn);
      populated.add('abn');
    }
    if (data.address) {
      setValue('address', data.address);
      populated.add('address');
    }
    if (data.contact) {
      setValue('contact', data.contact);
      populated.add('contact');
    }
    if (data.email) {
      setValue('email', data.email);
      populated.add('email');
    }
    if (data.mobile) {
      setValue('mobile', data.mobile);
      populated.add('mobile');
    }

    setAutoPopulated(populated);

    // Clear auto-populated indicators after 5 seconds
    setTimeout(() => setAutoPopulated(new Set()), 5000);
  };

  // Add to Stakeholders functionality
  const handleAddToStakeholders = async () => {
    const values = watch();

    if (!values.entity || !values.contact) {
      alert('Entity and Contact are required to add to stakeholders');
      return;
    }

    // TODO: Implement stakeholder addition when Plan Card Stakeholder API is available
    alert('Add to Stakeholders feature coming soon - will integrate with Plan Card Stakeholders section');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-lg overflow-hidden relative"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        // Only set isDragOver to false if we're actually leaving the container
        // Check if the related target is outside this element
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
          setIsDragOver(false);
        }
      }}
      onDrop={handleDrop}
    >
      {/* Drag-drop overlay */}
      {(isDragOver || isExtracting) && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-95 flex items-center justify-center z-10 border-2 border-dashed border-blue-400">
          <div className="text-center">
            {isExtracting ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-blue-700 font-medium">Extracting firm details...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <p className="text-blue-700 font-medium">Drop file to auto-populate</p>
                <p className="text-blue-600 text-sm mt-1">Supports vCard, email, PDF, Word, text</p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header with drag handle and actions */}
        <div className="flex items-center justify-between">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-1 text-xs">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    <span className="text-blue-600">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Save className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">Saved</span>
                  </>
                )}
                {saveStatus === 'error' && <span className="text-red-600">Error</span>}
              </div>
            )}
            <button
              onClick={handleDelete}
              className="p-1.5 rounded transition-colors hover:bg-red-100 text-gray-500 hover:text-red-600"
              title="Delete firm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Upload hint */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 px-3 py-1.5 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-3 h-3 inline mr-1" />
            Upload or drop file
          </button>
          <button
            onClick={handleAddToStakeholders}
            className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Add to Stakeholders"
          >
            <Users className="w-3 h-3" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".vcf,.eml,.msg,.pdf,.docx,.doc,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-xs text-gray-600 text-center">Or paste contact details below</p>

        {/* Form fields */}
        <form className="space-y-3" onPaste={handlePaste}>
          {/* Entity (required) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Entity <span className="text-red-500">*</span>
              {autoPopulated.has('entity') && <span className="ml-1 text-green-600 text-xs">(AI)</span>}
            </label>
            <input
              {...register('entity')}
              type="text"
              className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-md ${
                autoPopulated.has('entity') ? 'border-green-300 bg-green-50' :
                errors.entity ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Company name"
            />
            {errors.entity && <p className="mt-1 text-xs text-red-600">{errors.entity.message}</p>}
          </div>

          {/* ABN */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              ABN
              {autoPopulated.has('abn') && <span className="ml-1 text-green-600 text-xs">(AI)</span>}
            </label>
            <input
              {...register('abn')}
              type="text"
              className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-md ${
                autoPopulated.has('abn') ? 'border-green-300 bg-green-50' :
                errors.abn ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="12345678901"
              maxLength={11}
            />
            {errors.abn && <p className="mt-1 text-xs text-red-600">{errors.abn.message}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Address
              {autoPopulated.has('address') && <span className="ml-1 text-green-600 text-xs">(AI)</span>}
            </label>
            <textarea
              {...register('address')}
              rows={2}
              className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-md ${
                autoPopulated.has('address') ? 'border-green-300 bg-green-50' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Street address"
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contact
              {autoPopulated.has('contact') && <span className="ml-1 text-green-600 text-xs">(AI)</span>}
            </label>
            <input
              {...register('contact')}
              type="text"
              className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-md ${
                autoPopulated.has('contact') ? 'border-green-300 bg-green-50' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Contact person"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email
              {autoPopulated.has('email') && <span className="ml-1 text-green-600 text-xs">(AI)</span>}
            </label>
            <input
              {...register('email')}
              type="email"
              className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-md ${
                autoPopulated.has('email') ? 'border-green-300 bg-green-50' :
                errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="email@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mobile
              {autoPopulated.has('mobile') && <span className="ml-1 text-green-600 text-xs">(AI)</span>}
            </label>
            <input
              {...register('mobile')}
              type="tel"
              className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-md ${
                autoPopulated.has('mobile') ? 'border-green-300 bg-green-50' :
                errors.mobile ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="0412 345 678"
            />
            {errors.mobile && <p className="mt-1 text-xs text-red-600">{errors.mobile.message}</p>}
          </div>

          {/* Short Listed */}
          <div className="flex items-center gap-2">
            <input
              {...register('shortListed')}
              type="checkbox"
              id={`shortlist-${firm.id}`}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`shortlist-${firm.id}`} className="text-sm text-gray-700 cursor-pointer">
              Short Listed
            </label>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FirmsSection({ projectId, disciplineId }: FirmsSectionProps) {
  const [firms, setFirms] = useState<FirmData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load firms on mount
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

  const handleAddFirm = async () => {
    if (firms.length >= MAX_FIRMS) {
      alert(`Maximum ${MAX_FIRMS} firms allowed`);
      return;
    }

    startTransition(async () => {
      const result = await addFirmAction(projectId, disciplineId, 'consultant', {
        entity: 'New Firm',
        shortListed: false,
      });

      if (result.success) {
        setFirms([
          ...firms,
          {
            id: result.data.id,
            entity: 'New Firm',
            abn: null,
            address: null,
            contact: null,
            email: null,
            mobile: null,
            shortListed: false,
            displayOrder: result.data.displayOrder,
          },
        ]);
      }
    });
  };

  const handleUpdateFirm = async (firmId: string, data: any) => {
    const result = await updateFirmAction(firmId, data);
    if (result.success) {
      setFirms((prev) =>
        prev.map((f) =>
          f.id === firmId
            ? {
                ...f,
                entity: data.entity,
                abn: data.abn || null,
                address: data.address || null,
                contact: data.contact || null,
                email: data.email || null,
                mobile: data.mobile || null,
                shortListed: data.shortListed,
              }
            : f
        )
      );
    }
    return result;
  };

  const handleDeleteFirm = async (firmId: string) => {
    startTransition(async () => {
      const result = await deleteFirmAction(firmId);
      if (result.success) {
        setFirms((prev) => prev.filter((f) => f.id !== firmId));
      }
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = firms.findIndex((f) => f.id === active.id);
      const newIndex = firms.findIndex((f) => f.id === over.id);

      const reorderedFirms = arrayMove(firms, oldIndex, newIndex);
      setFirms(reorderedFirms);

      // Update server
      await reorderFirmsAction({
        firmIds: reorderedFirms.map((f) => f.id),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Firm Button */}
      <div>
        <button
          onClick={handleAddFirm}
          disabled={isPending || firms.length >= MAX_FIRMS}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add Firm
        </button>
        {firms.length >= MAX_FIRMS && (
          <p className="mt-2 text-xs text-gray-500">Maximum {MAX_FIRMS} firms reached</p>
        )}
      </div>

      {/* Firms Grid with DnD */}
      {firms.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={firms.map((f) => f.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {firms.map((firm) => (
                <FirmColumn
                  key={firm.id}
                  firm={firm}
                  projectId={projectId}
                  disciplineId={disciplineId}
                  onUpdate={handleUpdateFirm}
                  onDelete={handleDeleteFirm}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12 text-gray-500 text-sm">
          No firms added yet. Click "Add Firm" to get started.
        </div>
      )}
    </div>
  );
}
