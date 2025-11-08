/**
 * Authentication API - Logout Endpoint
 *
 * Handles user logout with secure session cleanup and comprehensive logging.
 * Clears authentication cookies and terminates Supabase session.
 *
 * @route POST /api/auth/logout
 */

import { supabase } from '../../../lib/supabase'
import { logger } from '../../../lib/logger'
import { ValidationError, AuthError } from '../../../lib/errors'
import { createSuccessResponse, createErrorResponse } from '../../../utils/api'

/**
 * @typedef {Object} LogoutResponse
 * @property {boolean} success - Whether the logout was successful
 * @property {string} message - Response message
 * @property {string} [error] - Error message if any
 */

/**
 * Parse authentication cookies from request
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @returns {{ accessToken?: string, refreshToken?: string }} Cookie values
 */
function parseAuthCookies(req) {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader) {
    return {}
  }

  /** @type {Record<string, string>} */
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    if (key && value) {
      acc[key] = value
    }
    return acc
  }, {})

  return {
    accessToken: cookies['sb-access-token'],
    refreshToken: cookies['sb-refresh-token']
  }
}

/**
 * Get user ID from access token
 * @param {string} accessToken - User's access token
 * @returns {Promise<string | null>} User ID if found
 */
async function getUserFromToken(accessToken) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      return null
    }

    return user.id
  } catch (error) {
    logger.warn('Failed to get user from token during logout', 'AUTH', { error })
    return null
  }
}

/**
 * Clear authentication cookies
 * @param {import('next').NextApiResponse} res - Next.js API response
 */
function clearAuthCookies(res) {
  const cookieOptions = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'

  res.setHeader('Set-Cookie', [
    `sb-access-token=; ${cookieOptions}`,
    `sb-refresh-token=; ${cookieOptions}`,
    `sb-auth-token=; ${cookieOptions}`
  ])
}

/**
 * Log logout attempt
 * @param {string | null} userId - User ID if available
 * @param {boolean} success - Whether logout succeeded
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @param {string} [failureReason] - Reason for failure if logout failed
 * @returns {Promise<void>}
 */
async function logLogoutAttempt(userId, success, req, failureReason) {
  try {
    const logData = {
      event: 'logout',
      success,
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString(),
      failure_reason: failureReason
    }

    // Log to application logger
    logger.auth(
      `Logout ${success ? 'success' : 'failed'}`,
      userId || undefined,
      success
    )

    // Log to database if we have a user ID
    if (userId) {
      await supabase
        .from('login_logs')
        .insert([{
          user_id: userId,
          ip_address: logData.ip_address,
          user_agent: logData.user_agent,
          success,
          logout_time: new Date().toISOString(),
          failure_reason: failureReason
        }])
        .catch(error => {
          logger.warn('Failed to log logout attempt to database', 'AUTH', { error })
        })
    }

    logger.info('Logout attempt', 'AUTH', logData)
  } catch (error) {
    logger.error('Failed to log logout attempt', 'AUTH', { error })
  }
}

/**
 * Attempt Supabase signout
 * @param {string} [accessToken] - User's access token
 * @returns {Promise<{ success: boolean, error?: any }>} Signout result
 */
async function performSupabaseSignout(accessToken) {
  if (!accessToken) {
    return { success: true } // No token to sign out
  }

  try {
    // Set the session before signing out
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(accessToken)

    if (getUserError) {
      logger.warn('User not found for signout', 'AUTH', { error: getUserError })
      return { success: true } // Token likely expired, which is fine
    }

    // Sign out from Supabase
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      logger.warn('Supabase signout failed', 'AUTH', { error: signOutError })
      return { success: false, error: signOutError }
    }

    return { success: true }
  } catch (error) {
    logger.error('Unexpected error during Supabase signout', 'AUTH', { error })
    return { success: false, error }
  }
}

/**
 * Main logout handler
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @param {import('next').NextApiResponse<LogoutResponse>} res - Next.js API response
 */
async function logoutHandler(req, res) {
  const startTime = Date.now()
  let userId = null

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed', { method: req.method })
    }

    logger.info('Logout attempt started', 'AUTH')

    // Parse authentication cookies
    const { accessToken, refreshToken } = parseAuthCookies(req)

    // Get user ID if we have an access token
    if (accessToken) {
      userId = await getUserFromToken(accessToken)
    }

    // Attempt Supabase signout
    const signoutResult = await performSupabaseSignout(accessToken)

    // Clear authentication cookies regardless of signout success
    clearAuthCookies(res)

    // Log the logout attempt
    if (!signoutResult.success) {
      await logLogoutAttempt(
        userId,
        false,
        req,
        'Supabase signout failed, but cookies cleared'
      )
    } else {
      await logLogoutAttempt(userId, true, req)
    }

    const duration = Date.now() - startTime
    logger.performance('Logout duration', duration)

    logger.info('Logout completed', 'AUTH', {
      userId,
      duration,
      hadToken: !!accessToken,
      supabaseSignoutSuccess: signoutResult.success
    })

    // Always return success - even if Supabase signout failed,
    // we've cleared the cookies which is the important part
    return res.status(200).json(createSuccessResponse({
      message: 'Logged out successfully'
    }))

  } catch (error) {
    const duration = Date.now() - startTime

    // Clear cookies even on error
    clearAuthCookies(res)

    if (error instanceof ValidationError) {
      logger.error('Logout validation failed', 'AUTH', { error, duration })
      await logLogoutAttempt(userId, false, req, 'Validation error')
      return res.status(error.statusCode).json(error.toJSON())
    }

    // For any other error, still return success since we cleared cookies
    logger.error('Unexpected logout error', 'AUTH', { error, duration, userId })
    await logLogoutAttempt(userId, false, req, 'Unexpected error, but cookies cleared')

    // Return success because clearing cookies is what matters most
    return res.status(200).json(createSuccessResponse({
      message: 'Logged out successfully'
    }))
  }
}