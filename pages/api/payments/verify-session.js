import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase-admin'
import { sendEmail } from '../../../lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { session_id } = req.query
    console.log('=== PAYMENT VERIFICATION START ===')
    console.log('Session ID:', session_id)

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' })
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)
    console.log('Stripe session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      payment_intent: session.payment_intent,
      amount_total: session.amount_total
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      console.log('Payment confirmed as paid, updating database...')
      
      // Update payment record if not already updated
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'approved',
          payment_id: session.payment_intent,
          approved_at: new Date().toISOString()
        })
        .eq('payment_id', session.id)
        .select(`
          *,
          profiles (name, email),
          courses (title, id)
        `)
        .single()

      console.log('Database update result:', { payment, paymentError })

      if (paymentError && paymentError.code !== 'PGRST116') {
        console.error('Error updating payment:', paymentError)
      }

      // Ensure user has course access
      if (payment) {
        const { error: purchaseError } = await supabase
          .from('purchases')
          .upsert({
            user_id: payment.user_id,
            course_id: payment.course_id,
            payment_id: payment.id,
            access_granted: true,
            purchase_date: new Date().toISOString()
          }, {
            onConflict: 'user_id,course_id'
          })

        if (purchaseError) {
          console.error('Error creating/updating purchase:', purchaseError)
        }

        // Send confirmation email
        try {
          console.log('Attempting to send email to:', payment?.profiles?.email)
          if (payment && payment.profiles && payment.courses) {
            await sendEmail({
              to: payment.profiles.email,
              template: 'payment-success',
              data: {
                studentName: payment.profiles.name,
                courseName: payment.courses.title,
                amount: session.amount_total,
                paymentId: session.payment_intent
              }
            })
            console.log('✅ Confirmation email sent successfully to:', payment.profiles.email)
          } else {
            console.log('❌ Cannot send email - missing payment/profile/course data:', {
              hasPayment: !!payment,
              hasProfile: !!payment?.profiles,
              hasCourse: !!payment?.courses
            })
          }
        } catch (emailError) {
          console.error('❌ Error sending confirmation email:', emailError)
        }
      }

      return res.status(200).json({
        success: true,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email,
        amount_total: session.amount_total,
        currency: session.currency,
        course: payment?.courses || null
      })
    } else {
      return res.status(200).json({
        success: false,
        payment_status: session.payment_status,
        message: 'Payment not completed'
      })
    }

  } catch (error) {
    console.error('Error verifying session:', error)
    res.status(500).json({ 
      error: 'Failed to verify session',
      details: error.message 
    })
  }
}