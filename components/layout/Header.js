import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMenu, FiX, FiUser, FiLogOut, FiBook, FiGrid, FiSettings } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function Header({ user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Error signing out')
    }
  }
  
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/courses', label: 'Courses' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' }
  ]
  
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark-900/95 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-lg px-3 py-1.5 font-display font-bold text-xl">
                MP
              </div>
            </div>
            <span className="text-white font-display font-semibold text-xl">
              MathPro Academy
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-gray-300 hover:text-white transition-colors duration-200 font-medium ${
                  router.pathname === link.href ? 'text-primary-400' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{user.name || user.email}</span>
                </button>
                
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 rounded-lg bg-dark-800 border border-dark-600 shadow-xl overflow-hidden"
                    >
                      <Link href="/my-courses" className="flex items-center space-x-2 px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                        <FiBook />
                        <span>My Courses</span>
                      </Link>
                      
                      {user.role === 'admin' && (
                        <Link href="/admin" className="flex items-center space-x-2 px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                          <FiGrid />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      
                      <Link href="/profile" className="flex items-center space-x-2 px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors">
                        <FiSettings />
                        <span>Profile</span>
                      </Link>
                      
                      <hr className="border-dark-600" />
                      
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 w-full px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
                      >
                        <FiLogOut />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-300 hover:text-white font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-900/95 backdrop-blur-xl border-t border-white/5"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors ${
                    router.pathname === link.href ? 'text-primary-400 bg-dark-800' : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {user ? (
                <>
                  <Link href="/my-courses"
                    className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Courses
                  </Link>
                  
                  {user.role === 'admin' && (
                    <Link href="/admin"
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  
                  <button
                    onClick={() => {
                      handleSignOut()
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login"
                    className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link href="/auth/register"
                    className="block px-4 py-2 text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}