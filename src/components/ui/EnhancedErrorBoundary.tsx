'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './button'
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Server, Clock } from 'lucide-react'

interface ErrorDetails {
  type: 'network' | 'server' | 'client' | 'timeout' | 'unknown'
  title: string
  message: string
  suggestion?: string
  canRetry: boolean
}

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, details: ErrorDetails) => void
  showErrorDetails?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorDetails?: ErrorDetails
  retryCount: number
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = []

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = this.categorizeError(error)
    this.setState({
      errorInfo,
      errorDetails
    })

    this.props.onError?.(error, errorInfo, errorDetails)

    // Log error for monitoring
    console.error('Enhanced Error Boundary caught an error:', error, errorInfo, errorDetails)
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
  }

  categorizeError(error: Error): ErrorDetails {
    const errorMessage = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return {
        type: 'network',
        title: 'Connection Problem',
        message: 'Unable to connect to our servers. Please check your internet connection.',
        suggestion: 'Check your internet connection and try again.',
        canRetry: true
      }
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      return {
        type: 'timeout',
        title: 'Request Timeout',
        message: 'The request took too long to complete. The server might be busy.',
        suggestion: 'Please try again in a few moments.',
        canRetry: true
      }
    }

    // Server errors (5xx status codes)
    if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
      return {
        type: 'server',
        title: 'Server Error',
        message: 'Our servers are experiencing issues. Please try again later.',
        suggestion: 'This is usually temporary. Please try again in a few minutes.',
        canRetry: true
      }
    }

    // Client errors (4xx status codes)
    if (errorMessage.includes('400') || errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('404')) {
      return {
        type: 'client',
        title: 'Request Error',
        message: 'There was a problem with your request. Please try again.',
        suggestion: 'Refresh the page or try again later.',
        canRetry: true
      }
    }

    // Default unknown error
    return {
      type: 'unknown',
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again.',
      suggestion: 'If this problem persists, please contact support.',
      canRetry: true
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state
    const newRetryCount = retryCount + 1

    // Exponential backoff: 1s, 2s, 4s, 8s, then 10s max
    const delay = Math.min(1000 * Math.pow(2, Math.min(newRetryCount - 1, 4)), 10000)

    this.setState({ retryCount: newRetryCount })

    // Set timeout for retry
    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorDetails: undefined
      })
    }, delay)

    this.retryTimeouts.push(timeout)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { errorDetails } = this.state

      if (!errorDetails) {
        return null
      }

      const getErrorIcon = () => {
        switch (errorDetails.type) {
          case 'network':
            return <WifiOff className="w-8 h-8 text-orange-500" />
          case 'timeout':
            return <Clock className="w-8 h-8 text-yellow-500" />
          case 'server':
            return <Server className="w-8 h-8 text-red-500" />
          default:
            return <AlertTriangle className="w-8 h-8 text-red-500" />
        }
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              {getErrorIcon()}
              <h2 className="text-xl font-semibold text-gray-900 mb-2 mt-4">
                {errorDetails.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {errorDetails.message}
              </p>
              {errorDetails.suggestion && (
                <p className="text-sm text-gray-500 mb-4">
                  💡 {errorDetails.suggestion}
                </p>
              )}

              {/* Retry count indicator */}
              {this.state.retryCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    Retry attempt #{this.state.retryCount}
                  </p>
                </div>
              )}

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && this.props.showErrorDetails && (
                <details className="text-left mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    🔧 Error Details (Development Only)
                  </summary>
                  <div className="p-3 bg-gray-50 rounded-md text-xs space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="whitespace-pre-wrap text-red-600 mt-1">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap text-gray-600 mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="space-y-3">
              {errorDetails.canRetry && (
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                  {this.state.retryCount > 0 && ` (${this.state.retryCount})`}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={this.handleReload}
                className="w-full"
              >
                Reload Page
              </Button>

              {errorDetails.type === 'network' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://downdetector.com', '_blank')}
                  className="w-full text-xs"
                >
                  Check Service Status
                </Button>
              )}
            </div>

            {/* Help text */}
            <p className="text-xs text-gray-500 mt-4">
              If this problem persists, please contact our support team.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default EnhancedErrorBoundary