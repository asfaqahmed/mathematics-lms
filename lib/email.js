import nodemailer from 'nodemailer'

// Create transporter
const transporter = nodemailer.createTransporter({
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
    
    'payment-success': {
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
              <h2>Thank you for your purchase, ${data.studentName}!</h2>
              <p>Your payment has been successfully processed and you now have full access to:</p>
              <h3 style="color: #667eea;">${data.courseName}</h3>
              
              <div class="invoice-details">
                <h3>Invoice Details</h3>
                <div class="invoice-row">
                  <span>Payment ID:</span>
                  <strong>${data.paymentId}</strong>
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
                  <strong>LKR ${(data.amount / 100).toLocaleString()}</strong>
                </div>
              </div>
              
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-courses" class="button">Access Your Course</a>
              </center>
              
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
    
    'payment-failed': {
      subject: `Payment Failed - Please Try Again`,
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
              <h1>Payment Failed</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.studentName},</h2>
              <p>Unfortunately, your payment for <strong>${data.courseName}</strong> could not be processed.</p>
              <p>Please try again or contact our support team for assistance.</p>
              
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/courses/${data.courseId}" class="button">Try Again</a>
              </center>
              
              <p>If you continue to experience issues, please contact us at support@mathpro.lk</p>
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

// Main email sending function
export const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const emailTemplate = getEmailTemplate(template, data)
    
    const mailOptions = {
      from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.SMTP_FROM}>`,
      to,
      subject: subject || emailTemplate.subject,
      html: emailTemplate.html
    }
    
    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)
    return result
  } catch (error) {
    console.error('Email sending failed:', error)
    throw error
  }
}