import { useState } from 'react'
import { FiCreditCard, FiLoader } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'

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
      // Get hash from backend (like working implementation)
      const response = await fetch('/api/payments/payhere?action=start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          userId: user.id,
          amount: course.price.toString(),
          title: course.title
        }),
      });

      if (!response.ok) throw new Error('Failed to initiate payment');

      const { hash, merchant_id, order_id, amount } = await response.json();

      // Initialize PayHere payment (matching Stripe behavior)
      const payment = {
        sandbox: true, // Set to false for production
        merchant_id,
        return_url: `${window.location.origin}/payment/success?order_id=${order_id}&course_id=${course.id}&payment_id=${order_id}`,
        cancel_url: `${window.location.origin}/courses/${course.id}?canceled=true`,
        notify_url: `${window.location.origin}/api/payments/payhere-callback`,
        order_id: order_id,
        items: course.title,
        amount: amount,
        currency: 'LKR',
        first_name: user.name?.split(' ')[0] || 'User',
        last_name: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: user.phone || '0000000000',
        address: user.address || 'No Address',
        city: user.city || 'Colombo',
        country: 'Sri Lanka',
        hash,
      };

      // Launch PayHere checkout (let PayHere handle redirects like Stripe does)
      if (window.payhere) {
        window.payhere.onCompleted = function onCompleted(orderId) {
          console.log('Payment completed. OrderID:' + orderId)
          toast.success('Payment completed! Redirecting to success page...')
          if (onSuccess) onSuccess(orderId)
          setLoading(false)
          // Let PayHere handle redirect via return_url (no manual redirect)
        }

        window.payhere.onDismissed = function onDismissed() {
          console.log('Payment dismissed')
          toast.info('Payment was cancelled')
          setLoading(false)
          // User will remain on current page
        }

        window.payhere.onError = function onError(error) {
          console.log('Error:' + error)
          toast.error('Payment failed: ' + error)
          if (onError) onError(error)
          setLoading(false)
          // User will remain on current page
        }

        window.payhere.startPayment(payment);
      } else {
        console.error('PayHere SDK not loaded');
        throw new Error('PayHere SDK not loaded');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment initialization failed');
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