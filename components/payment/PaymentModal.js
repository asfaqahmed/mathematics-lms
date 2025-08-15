// components/payment/PaymentModal.js
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiCreditCard, FiDollarSign, FiUpload, FiCheck } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import axios from 'axios'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function PaymentModal({ isOpen, onClose, course, user }) {
  const [paymentMethod, setPaymentMethod] = useState('payhere')
  const [loading, setLoading] = useState(false)
  const [bankReceipt, setBankReceipt] = useState(null)
  
  const formatPrice = (price) => {
    return `LKR ${(price / 100).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }
  
  const handlePayHerePayment = async () => {
    setLoading(true)
    
    try {
      // Create payment record
      const { data: payment, error } = await supabase
        .from('payments')
        .insert([{
          user_id: user.id,
          course_id: course.id,
          amount: course.price,
          method: 'payhere',
          status: 'pending'
        }])
        .select()
        .single()
      
      if (error) throw error
      
      // PayHere payment configuration
      const paymentConfig = {
        sandbox: process.env.NEXT_PUBLIC_PAYHERE_SANDBOX === 'true',
        merchant_id: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payhere-callback`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payhere-notify`,
        order_id: payment.id,
        items: course.title,
        currency: 'LKR',
        amount: (course.price / 100).toFixed(2),
        first_name: user.name?.split(' ')[0] || 'Student',
        last_name: user.name?.split(' ')[1] || '',
        email: user.email,
        phone: user.phone || '0771234567',
        address: 'Colombo',
        city: 'Colombo',
        country: 'Sri Lanka'
      }
      
      // Generate hash
      const hashString = 
        process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID +
        payment.id +
        (course.price / 100).toFixed(2) +
        'LKR' +
        process.env.PAYHERE_MERCHANT_SECRET?.toUpperCase()
      
      const crypto = require('crypto')
      paymentConfig.hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase()
      
      // Create form and submit
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = paymentConfig.sandbox 
        ? 'https://sandbox.payhere.lk/pay/checkout'
        : 'https://www.payhere.lk/pay/checkout'
      
      Object.keys(paymentConfig).forEach(key => {
        if (key !== 'sandbox') {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = paymentConfig[key]
          form.appendChild(input)
        }
      })
      
      document.body.appendChild(form)
      form.submit()
      
    } catch (error) {
      console.error('PayHere payment error:', error)
      toast.error('Payment initialization failed')
      setLoading(false)
    }
  }
  
  const handleStripePayment = async () => {
    setLoading(true)
    
    try {
      // Create Stripe checkout session
      const response = await axios.post('/api/payments/create-checkout', {
        courseId: course.id,
        userId: user.id,
        amount: course.price,
        courseName: course.title
      })
      
      const { sessionId } = response.data
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      const { error } = await stripe.redirectToCheckout({ sessionId })
      
      if (error) {
        throw error
      }
      
    } catch (error) {
      console.error('Stripe payment error:', error)
      toast.error('Payment initialization failed')
      setLoading(false)
    }
  }
  
  const handleBankTransfer = async () => {
    setLoading(true)
    
    try {
      // Create payment record
      const { data: payment, error } = await supabase
        .from('payments')
        .insert([{
          user_id: user.id,
          course_id: course.id,
          amount: course.price,
          method: 'bank',
          status: 'pending'
        }])
        .select()
        .single()
      
      if (error) throw error
      
      // Generate WhatsApp message
      const message = encodeURIComponent(
        `🎓 *Course Purchase Request*\n\n` +
        `*Student:* ${user.name}\n` +
        `*Email:* ${user.email}\n` +
        `*Course:* ${course.title}\n` +
        `*Amount:* ${formatPrice(course.price)}\n` +
        `*Payment ID:* ${payment.id}\n\n` +
        `Bank transfer completed. Please approve my payment.\n` +
        `Receipt attached below 👇`
      )
      
      // Open WhatsApp
      window.open(
        `https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP}?text=${message}`,
        '_blank'
      )
      
      toast.success('Payment request created. Please send the receipt via WhatsApp.')
      onClose()
      
    } catch (error) {
      console.error('Bank transfer error:', error)
      toast.error('Failed to create payment request')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="modal-content max-w-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-2xl font-display font-bold text-white">
                Complete Your Purchase
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Course Info */}
              <div className="bg-dark-700 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{course.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {formatPrice(course.price)}
                    </div>
                    <p className="text-gray-400 text-sm">One-time payment</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Methods */}
              <h3 className="text-lg font-semibold text-white mb-4">Select Payment Method</h3>
              
              <div className="space-y-3">
                {/* PayHere Option */}
                <label className="relative flex items-center p-4 rounded-lg border-2 border-dark-600 hover:border-primary-500 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="payment"
                    value="payhere"
                    checked={paymentMethod === 'payhere'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center flex-1">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      paymentMethod === 'payhere' 
                        ? 'border-primary-500 bg-primary-500' 
                        : 'border-gray-500'
                    } mr-3`}>
                      {paymentMethod === 'payhere' && (
                        <FiCheck className="w-3 h-3 text-white mx-auto" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FiCreditCard className="w-5 h-5 text-primary-400 mr-2" />
                        <span className="font-medium text-white">PayHere</span>
                        <span className="ml-2 badge badge-success">Recommended</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Pay securely with Credit/Debit cards, Mobile wallets
                      </p>
                    </div>
                  </div>
                </label>
                
                {/* Stripe Option */}
                <label className="relative flex items-center p-4 rounded-lg border-2 border-dark-600 hover:border-primary-500 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center flex-1">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      paymentMethod === 'stripe' 
                        ? 'border-primary-500 bg-primary-500' 
                        : 'border-gray-500'
                    } mr-3`}>
                      {paymentMethod === 'stripe' && (
                        <FiCheck className="w-3 h-3 text-white mx-auto" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FiDollarSign className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="font-medium text-white">Stripe</span>
                        <span className="ml-2 badge badge-primary">International</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        International cards accepted (Visa, Mastercard, Amex)
                      </p>
                    </div>
                  </div>
                </label>
                
                {/* Bank Transfer Option */}
                <label className="relative flex items-center p-4 rounded-lg border-2 border-dark-600 hover:border-primary-500 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={paymentMethod === 'bank'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center flex-1">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      paymentMethod === 'bank' 
                        ? 'border-primary-500 bg-primary-500' 
                        : 'border-gray-500'
                    } mr-3`}>
                      {paymentMethod === 'bank' && (
                        <FiCheck className="w-3 h-3 text-white mx-auto" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FiUpload className="w-5 h-5 text-green-400 mr-2" />
                        <span className="font-medium text-white">Bank Transfer</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Transfer to bank account and send receipt via WhatsApp
                      </p>
                    </div>
                  </div>
                </label>
              </div>
              
              {/* Bank Details (shown when bank transfer selected) */}
              {paymentMethod === 'bank' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 bg-dark-700 rounded-lg"
                >
                  <h4 className="font-semibold text-white mb-3">Bank Account Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bank:</span>
                      <span className="text-white">{process.env.NEXT_PUBLIC_BANK_NAME}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Number:</span>
                      <span className="text-white font-mono">{process.env.NEXT_PUBLIC_BANK_ACCOUNT}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Name:</span>
                      <span className="text-white">{process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Branch:</span>
                      <span className="text-white">{process.env.NEXT_PUBLIC_BANK_BRANCH}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">SWIFT Code:</span>
                      <span className="text-white font-mono">{process.env.NEXT_PUBLIC_BANK_SWIFT}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-400">
                      <FaWhatsapp className="inline mr-2" />
                      After completing the transfer, click "Proceed" to send receipt via WhatsApp
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-dark-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (paymentMethod === 'payhere') handlePayHerePayment()
                    else if (paymentMethod === 'stripe') handleStripePayment()
                    else if (paymentMethod === 'bank') handleBankTransfer()
                  }}
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="spinner w-5 h-5 border-2"></div>
                  ) : (
                    <>
                      <span>
                        {paymentMethod === 'bank' ? 'Proceed to WhatsApp' : 'Pay Now'}
                      </span>
                      {paymentMethod === 'bank' && <FaWhatsapp />}
                    </>
                  )}
                </button>
              </div>
              
              {/* Security Note */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  🔒 Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// lib/payhere.js - PayHere Integration Helper
export const initPayHere = () => {
  if (typeof window !== 'undefined' && !window.payhere) {
    const script = document.createElement('script')
    script.src = process.env.NEXT_PUBLIC_PAYHERE_SANDBOX === 'true'
      ? 'https://www.payhere.lk/lib/payhere.js'
      : 'https://www.payhere.lk/lib/payhere.js'
    script.async = true
    document.body.appendChild(script)
  }
}

// lib/stripe.js - Stripe Integration Helper
import { loadStripe } from '@stripe/stripe-js'

let stripePromise
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

// pages/api/payments/payhere-callback.js - PayHere Callback Handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
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
    
    // Verify merchant ID
    if (merchant_id !== process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID) {
      return res.status(400).json({ message: 'Invalid merchant ID' })
    }
    
    // Verify MD5 signature
    const crypto = require('crypto')
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET
    const hash = crypto.createHash('md5')
      .update(
        merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        merchant_secret.toUpperCase()
      )
      .digest('hex')
      .toUpperCase()
    
    if (md5sig !== hash) {
      return res.status(400).json({ message: 'Invalid signature' })
    }
    
    // Import Supabase admin client
    const { createClient } = require('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Update payment status
    if (status_code === '2') {
      // Payment successful
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'approved',
          payment_id: payment_id,
          approved_at: new Date().toISOString()
        })
        .eq('id', order_id)
        .select()
        .single()
      
      if (paymentError) throw paymentError
      
      // Grant course access
      const { error: purchaseError } = await supabaseAdmin
        .from('purchases')
        .upsert({
          user_id: payment.user_id,
          course_id: payment.course_id,
          payment_id: payment.id,
          access_granted: true,
          purchase_date: new Date().toISOString()
        })
      
      if (purchaseError) throw purchaseError
      
      // Get user and course details for email
      const { data: user } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', payment.user_id)
        .single()
      
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('*')
        .eq('id', payment.course_id)
        .single()
      
      // Generate invoice
      const { generateInvoice } = require('../../../lib/invoice')
      const invoice = await generateInvoice({
        customerName: user.name,
        customerEmail: user.email,
        userId: user.id,
        courseName: course.title,
        amount: payment.amount,
        paymentMethod: 'PayHere',
        transactionId: payment_id
      })
      
      // Update payment with invoice URL
      await supabaseAdmin
        .from('payments')
        .update({
          invoice_url: invoice.publicPath,
          invoice_number: invoice.invoiceNumber
        })
        .eq('id', order_id)
      
      // Send confirmation email
      const { sendEmail } = require('../../../lib/email')
      await sendEmail(
        user.email,
        'paymentSuccess',
        {
          name: user.name,
          courseName: course.title,
          amount: payment.amount,
          paymentMethod: 'PayHere',
          invoiceNumber: invoice.invoiceNumber
        },
        [{
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          path: invoice.filePath
        }]
      )
      
      // Redirect to success page
      res.redirect(`/courses/${payment.course_id}?payment=success`)
      
    } else {
      // Payment failed or cancelled
      await supabaseAdmin
        .from('payments')
        .update({
          status: status_code === '0' ? 'pending' : 'failed',
          payment_id: payment_id
        })
        .eq('id', order_id)
      
      res.redirect(`/courses?payment=failed`)
    }
    
  } catch (error) {
    console.error('PayHere callback error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// pages/api/payments/create-checkout.js - Stripe Checkout Session
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  
  try {
    const { courseId, userId, amount, courseName } = req.body
    
    // Create Stripe customer if not exists
    const { createClient } = require('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Check if customer exists
    const { data: stripeCustomer } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userId)
      .single()
    
    let customerId
    
    if (!stripeCustomer) {
      // Get user details
      const { data: user } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          user_id: userId
        }
      })
      
      customerId = customer.id
      
      // Save to database
      await supabaseAdmin
        .from('stripe_customers')
        .insert({
          user_id: userId,
          customer_id: customerId
        })
    } else {
      customerId = stripeCustomer.customer_id
    }
    
    // Create payment record
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        course_id: courseId,
        amount: amount,
        method: 'stripe',
        status: 'pending'
      })
      .select()
      .single()
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'lkr',
            product_data: {
              name: courseName,
              description: 'Online Course Access'
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}?payment=cancelled`,
      metadata: {
        payment_id: payment.id,
        course_id: courseId,
        user_id: userId
      }
    })
    
    // Save session ID
    await supabaseAdmin
      .from('stripe_orders')
      .insert({
        customer_id: customerId,
        checkout_session_id: session.id,
        amount: amount,
        course_id: courseId,
        payment_status: 'pending'
      })
    
    res.status(200).json({ sessionId: session.id })
    
  } catch (error) {
    console.error('Stripe checkout error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// pages/api/payments/stripe-webhook.js - Stripe Webhook Handler
import { buffer } from 'micro'

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  
  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']
  
  let event
  
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  
  const { createClient } = require('@supabase/supabase-js')
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        
        // Update payment status
        const { data: payment } = await supabaseAdmin
          .from('payments')
          .update({
            status: 'approved', 
            payment_id: session.payment_intent,
            approved_at: new Date().toISOString()
          })
          .eq('id', session.metadata.payment_id)
          .select()
          .single()
        
        // Grant course access
        await supabaseAdmin
          .from('purchases')
          .upsert({
            user_id: session.metadata.user_id,
            course_id: session.metadata.course_id,
            payment_id: session.metadata.payment_id,
            access_granted: true,
            purchase_date: new Date().toISOString()
          })
        
        // Update Stripe order
        await supabaseAdmin
          .from('stripe_orders')
          .update({
            payment_status: 'succeeded',
            payment_intent_id: session.payment_intent
          })
          .eq('checkout_session_id', session.id)
        
        // Generate invoice and send email
        const { generateInvoice } = require('../../../lib/invoice')
        const { sendEmail } = require('../../../lib/email')
        
        const invoice = await generateInvoice({
          customerName: session.customer_details.name,
          customerEmail: session.customer_details.email,
          userId: session.metadata.user_id,
          courseName: session.metadata.course_name,
          amount: session.amount_total,
          paymentMethod: 'Stripe',
          transactionId: session.payment_intent
        })
        
        // Send confirmation email
        await sendEmail(
          session.customer_details.email,
          'paymentSuccess',
          {
            name: session.customer_details.name,
            courseName: session.metadata.course_name,
            amount: session.amount_total,
            paymentMethod: 'Stripe',
            invoiceNumber: invoice.invoiceNumber
          },
          [{
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            path: invoice.filePath
          }]
        )
        
        break
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'failed'
          })
          .eq('payment_id', paymentIntent.id)
        
        break
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`)
    }
    
    res.status(200).json({ received: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

            {/* Footer */}
            <div className="p-6 border-t border-dark-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => {
                    if (paymentMethod === 'payhere') handlePayHerePayment()
                    else if (paymentMethod === 'stripe') handleStripePayment()
                    else if (paymentMethod === 'bank') handleBankTransfer()
                  }}
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="spinner w-5 h-5 border-2"></div>
                  ) : (
                    <>
                      <span>
                        {paymentMethod === 'bank' ? 'Proceed to WhatsApp' : 'Pay Now'}
                      </span>
                      {paymentMethod === 'bank' && <FaWhatsapp />}
                    </>
                  )}
                </button>
              </div>
              
              {/* Security Note */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  🔒 Your payment information is secure and encrypted
                </p>
              </div>
            </div>