'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SortableListItemProps {
  id: string;
  children: React.ReactNode;
  onDelete?: () => Promise<void>;
  disabled?: boolean;
}

export function SortableListItem({ id, children, onDelete, disabled }: SortableListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = confirm('Are you sure you want to delete this item?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Failed to delete:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg
        ${isDragging ? 'opacity-50 shadow-lg z-50' : 'hover:border-gray-300'}
        ${disabled ? 'opacity-50' : ''}
        transition-all
      `}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className={`
          flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded
          text-gray-400 hover:text-gray-600 hover:bg-gray-100
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
        disabled={disabled}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting || disabled}
          className="
            flex-shrink-0 p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50
            opacity-0 group-hover:opacity-100 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}
