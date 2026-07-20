import { toast as sonnerToast } from 'sonner'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function toast(props: ToastProps) {
  const { title, description, variant } = props
  if (variant === 'destructive') {
    sonnerToast.error(title, { description })
  } else {
    sonnerToast(title, { description })
  }
}

export function useToast() {
  return { toast }
}
