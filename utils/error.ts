/**
 * Error Handling Utilities
 * Provides comprehensive error handling, logging, and user-friendly error messages
 */

import type { LogLevel, ErrorContext } from './types';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: ErrorContext;
  timestamp?: string;
  userId?: string;
  isOperational?: boolean; // Distinguishes operational errors from programming errors
}

export interface ErrorReport {
  error: AppError;
  userAgent?: string;
  url?: string;
  userId?: string;
  timestamp: string;
  stackTrace?: string;
  context?: ErrorContext;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

/**
 * Custom error classes for different error types
 */
export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;
  isOperational = true;

  constructor(message: string, context?: ErrorContext) {
    super(message);
    this.name = 'ValidationError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class AuthenticationError extends Error implements AppError {
  code = 'AUTHENTICATION_ERROR';
  statusCode = 401;
  isOperational = true;

  constructor(message: string = 'Authentication failed', context?: ErrorContext) {
    super(message);
    this.name = 'AuthenticationError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class AuthorizationError extends Error implements AppError {
  code = 'AUTHORIZATION_ERROR';
  statusCode = 403;
  isOperational = true;

  constructor(message: string = 'Access denied', context?: ErrorContext) {
    super(message);
    this.name = 'AuthorizationError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class NotFoundError extends Error implements AppError {
  code = 'NOT_FOUND_ERROR';
  statusCode = 404;
  isOperational = true;

  constructor(resource: string = 'Resource', context?: ErrorContext) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class ConflictError extends Error implements AppError {
  code = 'CONFLICT_ERROR';
  statusCode = 409;
  isOperational = true;

  constructor(message: string = 'Resource conflict', context?: ErrorContext) {
    super(message);
    this.name = 'ConflictError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class RateLimitError extends Error implements AppError {
  code = 'RATE_LIMIT_ERROR';
  statusCode = 429;
  isOperational = true;

  constructor(message: string = 'Too many requests', context?: ErrorContext) {
    super(message);
    this.name = 'RateLimitError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class NetworkError extends Error implements AppError {
  code = 'NETWORK_ERROR';
  statusCode = 500;
  isOperational = true;

  constructor(message: string = 'Network error occurred', context?: ErrorContext) {
    super(message);
    this.name = 'NetworkError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class PaymentError extends Error implements AppError {
  code = 'PAYMENT_ERROR';
  statusCode = 402;
  isOperational = true;

  constructor(message: string = 'Payment processing failed', context?: ErrorContext) {
    super(message);
    this.name = 'PaymentError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class CourseAccessError extends Error implements AppError {
  code = 'COURSE_ACCESS_ERROR';
  statusCode = 403;
  isOperational = true;

  constructor(message: string = 'Course access denied', context?: ErrorContext) {
    super(message);
    this.name = 'CourseAccessError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Logger class for centralized logging
 */
export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enableConsoleLogging = process.env.NODE_ENV !== 'production';
  private enableRemoteLogging = false; // Can be enabled in production

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging
    if (this.enableConsoleLogging) {
      this.logToConsole(entry);
    }

    // Remote logging (implement based on your logging service)
    if (this.enableRemoteLogging) {
      this.logToRemote(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const { level, message, timestamp, context, error } = entry;
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    switch (level) {
      case 'error':
        console.error(logMessage, context, error);
        break;
      case 'warn':
        console.warn(logMessage, context);
        break;
      case 'info':
        console.info(logMessage, context);
        break;
      case 'debug':
        console.debug(logMessage, context);
        break;
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    try {
      // Implement remote logging (e.g., send to logging service)
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      console.error('Failed to send log to remote service:', error);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('info', message, context);
    this.addLog(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', message, context);
    this.addLog(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry('error', message, context, error);
    this.addLog(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('debug', message, context);
    this.addLog(entry);
  }

  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    return filteredLogs.slice(-limit).reverse();
  }

  clearLogs(): void {
    this.logs = [];
  }

  setRemoteLogging(enabled: boolean): void {
    this.enableRemoteLogging = enabled;
  }
}

/**
 * Error handler instance
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: Logger;
  private errorReports: ErrorReport[] = [];
  private maxReports = 100;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and process errors
   */
  handleError(error: Error | AppError, context?: ErrorContext): AppError {
    const appError = this.normalizeError(error);
    const report = this.createErrorReport(appError, context);

    // Store error report
    this.errorReports.push(report);
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports);
    }

    // Log the error
    this.logger.error(appError.message, appError, context);

    // Report to external services in production
    if (process.env.NODE_ENV === 'production') {
      this.reportToExternalService(report);
    }

    return appError;
  }

  /**
   * Normalize different error types to AppError
   */
  private normalizeError(error: Error | AppError): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    // Convert generic errors to AppError
    const appError = error as AppError;
    appError.timestamp = new Date().toISOString();
    appError.isOperational = false; // Programming error by default

    // Categorize common error types
    if (error.name === 'TypeError') {
      appError.code = 'TYPE_ERROR';
      appError.statusCode = 500;
    } else if (error.name === 'ReferenceError') {
      appError.code = 'REFERENCE_ERROR';
      appError.statusCode = 500;
    } else if (error.message.includes('fetch')) {
      appError.code = 'NETWORK_ERROR';
      appError.statusCode = 500;
      appError.isOperational = true;
    }

    return appError;
  }

  private isAppError(error: Error): error is AppError {
    return 'code' in error && 'timestamp' in error;
  }

  /**
   * Create error report
   */
  private createErrorReport(error: AppError, context?: ErrorContext): ErrorReport {
    return {
      error,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: context?.userId,
      timestamp: error.timestamp || new Date().toISOString(),
      stackTrace: error.stack,
      context,
    };
  }

  /**
   * Report error to external monitoring service
   */
  private async reportToExternalService(report: ErrorReport): Promise<void> {
    try {
      // Implement external error reporting (e.g., Sentry, Bugsnag)
      // await errorReportingService.report(report);
    } catch (error) {
      console.error('Failed to report error to external service:', error);
    }
  }

  /**
   * Get error reports
   */
  getErrorReports(limit = 50): ErrorReport[] {
    return this.errorReports.slice(-limit).reverse();
  }

  /**
   * Clear error reports
   */
  clearErrorReports(): void {
    this.errorReports = [];
  }
}

/**
 * Get user-friendly error messages
 */
export const getUserFriendlyMessage = (error: Error | AppError): string => {
  const appError = error as AppError;

  // Custom messages for different error codes
  const messages: Record<string, string> = {
    VALIDATION_ERROR: 'Please check your input and try again.',
    AUTHENTICATION_ERROR: 'Please log in to continue.',
    AUTHORIZATION_ERROR: 'You don\'t have permission to perform this action.',
    NOT_FOUND_ERROR: 'The requested item could not be found.',
    CONFLICT_ERROR: 'This action conflicts with existing data.',
    RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
    NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
    PAYMENT_ERROR: 'Payment processing failed. Please try again or contact support.',
    COURSE_ACCESS_ERROR: 'You need to purchase this course to access its content.',
  };

  if (appError.code && messages[appError.code]) {
    return messages[appError.code];
  }

  // Fallback to generic messages based on status code
  if (appError.statusCode) {
    if (appError.statusCode >= 400 && appError.statusCode < 500) {
      return 'There was a problem with your request. Please try again.';
    } else if (appError.statusCode >= 500) {
      return 'A server error occurred. We\'re working to fix this.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Global error handlers
 */
export const setupGlobalErrorHandlers = (): void => {
  const errorHandler = ErrorHandler.getInstance();

  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      errorHandler.handleError(error, { component: 'global', action: 'unhandledRejection' });
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message);
      errorHandler.handleError(error, {
        component: 'global',
        action: 'javascriptError',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
  }

  // Handle Node.js unhandled exceptions (for server-side)
  if (typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      errorHandler.handleError(error, { component: 'server', action: 'unhandledRejection' });
    });

    process.on('uncaughtException', (error) => {
      errorHandler.handleError(error, { component: 'server', action: 'uncaughtException' });
    });
  }
};

/**
 * Error boundary helper for React components
 */
export const createErrorBoundary = (fallbackComponent?: React.ComponentType<{ error: Error }>) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.handleError(error, {
        component: 'ErrorBoundary',
        action: 'componentError',
        additionalData: errorInfo,
      });
    }

    render() {
      if (this.state.hasError) {
        if (fallbackComponent) {
          const FallbackComponent = fallbackComponent;
          return <FallbackComponent error={this.state.error!} />;
        }

        return (
          <div className="error-boundary">
            <h2>Something went wrong.</h2>
            <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
          </div>
        );
      }

      return this.props.children;
    }
  };
};

/**
 * Utility functions
 */
export const errorUtils = {
  /**
   * Wrap async functions to handle errors automatically
   */
  asyncHandler: <T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorHandler.getInstance().handleError(error as Error);
      return null;
    }
  },

  /**
   * Retry function with exponential backoff
   */
  retry: async <T>(
    fn: () => Promise<T>,
    options: {
      retries?: number;
      delay?: number;
      backoff?: number;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> => {
    const { retries = 3, delay = 1000, backoff = 2, onRetry } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }

        if (onRetry) {
          onRetry(attempt, error as Error);
        }

        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error('Retry failed'); // This should never be reached
  },

  /**
   * Check if error is retryable
   */
  isRetryable: (error: Error | AppError): boolean => {
    const appError = error as AppError;

    // Don't retry client errors (400-499)
    if (appError.statusCode && appError.statusCode >= 400 && appError.statusCode < 500) {
      return false;
    }

    // Retry network errors and server errors
    return appError.code === 'NETWORK_ERROR' ||
           (appError.statusCode && appError.statusCode >= 500);
  },
};

// Export singleton instances
export const logger = Logger.getInstance();
export const errorHandler = ErrorHandler.getInstance();

// Setup global error handlers
if (typeof window !== 'undefined' || typeof process !== 'undefined') {
  setupGlobalErrorHandlers();
}