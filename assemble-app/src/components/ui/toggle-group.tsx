'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

const ToggleGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

interface ToggleGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function ToggleGroup({
  value,
  onValueChange,
  children,
  className
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn('inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1', className)}>
        {children}
      </div>
    </ToggleGroupContext.Provider>
  )
}

interface ToggleGroupItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function ToggleGroupItem({
  value,
  children,
  className
}: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext)
  const isSelected = context.value === value

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isSelected
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900',
        className
      )}
      onClick={() => context.onValueChange?.(value)}
      aria-pressed={isSelected}
    >
      {children}
    </button>
  )
}