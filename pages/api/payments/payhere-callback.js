import { supabase } from '../../../lib/supabase-admin'
import crypto from 'crypto'

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

    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchant_secret) {
      return res.status(500).json({ error: 'PayHere merchant secret not configured' });
    }

    // Generate expected hash for verification (matching working implementation)
    const local_md5sig = crypto
      .createHash('md5')
      .update(
        merchant_id +
          order_id +
          payhere_amount +
          payhere_currency +
          status_code +
          crypto
            .createHash('md5')
            .update(merchant_secret)
            .digest('hex')
            .toUpperCase()
      )
      .digest('hex')
      .toUpperCase()

    if (local_md5sig === md5sig && status_code === '2') {
      // Update payment status in database
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          payhere_payment_id: payment_id
        })
        .eq('id', order_id)
        .select(`
          *,
          profiles (name, email),
          courses (title)
        `)
        .single()

      if (paymentError) {
        console.error('Payment update error:', paymentError);
        return res.status(500).json({ error: 'Failed to update payment' });
      }

      if (payment) {
        console.log(`Payment successful for order: ${order_id}`)
        
        // Send confirmation email if email service is available
        try {
          const { sendEmail } = await import('../../../lib/email')
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
      }

      return res.status(200).json({ status: 'success' })
    }

    console.log(`Payment failed for order: ${order_id}`)
    return res.status(400).json({ error: 'Invalid payment' })

  } catch (error) {
    console.error('PayHere callback error:', error)
    res.status(500).json({ error: 'Failed to process payment callback' })
  }
}