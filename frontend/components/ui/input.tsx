import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({ className, type, style, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-[46px] w-full min-w-0 rounded-[var(--radius)] border px-4 py-2 text-sm font-medium transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
        className
      )}
      style={{
        backgroundColor: 'var(--input)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)',
        outlineColor: 'var(--ring)',
        ...style,
      }}
      {...props}
    />
  )
}

export { Input }
