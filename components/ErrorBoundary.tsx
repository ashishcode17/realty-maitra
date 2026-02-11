'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-8 rounded-xl bg-slate-800/50 border border-slate-700">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
          <p className="text-slate-400 text-sm text-center max-w-md">
            We’ve run into an error. Try refreshing the page. If it keeps happening, report it from Settings → Help / Report a Problem.
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: undefined })
              window.location.reload()
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Reload page
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
