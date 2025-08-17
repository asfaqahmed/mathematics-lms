import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMenu, FiX, FiHome, FiBook, FiUser, FiSettings } from 'react-icons/fi'

export default function MobileNav({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const menuItems = [
    {
      title: 'Home',
      icon: FiHome,
      href: '/'
    },
    {
      title: 'Courses',
      icon: FiBook,
      href: '/courses'
    },
    {
      title: 'My Courses',
      icon: FiBook,
      href: '/my-courses',
      authRequired: true
    },
    {
      title: 'Profile',
      icon: FiUser,
      href: '/profile',
      authRequired: true
    }
  ]

  const filteredItems = menuItems.filter(item => 
    !item.authRequired || user
  )

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth/login')
      setIsOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="md:hidden">
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
      >
        {isOpen ? (
          <FiX className="w-6 h-6" />
        ) : (
          <FiMenu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-80 bg-dark-900 border-l border-dark-700 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-dark-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-6">
                <div className="space-y-4">
                  {filteredItems.map((item) => {
                    const Icon = item.icon
                    const isActive = router.pathname === item.href
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={`
                            flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer
                            ${isActive 
                              ? 'bg-primary-600 text-white' 
                              : 'text-gray-400 hover:text-white hover:bg-dark-700'
                            }
                          `}
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </nav>

              {/* User Section */}
              <div className="p-6 border-t border-dark-700">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-dark-700/50 rounded-lg">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors text-left"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/auth/login">
                      <button
                        className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Sign In
                      </button>
                    </Link>
                    <Link href="/auth/register">
                      <button
                        className="w-full px-4 py-3 border border-primary-600 text-primary-400 rounded-lg hover:bg-primary-600 hover:text-white transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Sign Up
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}