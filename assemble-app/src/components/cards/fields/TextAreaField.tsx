'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => Promise<void>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  error?: string;
  autoSize?: boolean; // Enable auto-sizing behavior
  minRows?: number; // Minimum rows when auto-sizing (default 4)
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  rows = 4,
  error,
  autoSize = false,
  minRows = 4,
}: TextAreaFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (autoSize && textareaRef.current && isEditing) {
      const textarea = textareaRef.current;

      // Reset height to recalculate
      textarea.style.height = 'auto';

      // Calculate minimum height based on minRows
      const computedStyle = getComputedStyle(textarea);
      const lineHeight = parseInt(computedStyle.lineHeight);
      const paddingTop = parseInt(computedStyle.paddingTop);
      const paddingBottom = parseInt(computedStyle.paddingBottom);
      const borderTop = parseInt(computedStyle.borderTopWidth);
      const borderBottom = parseInt(computedStyle.borderBottomWidth);

      const minHeight = (lineHeight * minRows) + paddingTop + paddingBottom + borderTop + borderBottom;

      // Set height to scrollHeight or minHeight, whichever is larger
      const newHeight = Math.max(textarea.scrollHeight, minHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [localValue, autoSize, minRows, isEditing]);

  const handleSave = async () => {
    if (localValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onChange(localValue);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setIsEditing(false);
    } catch (error) {
      setLocalValue(value);
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="py-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving || disabled}
            placeholder={placeholder}
            rows={autoSize ? undefined : rows}
            className={`
              w-full px-3 py-2 border rounded-lg text-sm text-gray-900
              ${autoSize ? 'resize-none overflow-hidden' : 'resize-y'}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${error ? 'border-red-300' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
            `}
          />
          {(isSaving || showSuccess) && (
            <div className="absolute top-2 right-2">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              {showSuccess && <Check className="w-4 h-4 text-green-600" />}
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">Ctrl+Enter to save, Esc to cancel</p>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div
      className="py-2 cursor-pointer hover:bg-gray-50 rounded px-3 -mx-3 transition-colors"
      onClick={() => !disabled && setIsEditing(true)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          !disabled && setIsEditing(true);
        }
      }}
    >
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <p className={`text-sm whitespace-pre-wrap ${value ? 'text-gray-900' : 'text-gray-400'}`}>
        {value || placeholder || 'Click to edit'}
      </p>
    </div>
  );
}
