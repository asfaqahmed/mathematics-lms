import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  FiCheckCircle, FiBook, FiPlay, FiDownload, 
  FiMail, FiClock, FiUsers, FiArrowRight
} from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import toast from 'react-hot-toast'

export default function PaymentSuccess({ user }) {
  const router = useRouter()
  const { order_id, payment_id, course_id } = router.query
  
  const [course, setCourse] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (order_id) {
      fetchPaymentData()
    }
  }, [order_id, user])

  const fetchPaymentData = async () => {
    try {
      // Fetch payment details
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select(`
          *,
          profiles (name, email),
          courses (*)
        `)
        .eq('id', order_id)
        .eq('status', 'completed')
        .single()

      if (paymentError) {
        console.error('Payment fetch error:', paymentError)
        toast.error('Payment not found or not completed')
        router.push('/')
        return
      }

      setPayment(paymentData)
      setCourse(paymentData.courses)

      // Verify user has access
      if (user && paymentData.user_id === user.id) {
        setHasAccess(true)
        
        // Check if already has purchase record, if not create one
        const { data: existingPurchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', paymentData.course_id)
          .single()

        if (!existingPurchase) {
          // Create purchase record for course access
          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              user_id: user.id,
              course_id: paymentData.course_id,
              payment_id: paymentData.id,
              access_granted: true,
              purchase_date: new Date().toISOString()
            })

          if (purchaseError) {
            console.error('Error creating purchase record:', purchaseError)
          }
        }
      }

    } catch (error) {
      console.error('Error fetching payment data:', error)
      toast.error('Failed to load payment information')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleStartLearning = () => {
    if (course) {
      router.push(`/courses/${course.id}`)
    }
  }

  const handleDownloadReceipt = async () => {
    try {
      // Generate invoice/receipt
      const response = await fetch('/api/invoice/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          orderId: order_id
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `receipt-${order_id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Receipt downloaded successfully')
      } else {
        toast.error('Failed to generate receipt')
      }
    } catch (error) {
      console.error('Error downloading receipt:', error)
      toast.error('Failed to download receipt')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <Header user={user} />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Please sign in to view payment details</h2>
            <Link href="/auth/login" legacyBehavior>
              <a className="btn-primary">Sign In</a>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!payment || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <Header user={user} />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Payment not found or access denied</h2>
            <Link href="/" legacyBehavior>
              <a className="btn-primary">Go Home</a>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      {/* Success Hero Section */}
      <section className="relative pt-20 pb-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 mb-8">
              <FiCheckCircle className="w-12 h-12 text-green-400" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              🎉 Congratulations!
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Your payment was successful and you now have full access to
            </p>
            
            <h2 className="text-2xl md:text-3xl font-bold text-primary-400 mb-4">
              {course?.title}
            </h2>
            
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Welcome to your learning journey! You can now access all course materials, 
              videos, and resources. Start learning at your own pace and earn your certificate upon completion.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Payment Details */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Course Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <FiBook className="mr-3 text-primary-400" />
                Course Details
              </h3>
              
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden mb-4">
                  <img
                    src={course?.thumbnail || '/api/placeholder/400/225'}
                    alt={course?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <h4 className="text-lg font-semibold text-white">
                  {course?.title}
                </h4>
                
                <p className="text-gray-400 text-sm">
                  {course?.description}
                </p>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dark-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">12</div>
                    <div className="text-sm text-gray-400">Lessons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">6h 30m</div>
                    <div className="text-sm text-gray-400">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">HD</div>
                    <div className="text-sm text-gray-400">Quality</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <FiMail className="mr-3 text-primary-400" />
                Payment Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="text-white font-mono text-sm">{order_id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment ID:</span>
                  <span className="text-white font-mono text-sm">{payment_id || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-semibold">LKR {payment?.amount?.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Method:</span>
                  <span className="text-white">PayHere</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">
                    {new Date(payment?.updated_at || payment?.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between pt-4 border-t border-dark-700">
                  <span className="text-gray-400">Status:</span>
                  <span className="badge badge-success">
                    <FiCheckCircle className="mr-1" /> Completed
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              What's Next?
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Start Learning */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 mb-4">
                  <FiPlay className="w-8 h-8 text-primary-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Start Learning</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Begin your course immediately and learn at your own pace
                </p>
                <button
                  onClick={handleStartLearning}
                  className="btn-primary w-full"
                >
                  Start Course <FiArrowRight className="ml-2" />
                </button>
              </div>

              {/* Download Receipt */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
                  <FiDownload className="w-8 h-8 text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Get Receipt</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Download your payment receipt for your records
                </p>
                <button
                  onClick={handleDownloadReceipt}
                  className="btn-secondary w-full"
                >
                  Download PDF
                </button>
              </div>

              {/* View Dashboard */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                  <FiUsers className="w-8 h-8 text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">My Courses</h4>
                <p className="text-gray-400 text-sm mb-4">
                  View all your enrolled courses and track progress
                </p>
                <Link href="/my-courses" legacyBehavior>
                  <a className="btn-ghost w-full">
                    View Dashboard
                  </a>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Email Confirmation Notice */}
      <section className="py-12 border-t border-dark-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-6">
              <FiMail className="w-8 h-8 text-purple-400" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-4">
              Confirmation Email Sent
            </h3>
            
            <p className="text-gray-400 max-w-2xl mx-auto">
              We've sent a confirmation email to <span className="text-white font-medium">{user?.email}</span> 
              with your course access details and receipt. If you don't see it in your inbox, 
              please check your spam folder.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}