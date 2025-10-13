import { LoadingSpinner } from './loading-spinner'

interface LoadingOverlayProps {
  isVisible: boolean
  text?: string
  className?: string
}

export function LoadingOverlay({ isVisible, text = "Carregando...", className = "" }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-4 p-6 bg-card border rounded-lg shadow-lg">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      </div>
    </div>
  )
}
