import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  isVisible?: boolean
  text?: string
  className?: string
}

export function LoadingOverlay({
  isVisible = false,
  text = "Carregando...",
  className,
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-card p-6 shadow-lg border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {text && (
          <p className="text-sm font-medium text-foreground">{text}</p>
        )}
      </div>
    </div>
  )
}

