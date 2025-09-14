/**
 * Payment API - Create Stripe Checkout Session
 *
 * Creates a Stripe checkout session for course payments with comprehensive
 * validation, error handling, and secure payment processing.
 *
 * @route POST /api/payments/create-checkout
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import Stripe from 'stripe'
import { supabaseAdmin } from '../../../src/lib/supabase-admin'
import { logger } from '../../../src/lib/logger'
import {
  withMiddleware,
  createSuccessResponse,
  createErrorResponse,
  STRICT_RATE_LIMIT,
  sanitizeInput
} from '../../../src/lib/api-utils'
import {
  ValidationError,
  PaymentError,
  createNotFoundError,
  ErrorCode
} from '../../../src/lib/errors'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// Validation schemas
const createCheckoutSchema = z.object({
  courseId: z.string().uuid('Invalid course ID format'),
  userId: z.string().uuid('Invalid user ID format'),
  successUrl: z.string().url('Invalid success URL').optional(),
  cancelUrl: z.string().url('Invalid cancel URL').optional()
})

// Response types
interface CheckoutSessionResponse {
  success: boolean
  sessionId?: string
  url?: string
  message?: string
}

interface CourseData {
  id: string
  title: string
  description: string
  price: number
  currency: string
  status: string
}

interface UserData {
  id: string
  email: string
  name: string
}

interface PaymentRecord {
  id: string
  user_id: string
  course_id: string
  amount: number
  currency: string
  status: string
  method: string
  stripe_session_id?: string
  created_at: string
}

/**
 * Get site URL from environment or request
 */
function getSiteUrl(req: NextApiRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`
  )
}

/**
 * Fetch course details with validation
 */
async function fetchCourse(courseId: string): Promise<CourseData> {
  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .select('id, title, description, price, currency, status')
    .eq('id', courseId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('Course')
    }
    logger.error('Database error fetching course', 'PAYMENT', { courseId, error })
    throw new PaymentError('Failed to fetch course details')
  }

  if (course.status !== 'published') {
    throw new ValidationError('Course is not available for purchase')
  }

  if (course.price <= 0) {
    throw new ValidationError('Course price is invalid')
  }

  return course
}

/**
 * Fetch user details with validation
 */
async function fetchUser(userId: string): Promise<UserData> {
  const { data: user, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, name')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('User')
    }
    logger.error('Database error fetching user', 'PAYMENT', { userId, error })
    throw new PaymentError('Failed to fetch user details')
  }

  if (!user.email) {
    throw new ValidationError('User email is required for payment processing')
  }

  return user
}

/**
 * Check if user already has access to the course
 */
async function checkExistingAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    // Check for approved payments
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .in('status', ['approved', 'completed'])
      .single()

    if (existingPayment) {
      return true
    }

    // Check for direct course access
    const { data: existingPurchase } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('access_granted', true)
      .single()

    return !!existingPurchase
  } catch (error) {
    logger.warn('Error checking existing access', 'PAYMENT', {
      userId,
      courseId,
      error
    })
    return false
  }
}

/**
 * Create payment record in database
 */
async function createPaymentRecord(
  userId: string,
  courseId: string,
  course: CourseData
): Promise<PaymentRecord> {
  const paymentData = {
    user_id: userId,
    course_id: courseId,
    amount: course.price,
    currency: course.currency || 'USD',
    status: 'pending',
    method: 'stripe',
    created_at: new Date().toISOString()
  }

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .insert([paymentData])
    .select()
    .single()

  if (error) {
    logger.error('Database error creating payment record', 'PAYMENT', {
      paymentData,
      error
    })
    throw new PaymentError('Failed to create payment record')
  }

  return payment
}

/**
 * Convert currency amounts
 */
function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  // Simple conversion rates (in production, use real-time rates)
  const rates: Record<string, Record<string, number>> = {
    LKR: {
      USD: 1 / 300, // 1 USD = 300 LKR (approximate)
      EUR: 1 / 330, // 1 EUR = 330 LKR (approximate)
    },
    USD: {
      LKR: 300,
      EUR: 0.9,
    },
    EUR: {
      LKR: 330,
      USD: 1.1,
    }
  }

  const rate = rates[fromCurrency]?.[toCurrency] || 1
  return amount * rate
}

/**
 * Create Stripe checkout session
 */
async function createStripeSession(
  course: CourseData,
  user: UserData,
  payment: PaymentRecord,
  siteUrl: string,
  successUrl?: string,
  cancelUrl?: string
): Promise<Stripe.Checkout.Session> {
  try {
    // Convert to USD if needed (Stripe prefers USD)
    const targetCurrency = 'usd'
    const convertedAmount = convertCurrency(course.price, course.currency, 'USD')
    const stripeAmount = Math.round(convertedAmount * 100) // Convert to cents

    // Build URLs
    const defaultSuccessUrl = `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&course_id=${course.id}`
    const defaultCancelUrl = `${siteUrl}/courses/${course.id}?canceled=true`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: targetCurrency,
            product_data: {
              name: sanitizeInput(course.title),
              description: sanitizeInput(course.description),
              metadata: {
                course_id: course.id,
                original_price: course.price,
                original_currency: course.currency
              }
            },
            unit_amount: stripeAmount
          },
          quantity: 1
        }
      ],
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: {
        user_id: user.id,
        course_id: course.id,
        payment_id: payment.id,
        original_amount: course.price.toString(),
        original_currency: course.currency
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          course_id: course.id,
          payment_id: payment.id
        }
      }
    })

    return session
  } catch (error) {
    logger.error('Stripe session creation failed', 'PAYMENT', {
      courseId: course.id,
      userId: user.id,
      paymentId: payment.id,
      error
    })

    if (error instanceof Stripe.errors.StripeError) {
      throw new PaymentError(
        `Payment processing failed: ${error.message}`,
        ErrorCode.PAYMENT_GATEWAY_ERROR
      )
    }

    throw new PaymentError('Failed to create checkout session')
  }
}

/**
 * Update payment record with Stripe session ID
 */
async function updatePaymentWithSession(
  paymentId: string,
  sessionId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('payments')
    .update({
      stripe_session_id: sessionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentId)

  if (error) {
    logger.error('Failed to update payment with session ID', 'PAYMENT', {
      paymentId,
      sessionId,
      error
    })
    // Don't throw here as the session was created successfully
  }
}

/**
 * Main checkout handler
 */
async function createCheckoutHandler(
  req: NextApiRequest,
  res: NextApiResponse<CheckoutSessionResponse>
) {
  const startTime = Date.now()

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed')
    }

    // Parse and validate request body
    const validatedData = createCheckoutSchema.parse(req.body)
    const { courseId, userId, successUrl, cancelUrl } = validatedData

    logger.info('Creating checkout session', 'PAYMENT', {
      courseId,
      userId
    })

    // Fetch course details
    const course = await fetchCourse(courseId)

    // Fetch user details
    const user = await fetchUser(userId)

    // Check if user already has access
    const hasAccess = await checkExistingAccess(userId, courseId)
    if (hasAccess) {
      throw new ValidationError('User already has access to this course')
    }

    // Create payment record
    const payment = await createPaymentRecord(userId, courseId, course)

    // Get site URL
    const siteUrl = getSiteUrl(req)

    // Create Stripe session
    const session = await createStripeSession(
      course,
      user,
      payment,
      siteUrl,
      successUrl,
      cancelUrl
    )

    // Update payment record with session ID
    await updatePaymentWithSession(payment.id, session.id)

    const duration = Date.now() - startTime
    logger.performance('Checkout session creation', duration)

    logger.info('Checkout session created successfully', 'PAYMENT', {
      courseId,
      userId,
      paymentId: payment.id,
      sessionId: session.id,
      amount: course.price,
      currency: course.currency,
      duration
    })

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      message: 'Checkout session created successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        { validationErrors: error.errors }
      )

      logger.error('Checkout validation failed', 'PAYMENT', {
        error: validationError,
        duration
      })

      return res.status(400).json(validationError.toJSON() as any)
    }

    if (error instanceof ValidationError || error instanceof PaymentError) {
      logger.error('Checkout failed', 'PAYMENT', { error, duration })
      return res.status(error.statusCode).json(error.toJSON() as any)
    }

    logger.error('Unexpected checkout error', 'PAYMENT', { error, duration })

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while creating the checkout session'
    })
  }
}

// Export with middleware
export default withMiddleware(createCheckoutHandler, {
  auth: true, // Require authentication
  rateLimit: STRICT_RATE_LIMIT, // Strict rate limiting for payments
  cors: true
})