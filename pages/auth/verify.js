import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiXCircle, FiMail, FiRefreshCw } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function VerifyEmail() {
  const router = useRouter()
  const { token, type } = router.query
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState(null)
  const [resending, setResending] = useState(false)
  const [email, setEmail] = useState('')
  
  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setVerifying(false)
    }
  }, [token])
  
  const verifyToken = async () => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type || 'signup'
      })
      
      if (error) throw error
      
      setVerified(true)
      toast.success('Email verified successfully!')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
      
    } catch (error) {
      console.error('Verification error:', error)
      setError(error.message || 'Invalid or expired verification link')
    } finally {
      setVerifying(false)
    }
  }
  
  const resendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address')
      return
    }
    
    setResending(true)
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })
      
      if (error) throw error
      
      toast.success('Verification email sent! Please check your inbox.')
      
    } catch (error) {
      console.error('Resend error:', error)
      toast.error('Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary-500/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-float animation-delay-2000"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <a className="inline-flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-lg px-3 py-1.5 font-display font-bold text-xl">
                  MP
                </div>
              </div>
              <span className="text-white font-display font-semibold text-xl">
                MathPro Academy
              </span>
            </a>
          </Link>
        </div>
        
        {/* Verification Card */}
        <div className="glass rounded-2xl p-8">
          {verifying ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 mb-6">
                <div className="spinner w-10 h-10 border-4"></div>
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                Verifying Your Email
              </h2>
              <p className="text-gray-400">
                Please wait while we verify your email address...
              </p>
            </div>
          ) : verified ? (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6"
              >
                <FiCheckCircle className="w-10 h-10 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                Email Verified!
              </h2>
              <p className="text-gray-400 mb-6">
                Your email has been successfully verified. Redirecting to login...
              </p>
              <Link href="/auth/login">
                <a className="btn-primary inline-flex items-center">
                  Continue to Login
                </a>
              </Link>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
                <FiXCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                Verification Failed
              </h2>
              <p className="text-gray-400 mb-6">
                {error}
              </p>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Enter your email to resend verification link:
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input w-full"
                />
                <button
                  onClick={resendVerification}
                  disabled={resending}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  {resending ? (
                    <div className="spinner w-5 h-5 border-2"></div>
                  ) : (
                    <>
                      <FiRefreshCw />
                      <span>Resend Verification</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 mb-6">
                <FiMail className="w-10 h-10 text-primary-400" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                Verify Your Email
              </h2>
              <p className="text-gray-400 mb-6">
                Please check your email for a verification link. If you haven't received it, you can request a new one.
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input w-full"
                />
                <button
                  onClick={resendVerification}
                  disabled={resending}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  {resending ? (
                    <div className="spinner w-5 h-5 border-2"></div>
                  ) : (
                    <>
                      <FiMail />
                      <span>Send Verification Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link href="/auth/login">
              <a className="text-gray-400 hover:text-primary-400 transition-colors">
                ← Back to Login
              </a>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}