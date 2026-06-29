"use client"

import { useTheme } from "@/providers/ThemeProvider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="h-4.5 w-4.5" style={{ color: '#32C766' }} />
        ),
        info: (
          <InfoIcon className="h-4.5 w-4.5" style={{ color: '#74AAD9' }} />
        ),
        warning: (
          <TriangleAlertIcon className="h-4.5 w-4.5" style={{ color: '#E88916' }} />
        ),
        error: (
          <OctagonXIcon className="h-4.5 w-4.5" style={{ color: '#E64C4C' }} />
        ),
        loading: (
          <Loader2Icon className="h-4.5 w-4.5 animate-spin" style={{ color: 'var(--primary)' }} />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "16px",
          
          // Custom success theme variables
          "--success-bg": "var(--card)",
          "--success-text": "var(--foreground)",
          "--success-border": "rgba(50, 199, 102, 0.22)",
          
          // Custom error/destructive theme variables
          "--error-bg": "var(--card)",
          "--error-text": "var(--foreground)",
          "--error-border": "rgba(230, 76, 76, 0.22)",
          
          // Custom warning theme variables
          "--warning-bg": "var(--card)",
          "--warning-text": "var(--foreground)",
          "--warning-border": "rgba(232, 137, 22, 0.22)",
          
          // Custom info theme variables
          "--info-bg": "var(--card)",
          "--info-text": "var(--foreground)",
          "--info-border": "rgba(116, 170, 217, 0.22)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-[0_8px_30px_rgba(0,0,0,0.14)] group-[.toaster]:rounded-[16px] group-[.toaster]:px-4 group-[.toaster]:py-3.5 group-[.toaster]:font-sans",
          title: "group-[.toast]:text-foreground group-[.toast]:font-bold group-[.toast]:text-xs",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[11px] group-[.toast]:mt-0.5",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-[11px] group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-[11px] group-[.toast]:font-semibold",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
