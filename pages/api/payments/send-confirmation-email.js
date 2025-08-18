import { sendEmail } from '../../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      paymentId, 
      studentName, 
      studentEmail, 
      courseName, 
      amount, 
      paymentMethod = 'PayHere' 
    } = req.body

    if (!studentEmail || !studentName || !courseName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log('Sending confirmation email to:', studentEmail)
    
    // Send confirmation email
    const emailResult = await sendEmail({
      to: studentEmail,
      template: 'payment-success',
      data: {
        studentName,
        courseName,
        amount: amount || 0,
        paymentId: paymentId || 'N/A',
        paymentMethod
      }
    })

    if (emailResult.error) {
      console.error('Email sending failed:', emailResult.error)
      return res.status(500).json({ 
        error: 'Email sending failed', 
        details: emailResult.error 
      })
    }

    console.log('✅ Confirmation email sent successfully to:', studentEmail)
    return res.status(200).json({ 
      success: true, 
      messageId: emailResult.messageId 
    })

  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return res.status(500).json({ 
      error: 'Failed to send confirmation email',
      details: error.message 
    })
  }
}