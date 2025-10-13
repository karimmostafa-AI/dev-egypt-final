'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface ErrorState {
  error: Error | null
  isRetrying: boolean
  retryCount: number
  canRetry: boolean
  errorType: 'network' | 'server' | 'client' | 'timeout' | 'unknown'
}

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
}

export function useErrorHandling(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
    errorType: 'unknown'
  })

  const queryClient = useQueryClient()

  const categorizeError = useCallback((error: Error): ErrorState['errorType'] => {
    const errorMessage = error.message.toLowerCase()

    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return 'network'
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      return 'timeout'
    }

    if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
      return 'server'
    }

    if (errorMessage.includes('400') || errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('404')) {
      return 'client'
    }

    return 'unknown'
  }, [])

  const calculateRetryDelay = useCallback((retryCount: number): number => {
    const delay = baseDelay * Math.pow(backoffFactor, retryCount)
    return Math.min(delay, maxDelay)
  }, [baseDelay, backoffFactor, maxDelay])

  const handleError = useCallback((error: Error) => {
    const errorType = categorizeError(error)

    setErrorState({
      error,
      isRetrying: false,
      retryCount: 0,
      canRetry: true,
      errorType
    })
  }, [categorizeError])

  const retryWithBackoff = useCallback(async (retryFn: () => Promise<void> | void) => {
    const newRetryCount = errorState.retryCount + 1

    if (newRetryCount > maxRetries) {
      setErrorState(prev => ({
        ...prev,
        canRetry: false,
        retryCount: newRetryCount
      }))
      return
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: newRetryCount
    }))

    const delay = calculateRetryDelay(newRetryCount - 1)

    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      await retryFn()

      // Success - clear error state
      setErrorState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: true,
        errorType: 'unknown'
      })
    } catch (error) {
      // Retry failed - update error state
      setErrorState(prev => ({
        ...prev,
        error: error as Error,
        isRetrying: false,
        errorType: categorizeError(error as Error)
      }))
    }
  }, [errorState.retryCount, maxRetries, calculateRetryDelay, categorizeError])

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true,
      errorType: 'unknown'
    })
  }, [])

  const invalidateRelatedQueries = useCallback((queryKeys: string[]) => {
    queryKeys.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    })
  }, [queryClient])

  const getErrorMessage = useCallback((error: Error | null, errorType: ErrorState['errorType']): string => {
    if (!error) return ''

    switch (errorType) {
      case 'network':
        return 'Unable to connect to our servers. Please check your internet connection and try again.'
      case 'timeout':
        return 'The request took too long to complete. Please try again.'
      case 'server':
        return 'Our servers are experiencing issues. Please try again in a few moments.'
      case 'client':
        return 'There was a problem with your request. Please try again.'
      default:
        return error.message || 'An unexpected error occurred. Please try again.'
    }
  }, [])

  const getErrorSuggestion = useCallback((errorType: ErrorState['errorType']): string => {
    switch (errorType) {
      case 'network':
        return 'Check your internet connection and refresh the page.'
      case 'timeout':
        return 'The server is taking longer than usual. Please try again.'
      case 'server':
        return 'This appears to be a temporary server issue. Please wait a moment and try again.'
      case 'client':
        return 'Please refresh the page and try your request again.'
      default:
        return 'If this problem persists, please contact our support team.'
    }
  }, [])

  return {
    errorState,
    handleError,
    retryWithBackoff,
    clearError,
    invalidateRelatedQueries,
    getErrorMessage: (error?: Error | null) =>
      getErrorMessage(error || errorState.error, errorState.errorType),
    getErrorSuggestion: () => getErrorSuggestion(errorState.errorType),
    canRetry: errorState.canRetry && errorState.retryCount < maxRetries,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount
  }
}