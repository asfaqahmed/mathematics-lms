import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  FiXCircle, FiArrowLeft, FiRefreshCw, FiMail, 
  FiHelpCircle, FiCreditCard, FiPhone
} from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import toast from 'react-hot-toast'

export default function PaymentCancel({ user }) {
  const router = useRouter()
  const { order_id, course_id, reason } = router.query
  
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (course_id) {
      fetchCourseData()
    } else {
      setLoading(false)
    }
  }, [course_id])

  const fetchCourseData = async () => {
    try {
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', course_id)
        .single()

      if (!error && courseData) {
        setCourse(courseData)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetryPayment = () => {
    if (course) {
      router.push(`/courses/${course.id}`)
    } else {
      router.push('/courses')
    }
  }

  const handleContactSupport = () => {
    toast.success('Redirecting to support...')
    // You can redirect to a contact form or support page
    router.push('/contact')
  }

  const getReasonMessage = (reasonCode) => {
    switch (reasonCode) {
      case 'user_cancelled':
        return 'You cancelled the payment process.'
      case 'payment_failed':
        return 'The payment could not be processed.'
      case 'insufficient_funds':
        return 'Insufficient funds in your account.'
      case 'card_declined':
        return 'Your payment method was declined.'
      case 'timeout':
        return 'The payment session timed out.'
      default:
        return 'The payment was not completed.'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      {/* Cancel Hero Section */}
      <section className="relative pt-20 pb-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Cancel Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 mb-8">
              <FiXCircle className="w-12 h-12 text-red-400" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Payment Cancelled
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              {getReasonMessage(reason)}
            </p>
            
            {course && (
              <p className="text-lg text-gray-400 mb-8">
                Your enrollment for <span className="text-primary-400 font-semibold">{course.title}</span> was not completed.
              </p>
            )}
            
            <p className="text-gray-400 max-w-2xl mx-auto">
              Don't worry! No charges were made to your account. 
              You can try again or contact our support team if you need assistance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Course Info (if available) */}
      {course && (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 text-center">
                You were trying to enroll in:
              </h3>
              
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-shrink-0">
                  <div className="w-48 h-32 rounded-lg overflow-hidden">
                    <img
                      src={course.thumbnail || '/api/placeholder/300/200'}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-2xl font-bold text-white mb-2">
                    {course.title}
                  </h4>
                  
                  <p className="text-gray-400 mb-4">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center justify-center md:justify-start space-x-6 text-sm text-gray-500">
                    <div>Category: {course.category || 'Course'}</div>
                    <div>Price: LKR {course.price?.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Action Options */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              What would you like to do?
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Retry Payment */}
              <div className="text-center p-6 rounded-xl border border-dark-700 hover:border-primary-500/50 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 mb-4">
                  <FiRefreshCw className="w-8 h-8 text-primary-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Try Again</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Go back to the course page and attempt the payment again
                </p>
                <button
                  onClick={handleRetryPayment}
                  className="btn-primary w-full"
                >
                  Retry Payment
                </button>
              </div>

              {/* Contact Support */}
              <div className="text-center p-6 rounded-xl border border-dark-700 hover:border-green-500/50 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                  <FiHelpCircle className="w-8 h-8 text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Get Help</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Contact our support team for assistance with your payment
                </p>
                <button
                  onClick={handleContactSupport}
                  className="btn-secondary w-full"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Help & FAQ */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-white mb-8 text-center">
              Common Payment Issues
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Payment Methods */}
              <div className="glass rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FiCreditCard className="mr-3 text-primary-400" />
                  Payment Methods
                </h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>• Credit/Debit Cards (Visa, Mastercard)</li>
                  <li>• Online Banking</li>
                  <li>• Digital Wallets</li>
                  <li>• Bank Transfers</li>
                </ul>
                <p className="text-xs text-gray-500 mt-4">
                  Make sure your payment method is enabled for online transactions.
                </p>
              </div>

              {/* Troubleshooting */}
              <div className="glass rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FiHelpCircle className="mr-3 text-green-400" />
                  Troubleshooting Tips
                </h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>• Check your internet connection</li>
                  <li>• Verify your card details are correct</li>
                  <li>• Ensure sufficient funds are available</li>
                  <li>• Try using a different browser</li>
                  <li>• Disable ad blockers temporarily</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-12 border-t border-dark-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center"
          >
            <h3 className="text-xl font-bold text-white mb-6">
              Need Immediate Help?
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <div className="flex items-center space-x-3 text-gray-400">
                <FiMail className="w-5 h-5 text-primary-400" />
                <span>support@mathslms.com</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-400">
                <FiPhone className="w-5 h-5 text-green-400" />
                <span>+94 77 123 4567</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Our support team is available 24/7 to assist you with any payment issues.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses" legacyBehavior>
                <a className="btn-ghost flex items-center justify-center space-x-2">
                  <FiArrowLeft />
                  <span>Browse All Courses</span>
                </a>
              </Link>
              
              <Link href="/" legacyBehavior>
                <a className="btn-secondary">
                  Go to Homepage
                </a>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}