import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiHome, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi'

export default function Custom500() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-red-500/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-orange-500/20 rounded-full filter blur-3xl animate-float animation-delay-2000"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center max-w-2xl mx-auto"
      >
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-500/20 mb-6">
            <FiAlertTriangle className="w-16 h-16 text-red-400" />
          </div>
          <h1 className="text-9xl md:text-[10rem] font-display font-bold text-red-400">
            500
          </h1>
        </div>
        
        {/* Message */}
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
          Server Error
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          Something went wrong on our end. Our team has been notified and is working to fix it.
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg hover:from-primary-600 hover:to-primary-700 transform hover:scale-105 transition-all duration-200"
          >
            <FiRefreshCw className="mr-2" />
            Try Again
          </button>
          
          <Link href="/">
            <a className="inline-flex items-center justify-center px-6 py-3 font-semibold text-gray-300 bg-dark-800 border border-dark-600 rounded-lg hover:bg-dark-700 hover:text-white transform hover:scale-105 transition-all duration-200">
              <FiHome className="mr-2" />
              Go to Homepage
            </a>
          </Link>
        </div>
        
        {/* Support Info */}
        <div className="mt-12 p-6 glass rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">
            Need Help?
          </h3>
          <p className="text-gray-400 mb-4">
            If this problem persists, please contact our support team:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@mathpro.lk" className="text-primary-400 hover:text-primary-300">
              support@mathpro.lk
            </a>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <a href="https://wa.me/94771234567" className="text-green-400 hover:text-green-300">
              WhatsApp Support
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}