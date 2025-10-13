'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  enableRetry?: boolean;
  errorTypes?: ('network' | 'image' | 'variation' | 'general')[];
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ProductErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Enhanced error logging and categorization
    const errorCategory = this.categorizeError(error);
    console.error(`Product Error Boundary [${errorCategory}] caught an error:`, error, errorInfo);

    // Report to error monitoring service if available
    this.reportError(error, errorInfo, errorCategory);
  }

  private categorizeError(error: Error): string {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'network';
    } else if (errorMessage.includes('image') || errorMessage.includes('media')) {
      return 'image';
    } else if (errorMessage.includes('variation') || errorMessage.includes('stock')) {
      return 'variation';
    }

    return 'general';
  }

  private reportError(error: Error, errorInfo: ErrorInfo, category: string) {
    // Here you would integrate with error monitoring services like Sentry, LogRocket, etc.
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Product Error [${category.toUpperCase()}]`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorCategory = this.state.error ? this.categorizeError(this.state.error) : 'general';
      const showErrorDetails = this.props.showErrorDetails !== false && process.env.NODE_ENV === 'development';
      const enableRetry = this.props.enableRetry !== false;

      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              {this.renderErrorIcon(errorCategory)}
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {this.getErrorTitle(errorCategory)}
              </h2>
              <p className="text-gray-600 mb-4">
                {this.getErrorMessage(errorCategory)}
              </p>

              {/* Error-specific actions */}
              {this.renderErrorActions(errorCategory)}

              {showErrorDetails && this.state.error && (
                <details className="text-left mb-4 p-3 bg-gray-50 rounded-md text-xs">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="whitespace-pre-wrap text-red-600">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="whitespace-pre-wrap text-gray-600 mt-2">
                      Component Stack: {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </div>

            <div className="space-y-3">
              {enableRetry && (
                <Button onClick={this.handleRetry} className="w-full">
                  Try Again
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Page
              </Button>
              {errorCategory === 'network' && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/catalog'}
                  className="w-full"
                >
                  Browse Other Products
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private renderErrorIcon(category: string) {
    const iconClass = "w-16 h-16 mx-auto mb-4";

    switch (category) {
      case 'network':
        return (
          <svg className={`${iconClass} text-orange-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          </svg>
        );
      case 'image':
        return (
          <svg className={`${iconClass} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'variation':
        return (
          <svg className={`${iconClass} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  }

  private getErrorTitle(category: string): string {
    switch (category) {
      case 'network':
        return 'Connection Problem';
      case 'image':
        return 'Image Loading Error';
      case 'variation':
        return 'Product Options Error';
      default:
        return 'Something went wrong';
    }
  }

  private getErrorMessage(category: string): string {
    switch (category) {
      case 'network':
        return 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.';
      case 'image':
        return 'Some product images couldn\'t be loaded. The product information is still available below.';
      case 'variation':
        return 'We\'re having trouble loading product options. You can still view the product details.';
      default:
        return 'We\'re having trouble loading this product. This might be a temporary issue.';
    }
  }

  private renderErrorActions(category: string) {
    switch (category) {
      case 'network':
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-orange-800">
              💡 <strong>Tip:</strong> Check your internet connection or try refreshing the page.
            </p>
          </div>
        );
      case 'image':
        return (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-purple-800">
              💡 <strong>Tip:</strong> Images may be loading slowly. You can continue shopping or try refreshing.
            </p>
          </div>
        );
      case 'variation':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Note:</strong> Product options may be limited. Contact support if you need help.
            </p>
          </div>
        );
      default:
        return null;
    }
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Product component error:', error, errorInfo);

    // Here you could send to error reporting service
    // reportError(error, errorInfo);
  };
};

export default ProductErrorBoundary;