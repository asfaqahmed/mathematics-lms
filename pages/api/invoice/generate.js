import { generateInvoicePDF } from '../../../lib/invoice'
import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { paymentId } = req.query

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' })
    }

    // Fetch payment details with related data
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        profiles (
          name,
          email
        ),
        courses (
          title,
          description
        )
      `)
      .eq('id', paymentId)
      .eq('status', 'approved')
      .single()

    if (paymentError) throw paymentError

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found or not approved' })
    }

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `INV-${payment.id.toString()}`,
      date: new Date(payment.created_at).toLocaleDateString(),
      dueDate: new Date(payment.created_at).toLocaleDateString(),
      
      // Company details
      company: {
        name: 'MathPro Academy',
        address: 'Colombo, Sri Lanka',
        email: 'support@mathslms.com',
        phone: '+94 11 234 5678'
      },
      
      // Customer details
      customer: {
        name: payment.profiles.name || 'N/A',
        email: payment.profiles.email,
        // phone: 'N/A'
      },
      
      // Items
      items: [
        {
          description: payment.courses.title,
          quantity: 1,
          unitPrice: payment.amount,
          total: payment.amount
        }
      ],
      
      // Totals
      // subtotal: payment.amount,
       total: payment.amount,
      
      // Payment info
      paymentMethod: payment.payment_method,
      paymentId: payment.payment_id || payment.order_id,
      paymentDate: new Date(payment.updated_at).toLocaleDateString()
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData)

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    // Send PDF
    res.send(pdfBuffer)

  } catch (error) {
    console.error('Error generating invoice:', error)
    res.status(500).json({ error: 'Failed to generate invoice' })
  }
}