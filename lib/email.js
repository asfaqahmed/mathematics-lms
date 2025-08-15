import nodemailer from 'nodemailer'

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// Email templates
const getEmailTemplate = (type, data) => {
  const templates = {
    welcome: {
      subject: `Welcome to ${process.env.NEXT_PUBLIC_APP_NAME}! 🎓`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .approval-icon { font-size: 48px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="approval-icon">🎉</div>
              <h1>Bank Transfer Approved!</h1>
            </div>
            <div class="content">
              <h2>Great news, ${data.name}!</h2>
              <p>Your bank transfer payment has been verified and approved by our admin team.</p>
              <p>You now have full access to:</p>
              <h3 style="color: #3b82f6;">${data.courseName}</h3>
              
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-courses" class="button">Start Learning Now</a>
              </center>
              
              <p>Thank you for your patience during the verification process.</p>
              <p>Happy Learning!<br>The ${process.env.NEXT_PUBLIC_APP_NAME} Team</p>
            </div>
            <div class="footer">
              <p>© 2025 ${process.env.NEXT_PUBLIC_APP_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    
    passwordReset: {
      subject: 'Password Reset Request 🔐',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <center>
                <a href="${data.resetLink}" class="button">Reset Password</a>
              </center>
              
              <p>This link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request this, please ignore this email.</p>
              
              <p>Best regards,<br>The ${process.env.NEXT_PUBLIC_APP_NAME} Team</p>
            </div>
            <div class="footer">
              <p>© 2025 ${process.env.NEXT_PUBLIC_APP_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }
  
  return templates[type] || templates.welcome
}

// Send email function
export const sendEmail = async (to, type, data, attachments = []) => {
  try {
    const template = getEmailTemplate(type, data)
    
    const mailOptions = {
      from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.SMTP_FROM}>`,
      to,
      subject: template.subject,
      html: template.html,
      attachments
    }
    
    const info = await transporter.sendMail(mailOptions)
    
    // Log email
    if (process.env.NODE_ENV === 'production') {
      const { supabase } = await import('./supabase')
      await supabase.from('email_logs').insert([{
        to_email: to,
        subject: template.subject,
        template_type: type,
        success: true
      }])
    }
    
    return info
  } catch (error) {
    console.error('Email send error:', error)
    
    // Log error
    if (process.env.NODE_ENV === 'production') {
      const { supabase } = await import('./supabase')
      await supabase.from('email_logs').insert([{
        to_email: to,
        subject: template.subject || 'Error',
        template_type: type,
        success: false,
        error_message: error.message
      }])
    }
    
    throw error
  }
}

export default sendEmailtop: 30px; color: #666; font-size: 12px; }
            .logo { font-size: 28px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📚 ${process.env.NEXT_PUBLIC_APP_NAME}</div>
              <h1>Welcome to Your Learning Journey!</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name}! 👋</h2>
              <p>Thank you for joining ${process.env.NEXT_PUBLIC_APP_NAME}. We're excited to have you as part of our learning community!</p>
              <p>You now have access to:</p>
              <ul>
                <li>📹 High-quality video lessons</li>
                <li>📝 Comprehensive study materials</li>
                <li>🎯 Practice exercises and quizzes</li>
                <li>💬 24/7 support</li>
              </ul>
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/courses" class="button">Browse Courses</a>
              </center>
              <p>If you have any questions, feel free to reach out to us!</p>
              <p>Best regards,<br>The ${process.env.NEXT_PUBLIC_APP_NAME} Team</p>
            </div>
            <div class="footer">
              <p>© 2025 ${process.env.NEXT_PUBLIC_APP_NAME}. All rights reserved.</p>
              <p>You received this email because you signed up for ${process.env.NEXT_PUBLIC_APP_NAME}</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    
    paymentSuccess: {
      subject: `Payment Confirmation - ${data.courseName} 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .success-icon { font-size: 48px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Payment Successful!</h1>
            </div>
            <div class="content">
              <h2>Thank you for your purchase, ${data.name}!</h2>
              <p>Your payment has been successfully processed and you now have full access to:</p>
              <h3 style="color: #667eea;">${data.courseName}</h3>
              
              <div class="invoice-details">
                <h3>Invoice Details</h3>
                <div class="invoice-row">
                  <span>Invoice Number:</span>
                  <strong>${data.invoiceNumber}</strong>
                </div>
                <div class="invoice-row">
                  <span>Date:</span>
                  <strong>${new Date().toLocaleDateString()}</strong>
                </div>
                <div class="invoice-row">
                  <span>Course:</span>
                  <strong>${data.courseName}</strong>
                </div>
                <div class="invoice-row">
                  <span>Amount Paid:</span>
                  <strong>LKR ${data.amount.toLocaleString()}</strong>
                </div>
                <div class="invoice-row">
                  <span>Payment Method:</span>
                  <strong>${data.paymentMethod}</strong>
                </div>
              </div>
              
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-courses" class="button">Access Your Course</a>
              </center>
              
              <p><strong>Note:</strong> A PDF invoice has been attached to this email for your records.</p>
              
              <p>Happy Learning!<br>The ${process.env.NEXT_PUBLIC_APP_NAME} Team</p>
            </div>
            <div class="footer">
              <p>© 2025 ${process.env.NEXT_PUBLIC_APP_NAME}. All rights reserved.</p>
              <p>This is an automated payment confirmation email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    
    bankApproval: {
      subject: `Bank Transfer Approved - ${data.courseName} ✅`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-