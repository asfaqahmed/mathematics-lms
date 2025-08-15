import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

export const generateInvoice = async (invoiceData) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      })
      
      // Generate unique invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      // File path
      const fileName = `invoice-${invoiceNumber}.pdf`
      const filePath = path.join(process.cwd(), 'public', 'invoices', fileName)
      
      // Ensure directory exists
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      // Pipe to file
      doc.pipe(fs.createWriteStream(filePath))
      
      // Header with gradient effect (simulated)
      doc.rect(0, 0, doc.page.width, 150)
         .fill('#667eea')
      
      // Logo and Company Name
      doc.fillColor('#ffffff')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text(process.env.NEXT_PUBLIC_APP_NAME, 50, 50)
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('Excellence in Mathematics Education', 50, 85)
      
      // Invoice Title
      doc.fillColor('#ffffff')
         .fontSize(20)
         .text('INVOICE', 450, 50, { align: 'right' })
      
      doc.fontSize(10)
         .text(`#${invoiceNumber}`, 450, 75, { align: 'right' })
         .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 450, 90, { align: 'right' })
      
      // Reset color for body
      doc.fillColor('#333333')
      
      // Customer Information Box
      doc.rect(50, 180, 250, 100)
         .stroke('#e5e7eb')
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('BILL TO:', 60, 190)
      
      doc.font('Helvetica')
         .fontSize(11)
         .text(invoiceData.customerName, 60, 210)
         .text(invoiceData.customerEmail, 60, 225)
         .text(`Student ID: ${invoiceData.userId}`, 60, 240)
      
      // Company Information Box
      doc.rect(320, 180, 250, 100)
         .stroke('#e5e7eb')
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('FROM:', 330, 190)
      
      doc.font('Helvetica')
         .fontSize(11)
         .text(process.env.NEXT_PUBLIC_APP_NAME, 330, 210)
         .text('mathtutor@asfaqahmed.com', 330, 225)
         .text('Colombo, Sri Lanka', 330, 240)
         .text('Tel: +94 75 660 5254', 330, 255)
      
      // Invoice Details Table
      doc.rect(50, 310, 520, 30)
         .fill('#f3f4f6')
      
      doc.fillColor('#333333')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('Description', 60, 320)
         .text('Quantity', 350, 320)
         .text('Unit Price', 420, 320)
         .text('Total', 500, 320)
      
      // Course Details
      doc.rect(50, 340, 520, 60)
         .stroke('#e5e7eb')
      
      doc.font('Helvetica')
         .fontSize(11)
         .text(invoiceData.courseName, 60, 355)
         .text('Online Course Access', 60, 370, { color: '#6b7280' })
         .text('1', 350, 355)
         .text(`LKR ${invoiceData.amount.toLocaleString()}`, 420, 355)
         .text(`LKR ${invoiceData.amount.toLocaleString()}`, 500, 355)
      
      // Payment Summary
      doc.rect(320, 420, 250, 120)
         .stroke('#e5e7eb')
      
      doc.font('Helvetica')
         .fontSize(11)
         .text('Subtotal:', 330, 435)
         .text(`LKR ${invoiceData.amount.toLocaleString()}`, 480, 435, { align: 'right' })
      
      doc.text('Tax (0%):', 330, 455)
         .text('LKR 0', 480, 455, { align: 'right' })
      
      doc.moveTo(330, 475)
         .lineTo(560, 475)
         .stroke('#e5e7eb')
      
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .text('Total:', 330, 490)
         .text(`LKR ${invoiceData.amount.toLocaleString()}`, 460, 490, { align: 'right' })
      
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#10b981')
         .text(`Paid via ${invoiceData.paymentMethod}`, 330, 515)
      
      // Payment Information
      doc.fillColor('#333333')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('Payment Information:', 50, 435)
      
      doc.font('Helvetica')
         .fontSize(10)
         .text(`Method: ${invoiceData.paymentMethod}`, 50, 455)
         .text(`Transaction ID: ${invoiceData.transactionId || 'N/A'}`, 50, 470)
         .text(`Payment Date: ${new Date().toLocaleString('en-GB')}`, 50, 485)
      
      // Bank Details (if needed)
      if (invoiceData.paymentMethod === 'Bank Transfer') {
        doc.rect(50, 560, 520, 80)
           .stroke('#e5e7eb')
        
        doc.font('Helvetica-Bold')
           .fontSize(11)
           .text('Bank Details:', 60, 570)
        
        doc.font('Helvetica')
           .fontSize(10)
           .text(`Bank: ${process.env.NEXT_PUBLIC_BANK_NAME}`, 60, 590)
           .text(`Account: ${process.env.NEXT_PUBLIC_BANK_ACCOUNT}`, 60, 605)
           .text(`Name: ${process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME}`, 60, 620)
           .text(`Branch: ${process.env.NEXT_PUBLIC_BANK_BRANCH}`, 300, 590)
           .text(`SWIFT: ${process.env.NEXT_PUBLIC_BANK_SWIFT}`, 300, 605)
      }
      
      // Footer
      doc.fontSize(9)
         .fillColor('#6b7280')
         .text('Thank you for your business!', 50, 680, { align: 'center' })
         .text(`This is a computer-generated invoice and is valid without signature.`, 50, 695, { align: 'center' })
         .text(`© 2025 ${process.env.NEXT_PUBLIC_APP_NAME}. All rights reserved.`, 50, 710, { align: 'center' })
      
      // Finalize PDF
      doc.end()
      
      // Return file info
      resolve({
        fileName,
        filePath,
        publicPath: `/invoices/${fileName}`,
        invoiceNumber
      })
      
    } catch (error) {
      reject(error)
    }
  })
}

export default generateInvoice