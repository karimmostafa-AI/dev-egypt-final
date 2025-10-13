// Centralized error handling service

export interface ErrorInfo {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  url?: string;
  stack?: string;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export interface ErrorHandlingResult {
  shouldShowError: boolean;
  userMessage: string;
  recoveryActions?: ErrorRecoveryAction[];
  logError: boolean;
}

// Error categories for different handling strategies
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  UNKNOWN = 'unknown'
}

// Error codes for specific error types
export enum ErrorCode {
  // Network errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_SERVER_ERROR = 'NETWORK_SERVER_ERROR',

  // Product errors
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  PRODUCT_OUT_OF_STOCK = 'PRODUCT_OUT_OF_STOCK',
  PRODUCT_INVALID_VARIANT = 'PRODUCT_INVALID_VARIANT',

  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED'
}

export interface IErrorService {
  handleError(error: Error | unknown, context?: Record<string, any>): ErrorHandlingResult;
  createError(code: ErrorCode, message: string, details?: Record<string, any>): Error;
  isRetryableError(error: ErrorInfo): boolean;
  getRecoveryActions(error: ErrorInfo): ErrorRecoveryAction[];
  logError(error: ErrorInfo): void;
}

// Implementation of the error service
export class ErrorService implements IErrorService {
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 100;

  handleError(error: Error | unknown, context?: Record<string, any>): ErrorHandlingResult {
    const errorInfo = this.normalizeError(error, context);

    // Determine error category
    const category = this.categorizeError(errorInfo);

    // Get user-friendly message
    const userMessage = this.getUserMessage(errorInfo, category);

    // Get recovery actions
    const recoveryActions = this.getRecoveryActions(errorInfo);

    // Determine if error should be shown to user
    const shouldShowError = this.shouldShowError(category);

    // Log error if needed
    const logError = this.shouldLogError(category);

    if (logError) {
      this.logError(errorInfo);
    }

    return {
      shouldShowError,
      userMessage,
      recoveryActions,
      logError
    };
  }

  createError(code: ErrorCode, message: string, details?: Record<string, any>): Error {
    const error = new Error(message);
    (error as any).code = code;
    (error as any).details = details;
    return error;
  }

  isRetryableError(error: ErrorInfo): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_TIMEOUT,
      ErrorCode.NETWORK_SERVER_ERROR,
      ErrorCode.NETWORK_OFFLINE
    ];

    return retryableCodes.includes(error.code as ErrorCode);
  }

  getRecoveryActions(error: ErrorInfo): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    switch (error.code) {
      case ErrorCode.NETWORK_OFFLINE:
        actions.push({
          label: 'Retry',
          action: () => window.location.reload(),
          primary: true
        });
        break;

      case ErrorCode.PRODUCT_NOT_FOUND:
        actions.push({
          label: 'Browse Products',
          action: () => { window.location.href = '/catalog'; },
          primary: true
        });
        break;

      case ErrorCode.AUTH_SESSION_EXPIRED:
        actions.push({
          label: 'Login Again',
          action: () => { window.location.href = '/login'; },
          primary: true
        });
        break;

      default:
        if (this.isRetryableError(error)) {
          actions.push({
            label: 'Try Again',
            action: () => window.location.reload(),
            primary: true
          });
        }
        break;
    }

    return actions;
  }

  logError(error: ErrorInfo): void {
    this.errorLog.unshift(error);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // In production, you would send this to an error reporting service
    console.error('Error logged:', error);
  }

  private normalizeError(error: Error | unknown, context?: Record<string, any>): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: 'An unknown error occurred',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    if (error instanceof Error) {
      errorInfo.message = error.message;
      errorInfo.stack = error.stack;

      // Check if error has custom properties
      if ((error as any).code) {
        errorInfo.code = (error as any).code;
      }
      if ((error as any).statusCode) {
        errorInfo.statusCode = (error as any).statusCode;
      }
      if ((error as any).details) {
        errorInfo.details = (error as any).details;
      }
    } else if (typeof error === 'string') {
      errorInfo.message = error;
    } else if (error && typeof error === 'object') {
      errorInfo.message = (error as any).message || 'An unknown error occurred';
      errorInfo.details = error as Record<string, any>;
    }

    // Add context information
    if (context) {
      errorInfo.details = { ...errorInfo.details, context };
    }

    return errorInfo;
  }

  private categorizeError(error: ErrorInfo): ErrorCategory {
    // Network errors
    if (error.statusCode && error.statusCode >= 500) {
      return ErrorCategory.SERVER_ERROR;
    }
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return ErrorCategory.CLIENT_ERROR;
    }

    // Specific error codes
    switch (error.code) {
      case ErrorCode.NETWORK_TIMEOUT:
      case ErrorCode.NETWORK_OFFLINE:
      case ErrorCode.NETWORK_SERVER_ERROR:
        return ErrorCategory.NETWORK;

      case ErrorCode.PRODUCT_NOT_FOUND:
        return ErrorCategory.NOT_FOUND;

      case ErrorCode.AUTH_INVALID_CREDENTIALS:
      case ErrorCode.AUTH_SESSION_EXPIRED:
        return ErrorCategory.AUTHENTICATION;

      case ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS:
        return ErrorCategory.AUTHORIZATION;

      case ErrorCode.VALIDATION_REQUIRED_FIELD:
      case ErrorCode.VALIDATION_INVALID_FORMAT:
      case ErrorCode.VALIDATION_OUT_OF_RANGE:
        return ErrorCategory.VALIDATION;

      default:
        return ErrorCategory.UNKNOWN;
    }
  }

  private getUserMessage(error: ErrorInfo, category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.NETWORK:
        return 'Connection problem. Please check your internet connection and try again.';

      case ErrorCategory.NOT_FOUND:
        return 'The requested item could not be found.';

      case ErrorCategory.AUTHENTICATION:
        return 'Please log in to continue.';

      case ErrorCategory.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';

      case ErrorCategory.VALIDATION:
        return error.message || 'Please check your input and try again.';

      case ErrorCategory.SERVER_ERROR:
        return 'Server error. Please try again later.';

      case ErrorCategory.CLIENT_ERROR:
        return 'Request error. Please try again.';

      default:
        return 'Something went wrong. Please try again.';
    }
  }

  private shouldShowError(category: ErrorCategory): boolean {
    // Show all errors except some specific ones that should be handled silently
    const silentErrors = [
      ErrorCategory.UNKNOWN // You might want to handle unknown errors silently in production
    ];

    return !silentErrors.includes(category);
  }

  private shouldLogError(category: ErrorCategory): boolean {
    // Log all errors for debugging and monitoring
    return true;
  }

  // Utility method to get recent errors (for debugging)
  getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errorLog.slice(0, count);
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Factory function for creating error service
export const createErrorService = (): IErrorService => {
  return new ErrorService();
};