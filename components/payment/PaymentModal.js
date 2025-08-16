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
      // Create payment record matching your database schema
      const paymentData = {
        user_id: user.id,
        course_id: course.id,
        amount: course.price,
        method: 'payhere',
        status: 'pending'
      }
      
      console.log('Creating payment with data:', paymentData)
      
      const { data: payment, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

      if (error) throw error

      // PayHere payment configuration
      const payhereConfig = {
        sandbox: true,
        merchant_id: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID,
        return_url: `${window.location.origin}/courses/${course.id}?success=true`,
        cancel_url: `${window.location.origin}/courses/${course.id}?canceled=true`,
        notify_url: `${window.location.origin}/api/payments/payhere-callback`,
        order_id: payment.id.toString(),
        items: course.title,
        amount: (course.price / 100).toFixed(2),
        currency: 'LKR',
        first_name: user.name?.split(' ')[0] || 'John',
        last_name: user.name?.split(' ').slice(1).join(' ') || 'Doe',
        email: user.email,
        phone: user.phone || '0771234567',
        address: 'No. 1, Galle Road',
        city: 'Colombo',
        country: 'Sri Lanka',
        hash: '', // Will be calculated if needed
        custom_1: '',
        custom_2: ''
      }

      // Debug PayHere configuration
      console.log('PayHere config:', payhereConfig)
      console.log('Merchant ID:', process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID)
      
      // Set up PayHere event handlers
      if (window.payhere) {
        // Payment success callback
        window.payhere.onCompleted = function onCompleted(orderId) {
          console.log('Payment completed. OrderID:', orderId)
          toast.success('Payment completed successfully!')
          setLoading(false)
          onClose()
          // Refresh the page to update course access
          window.location.reload()
        }

        // Payment dismissal callback
        window.payhere.onDismissed = function onDismissed() {
          console.log('Payment dismissed')
          toast.error('Payment was cancelled')
          setLoading(false)
        }

        // Payment error callback
        window.payhere.onError = function onError(error) {
          console.log('Payment error:', error)
          toast.error('Payment failed: ' + error)
          setLoading(false)
        }

        // Start the payment
        window.payhere.startPayment(payhereConfig)
      } else {
        throw new Error('PayHere script not loaded')
      }
      
    } catch (error) {
      console.error('PayHere payment error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      toast.error(`Payment initialization failed: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleStripePayment = async () => {
    setLoading(true)
    
    try {
      // Create Stripe checkout session
      const response = await axios.post('/api/payments/create-checkout', {
        courseId: course.id,
        userId: user.id
      })
      
      const { sessionId } = response.data
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      await stripe.redirectToCheckout({ sessionId })
      
    } catch (error) {
      console.error('Stripe payment error:', error)
      toast.error('Payment initialization failed')
    } finally {
      setLoading(false)
    }
  }
  
  const handleBankTransfer = async () => {
    if (!bankReceipt) {
      toast.error('Please upload your bank transfer receipt')
      return
    }
    
    setLoading(true)
    
    try {
      // Create payment record for bank transfer
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          amount: course.price,
          method: 'bank_transfer',
          status: 'pending',
          receipt_url: bankReceipt
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Bank transfer submitted for verification')
      onClose()
      
    } catch (error) {
      console.error('Bank transfer error:', error)
      toast.error('Failed to submit bank transfer')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-dark-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-600">
            <h2 className="text-2xl font-bold text-white">
              Complete Your Purchase
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Course Info */}
          <div className="p-6 border-b border-dark-600">
            <div className="flex items-center space-x-4">
              <img
                src={course.thumbnail || '/api/placeholder/80/60'}
                alt={course.title}
                className="w-20 h-15 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                <p className="text-gray-400">{course.category}</p>
                <p className="text-2xl font-bold text-primary-400 mt-1">
                  {formatPrice(course.price)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Choose Payment Method
            </h3>

            <div className="space-y-4">
              {/* PayHere */}
              <div
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  paymentMethod === 'payhere'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                }`}
                onClick={() => setPaymentMethod('payhere')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FiCreditCard className="w-6 h-6 text-primary-400" />
                    <div>
                      <p className="font-semibold text-white">PayHere</p>
                      <p className="text-sm text-gray-400">
                        Cards, Mobile Banking, Online Banking
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'payhere'
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-400'
                  }`}>
                    {paymentMethod === 'payhere' && (
                      <FiCheck className="w-3 h-3 text-white m-auto mt-0.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Stripe */}
              <div
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                }`}
                onClick={() => setPaymentMethod('stripe')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FiCreditCard className="w-6 h-6 text-blue-400" />
                    <div>
                      <p className="font-semibold text-white">Stripe</p>
                      <p className="text-sm text-gray-400">
                        International Credit/Debit Cards
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'stripe'
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-400'
                  }`}>
                    {paymentMethod === 'stripe' && (
                      <FiCheck className="w-3 h-3 text-white m-auto mt-0.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Transfer */}
              <div
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  paymentMethod === 'bank'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                }`}
                onClick={() => setPaymentMethod('bank')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FiDollarSign className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="font-semibold text-white">Bank Transfer</p>
                      <p className="text-sm text-gray-400">
                        Direct bank deposit (Manual verification)
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'bank'
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-400'
                  }`}>
                    {paymentMethod === 'bank' && (
                      <FiCheck className="w-3 h-3 text-white m-auto mt-0.5" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Transfer Details */}
            {paymentMethod === 'bank' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-dark-700 rounded-xl"
              >
                <h4 className="font-semibold text-white mb-3">Bank Details:</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><strong>Bank:</strong> Commercial Bank of Ceylon</p>
                  <p><strong>Account Name:</strong> MathPro Academy</p>
                  <p><strong>Account Number:</strong> 1234567890</p>
                  <p><strong>Branch:</strong> Colombo Main Branch</p>
                  <p><strong>Amount:</strong> {formatPrice(course.price)}</p>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Transfer Receipt
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setBankReceipt(e.target.files[0])}
                    className="w-full p-3 bg-dark-600 border border-dark-500 rounded-lg text-white"
                  />
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 border border-dark-500 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={
                  paymentMethod === 'payhere' ? handlePayHerePayment :
                  paymentMethod === 'stripe' ? handleStripePayment :
                  handleBankTransfer
                }
                disabled={loading || (paymentMethod === 'bank' && !bankReceipt)}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Pay ${formatPrice(course.price)}`
                )}
              </button>
            </div>

            {/* Help */}
            <div className="mt-6 p-4 bg-dark-700/50 rounded-xl">
              <p className="text-sm text-gray-400 mb-2">
                Need help with payment?
              </p>
              <a
                href="https://wa.me/94771234567"
                className="inline-flex items-center space-x-2 text-green-400 hover:text-green-300 text-sm"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}