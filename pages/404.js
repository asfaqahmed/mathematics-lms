import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiHome, FiArrowLeft, FiSearch } from 'react-icons/fi'

export default function Custom404() {
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
        className="relative text-center max-w-2xl mx-auto"
      >
        {/* 404 Text */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[12rem] font-display font-bold gradient-text">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-gradient-to-r from-primary-500/30 to-purple-500/30 rounded-full filter blur-3xl"></div>
          </div>
        </div>
        
        {/* Message */}
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <a className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg hover:from-primary-600 hover:to-primary-700 transform hover:scale-105 transition-all duration-200">
              <FiHome className="mr-2" />
              Go to Homepage
            </a>
          </Link>
          
          <Link href="/courses">
            <a className="inline-flex items-center justify-center px-6 py-3 font-semibold text-gray-300 bg-dark-800 border border-dark-600 rounded-lg hover:bg-dark-700 hover:text-white transform hover:scale-105 transition-all duration-200">
              <FiSearch className="mr-2" />
              Browse Courses
            </a>
          </Link>
        </div>
        
        {/* Suggestions */}
        <div className="mt-12 p-6 glass rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Home', href: '/' },
              { label: 'Courses', href: '/courses' },
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/contact' }
            ].map((link) => (
              <Link key={link.label} href={link.href}>
                <a className="text-gray-400 hover:text-primary-400 transition-colors">
                  {link.label} →
                </a>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}