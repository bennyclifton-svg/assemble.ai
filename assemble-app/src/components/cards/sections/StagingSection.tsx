'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Loader2 } from 'lucide-react';
import { SortableListItem } from '../fields/SortableListItem';
import { addItemAction, deleteItemAction, reorderItemsAction, updateItemAction, getSectionItemsAction, initializeStagingSectionAction } from '@/app/actions/card';

interface StagingSectionProps {
  projectId: string;
}

interface StageItem {
  id: string;
  name: string;
  order: number;
}

export function StagingSection({ projectId }: StagingSectionProps) {
  const [stages, setStages] = useState<StageItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStages = async () => {
      setIsLoading(true);

      // Try to get existing stages
      const result = await getSectionItemsAction(projectId, 'staging');

      if (result.success && result.data.length > 0) {
        // Map database items to stages
        setStages(result.data.map(item => ({
          id: item.id,
          name: (item.data as any).name || '',
          order: item.order,
        })));
      } else {
        // Initialize with default stages
        await initializeStagingSectionAction(projectId);

        // Reload stages
        const reloadResult = await getSectionItemsAction(projectId, 'staging');
        if (reloadResult.success) {
          setStages(reloadResult.data.map(item => ({
            id: item.id,
            name: (item.data as any).name || '',
            order: item.order,
          })));
        }
      }

      setIsLoading(false);
    };

    loadStages();
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      const reorderedStages = arrayMove(stages, oldIndex, newIndex);
      setStages(reorderedStages);

      // Update order in database
      try {
        const result = await reorderItemsAction(reorderedStages.map((s) => s.id));
        if (!result.success) {
          // Revert on failure
          setStages(stages);
          console.error('Failed to reorder:', result.error.message);
        }
      } catch (error) {
        setStages(stages);
        console.error('Failed to reorder:', error);
      }
    }
  };

  const handleDelete = (stageId: string) => {
    return async () => {
      const result = await deleteItemAction(stageId);
      if (result.success) {
        setStages(stages.filter((s) => s.id !== stageId));
      } else {
        throw new Error(result.error.message);
      }
    };
  };

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      // Get the staging section to find its sectionId
      const sectionResult = await getSectionItemsAction(projectId, 'staging');

      if (!sectionResult.success || sectionResult.data.length === 0) {
        console.error('Staging section not found');
        alert('Failed to add stage: Section not found');
        setIsAdding(false);
        return;
      }

      // Get sectionId from any existing item
      const sectionId = sectionResult.data[0].sectionId;

      const result = await addItemAction(
        sectionId,
        { name: `Stage ${stages.length + 1}` },
        'text'
      );

      if (result.success) {
        setStages([
          ...stages,
          {
            id: result.data.id,
            name: `Stage ${stages.length + 1}`,
            order: result.data.order,
          },
        ]);
      } else {
        console.error('Failed to add stage:', result.error.message);
        alert(`Failed to add stage: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Failed to add stage:', error);
      alert('Failed to add stage');
    } finally {
      setIsAdding(false);
    }
  };

  const startEditing = (stage: StageItem) => {
    setEditingId(stage.id);
    setEditValue(stage.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (stageId: string) => {
    if (!editValue.trim()) {
      cancelEditing();
      return;
    }

    try {
      // Update the stage with the new name
      const result = await updateItemAction(stageId, { name: editValue.trim() });
      if (result.success) {
        // Update local state
        setStages(stages.map((s) => (s.id === stageId ? { ...s, name: editValue.trim() } : s)));
        cancelEditing();
      } else {
        console.error('Failed to update stage:', result.error.message);
        alert(`Failed to update stage: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Failed to update stage:', error);
      alert('Failed to update stage');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading stages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {stages.map((stage) => (
            <SortableListItem key={stage.id} id={stage.id} onDelete={handleDelete(stage.id)}>
              {editingId === stage.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveEdit(stage.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveEdit(stage.id);
                    } else if (e.key === 'Escape') {
                      cancelEditing();
                    }
                  }}
                  className="flex-1 px-2 py-1 text-sm text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => startEditing(stage)}
                  className="flex-1 px-2 py-1 text-sm text-gray-900 cursor-pointer hover:bg-gray-50 rounded"
                >
                  {stage.name}
                </div>
              )}
            </SortableListItem>
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={handleAdd}
        disabled={isAdding}
        className="
          w-full flex items-center justify-center gap-2 px-3 py-2
          text-sm text-gray-600 hover:text-gray-900
          border border-dashed border-gray-300 hover:border-gray-400
          rounded-lg transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Plus className="w-4 h-4" />
        {isAdding ? 'Adding...' : 'Add Stage'}
      </button>
    </div>
  );
}
