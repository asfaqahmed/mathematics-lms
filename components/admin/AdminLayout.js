import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiGrid, FiBook, FiUsers, FiDollarSign, FiSettings,
  FiLogOut, FiMenu, FiX, FiHome, FiMail, FiFileText,
  FiBarChart, FiBell, FiSearch
} from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminLayout({ children, user }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Error signing out')
    }
  }
  
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiGrid },
    { name: 'Courses', href: '/admin/courses', icon: FiBook },
    { name: 'Users', href: '/admin/users', icon: FiUsers },
    { name: 'Payments', href: '/admin/payments', icon: FiDollarSign },
    { name: 'Reports', href: '/admin/reports', icon: FiBarChart },
    { name: 'Emails', href: '/admin/emails', icon: FiMail },
    { name: 'Settings', href: '/admin/settings', icon: FiSettings }
  ]
  
  const isActive = (href) => router.pathname === href
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Sidebar Desktop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-30"
          >
            <div className="flex flex-col flex-1 min-h-0 bg-dark-900/95 backdrop-blur-xl border-r border-white/5">
              {/* Logo */}
              <div className="flex items-center h-16 px-4 border-b border-white/5">
                <Link href="/admin" legacyBehavior>
                  <a className="flex items-center space-x-3 group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-lg px-2 py-1 font-display font-bold text-lg">
                        MP
                      </div>
                    </div>
                    <span className="text-white font-display font-semibold">
                      Admin Panel
                    </span>
                  </a>
                </Link>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link key={item.name} href={item.href} legacyBehavior>
                      <a
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                          active
                            ? 'bg-primary-500/20 text-primary-400 border-l-4 border-primary-400'
                            : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </a>
                    </Link>
                  )
                })}
              </nav>
              
              {/* User Info */}
              <div className="flex items-center p-4 border-t border-white/5">
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">
                      {user?.name || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  <FiLogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:pl-64' : ''} flex flex-col flex-1`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-dark-900/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              {/* Sidebar Toggle Desktop */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block text-gray-400 hover:text-white"
              >
                <FiMenu className="h-6 w-6" />
              </button>
              
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <FiMenu className="h-6 w-6" />
              </button>
              
              {/* Search Bar */}
              <div className="ml-4 flex-1 max-w-md">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative text-gray-400 hover:text-white">
                <FiBell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              
              {/* Back to Site */}
              <Link href="/" legacyBehavior>
                <a className="text-gray-400 hover:text-white">
                  <FiHome className="h-6 w-6" />
                </a>
              </Link>
            </div>
          </div>
        </header>
        
        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              
              {/* Sidebar */}
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="lg:hidden fixed inset-y-0 left-0 flex w-64 flex-col z-50"
              >
                <div className="flex flex-col flex-1 min-h-0 bg-dark-900 border-r border-white/5">
                  {/* Header */}
                  <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
                    <span className="text-white font-display font-semibold text-lg">
                      Admin Panel
                    </span>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {/* Navigation */}
                  <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link key={item.name} href={item.href} legacyBehavior>
                          <a
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                              active
                                ? 'bg-primary-500/20 text-primary-400'
                                : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                            }`}
                          >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </a>
                        </Link>
                      )
                    })}
                  </nav>
                  
                  {/* User Info */}
                  <div className="p-4 border-t border-white/5">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-dark-800 hover:text-white"
                    >
                      <FiLogOut className="mr-3 h-5 w-5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        
        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}