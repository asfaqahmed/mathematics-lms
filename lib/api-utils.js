/**
 * API Utilities Module
 * 
 * Common utilities for API route handlers including middleware,
 * request/response helpers, and security functions.
 */

import { ValidationError } from './errors'

/**
 * Get client IP address from request
 * @param {import('next').NextApiRequest} req 
 * @returns {string}
 */
export function getUserIP(req) {
  const forwarded = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]
  }
  
  if (typeof realIp === 'string') {
    return realIp
  }
  
  return req.socket.remoteAddress || 'unknown'
}

/**
 * Sanitize user input to prevent XSS
 * @param {string | number} input 
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (typeof input === 'number') {
    return input.toString()
  }
  
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Common response structure for successful API calls
 * @param {Object} data - Response data
 * @param {string} [message] - Success message
 * @returns {Object}
 */
export function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data
  }
}

/**
 * Common error response structure
 * @param {Error} error - Error object
 * @param {string} [message] - Error message override
 * @returns {Object}
 */
export function createErrorResponse(error, message) {
  return {
    success: false,
    message: message || error.message,
    error: error instanceof ValidationError ? error.details : undefined
  }
}

/**
 * API route middleware wrapper
 * @param {Function} handler - Route handler function 
 * @param {Object} [options] - Middleware options
 * @returns {Function}
 */
export function withMiddleware(handler, options = {}) {
  return async (req, res) => {
    try {
      // Add common security headers
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('X-XSS-Protection', '1; mode=block')
      
      // Rate limiting could be added here
      
      return await handler(req, res)
    } catch (error) {
      console.error('API Error:', error)
      
      const statusCode = error.statusCode || 500
      return res.status(statusCode).json(createErrorResponse(error))
    }
  }
}

// Export constants
export const STRICT_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}