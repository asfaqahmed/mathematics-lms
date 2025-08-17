import Stripe from 'stripe'

// Initialize Stripe with secret key (server-side only)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null

// Stripe configuration
export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  CURRENCY: 'lkr', // Sri Lankan Rupee
  API_VERSION: '2023-10-16'
}

/**
 * Create a Stripe checkout session
 */
export const createCheckoutSession = async ({
  courseId,
  courseName,
  courseDescription,
  amount, // Amount in LKR (will be converted to cents)
  customerEmail,
  userId,
  successUrl,
  cancelUrl,
  metadata = {}
}) => {
  if (!stripe) {
    throw new Error('Stripe not initialized. Check STRIPE_SECRET_KEY environment variable.')
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.CURRENCY,
            product_data: {
              name: courseName,
              description: courseDescription,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        courseId,
        userId,
        ...metadata
      },
      payment_intent_data: {
        metadata: {
          courseId,
          userId,
          ...metadata
        }
      }
    })

    return {
      sessionId: session.id,
      url: session.url,
      paymentIntentId: session.payment_intent
    }
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error)
    throw new Error(`Failed to create checkout session: ${error.message}`)
  }
}

/**
 * Retrieve a checkout session
 */
export const getCheckoutSession = async (sessionId) => {
  if (!stripe) {
    throw new Error('Stripe not initialized')
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    })
    return session
  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    throw new Error(`Failed to retrieve session: ${error.message}`)
  }
}

/**
 * Create a payment intent (for custom payment flows)
 */
export const createPaymentIntent = async ({
  amount,
  currency = STRIPE_CONFIG.CURRENCY,
  courseId,
  userId,
  customerEmail,
  metadata = {}
}) => {
  if (!stripe) {
    throw new Error('Stripe not initialized')
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        courseId,
        userId,
        ...metadata
      },
      receipt_email: customerEmail,
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw new Error(`Failed to create payment intent: ${error.message}`)
  }
}

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (payload, signature) => {
  if (!stripe || !STRIPE_CONFIG.WEBHOOK_SECRET) {
    throw new Error('Stripe webhook secret not configured')
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_CONFIG.WEBHOOK_SECRET
    )
    return event
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw new Error('Invalid webhook signature')
  }
}

/**
 * Handle Stripe webhook events
 */
export const handleWebhookEvent = async (event) => {
  console.log('Processing Stripe webhook event:', event.type)

  switch (event.type) {
    case 'checkout.session.completed':
      return await handleCheckoutCompleted(event.data.object)
    
    case 'payment_intent.succeeded':
      return await handlePaymentSucceeded(event.data.object)
    
    case 'payment_intent.payment_failed':
      return await handlePaymentFailed(event.data.object)
    
    case 'invoice.payment_succeeded':
      return await handleInvoicePaymentSucceeded(event.data.object)
    
    default:
      console.log(`Unhandled event type: ${event.type}`)
      return { received: true }
  }
}

/**
 * Handle successful checkout session
 */
const handleCheckoutCompleted = async (session) => {
  const { metadata } = session
  const { courseId, userId } = metadata

  return {
    type: 'checkout_completed',
    sessionId: session.id,
    courseId,
    userId,
    amount: session.amount_total / 100, // Convert back from cents
    currency: session.currency,
    customerEmail: session.customer_details?.email,
    paymentStatus: session.payment_status
  }
}

/**
 * Handle successful payment
 */
const handlePaymentSucceeded = async (paymentIntent) => {
  const { metadata } = paymentIntent
  const { courseId, userId } = metadata

  return {
    type: 'payment_succeeded',
    paymentIntentId: paymentIntent.id,
    courseId,
    userId,
    amount: paymentIntent.amount / 100, // Convert back from cents
    currency: paymentIntent.currency,
    receiptEmail: paymentIntent.receipt_email
  }
}

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (paymentIntent) => {
  const { metadata } = paymentIntent
  const { courseId, userId } = metadata

  return {
    type: 'payment_failed',
    paymentIntentId: paymentIntent.id,
    courseId,
    userId,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    lastPaymentError: paymentIntent.last_payment_error
  }
}

/**
 * Handle successful invoice payment (for subscriptions)
 */
const handleInvoicePaymentSucceeded = async (invoice) => {
  return {
    type: 'invoice_payment_succeeded',
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId: invoice.subscription,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency
  }
}

/**
 * Create a customer
 */
export const createCustomer = async ({ email, name, metadata = {} }) => {
  if (!stripe) {
    throw new Error('Stripe not initialized')
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata
    })
    return customer
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw new Error(`Failed to create customer: ${error.message}`)
  }
}

/**
 * Format amount for display (convert cents to currency)
 */
export const formatAmount = (amountInCents, currency = 'LKR') => {
  const amount = amountInCents / 100
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(amount)
}

/**
 * Convert amount to cents for Stripe
 */
export const convertToCents = (amount) => {
  return Math.round(amount * 100)
}

/**
 * Convert cents back to currency amount
 */
export const convertFromCents = (amountInCents) => {
  return amountInCents / 100
}

/**
 * Validate Stripe configuration
 */
export const validateStripeConfig = () => {
  const errors = []
  
  if (!STRIPE_CONFIG.PUBLISHABLE_KEY) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  }
  
  if (!STRIPE_CONFIG.SECRET_KEY) {
    errors.push('STRIPE_SECRET_KEY is not set')
  }
  
  if (errors.length > 0) {
    throw new Error(`Stripe configuration errors: ${errors.join(', ')}`)
  }
  
  return true
}

const StripeUtils = {
  stripe,
  STRIPE_CONFIG,
  createCheckoutSession,
  getCheckoutSession,
  createPaymentIntent,
  verifyWebhookSignature,
  handleWebhookEvent,
  createCustomer,
  formatAmount,
  convertToCents,
  convertFromCents,
  validateStripeConfig
}

export default StripeUtils