import { buffer } from 'micro'
import { verifyWebhookSignature, handleWebhookEvent } from '../../../lib/stripe'
import { supabase } from '../../../lib/supabase-admin'
import { sendEmail } from '../../../lib/email'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout session completed:', session.id)

  // Update payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'approved',
      payment_id: session.payment_intent,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_session_id', session.id)
    .select(`
      *,
      profiles (name, email),
      courses (title)
    `)
    .single()

  if (paymentError) throw paymentError

  if (!payment) {
    console.error('Payment not found for session:', session.id)
    return
  }

  // Add user to course
  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .insert({
      user_id: payment.user_id,
      course_id: payment.course_id,
      enrolled_at: new Date().toISOString()
    })

  if (enrollmentError && enrollmentError.code !== '23505') { // Ignore duplicate key error
    console.error('Error creating enrollment:', enrollmentError)
  }

  // Send confirmation email
  try {
    await sendEmail({
      to: payment.profiles.email,
      subject: 'Payment Confirmed - Course Access Granted',
      template: 'payment-success',
      data: {
        studentName: payment.profiles.name,
        courseName: payment.courses.title,
        amount: payment.amount,
        paymentId: session.payment_intent
      }
    })
  } catch (emailError) {
    console.error('Error sending confirmation email:', emailError)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id)
  // Additional handling if needed
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id)

  // Update payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', paymentIntent.id)
    .select(`
      *,
      profiles (name, email),
      courses (title)
    `)
    .single()

  if (paymentError) throw paymentError

  if (!payment) {
    console.error('Payment not found for payment intent:', paymentIntent.id)
    return
  }

  // Send failure email
  try {
    await sendEmail({
      to: payment.profiles.email,
      subject: 'Payment Failed',
      template: 'payment-failed',
      data: {
        studentName: payment.profiles.name,
        courseName: payment.courses.title,
        amount: payment.amount,
        paymentId: paymentIntent.id
      }
    })
  } catch (emailError) {
    console.error('Error sending failure email:', emailError)
  }
}