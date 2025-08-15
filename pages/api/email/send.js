import { sendEmail } from '../../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  
  try {
    const { to, type, data, attachments } = req.body
    
    if (!to || !type || !data) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    
    const result = await sendEmail(to, type, data, attachments)
    
    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId 
    })
    
  } catch (error) {
    console.error('Email API error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: error.message 
    })
  }
}