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
  const { order_id, payment_id, course_id, session_id } = router.query
  
  const [course, setCourse] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (order_id || session_id) {
      fetchPaymentData()
    }
  }, [order_id, session_id, user])

  const fetchPaymentData = async () => {
    try {
      let paymentData = null

      // Handle Stripe session_id flow
      if (session_id) {
        console.log('Processing Stripe payment verification...')
        // Verify the Stripe session first
        const response = await fetch(`/api/payments/verify-session?session_id=${session_id}`)
        const verificationData = await response.json()
        
        if (verificationData.success) {
          // Find the payment by session ID
          const { data: stripePayment, error: stripePaymentError } = await supabase
            .from('payments')
            .select(`
              *,
              profiles (name, email),
              courses (*)
            `)
            .eq('payment_id', session_id)
            .eq('status', 'approved')
            .single()

          if (!stripePaymentError) {
            paymentData = stripePayment
          }
        }

        // If no payment found by session_id, try by course_id and user
        if (!paymentData && course_id && user) {
          const { data: coursePayment, error: coursePaymentError } = await supabase
            .from('payments')
            .select(`
              *,
              profiles (name, email),
              courses (*)
            `)
            .eq('course_id', course_id)
            .eq('user_id', user.id)
            .eq('status', 'approved')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

          if (!coursePaymentError) {
            paymentData = coursePayment
          }
        }
      } 
      // Handle PayHere order_id flow  
      else if (order_id) {
        console.log('Processing PayHere payment verification...')
        const { data: orderPayment, error: orderPaymentError } = await supabase
          .from('payments')
          .select(`
            *,
            profiles (name, email),
            courses (*)
          `)
          .eq('id', order_id)
          .eq('status', 'completed')
          .single()

        if (!orderPaymentError) {
          paymentData = orderPayment
          console.log('PayHere payment found:', paymentData)
        } else {
          console.log('PayHere payment not found or not completed yet, checking with any status...')
          // Try to find the payment even if not completed yet
          const { data: pendingPayment, error: pendingError } = await supabase
            .from('payments')
            .select(`
              *,
              profiles (name, email),
              courses (*)
            `)
            .eq('id', order_id)
            .single()
            
          if (!pendingError && pendingPayment) {
            console.log('Found PayHere payment with status:', pendingPayment.status)
            // If payment exists but not completed, wait a moment and check callback
            if (pendingPayment.status === 'pending') {
              console.log('Payment is pending, callback might still be processing...')
              // Wait for callback to process
              await new Promise(resolve => setTimeout(resolve, 2000))
              
              // Check again
              const { data: updatedPayment } = await supabase
                .from('payments')
                .select(`
                  *,
                  profiles (name, email),
                  courses (*)
                `)
                .eq('id', order_id)
                .eq('status', 'completed')
                .single()
              
              if (updatedPayment) {
                paymentData = updatedPayment
                console.log('PayHere payment completed after callback processing')
              }
            }
          }
        }
      }

      if (!paymentData) {
        console.error('Payment not found or not completed')
        toast.error('Payment not found or not completed')
        router.push('/')
        return
      }

      setPayment(paymentData)
      setCourse(paymentData.courses)

      // Verify user has access (if user is authenticated)
      if (user && paymentData.user_id === user.id) {
        setHasAccess(true)
        console.log('User verified, creating purchase record and sending email...')
        
        // Check if already has purchase record, if not create one
        const { data: existingPurchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', paymentData.course_id)
          .single()

        if (!existingPurchase) {
          console.log('Creating purchase record...')
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
          } else {
            console.log('Purchase record created successfully')
          }
        } else {
          console.log('Purchase record already exists')
        }

        // Send confirmation email for PayHere payments (if not already sent)
        if (order_id && paymentData) {
          try {
            console.log('Sending confirmation email for PayHere payment...')
            const response = await fetch('/api/payments/send-confirmation-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentId: paymentData.id,
                studentName: user.name,
                studentEmail: user.email,
                courseName: paymentData.courses?.title,
                amount: paymentData.amount,
                paymentMethod: 'PayHere'
              })
            })

            if (response.ok) {
              console.log('Confirmation email sent successfully')
            } else {
              console.log('Email service might not be available')
            }
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError)
          }
        }
      } else if (!user) {
        // User not authenticated yet, show payment info but require login for access
        setHasAccess(false)
      } else {
        // User authenticated but doesn't own this payment
        toast.error('This payment doesn\'t belong to your account')
        router.push('/')
        return
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
          orderId: order_id || payment?.id,
          sessionId: session_id
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `receipt-${order_id || session_id || payment?.id}.pdf`
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

  if (!user && !payment) {
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

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <Header user={user} />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Payment not found</h2>
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
            
            {!user ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                <p className="text-yellow-400 mb-2">
                  🔐 Please sign in to access your course
                </p>
                <p className="text-sm text-gray-400">
                  Your payment was successful, but you need to sign in to access your course materials.
                </p>
                <Link href="/auth/login" legacyBehavior>
                  <a className="inline-block mt-3 px-4 py-2 bg-yellow-500 text-dark-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors">
                    Sign In Now
                  </a>
                </Link>
              </div>
            ) : (
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Welcome to your learning journey! You can now access all course materials, 
                videos, and resources. Start learning at your own pace and earn your certificate upon completion.
              </p>
            )}
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
                  <span className="text-white font-mono text-sm">{order_id || payment?.id || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment ID:</span>
                  <span className="text-white font-mono text-sm">{session_id || payment_id || payment?.payment_id || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-semibold">LKR {payment?.amount?.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Method:</span>
                  <span className="text-white">{session_id ? 'Stripe' : 'PayHere'}</span>
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
                {user && hasAccess ? (
                  <button
                    onClick={handleStartLearning}
                    className="btn-primary w-full"
                  >
                    Start Course <FiArrowRight className="ml-2" />
                  </button>
                ) : (
                  <Link href="/auth/login" legacyBehavior>
                    <a className="btn-primary w-full inline-flex items-center justify-center">
                      Sign In to Access <FiArrowRight className="ml-2" />
                    </a>
                  </Link>
                )}
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