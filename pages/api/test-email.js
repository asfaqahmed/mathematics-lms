import { sendEmail } from '../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email = 'test@example.com' } = req.body

    console.log('Testing email send to:', email)

    await sendEmail({
      to: email,
      template: 'payment-success',
      data: {
        studentName: 'Test Student',
        courseName: 'Test Course',
        amount: 500000, // 5000 LKR in cents
        paymentId: 'test_payment_123'
      }
    })

    console.log('✅ Test email sent successfully')

    res.status(200).json({ 
      success: true,
      message: 'Test email sent successfully',
      sentTo: email
    })

  } catch (error) {
    console.error('❌ Test email failed:', error)
    res.status(500).json({ 
      error: 'Email sending failed',
      details: error.message 
    })
  }
}