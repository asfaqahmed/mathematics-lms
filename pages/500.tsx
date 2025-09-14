import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiHome, FiRefreshCw, FiAlertTriangle, FiMail } from 'react-icons/fi'

/**
 * Custom 500 Error Page
 * Displays when a server error occurs
 */
export default function Custom500() {
  /**
   * Refreshes the current page
   */
  const handleRefresh = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-red-500/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-orange-500/20 rounded-full filter blur-3xl animate-float animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center max-w-2xl mx-auto"
      >
        {/* Error Icon and Number */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-500/20 mb-6">
            <FiAlertTriangle className="w-16 h-16 text-red-400" aria-hidden="true" />
          </div>
          <h1 className="text-9xl md:text-[10rem] font-display font-bold text-red-400" role="heading" aria-level={1}>
            500
          </h1>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
          Server Error
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          Something went wrong on our end. Our team has been notified and is working to fix it.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg hover:from-primary-600 hover:to-primary-700 transform hover:scale-105 transition-all duration-200"
            aria-label="Refresh the page"
          >
            <FiRefreshCw className="mr-2" aria-hidden="true" />
            Try Again
          </button>

          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 font-semibold text-gray-300 bg-dark-800 border border-dark-600 rounded-lg hover:bg-dark-700 hover:text-white transform hover:scale-105 transition-all duration-200">
            <FiHome className="mr-2" aria-hidden="true" />
            Go to Homepage
          </Link>
        </div>

        {/* Support Information */}
        <div className="mt-12 p-6 glass rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">
            Need Help?
          </h3>
          <p className="text-gray-400 mb-4">
            If this problem persists, please contact our support team:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:support@mathpro.lk"
              className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
              aria-label="Send email to support"
            >
              <FiMail className="mr-2" aria-hidden="true" />
              support@mathpro.lk
            </a>
            <span className="text-gray-600 hidden sm:inline" aria-hidden="true">|</span>
            <a
              href="https://wa.me/94771234567"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 transition-colors"
              aria-label="Contact support via WhatsApp"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}