/**
 * Authentication API - Login Endpoint
 * 
 * @route POST /api/auth/login
 */

import { z } from 'zod'
import { supabase } from '../../../lib/supabase'
import { createSuccessResponse, createErrorResponse } from '../../../utils/api'
import { logger } from '../../../lib/logger'
import { validateEmail } from '../../../utils/validators'
import { AuthError, ValidationError, ErrorCode } from '../../../utils/error'

/**
 * @typedef {Object} LoginResponse
 * @property {boolean} success - Whether the login was successful
 * @property {Object} [user] - User data if login successful
 * @property {string} user.id - User ID
 * @property {string} user.email - User email
 * @property {string} [user.name] - User name if available
 * @property {string} user.role - User role
 * @property {Object} [session] - Session data if login successful
 * @property {string} [message] - Response message
 */

/**
 * @typedef {Object} LoginLogData
 * @property {string} user_id - User ID
 * @property {string} ip_address - Client IP address
 * @property {string} user_agent - Client user agent
 * @property {boolean} success - Whether login succeeded
 * @property {string} [failure_reason] - Reason for failure if login failed
 */

/**
 * Get client IP address from request
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for']
  return (
    (typeof forwarded === 'string' && forwarded.split(',')[0].trim()) ||
    req.connection.remoteAddress ||
    '127.0.0.1'
  )
}

/**
 * Log login attempt
 * @param {string | null} userId - User ID if available
 * @param {boolean} success - Whether login succeeded  
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @param {string} [failureReason] - Reason for failure if login failed
 */
async function logLoginAttempt(userId, success, req, failureReason) {
  try {
    /** @type {LoginLogData} */
    const logData = {
      user_id: userId || 'unknown',
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'] || 'unknown',
      success,
      ...(failureReason && { failure_reason: failureReason })
    }

    // Log to database
    await supabase
      .from('login_logs')
      .insert([logData])
      .catch(error => {
        logger.warn('Failed to log login attempt to database', 'AUTH', { error })
      })

    // Log to application logger
    logger.auth(
      `Login ${success ? 'success' : 'failed'}`,
      userId || undefined,
      success
    )
  } catch (error) {
    logger.error('Failed to log login attempt', 'AUTH', { error })
  }
}

/**
 * Set secure authentication cookies
 * @param {import('next').NextApiResponse} res - Next.js API response
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @param {boolean} [rememberMe=false] - Whether to set long-term cookies
 */
function setAuthCookies(res, accessToken, refreshToken, rememberMe = false) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days or 1 day
  const cookieOptions = `Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`

  res.setHeader('Set-Cookie', [
    `sb-access-token=${accessToken}; ${cookieOptions}`,
    `sb-refresh-token=${refreshToken}; ${cookieOptions}`
  ])
}

/**
 * Main login handler
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @param {import('next').NextApiResponse<LoginResponse>} res - Next.js API response
 */
export default async function handler(req, res) {
  const startTime = Date.now()
  let userId = null

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed', { method: req.method })
    }

    const { email, password, rememberMe = false } = req.body

    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required')
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email address')
    }

    logger.info('Login attempt started', 'AUTH', { email })

    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      let failureReason = 'Authentication failed'
      let errorCode = ErrorCode.INVALID_CREDENTIALS

      // Handle specific authentication errors
      if (error.message.includes('Invalid login credentials')) {
        failureReason = 'Invalid email or password'
      } else if (error.message.includes('Email not confirmed')) {
        failureReason = 'Email not verified'
        errorCode = ErrorCode.ACCOUNT_NOT_VERIFIED
      } else if (error.message.includes('Too many requests')) {
        failureReason = 'Too many login attempts'
        errorCode = ErrorCode.SERVER_ERROR
      }

      await logLoginAttempt(null, false, req, failureReason)
      throw new AuthError(failureReason, errorCode)
    }

    if (!data.user || !data.session) {
      await logLoginAttempt(null, false, req, 'No user data returned')
      throw new AuthError('Authentication failed', ErrorCode.INVALID_CREDENTIALS)
    }

    userId = data.user.id

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      logger.warn('Profile not found for user', 'AUTH', {
        userId,
        error: profileError
      })
    }

    // Set authentication cookies
    setAuthCookies(res, data.session.access_token, data.session.refresh_token, rememberMe)

    // Log successful login
    await logLoginAttempt(userId, true, req)

    const duration = Date.now() - startTime
    logger.performance('Login duration', duration)

    // Prepare user response data
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name || data.user.user_metadata?.name,
      role: profile?.role || 'student',
      ...(profile && { profile })
    }

    logger.info('Login completed successfully', 'AUTH', {
      userId,
      duration,
      rememberMe
    })

    return res.status(200).json(createSuccessResponse({
      user: userData,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        user: userData
      },
      message: 'Login successful'
    }))

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof ValidationError || error instanceof AuthError) {
      logger.error('Login failed', 'AUTH', { error, duration, userId })
      return res.status(error.statusCode).json(error.toJSON())
    }

    // Unexpected error
    logger.error('Unexpected login error', 'AUTH', { error, duration, userId })
    await logLoginAttempt(userId, false, req, 'Internal server error')

    return res.status(500).json(createErrorResponse(
      'An unexpected error occurred during login. Please try again.'
    ))
  }
}