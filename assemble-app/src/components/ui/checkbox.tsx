import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, indeterminate, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate || false
      }
    }, [indeterminate])

    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
          className
        )}
        ref={(el) => {
          if (ref) {
            if (typeof ref === 'function') {
              ref(el)
            } else {
              ref.current = el
            }
          }
          if (el) {
            (inputRef as any).current = el
          }
        }}
        onChange={(e) => {
          props.onChange?.(e)
          onCheckedChange?.(e.target.checked)
        }}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }