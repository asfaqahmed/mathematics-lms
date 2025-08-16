import { supabase } from '../../../lib/supabase-admin'
import { sendEmail } from '../../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig
    } = req.body

    console.log('PayHere callback received:', req.body)

    // Verify the payment with PayHere (implement signature verification)
    // For security, you should verify the md5sig here

    // Update payment status in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: status_code === '2' ? 'completed' : 'failed',
        payhere_payment_id: payment_id
      })
      .eq('id', order_id)
      .select(`
        *,
        profiles (name, email),
        courses (title)
      `)
      .single()

    if (paymentError) throw paymentError

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    // If payment completed, course access is granted via the completed payment record
    if (status_code === '2') {
      console.log('Payment completed successfully for user:', payment.user_id, 'course:', payment.course_id)

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
            paymentId: payment_id
          }
        })
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
      }
    } else {
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
            orderId: order_id
          }
        })
      } catch (emailError) {
        console.error('Error sending failure email:', emailError)
      }
    }

    res.status(200).json({ message: 'Payment callback processed' })
  } catch (error) {
    console.error('PayHere callback error:', error)
    res.status(500).json({ error: 'Failed to process payment callback' })
  }
}