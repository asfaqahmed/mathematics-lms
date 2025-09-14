/**
 * Payment API - Bank Transfer Approval
 *
 * Handles manual approval of bank transfer payments by admin users.
 * Includes invoice generation, course access granting, and email notifications.
 *
 * @route POST /api/payments/approve-bank
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '../../../src/lib/supabase-admin'
import { generateInvoice } from '../../../src/lib/invoice'
import { sendEmail } from '../../../src/lib/email'
import { logger } from '../../../src/lib/logger'
import {
  withMiddleware,
  createSuccessResponse,
  createErrorResponse,
  STRICT_RATE_LIMIT,
  requireAdmin
} from '../../../src/lib/api-utils'
import {
  ValidationError,
  PaymentError,
  AuthError,
  createNotFoundError,
  ErrorCode
} from '../../../src/lib/errors'

// Validation schema
const approvePaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID format'),
  adminId: z.string().uuid('Invalid admin ID format'),
  notes: z.string().max(500, 'Notes too long').optional()
})

// Response types
interface ApprovalResponse {
  success: boolean
  payment?: PaymentDetails
  invoice?: string
  message: string
}

interface PaymentDetails {
  id: string
  user_id: string
  course_id: string
  amount: number
  currency: string
  status: string
  method: string
  approved_at: string
  invoice_url?: string
  invoice_number?: string
}

interface PaymentWithRelations {
  id: string
  user_id: string
  course_id: string
  amount: number
  currency: string
  status: string
  method: string
  created_at: string
  profiles: {
    name: string
    email: string
  }
  courses: {
    title: string
    price: number
  }
}

/**
 * Validate admin permissions
 */
async function validateAdminUser(adminId: string): Promise<void> {
  const { data: admin, error } = await supabaseAdmin
    .from('profiles')
    .select('id, role, name')
    .eq('id', adminId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new AuthError('Admin user not found', ErrorCode.UNAUTHORIZED)
    }
    logger.error('Database error validating admin', 'PAYMENT', { adminId, error })
    throw new PaymentError('Failed to validate admin user')
  }

  if (admin.role !== 'admin') {
    logger.warn('Non-admin user attempted payment approval', 'PAYMENT', {
      userId: adminId,
      role: admin.role
    })
    throw new AuthError('Admin privileges required', ErrorCode.FORBIDDEN)
  }

  logger.info('Admin user validated', 'PAYMENT', {
    adminId,
    adminName: admin.name
  })
}

/**
 * Get payment details with relations
 */
async function getPaymentWithRelations(paymentId: string): Promise<PaymentWithRelations> {
  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select(`
      *,
      profiles (name, email),
      courses (title, price)
    `)
    .eq('id', paymentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('Payment')
    }
    logger.error('Database error fetching payment', 'PAYMENT', { paymentId, error })
    throw new PaymentError('Failed to fetch payment details')
  }

  return payment
}

/**
 * Validate payment is eligible for approval
 */
function validatePaymentEligibility(payment: PaymentWithRelations): void {
  if (payment.status !== 'pending') {
    logger.warn('Attempted to approve non-pending payment', 'PAYMENT', {
      paymentId: payment.id,
      currentStatus: payment.status
    })
    throw new ValidationError(
      `Payment cannot be approved. Current status: ${payment.status}`
    )
  }

  if (payment.method !== 'bank_transfer' && payment.method !== 'bank') {
    logger.warn('Attempted to approve non-bank payment', 'PAYMENT', {
      paymentId: payment.id,
      method: payment.method
    })
    throw new ValidationError('Only bank transfer payments can be manually approved')
  }

  if (!payment.profiles) {
    throw new ValidationError('Payment user profile not found')
  }

  if (!payment.courses) {
    throw new ValidationError('Payment course not found')
  }
}

/**
 * Update payment status to approved
 */
async function approvePayment(
  paymentId: string,
  adminId: string,
  notes?: string
): Promise<PaymentDetails> {
  const approvalTime = new Date().toISOString()

  const updateData: any = {
    status: 'approved',
    approved_at: approvalTime,
    approved_by: adminId,
    updated_at: approvalTime
  }

  if (notes) {
    updateData.admin_notes = notes
  }

  const { data: updatedPayment, error } = await supabaseAdmin
    .from('payments')
    .update(updateData)
    .eq('id', paymentId)
    .select()
    .single()

  if (error) {
    logger.error('Database error updating payment status', 'PAYMENT', {
      paymentId,
      error
    })
    throw new PaymentError('Failed to update payment status')
  }

  return updatedPayment
}

/**
 * Grant course access to user
 */
async function grantCourseAccess(
  userId: string,
  courseId: string,
  paymentId: string
): Promise<void> {
  const purchaseData = {
    user_id: userId,
    course_id: courseId,
    payment_id: paymentId,
    access_granted: true,
    purchase_date: new Date().toISOString()
  }

  // Use upsert to handle case where purchase record might already exist
  const { error } = await supabaseAdmin
    .from('purchases')
    .upsert(purchaseData, {
      onConflict: 'user_id,course_id',
      ignoreDuplicates: false
    })

  if (error) {
    logger.error('Database error granting course access', 'PAYMENT', {
      userId,
      courseId,
      paymentId,
      error
    })
    throw new PaymentError('Failed to grant course access')
  }

  logger.info('Course access granted', 'PAYMENT', {
    userId,
    courseId,
    paymentId
  })
}

/**
 * Generate and store invoice
 */
async function generateAndStoreInvoice(
  payment: PaymentWithRelations,
  paymentId: string
): Promise<{ invoiceUrl: string; invoiceNumber: string }> {
  try {
    const invoice = await generateInvoice({
      customerName: payment.profiles.name,
      customerEmail: payment.profiles.email,
      userId: payment.user_id,
      courseName: payment.courses.title,
      amount: payment.amount,
      currency: payment.currency || 'USD',
      paymentMethod: 'Bank Transfer',
      transactionId: paymentId,
      approvedAt: new Date().toISOString()
    })

    // Update payment with invoice details
    const { error: invoiceUpdateError } = await supabaseAdmin
      .from('payments')
      .update({
        invoice_url: invoice.publicPath,
        invoice_number: invoice.invoiceNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (invoiceUpdateError) {
      logger.warn('Failed to update payment with invoice details', 'PAYMENT', {
        paymentId,
        invoiceNumber: invoice.invoiceNumber,
        error: invoiceUpdateError
      })
    }

    logger.info('Invoice generated successfully', 'PAYMENT', {
      paymentId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceUrl: invoice.publicPath
    })

    return {
      invoiceUrl: invoice.publicPath,
      invoiceNumber: invoice.invoiceNumber
    }

  } catch (error) {
    logger.error('Invoice generation failed', 'PAYMENT', {
      paymentId,
      error
    })
    // Don't throw - invoice generation failure shouldn't prevent approval
    return {
      invoiceUrl: '',
      invoiceNumber: ''
    }
  }
}

/**
 * Send approval email to customer
 */
async function sendApprovalEmail(
  payment: PaymentWithRelations,
  invoiceNumber: string,
  invoiceFilePath?: string
): Promise<void> {
  try {
    const emailAttachments = invoiceFilePath ? [{
      filename: `invoice-${invoiceNumber}.pdf`,
      path: invoiceFilePath
    }] : undefined

    await sendEmail(
      payment.profiles.email,
      'bankApproval',
      {
        name: payment.profiles.name,
        courseName: payment.courses.title,
        amount: payment.amount,
        currency: payment.currency || 'USD',
        invoiceNumber,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
        courseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${payment.course_id}`
      },
      emailAttachments
    )

    logger.info('Approval email sent successfully', 'PAYMENT', {
      paymentId: payment.id,
      email: payment.profiles.email,
      invoiceNumber
    })

  } catch (error) {
    logger.error('Failed to send approval email', 'PAYMENT', {
      paymentId: payment.id,
      email: payment.profiles.email,
      error
    })
    // Don't throw - email failure shouldn't prevent approval
  }
}

/**
 * Main bank approval handler
 */
async function approveBankHandler(
  req: NextApiRequest,
  res: NextApiResponse<ApprovalResponse>
) {
  const startTime = Date.now()

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed')
    }

    // Parse and validate request body
    const validatedData = approvePaymentSchema.parse(req.body)
    const { paymentId, adminId, notes } = validatedData

    logger.info('Bank payment approval initiated', 'PAYMENT', {
      paymentId,
      adminId,
      hasNotes: !!notes
    })

    // Validate admin user
    await validateAdminUser(adminId)

    // Get payment details with relations
    const payment = await getPaymentWithRelations(paymentId)

    // Validate payment eligibility
    validatePaymentEligibility(payment)

    // Approve payment
    const approvedPayment = await approvePayment(paymentId, adminId, notes)

    // Grant course access
    await grantCourseAccess(payment.user_id, payment.course_id, paymentId)

    // Generate invoice
    const { invoiceUrl, invoiceNumber } = await generateAndStoreInvoice(payment, paymentId)

    // Send approval email (non-blocking)
    sendApprovalEmail(payment, invoiceNumber).catch(error => {
      logger.error('Approval email failed', 'PAYMENT', { paymentId, error })
    })

    const duration = Date.now() - startTime
    logger.performance('Bank payment approval', duration)

    logger.info('Bank payment approved successfully', 'PAYMENT', {
      paymentId,
      userId: payment.user_id,
      courseId: payment.course_id,
      amount: payment.amount,
      adminId,
      invoiceNumber,
      duration
    })

    return res.status(200).json({
      success: true,
      payment: {
        id: approvedPayment.id,
        user_id: approvedPayment.user_id,
        course_id: approvedPayment.course_id,
        amount: approvedPayment.amount,
        currency: approvedPayment.currency,
        status: approvedPayment.status,
        method: approvedPayment.method,
        approved_at: approvedPayment.approved_at,
        invoice_url: invoiceUrl,
        invoice_number: invoiceNumber
      },
      invoice: invoiceUrl,
      message: 'Payment approved successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        { validationErrors: error.errors }
      )

      logger.error('Bank approval validation failed', 'PAYMENT', {
        error: validationError,
        duration
      })

      return res.status(400).json(validationError.toJSON() as any)
    }

    if (error instanceof ValidationError ||
        error instanceof PaymentError ||
        error instanceof AuthError) {
      logger.error('Bank approval failed', 'PAYMENT', { error, duration })
      return res.status(error.statusCode).json(error.toJSON() as any)
    }

    logger.error('Unexpected bank approval error', 'PAYMENT', { error, duration })

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while approving the payment'
    })
  }
}

// Export with middleware
export default withMiddleware(approveBankHandler, {
  auth: true, // Require authentication
  adminOnly: true, // Require admin privileges
  rateLimit: STRICT_RATE_LIMIT, // Strict rate limiting for admin actions
  cors: true
})