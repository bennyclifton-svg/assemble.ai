'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => Promise<void>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  unit?: string;
  error?: string;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  unit,
  error,
}: TextFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
      // Error handling - revert to original value
      setLocalValue(value);
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="py-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving || disabled}
            placeholder={placeholder}
            className={`
              flex-1 px-3 py-2 border rounded-lg text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${error ? 'border-red-300' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
            `}
          />
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
          {isSaving && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          {showSuccess && <Check className="w-4 h-4 text-green-600" />}
        </div>
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
      <div className="flex items-center gap-2">
        <p className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value || placeholder || 'Click to edit'}
        </p>
        {unit && value && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}
