import { useState } from 'react'
import { FiCreditCard, FiLoader } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'
import { createPayHerePayment, initializePayHerePayment } from '../../lib/payhere'

export default function PayHereButton({ course, user, onSuccess, onError, disabled = false, className = '' }) {
  const [loading, setLoading] = useState(false)

  const handlePayHerePayment = async () => {
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
      // Create payment order
      const response = await axios.post('/api/payments/payhere-checkout', {
        courseId: course.id,
        userId: user.id,
        amount: course.price,
        title: course.title
      })

      const { orderId, hash, merchantId } = response.data

      // Create PayHere payment object using utility
      const payment = createPayHerePayment({
        orderId,
        amount: course.price,
        items: course.title,
        firstName: user.name?.split(' ')[0] || 'User',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || 'Colombo',
        returnUrl: `${window.location.origin}/courses/${course.id}?payment=success`,
        cancelUrl: `${window.location.origin}/courses/${course.id}?payment=cancelled`,
        notifyUrl: `${window.location.origin}/api/payments/payhere-callback`,
        customFields: {
          custom_1: course.id,
          custom_2: user.id
        }
      })

      // Initialize PayHere payment using utility
      await initializePayHerePayment(payment, {
        onCompleted: (orderId) => {
          console.log('Payment completed. OrderID:' + orderId)
          toast.success('Payment completed successfully!')
          if (onSuccess) onSuccess(orderId)
          setLoading(false)
          
          // Refresh the page to update course access
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        },
        onDismissed: () => {
          console.log('Payment dismissed')
          toast.info('Payment was cancelled')
          setLoading(false)
        },
        onError: (error) => {
          console.log('Error:' + error)
          toast.error('Payment failed: ' + error)
          if (onError) onError(error)
          setLoading(false)
        }
      })

    } catch (error) {
      console.error('PayHere payment error:', error)
      toast.error('Payment failed. Please try again.')
      if (onError) onError(error)
      setLoading(false)
    }
  }


  return (
    <button
      onClick={handlePayHerePayment}
      disabled={disabled || loading}
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
          <span>Pay with PayHere</span>
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