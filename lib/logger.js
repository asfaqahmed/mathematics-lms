/**
 * Application logging module
 * 
 * Provides structured logging with support for different log levels,
 * performance tracking, and error reporting.
 */

const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
}

/**
 * Format a log message with metadata
 * @param {string} message - Log message
 * @param {string} level - Log level
 * @param {string} category - Log category
 * @param {Object} [metadata] - Additional log metadata
 * @returns {Object} Formatted log object
 */
function formatLog(message, level, category, metadata = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    ...metadata,
    environment: process.env.NODE_ENV || 'development'
  }
}

/**
 * Log output handling based on environment
 * @param {Object} logObject - Formatted log object
 */
function outputLog(logObject) {
  if (process.env.NODE_ENV === 'production') {
    // In production, output JSON for log aggregation
    console.log(JSON.stringify(logObject))
  } else {
    // In development, format for readability
    const { timestamp, level, category, message, ...metadata } = logObject
    console.log(
      `[${timestamp}] ${level.toUpperCase()} [${category}] ${message}`,
      Object.keys(metadata).length ? metadata : ''
    )
  }
}

/**
 * Core logging function
 * @param {string} message - Log message
 * @param {string} level - Log level
 * @param {string} category - Log category
 * @param {Object} [metadata] - Additional metadata
 */
function log(message, level, category, metadata = {}) {
  const logObject = formatLog(message, level, category, metadata)
  outputLog(logObject)

  // Alert on fatal errors
  if (level === LOG_LEVELS.FATAL && process.env.NODE_ENV === 'production') {
    // TODO: Implement error alerting service integration
  }
}

const logger = {
  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {string} category - Log category
   * @param {Object} [metadata] - Additional metadata
   */
  debug: (message, category, metadata) => 
    log(message, LOG_LEVELS.DEBUG, category, metadata),

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {string} category - Log category
   * @param {Object} [metadata] - Additional metadata
   */
  info: (message, category, metadata) => 
    log(message, LOG_LEVELS.INFO, category, metadata),

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {string} category - Log category
   * @param {Object} [metadata] - Additional metadata
   */
  warn: (message, category, metadata) => 
    log(message, LOG_LEVELS.WARN, category, metadata),

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {string} category - Log category
   * @param {Object} [metadata] - Additional metadata
   */
  error: (message, category, metadata) => 
    log(message, LOG_LEVELS.ERROR, category, metadata),

  /**
   * Log fatal error message
   * @param {string} message - Fatal error message
   * @param {string} category - Log category
   * @param {Object} [metadata] - Additional metadata
   */
  fatal: (message, category, metadata) => 
    log(message, LOG_LEVELS.FATAL, category, metadata),

  /**
   * Log performance metric
   * @param {string} label - Performance metric label
   * @param {number} duration - Duration in milliseconds
   * @param {Object} [metadata] - Additional metadata
   */
  performance: (label, duration, metadata = {}) => {
    log(
      `Performance: ${label} - ${duration}ms`,
      LOG_LEVELS.INFO,
      'PERFORMANCE',
      { duration, ...metadata }
    )
  }
}

export { logger }