/**
 * Error Handling Utilities
 */

import React from 'react'

export class ValidationError extends Error {
  constructor(message, context) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.statusCode = 400;
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed', context) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'AUTHENTICATION_ERROR';
    this.statusCode = 401;
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Access denied', context) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'AUTHORIZATION_ERROR';
    this.statusCode = 403;
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource', context) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND_ERROR';
    this.statusCode = 404;
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource conflict', context) {
    super(message);
    this.name = 'ConflictError';
    this.code = 'CONFLICT_ERROR';
    this.statusCode = 409;
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Too many requests', context) {
    super(message);
    this.name = 'RateLimitError';
    this.code = 'RATE_LIMIT_ERROR';
    this.statusCode = 429;
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error occurred', context) {
    super(message);
    this.name = 'NetworkError';
    this.code = 'NETWORK_ERROR';
    this.statusCode = 500;
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class PaymentError extends Error {
  constructor(message = 'Payment processing failed', context) {
    super(message);
    this.name = 'PaymentError';
    this.code = 'PAYMENT_ERROR';
    this.statusCode = 402;
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class CourseAccessError extends Error {
  constructor(message = 'Course access denied', context) {
    super(message);
    this.name = 'CourseAccessError';
    this.code = 'COURSE_ACCESS_ERROR';
    this.statusCode = 403;
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class Logger {
  static #instance;
  #logs = [];
  #maxLogs = 1000;
  #enableConsoleLogging = process.env.NODE_ENV !== 'production';
  #enableRemoteLogging = false;

  constructor() {}

  static getInstance() {
    if (!Logger.#instance) {
      Logger.#instance = new Logger();
    }
    return Logger.#instance;
  }

  #createLogEntry(level, message, context, error) {
    return { level, message, timestamp: new Date().toISOString(), context, error };
  }

  #addLog(entry) {
    this.#logs.push(entry);
    if (this.#logs.length > this.#maxLogs) this.#logs = this.#logs.slice(-this.#maxLogs);
    if (this.#enableConsoleLogging) this.#logToConsole(entry);
    if (this.#enableRemoteLogging) this.#logToRemote(entry);
  }

  #logToConsole(entry) {
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

  async #logToRemote(entry) {
    try {
      // Implement remote logging
    } catch (error) {
      console.error('Failed to send log to remote service:', error);
    }
  }

  info(message, context) { this.#addLog(this.#createLogEntry('info', message, context)); }
  warn(message, context) { this.#addLog(this.#createLogEntry('warn', message, context)); }
  error(message, error, context) { this.#addLog(this.#createLogEntry('error', message, context, error)); }
  debug(message, context) { this.#addLog(this.#createLogEntry('debug', message, context)); }

  getLogs(level, limit = 100) {
    let filteredLogs = this.#logs;
    if (level) filteredLogs = this.#logs.filter(log => log.level === level);
    return filteredLogs.slice(-limit).reverse();
  }

  clearLogs() { this.#logs = []; }
  setRemoteLogging(enabled) { this.#enableRemoteLogging = enabled; }
}

export class ErrorHandler {
  static #instance;
  #logger;
  #errorReports = [];
  #maxReports = 100;

  constructor() { this.#logger = Logger.getInstance(); }
  static getInstance() { if (!ErrorHandler.#instance) ErrorHandler.#instance = new ErrorHandler(); return ErrorHandler.#instance; }

  handleError(error, context) {
    const appError = this.#normalizeError(error);
    const report = this.#createErrorReport(appError, context);
    this.#errorReports.push(report);
    if (this.#errorReports.length > this.#maxReports) this.#errorReports = this.#errorReports.slice(-this.#maxReports);
    this.#logger.error(appError.message, appError, context);
    if (process.env.NODE_ENV === 'production') this.#reportToExternalService(report);
    return appError;
  }

  #normalizeError(error) {
    if (this.#isAppError(error)) return error;
    error.timestamp = new Date().toISOString();
    error.isOperational = false;
    if (error.name === 'TypeError') { error.code = 'TYPE_ERROR'; error.statusCode = 500; }
    else if (error.name === 'ReferenceError') { error.code = 'REFERENCE_ERROR'; error.statusCode = 500; }
    else if (error.message.includes('fetch')) { error.code = 'NETWORK_ERROR'; error.statusCode = 500; error.isOperational = true; }
    return error;
  }

  #isAppError(error) { return 'code' in error && 'timestamp' in error; }

  #createErrorReport(error, context) {
    return {
      error,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: context?.userId,
      timestamp: error.timestamp || new Date().toISOString(),
      stackTrace: error.stack,
      context
    };
  }

  async #reportToExternalService(report) { try { } catch (error) { console.error('Failed to report error to external service:', error); } }
  getErrorReports(limit = 50) { return this.#errorReports.slice(-limit).reverse(); }
  clearErrorReports() { this.#errorReports = []; }
}

export const getUserFriendlyMessage = (error) => {
  const messages = {
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

  const msg = error.code ? messages[error.code] : undefined;
  if (msg) return msg;

  if (error.statusCode) {
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return 'There was a problem with your request. Please try again.';
    } else if (error.statusCode >= 500) {
      return 'A server error occurred. We\'re working to fix this.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

export const setupGlobalErrorHandlers = () => {
  const errorHandler = ErrorHandler.getInstance();
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      errorHandler.handleError(error, { component: 'global', action: 'unhandledRejection' });
    });
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message);
      errorHandler.handleError(error, {
        component: 'global',
        action: 'javascriptError',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }
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

export const createErrorBoundary = (fallbackComponent) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.handleError(error, {
        component: 'ErrorBoundary',
        action: 'componentError',
        additionalData: errorInfo
      });
    }

    render() {
      if (this.state.hasError) {
        if (fallbackComponent) {
          const FallbackComponent = fallbackComponent;
          return <FallbackComponent error={this.state.error} />;
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

export const errorUtils = {
  asyncHandler: function(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        ErrorHandler.getInstance().handleError(error);
        return null;
      }
    };
  },
  retry: async function(fn, options = {}) {
    const { retries = 3, delay = 1000, backoff = 2, onRetry } = options;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === retries) throw error;
        if (onRetry) onRetry(attempt, error);
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    throw new Error('Retry failed');
  },
  isRetryable: function(error) {
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) return false;
    return error.code === 'NETWORK_ERROR' || (typeof error.statusCode === 'number' && error.statusCode >= 500);
  },
};

export const logger = Logger.getInstance();
export const errorHandler = ErrorHandler.getInstance();
export const handleError = (error, context) => {
  return ErrorHandler.getInstance().handleError(error, context);
};

if (typeof window !== 'undefined' || typeof process !== 'undefined') {
  setupGlobalErrorHandlers();
}