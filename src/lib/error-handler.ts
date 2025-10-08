// Error Handling and Logging System
// Provides comprehensive error handling and logging for the e-commerce application

export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  stack?: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  context?: Record<string, any>;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  category: string;
  data?: any;
  error?: AppError;
  requestId?: string;
  userId?: string;
  context?: Record<string, any>;
}

export class ErrorHandler {
  private static logs: LogEntry[] = [];
  private static maxLogs: number = 1000;

  // Create standardized error
  static createError(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any,
    context?: Record<string, any>
  ): AppError {
    const error: AppError = {
      code,
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
      context
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      error.stack = new Error().stack;
    }

    return error;
  }

  // Handle API errors
  static handleAPIError(error: any, requestId?: string, userId?: string): AppError {
    console.error('API Error:', error);

    // Handle known error types
    if (error.code === 'USER_NOT_FOUND') {
      return this.createError(
        'USER_NOT_FOUND',
        'User not found',
        404,
        error,
        { requestId, userId }
      );
    }

    if (error.code === 'VALIDATION_ERROR') {
      return this.createError(
        'VALIDATION_ERROR',
        'Validation failed',
        400,
        error.details,
        { requestId, userId }
      );
    }

    if (error.code === 'AUTHENTICATION_ERROR') {
      return this.createError(
        'AUTHENTICATION_ERROR',
        'Authentication failed',
        401,
        error,
        { requestId, userId }
      );
    }

    if (error.code === 'AUTHORIZATION_ERROR') {
      return this.createError(
        'AUTHORIZATION_ERROR',
        'Access denied',
        403,
        error,
        { requestId, userId }
      );
    }

    if (error.code === 'RATE_LIMIT_ERROR') {
      return this.createError(
        'RATE_LIMIT_ERROR',
        'Too many requests',
        429,
        error,
        { requestId, userId }
      );
    }

    // Handle Appwrite errors
    if (error.code && error.code.startsWith('APPWRITE_')) {
      return this.createError(
        error.code,
        error.message || 'Appwrite service error',
        this.mapAppwriteErrorCode(error.code),
        error,
        { requestId, userId }
      );
    }

    // Handle database errors
    if (error.code === 'SQLITE_CONSTRAINT') {
      return this.createError(
        'DATABASE_CONSTRAINT_ERROR',
        'Database constraint violation',
        400,
        error,
        { requestId, userId }
      );
    }

    // Default error
    return this.createError(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined,
      { requestId, userId }
    );
  }

  // Map Appwrite error codes to HTTP status codes
  private static mapAppwriteErrorCode(appwriteCode: string): number {
    const errorMap: Record<string, number> = {
      'USER_NOT_FOUND': 404,
      'USER_ALREADY_EXISTS': 409,
      'USER_INVALID_CREDENTIALS': 401,
      'USER_EMAIL_NOT_VERIFIED': 401,
      'DOCUMENT_NOT_FOUND': 404,
      'DOCUMENT_ALREADY_EXISTS': 409,
      'COLLECTION_NOT_FOUND': 404,
      'STORAGE_FILE_NOT_FOUND': 404,
      'UNAUTHORIZED': 401,
      'FORBIDDEN': 403,
      'RATE_LIMIT_EXCEEDED': 429
    };

    return errorMap[appwriteCode] || 500;
  }

  // Log error
  static logError(
    error: AppError,
    category: string = 'general',
    additionalContext?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      level: 'error',
      message: error.message,
      timestamp: error.timestamp,
      category,
      error,
      requestId: error.requestId,
      userId: error.userId,
      context: { ...error.context, ...additionalContext }
    };

    this.addLog(logEntry);

    // In production, you would send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    }
  }

  // Log info message
  static logInfo(
    message: string,
    category: string = 'general',
    data?: any,
    context?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      category,
      data,
      context
    };

    this.addLog(logEntry);
  }

  // Log warning
  static logWarning(
    message: string,
    category: string = 'general',
    data?: any,
    context?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      category,
      data,
      context
    };

    this.addLog(logEntry);
  }

  // Add log to internal storage
  private static addLog(logEntry: LogEntry): void {
    this.logs.push(logEntry);

    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = logEntry.level === 'error' ? 'error' : logEntry.level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${logEntry.category}] ${logEntry.message}`, logEntry.data || '');
    }
  }

  // Send log to external logging service (placeholder)
  private static sendToLoggingService(logEntry: LogEntry): void {
    // In a real implementation, you would send this to services like:
    // - DataDog
    // - New Relic
    // - CloudWatch
    // - Elasticsearch
    // - etc.

    try {
      // Example: Send to console for now
      console.log('External log:', JSON.stringify(logEntry));
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  // Get recent logs
  static getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  // Get logs by category
  static getLogsByCategory(category: string, limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.category === category)
      .slice(-limit);
  }

  // Get logs by level
  static getLogsByLevel(level: LogEntry['level'], limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-limit);
  }

  // Clear logs
  static clearLogs(): void {
    this.logs = [];
  }

  // Export logs
  static exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'data'];
      const rows = [headers.join(',')];

      this.logs.forEach(log => {
        rows.push([
          log.timestamp,
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          `"${JSON.stringify(log.data || '').replace(/"/g, '""')}"`
        ].join(','));
      });

      return rows.join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }
}

// Error boundary for React components
export class ErrorBoundary {
  private static errors: AppError[] = [];

  static captureError(error: Error, errorInfo?: any, context?: Record<string, any>): AppError {
    const appError = ErrorHandler.createError(
      'REACT_ERROR',
      error.message,
      500,
      { errorInfo, originalError: error },
      context
    );

    this.errors.push(appError);
    ErrorHandler.logError(appError, 'react', { errorInfo });

    return appError;
  }

  static getErrors(): AppError[] {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
  }
}

// Database operation wrapper with error handling
export class DatabaseErrorHandler {
  static async wrapOperation<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const appError = ErrorHandler.handleAPIError(error, context?.requestId, context?.userId);

      if (context) {
        appError.context = { ...appError.context, ...context };
      }

      ErrorHandler.logError(appError, 'database', { operation: operation.toString() });

      return { success: false, error: appError };
    }
  }
}

// API response wrapper with error handling
export class APIResponseHandler {
  static success<T>(data: T, message?: string): { success: true; data: T; message?: string } {
    return {
      success: true,
      data,
      ...(message && { message })
    };
  }

  static error(error: AppError): { success: false; error: AppError } {
    return {
      success: false,
      error
    };
  }

  static handle<T>(
    result: { success: boolean; data?: T; error?: AppError },
    requestId?: string,
    userId?: string
  ): { statusCode: number; body: any } {
    if (result.success) {
      return {
        statusCode: 200,
        body: {
          success: true,
          data: result.data,
          requestId,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      const error = result.error!;

      // Log the error
      ErrorHandler.logError(error, 'api', { requestId, userId });

      return {
        statusCode: error.statusCode,
        body: {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && { details: error.details })
          },
          requestId,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Array<{
    operation: string;
    duration: number;
    timestamp: string;
    success: boolean;
    metadata?: Record<string, any>;
  }> = [];

  static startTimer(operation: string, metadata?: Record<string, any>): () => void {
    const startTime = performance.now();
    const startTimestamp = new Date().toISOString();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.metrics.push({
        operation,
        duration,
        timestamp: startTimestamp,
        success: true,
        metadata
      });

      // Log slow operations
      if (duration > 1000) {
        ErrorHandler.logWarning(
          `Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`,
          'performance',
          { operation, duration, metadata }
        );
      }

      // Keep only recent metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-500);
      }
    };
  }

  static recordError(operation: string, error: Error, metadata?: Record<string, any>): void {
    this.metrics.push({
      operation,
      duration: 0,
      timestamp: new Date().toISOString(),
      success: false,
      metadata: { ...metadata, error: error.message }
    });
  }

  static getMetrics(operation?: string): typeof PerformanceMonitor.metrics {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return this.metrics;
  }

  static getAverageDuration(operation: string): number {
    const metrics = this.getMetrics(operation).filter(m => m.success);

    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  static getErrorRate(operation?: string): number {
    const metrics = this.getMetrics(operation);
    const errors = metrics.filter(m => !m.success).length;

    return metrics.length > 0 ? (errors / metrics.length) * 100 : 0;
  }
}

// Global error handler for uncaught errors
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught JavaScript errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      const error = ErrorHandler.createError(
        'UNCAUGHT_ERROR',
        event.message,
        500,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        }
      );

      ErrorHandler.logError(error, 'client');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = ErrorHandler.createError(
        'UNHANDLED_PROMISE_REJECTION',
        'Unhandled promise rejection',
        500,
        { reason: event.reason }
      );

      ErrorHandler.logError(error, 'client');
    });
  }

  // Handle Node.js uncaught exceptions
  if (typeof process !== 'undefined') {
    process.on('uncaughtException', (error) => {
      const appError = ErrorHandler.createError(
        'UNCAUGHT_EXCEPTION',
        'Uncaught exception',
        500,
        { error: error.message, stack: error.stack }
      );

      ErrorHandler.logError(appError, 'server');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      const appError = ErrorHandler.createError(
        'UNHANDLED_REJECTION',
        'Unhandled promise rejection',
        500,
        { reason: reason }
      );

      ErrorHandler.logError(appError, 'server');
    });
  }
}

// Export error handler instance
export const errorHandler = ErrorHandler;