/**
 * Authentication API - Login Endpoint
 *
 * Handles user login with email/password authentication.
 * Provides secure session management and comprehensive logging.
 *
 * @route POST /api/auth/login
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabase } from '../../../lib/supabase'
import { withMiddleware, createSuccessResponse, createErrorResponse } from '../../../lib/api-utils'
import { logger } from '../../../lib/logger'
import { loginSchema, type LoginInput } from '../../../lib/validations'
import { AuthError, ValidationError, ErrorCode } from '../../../lib/errors'

// Response types
interface LoginResponse {
  success: boolean
  user?: {
    id: string
    email: string
    name?: string
    role: string
  }
  session?: any
  message?: string
}

interface LoginLogData {
  user_id: string
  ip_address: string
  user_agent: string
  success: boolean
  failure_reason?: string
}

/**
 * Get client IP address from request
 */
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const realIP = req.headers['x-real-ip']

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }

  if (typeof realIP === 'string') {
    return realIP
  }

  return req.socket.remoteAddress || '127.0.0.1'
}

/**
 * Log login attempt
 */
async function logLoginAttempt(
  userId: string | null,
  success: boolean,
  req: NextApiRequest,
  failureReason?: string
): Promise<void> {
  try {
    const logData: Partial<LoginLogData> = {
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'] || 'unknown',
      success,
    }

    if (userId) {
      logData.user_id = userId
    }

    if (failureReason) {
      logData.failure_reason = failureReason
    }

    // Log to database (if login_logs table exists)
    if (userId) {
      await supabase
        .from('login_logs')
        .insert([logData as LoginLogData])
        .catch(error => {
          logger.warn('Failed to log login attempt to database', 'AUTH', { error })
        })
    }

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
 */
function setAuthCookies(
  res: NextApiResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean = false
): void {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days or 1 day
  const cookieOptions = `Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`

  res.setHeader('Set-Cookie', [
    `sb-access-token=${accessToken}; ${cookieOptions}`,
    `sb-refresh-token=${refreshToken}; ${cookieOptions}`
  ])
}

/**
 * Main login handler
 */
async function loginHandler(req: NextApiRequest, res: NextApiResponse<LoginResponse>) {
  const startTime = Date.now()
  let userId: string | null = null

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed', { method: req.method })
    }

    // Parse and validate request body
    const validatedData: LoginInput = loginSchema.parse(req.body)
    const { email, password, rememberMe = false } = validatedData

    logger.info('Login attempt started', 'AUTH', { email })

    // Attempt authentication with Supabase
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
        errorCode = ErrorCode.INVALID_CREDENTIALS
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
      email: data.user.email!,
      name: profile?.name || data.user.user_metadata?.name,
      role: profile?.role || 'student',
      ...(profile && { profile })
    }

    logger.info('Login completed successfully', 'AUTH', {
      userId,
      duration,
      rememberMe
    })

    return res.status(200).json({
      success: true,
      user: userData,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        user: userData
      },
      message: 'Login successful'
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        { validationErrors: error.errors }
      )

      await logLoginAttempt(userId, false, req, 'Validation error')
      logger.error('Login validation failed', 'AUTH', { error: validationError, duration })

      return res.status(400).json(validationError.toJSON() as LoginResponse)
    }

    if (error instanceof AuthError || error instanceof ValidationError) {
      logger.error('Login failed', 'AUTH', { error, duration, userId })
      return res.status(error.statusCode).json(error.toJSON() as LoginResponse)
    }

    // Unexpected error
    logger.error('Unexpected login error', 'AUTH', { error, duration, userId })
    await logLoginAttempt(userId, false, req, 'Internal server error')

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login. Please try again.'
    })
  }
}

export default loginHandler