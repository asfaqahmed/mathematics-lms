/**
 * Payment API - PayHere Integration
 *
 * Handles PayHere payment processing including hash generation for payment initiation
 * and payment verification callbacks with comprehensive security measures.
 *
 * @route POST /api/payments/payhere?action=start - Generate PayHere payment hash
 * @route POST /api/payments/payhere?action=notify - Handle PayHere payment notifications
 */

import { z } from 'zod'
import crypto from 'crypto'
import { supabaseAdmin } from '../../../lib/supabase-admin'
import { logger } from '../../../lib/logger'
import {
  withMiddleware,
  sanitizeInput,
  getUserIP
} from '../../../lib/api-utils'
import {
  ValidationError,
  PaymentError,
  createNotFoundError,
  ErrorCode
} from '../../../lib/errors'

// PayHere configuration validation
const payhereConfig = {
  merchantId: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID,
  merchantSecret: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_SECRET
}

if (!payhereConfig.merchantId || !payhereConfig.merchantSecret) {
  logger.fatal('PayHere credentials not configured', 'PAYMENT')
  throw new Error('PayHere credentials missing')
}

// Validation schemas
const paymentStartSchema = z.object({
  courseId: z.string().uuid('Invalid course ID format'),
  userId: z.string().uuid('Invalid user ID format'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  title: z.string().min(1, 'Course title is required').max(200, 'Title too long'),
  currency: z.enum(['LKR']).default('LKR')
})

const paymentNotifySchema = z.object({
  order_id: z.string().uuid('Invalid order ID format'),
  payhere_amount: z.string(),
  payhere_currency: z.string(),
  status_code: z.string(),
  md5sig: z.string().length(32, 'Invalid MD5 signature'),
  payment_id: z.string().optional(),
  method: z.string().optional(),
  status_message: z.string().optional()
})

/**
 * Generate secure MD5 hash for PayHere
 * @param {string} merchantId
 * @param {string} orderId
 * @param {string} amount
 * @param {string} currency
 * @param {string} merchantSecret
 * @returns {string}
 */
function generatePayHereHash(merchantId, orderId, amount, currency, merchantSecret) {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase()

  const hashString = merchantId + orderId + amount + currency + hashedSecret

  return crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase()
}

/**
 * Verify PayHere payment notification signature
 * @param {string} merchantId
 * @param {string} orderId
 * @param {string} amount
 * @param {string} currency
 * @param {string} statusCode
 * @param {string} merchantSecret
 * @param {string} receivedSignature
 * @returns {boolean}
 */
function verifyPayHereSignature(
  merchantId,
  orderId,
  amount,
  currency,
  statusCode,
  merchantSecret,
  receivedSignature
) {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase()

  const hashString = merchantId + orderId + amount + currency + statusCode + hashedSecret

  const expectedSignature = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase()

  return expectedSignature === receivedSignature.toUpperCase()
}

/**
 * Validate course and get details
 * @param {string} courseId
 * @param {number} expectedAmount
 * @returns {Promise<{ id: string, title: string, price: number }>}
 */
async function validateCourse(courseId, expectedAmount) {
  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .select('id, title, price, status')
    .eq('id', courseId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('Course')
    }
    throw new PaymentError('Failed to validate course')
  }

  if (course.status !== 'published') {
    throw new ValidationError('Course is not available for purchase')
  }

  if (Math.abs(course.price - expectedAmount) > 0.01) {
    logger.warn('Course price mismatch', 'PAYMENT', {
      courseId,
      expectedAmount,
      actualPrice: course.price
    })
    throw new ValidationError('Payment amount does not match course price')
  }

  return course
}

/**
 * Check if user exists and get details
 * @param {string} userId
 * @returns {Promise<{ id: string, email: string }>}
 */
async function validateUser(userId) {
  const { data: user, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('User')
    }
    throw new PaymentError('Failed to validate user')
  }

  return user
}

/**
 * Create payment record for PayHere
 * @param {string} orderId
 * @param {string} userId
 * @param {string} courseId
 * @param {number} amount
 * @param {string} currency
 * @returns {Promise<PaymentRecord>}
 */
async function createPaymentRecord(orderId, userId, courseId, amount, currency) {
  const paymentData = {
    id: orderId,
    user_id: userId,
    course_id: courseId,
    amount,
    currency,
    status: 'pending',
    method: 'payhere',
    created_at: new Date().toISOString()
  }

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .insert([paymentData])
    .select()
    .single()

  if (error) {
    logger.error('Failed to create payment record', 'PAYMENT', {
      paymentData,
      error
    })
    throw new PaymentError('Failed to create payment record')
  }

  return payment
}

/**
 * Handle payment start request
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 * @returns {Promise<void>}
 */
async function handlePaymentStart(req, res) {
  const startTime = Date.now()

  try {
    const validatedData = paymentStartSchema.parse(req.body)
    const { courseId, userId, amount, title, currency } = validatedData

    logger.info('Initiating PayHere payment', 'PAYMENT', {
      courseId,
      userId,
      amount,
      currency
    })

    // Validate course and user
    await validateCourse(courseId, amount)
    await validateUser(userId)

    // Generate unique order ID
    const orderId = crypto.randomUUID()

    // Create payment record
    await createPaymentRecord(orderId, userId, courseId, amount, currency)

    // Generate PayHere hash
    const hash = generatePayHereHash(
      payhereConfig.merchantId,
      orderId,
      amount.toFixed(2),
      currency,
      payhereConfig.merchantSecret
    )

    const duration = Date.now() - startTime
    logger.performance('PayHere payment initiation', duration)

    logger.info('PayHere payment hash generated', 'PAYMENT', {
      orderId,
      courseId,
      userId,
      amount,
      duration
    })

    return res.status(200).json({
      success: true,
      hash,
      merchant_id: payhereConfig.merchantId,
      order_id: orderId,
      amount: amount.toFixed(2),
      message: 'Payment hash generated successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        { validationErrors: error.errors }
      )

      logger.error('PayHere start validation failed', 'PAYMENT', {
        error: validationError,
        duration
      })

      return res.status(400).json(validationError.toJSON())
    }

    if (error instanceof ValidationError || error instanceof PaymentError) {
      logger.error('PayHere payment start failed', 'PAYMENT', { error, duration })
      return res.status(error.statusCode).json(error.toJSON())
    }

    logger.error('Unexpected PayHere start error', 'PAYMENT', { error, duration })

    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    })
  }
}

/**
 * Grant course access after successful payment
 * @param {PaymentRecord} paymentRecord
 * @returns {Promise<void>}
 */
async function grantCourseAccess(paymentRecord) {
  try {
    // Check for existing purchase
    const { data: existingPurchase } = await supabaseAdmin
      .from('purchases')
      .select('id, access_granted')
      .eq('user_id', paymentRecord.user_id)
      .eq('course_id', paymentRecord.course_id)
      .single()

    if (existingPurchase) {
      if (!existingPurchase.access_granted) {
        // Update existing purchase to grant access
        const { error: updateError } = await supabaseAdmin
          .from('purchases')
          .update({
            access_granted: true,
            payment_id: paymentRecord.id,
            purchase_date: new Date().toISOString()
          })
          .eq('id', existingPurchase.id)

        if (updateError) {
          throw updateError
        }

        logger.info('Course access granted via existing purchase', 'PAYMENT', {
          userId: paymentRecord.user_id,
          courseId: paymentRecord.course_id,
          purchaseId: existingPurchase.id
        })
      }
    } else {
      // Create new purchase record
      const { error: insertError } = await supabaseAdmin
        .from('purchases')
        .insert([{
          user_id: paymentRecord.user_id,
          course_id: paymentRecord.course_id,
          payment_id: paymentRecord.id,
          access_granted: true,
          purchase_date: new Date().toISOString()
        }])

      if (insertError) {
        throw insertError
      }

      logger.info('Course access granted via new purchase', 'PAYMENT', {
        userId: paymentRecord.user_id,
        courseId: paymentRecord.course_id,
        paymentId: paymentRecord.id
      })
    }
  } catch (error) {
    logger.error('Failed to grant course access', 'PAYMENT', {
      paymentId: paymentRecord.id,
      userId: paymentRecord.user_id,
      courseId: paymentRecord.course_id,
      error
    })
    throw new PaymentError('Failed to grant course access')
  }
}

/**
 * Handle payment notification from PayHere
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 * @returns {Promise<void>}
 */
async function handlePaymentNotify(req, res) {
  const startTime = Date.now()
  const clientIP = getUserIP(req)

  try {
    const validatedData = paymentNotifySchema.parse(req.body)
    const {
      order_id: orderId,
      payhere_amount: amount,
      payhere_currency: currency,
      status_code: statusCode,
      md5sig: signature,
      payment_id: payherePaymentId,
      method,
      status_message: statusMessage
    } = validatedData

    logger.info('PayHere payment notification received', 'PAYMENT', {
      orderId,
      amount,
      currency,
      statusCode,
      payherePaymentId,
      method,
      clientIP
    })

    // Verify signature
    const isValidSignature = verifyPayHereSignature(
      payhereConfig.merchantId,
      orderId,
      amount,
      currency,
      statusCode,
      payhereConfig.merchantSecret,
      signature
    )

    if (!isValidSignature) {
      logger.warn('Invalid PayHere signature', 'PAYMENT', {
        orderId,
        expectedSignature: signature,
        clientIP
      })

      return res.status(400).json({
        success: false,
        status: 'failed',
        message: 'Invalid payment signature'
      })
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', orderId)
      .single()

    if (paymentError) {
      if (paymentError.code === 'PGRST116') {
        logger.warn('Payment record not found', 'PAYMENT', { orderId, clientIP })
        return res.status(404).json({
          success: false,
          status: 'failed',
          message: 'Payment record not found'
        })
      }

      logger.error('Database error fetching payment', 'PAYMENT', {
        orderId,
        error: paymentError
      })

      return res.status(500).json({
        success: false,
        status: 'failed',
        message: 'Database error'
      })
    }

    // Check if payment is successful (status_code '2' means success in PayHere)
    if (statusCode === '2') {
      // Update payment status
      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'completed',
          payhere_payment_id: payherePaymentId,
          payment_method_details: {
            method,
            status_message: statusMessage,
            processed_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) {
        logger.error('Failed to update payment status', 'PAYMENT', {
          orderId,
          error: updateError
        })

        return res.status(500).json({
          success: false,
          status: 'failed',
          message: 'Failed to update payment status'
        })
      }

      // Grant course access
      await grantCourseAccess(payment)

      const duration = Date.now() - startTime
      logger.performance('PayHere payment notification', duration)

      logger.info('PayHere payment completed successfully', 'PAYMENT', {
        orderId,
        userId: payment.user_id,
        courseId: payment.course_id,
        amount: payment.amount,
        payherePaymentId,
        duration
      })

      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Payment completed successfully'
      })

    } else {
      // Payment failed or other status
      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          payhere_payment_id: payherePaymentId,
          payment_method_details: {
            method,
            status_message: statusMessage,
            status_code: statusCode,
            failed_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) {
        logger.error('Failed to update failed payment status', 'PAYMENT', {
          orderId,
          error: updateError
        })
      }

      logger.warn('PayHere payment failed', 'PAYMENT', {
        orderId,
        statusCode,
        statusMessage,
        clientIP
      })

      return res.status(200).json({
        success: false,
        status: 'failed',
        message: statusMessage || 'Payment failed'
      })
    }

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      logger.error('PayHere notification validation failed', 'PAYMENT', {
        error: error.errors,
        clientIP,
        duration
      })

      return res.status(400).json({
        success: false,
        status: 'failed',
        message: 'Invalid notification data'
      })
    }

    logger.error('Unexpected PayHere notification error', 'PAYMENT', {
      error,
      clientIP,
      duration
    })

    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Internal server error'
    })
  }
}

/**
 * Main PayHere handler with action routing
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 * @returns {Promise<void>}
 */
async function payhereHandler(req, res) {
  const { action } = req.query

  try {
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed')
    }

    switch (action) {
      case 'start':
        return await handlePaymentStart(req, res)

      case 'notify':
        return await handlePaymentNotify(req, res)

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use "start" or "notify"'
        })
    }
  } catch (error) {
    logger.error('PayHere handler error', 'PAYMENT', { action, error })

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

export default payhereHandler

// Note: PayHere notifications come from their servers, so we can't use auth middleware
// However, we validate the signature which provides security