import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius)] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 ease-in-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:     "bg-primary text-white hover:opacity-90",
        outline:     "border border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground",
        secondary:   "bg-surface text-foreground hover:opacity-90 border border-border",
        ghost:       "bg-transparent text-foreground hover:bg-muted shadow-none",
        destructive: "bg-destructive text-white hover:opacity-90",
        link:        "text-primary underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-[44px] px-5 py-2",
        xs: "h-7 rounded-md px-3 text-xs",
        sm: "h-9 rounded-md px-4 text-sm",
        lg: "h-12 rounded-[var(--radius)] px-8 text-base",
        icon: "size-[44px]",
        "icon-xs": "size-7 rounded-md",
        "icon-sm": "size-9 rounded-md",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
