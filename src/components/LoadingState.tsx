import { Loader2 } from 'lucide-react'

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
      <p className="text-sm text-muted-foreground">{message || 'Carregando dados...'}</p>
    </div>
  )
}
