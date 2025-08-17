import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { courseId, userId } = req.body

    if (!courseId || !userId) {
      return res.status(400).json({ error: 'Course ID and User ID are required' })
    }

    // Fetch course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError) throw courseError

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Fetch user details
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if user already has access via payments table
    const { data: existingPayment, error: paymentCheckError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'approved')
      .single()

    if (paymentCheckError && paymentCheckError.code !== 'PGRST116') {
      throw paymentCheckError
    }

    if (existingPayment) {
      return res.status(400).json({ error: 'User already has access to this course' })
    }

    // Create payment record
    const orderId = `order_${Date.now()}_${userId}_${courseId}`
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        course_id: courseId,
        amount: course.price,
        payment_method: 'stripe',
        status: 'pending',
        order_id: orderId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Stripe doesn't support LKR, so we'll use USD
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: Math.round(course.price ), // Convert LKR cents to USD cents (rough conversion)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/courses/${courseId}?success=true`,
      cancel_url: `${req.headers.origin}/courses/${courseId}?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: userId,
        courseId: courseId,
        paymentId: payment.id,
        orderId: orderId
      },
    })

    // Update payment record with session ID
    await supabase
      .from('payments')
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
}