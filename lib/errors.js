/**
 * Application Error Types
 * 
 * Custom error classes for different types of application errors
 * with proper error codes and status codes.
 */

/**
 * @typedef {Object} ErrorDetails
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {Object} [details] - Additional error details
 */

/**
 * Error codes enum
 * @enum {string}
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
}

/**
 * Base error class for application errors
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} statusCode - HTTP status code
   * @param {Object} [details] - Additional error details
   */
  constructor(message, code, statusCode, details = {}) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Convert error to JSON response format
   * @returns {ErrorDetails}
   */
  toJSON() {
    return {
      success: false,
      code: this.code,
      message: this.message,
      details: this.details
    }
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Validation error details
   */
  constructor(message, details = {}) {
    super(
      message,
      ErrorCode.VALIDATION_ERROR,
      400,
      details
    )
  }
}

/**
 * Payment processing error
 */
export class PaymentError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Payment error details
   */
  constructor(message, details = {}) {
    super(
      message,
      ErrorCode.PAYMENT_ERROR,
      400,
      details
    )
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Not found error details
   */
  constructor(message, details = {}) {
    super(
      message,
      ErrorCode.NOT_FOUND,
      404,
      details
    )
  }
}

/**
 * Create a not found error for a specific resource
 * @param {string} resourceType - Type of resource that wasn't found
 * @param {Object} [details] - Additional error details
 * @returns {NotFoundError}
 */
export function createNotFoundError(resourceType, details = {}) {
  return new NotFoundError(
    `${resourceType} not found`,
    {
      resourceType,
      ...details
    }
  )
}

/**
 * Authorization error
 */
export class UnauthorizedError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Unauthorized error details
   */
  constructor(message = 'Unauthorized', details = {}) {
    super(
      message,
      ErrorCode.UNAUTHORIZED,
      401,
      details
    )
  }
}

/**
 * Permission error
 */
export class ForbiddenError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Forbidden error details
   */
  constructor(message = 'Forbidden', details = {}) {
    super(
      message,
      ErrorCode.FORBIDDEN,
      403,
      details
    )
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Rate limit error details
   */
  constructor(message = 'Rate limit exceeded', details = {}) {
    super(
      message,
      ErrorCode.RATE_LIMIT,
      429,
      details
    )
  }
}

export { AppError }