/**
 * Authentication API - Registration Endpoint
 *
 * Handles user registration with comprehensive validation and profile creation.
 * Includes email verification, welcome emails, and security logging.
 *
 * @route POST /api/auth/register
 */

import { z } from 'zod'
import { supabase } from '../../../lib/supabase'
import { sendEmail } from '../../../lib/email'
import { logger } from '../../../lib/logger'
import { registerSchema } from '../../../lib/validations'
import { AuthError, ValidationError, ErrorCode } from '../../../lib/errors'
import { sanitizeInput, createSuccessResponse, createErrorResponse } from '../../../utils/api'

/**
 * @typedef {Object} RegisterResponse
 * @property {boolean} success - Whether registration was successful
 * @property {Object} [user] - User data if registration successful
 * @property {string} user.id - User ID
 * @property {string} user.email - User email
 * @property {string} user.name - User name
 * @property {string} [message] - Success or error message
 * @property {string} [error] - Error message if any
 */

/**
 * @typedef {Object} ProfileData
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} name - User name
 * @property {string} [phone] - User phone number
 * @property {'student'} role - User role
 * @property {string} created_at - Profile creation timestamp
 */

/**
 * @typedef {Object} RegisterInput
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} password - User's password
 * @property {string} [phone] - User's phone number (optional)
 */

// Enhanced validation schema with phone number
const enhancedRegisterSchema = registerSchema.extend({
  phone: z.string().optional().refine((phone) => {
    if (!phone) return true
    // Sri Lankan phone number validation
    const phoneRegex = /^(?:\+94|94|0)?[0-9]{9}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }, 'Invalid phone number format')
})

/**
 * Check if user already exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} Whether user exists
 */
async function checkUserExists(email) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    // If error is "PGRST116" (not found), user doesn't exist
    if (error && error.code === 'PGRST116') {
      return false
    }

    // If we got data, user exists
    return !!data
  } catch (error) {
    logger.warn('Error checking user existence', 'AUTH', { email, error })
    return false
  }
}

/**
 * Create user profile in database
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} [phone] - User phone number
 * @returns {Promise<void>}
 */
async function createUserProfile(userId, email, name, phone) {
  /** @type {ProfileData} */
  const profileData = {
    id: userId,
    email: email.toLowerCase(),
    name: sanitizeInput(name),
    role: 'student',
    created_at: new Date().toISOString()
  }

  if (phone) {
    profileData.phone = sanitizeInput(phone)
  }

  const { error } = await supabase
    .from('profiles')
    .insert([profileData])

  if (error) {
    logger.error('Failed to create user profile', 'AUTH', {
      userId,
      email,
      error
    })
    throw new Error('Failed to create user profile')
  }

  logger.info('User profile created', 'AUTH', { userId, email })
}

/**
 * Send welcome email to new user
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} [userId] - User ID
 * @returns {Promise<void>}
 */
async function sendWelcomeEmail(email, name, userId) {
  try {
    await sendEmail(email, 'welcome', {
      name: sanitizeInput(name),
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?user_id=${userId}`,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
    })

    logger.info('Welcome email sent', 'EMAIL', { email, userId })
  } catch (error) {
    logger.error('Failed to send welcome email', 'EMAIL', {
      email,
      userId,
      error
    })
    // Don't throw - email failure shouldn't prevent registration
  }
}

/**
 * Log registration attempt
 * @param {string} email - User email
 * @param {boolean} success - Whether registration succeeded
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @param {string} [userId] - User ID if available
 * @param {string} [failureReason] - Reason for failure if registration failed
 * @returns {Promise<void>}
 */
async function logRegistrationAttempt(email, success, req, userId, failureReason) {
  const logData = {
    event: 'registration',
    email,
    success,
    ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
    user_agent: req.headers['user-agent'] || 'unknown',
    user_id: userId,
    failure_reason: failureReason,
    timestamp: new Date().toISOString()
  }

  logger.auth(
    `Registration ${success ? 'success' : 'failed'}`,
    userId,
    success
  )

  logger.info('Registration attempt', 'AUTH', logData)
}

/**
 * Main registration handler
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @param {import('next').NextApiResponse<RegisterResponse>} res - Next.js API response
 */
async function registerHandler(req, res) {
  const startTime = Date.now()
  let email = ''
  let userId

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed', { method: req.method })
    }

    // Parse and validate request body
    /** @type {RegisterInput} */
    const validatedData = enhancedRegisterSchema.parse(req.body)
    const { name, email: inputEmail, password, phone } = validatedData

    email = inputEmail.toLowerCase()

    logger.info('Registration attempt started', 'AUTH', { email, name })

    // Check if user already exists
    const userExists = await checkUserExists(email)
    if (userExists) {
      await logRegistrationAttempt(email, false, req, undefined, 'User already exists')
      throw new AuthError(
        'An account with this email already exists',
        ErrorCode.ALREADY_EXISTS
      )
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: sanitizeInput(name),
          phone: phone ? sanitizeInput(phone) : undefined
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`
      }
    })

    if (error) {
      let failureReason = 'Authentication signup failed'

      if (error.message.includes('already registered')) {
        failureReason = 'Email already registered'
        await logRegistrationAttempt(email, false, req, undefined, failureReason)
        throw new AuthError(
          'An account with this email already exists',
          ErrorCode.ALREADY_EXISTS
        )
      } else if (error.message.includes('Password should be at least')) {
        failureReason = 'Password too weak'
        await logRegistrationAttempt(email, false, req, undefined, failureReason)
        throw new ValidationError('Password does not meet security requirements')
      } else if (error.message.includes('Unable to validate email')) {
        failureReason = 'Invalid email address'
        await logRegistrationAttempt(email, false, req, undefined, failureReason)
        throw new ValidationError('Invalid email address provided')
      }

      await logRegistrationAttempt(email, false, req, undefined, failureReason)
      throw new AuthError(error.message, ErrorCode.INTERNAL_ERROR)
    }

    if (!data.user) {
      await logRegistrationAttempt(email, false, req, undefined, 'No user data returned')
      throw new AuthError('Registration failed', ErrorCode.INTERNAL_ERROR)
    }

    userId = data.user.id

    // Create user profile
    await createUserProfile(userId, email, name, phone)

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name, userId).catch(error => {
      logger.error('Welcome email failed', 'EMAIL', { email, userId, error })
    })

    // Log successful registration
    await logRegistrationAttempt(email, true, req, userId)

    const duration = Date.now() - startTime
    logger.performance('Registration duration', duration)

    logger.info('Registration completed successfully', 'AUTH', {
      userId,
      email,
      duration,
      hasPhone: !!phone
    })

    return res.status(201).json(createSuccessResponse({
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: userId,
        email,
        name: sanitizeInput(name)
      }
    }))

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        { validationErrors: error.errors }
      )

      await logRegistrationAttempt(email, false, req, userId, 'Validation error')
      logger.error('Registration validation failed', 'AUTH', {
        error: validationError,
        duration,
        email
      })

      return res.status(400).json(validationError.toJSON())
    }

    if (error instanceof AuthError || error instanceof ValidationError) {
      logger.error('Registration failed', 'AUTH', {
        error,
        duration,
        email,
        userId
      })

      return res.status(error.statusCode).json(error.toJSON())
    }

    // Unexpected error
    logger.error('Unexpected registration error', 'AUTH', {
      error,
      duration,
      email,
      userId
    })

    await logRegistrationAttempt(email, false, req, userId, 'Internal server error')

    return res.status(500).json(createErrorResponse(
      'An unexpected error occurred during registration. Please try again.'
    ))
  }
}

export default registerHandler