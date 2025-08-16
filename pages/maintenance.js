import { motion } from 'framer-motion'
import { FiTool, FiClock, FiMail, FiPhone } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-orange-500/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-yellow-500/20 rounded-full filter blur-3xl animate-float animation-delay-2000"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center max-w-2xl mx-auto"
      >
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-orange-500/20 mb-6">
            <FiTool className="w-16 h-16 text-orange-400 animate-pulse" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
          We'll Be Right Back!
        </h1>
        
        {/* Message */}
        <p className="text-xl text-gray-400 mb-8">
          We're currently performing scheduled maintenance to improve your experience.
        </p>
        
        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto mb-8">
          <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full animate-pulse" style={{ width: '65%' }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Estimated progress: 65%</p>
        </div>
        
        {/* Time Estimate */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center space-x-2 text-gray-300 mb-4">
            <FiClock className="w-5 h-5" />
            <span className="text-lg">Estimated Completion Time</span>
          </div>
          <div className="text-3xl font-bold text-white">
            2:00 PM - 4:00 PM
          </div>
          <div className="text-gray-400 mt-2">
            Sri Lanka Time (GMT+5:30)
          </div>
        </div>
        
        {/* What We're Doing */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            What we're working on:
          </h3>
          <ul className="text-left text-gray-400 space-y-2">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              Server performance improvements
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              Database optimization
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">⟳</span>
              Security updates
            </li>
            <li className="flex items-start">
              <span className="text-gray-500 mr-2">○</span>
              New feature deployment
            </li>
          </ul>
        </div>
        
        {/* Contact Info */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Need urgent assistance?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@mathpro.lk" 
              className="flex items-center justify-center space-x-2 text-primary-400 hover:text-primary-300"
            >
              <FiMail className="w-5 h-5" />
              <span>support@mathpro.lk</span>
            </a>
            <a 
              href="https://wa.me/94771234567" 
              className="flex items-center justify-center space-x-2 text-green-400 hover:text-green-300"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
        
        {/* Subscribe for Updates */}
        <div className="mt-8 p-6">
          <p className="text-gray-400 mb-4">
            Want to be notified when we're back online?
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all"
            >
              Notify Me
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}