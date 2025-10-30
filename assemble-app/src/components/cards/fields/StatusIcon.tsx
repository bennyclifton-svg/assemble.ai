'use client';

import { StatusKey } from '@/lib/constants/consultants';

interface StatusIconProps {
  type: StatusKey;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const labelMap = {
  brief: 'Brief',
  tender: 'Tender',
  rec: 'Rec',
  award: 'Award',
};

export function StatusIcon({ type, isActive, onClick, disabled }: StatusIconProps) {
  const label = labelMap[type];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={labelMap[type]}
      className={`
        relative px-2 py-1 text-xs font-medium rounded transition-all
        ${
          isActive
            ? 'text-emerald-400 border border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] hover:shadow-[0_0_12px_rgba(52,211,153,0.7)]'
            : disabled
            ? 'text-gray-400 border border-gray-300 opacity-50'
            : 'text-gray-700 border border-gray-300 hover:border-gray-400'
        }
        ${disabled ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
      `}
      style={
        !isActive && !disabled
          ? {
              textShadow: '1px 0 0 rgba(255, 0, 0, 0.3), -1px 0 0 rgba(0, 255, 255, 0.3)',
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}
