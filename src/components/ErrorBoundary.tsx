import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  message?: string
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-rose-500/20 bg-rose-500/5 min-h-[120px]">
          <AlertTriangle className="w-8 h-8 text-rose-500 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            {this.props.message || 'Error loading component'}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            <RefreshCw className="w-3 h-3 mr-2" />
            Tentar novamente
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export function WidgetErrorFallback({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg border border-rose-500/20 bg-rose-500/5 min-h-[100px]">
      <AlertTriangle className="w-6 h-6 text-rose-500 mb-2" />
      <p className="text-sm text-muted-foreground">{message || 'Error loading component'}</p>
    </div>
  )
}
