import { useState } from 'react'
import { FiCreditCard, FiLoader } from 'react-icons/fi'
import { loadStripe } from '@stripe/stripe-js'
import axios from 'axios'
import toast from 'react-hot-toast'
import { STRIPE_CONFIG } from '../../lib/stripe'

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_CONFIG.PUBLISHABLE_KEY)

export default function StripeButton({ course, user, onSuccess, onError, disabled = false, className = '' }) {
  const [loading, setLoading] = useState(false)

  const handleStripePayment = async () => {
    if (!user) {
      toast.error('Please sign in to purchase')
      return
    }

    if (!course) {
      toast.error('Course not found')
      return
    }

    setLoading(true)
    
    try {
      // Create checkout session
      const response = await axios.post('/api/payments/create-checkout', {
        courseId: course.id,
        price: course.price,
        title: course.title,
        userId: user.id
      })

      const { sessionId, url } = response.data
      
      if (url) {
        // Direct redirect URL provided
        window.location.href = url
        return
      }

      // Use Stripe redirect
      const stripe = await stripePromise
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId
      })

      if (error) {
        console.error('Stripe redirect error:', error)
        toast.error('Payment failed. Please try again.')
        if (onError) onError(error)
      } else {
        // Success callback will be handled by the success URL
        if (onSuccess) onSuccess(sessionId)
      }
    } catch (error) {
      console.error('Stripe payment error:', error)
      toast.error('Payment failed. Please try again.')
      if (onError) onError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStripePayment}
      disabled={disabled || loading || !course?.price}
      className={`btn-primary flex items-center justify-center space-x-2 ${className}`}
    >
      {loading ? (
        <>
          <FiLoader className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <FiCreditCard className="w-5 h-5" />
          <span>Pay with Card</span>
          {course?.price && (
            <span className="font-bold">
              LKR {course.price.toFixed(2)}
            </span>
          )}
        </>
      )}
    </button>
  )
}