import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { 
  FiHome, FiBook, FiUsers, FiSettings, FiBarChart3,
  FiCreditCard, FiMail, FiFileText, FiChevronLeft,
  FiChevronRight, FiLogOut
} from 'react-icons/fi'

export default function Sidebar({ user, collapsed = false, onToggle }) {
  const router = useRouter()

  const menuItems = [
    {
      title: 'Dashboard',
      icon: FiHome,
      href: '/admin',
      exact: true
    },
    {
      title: 'Courses',
      icon: FiBook,
      href: '/admin/courses'
    },
    {
      title: 'Users',
      icon: FiUsers,
      href: '/admin/users'
    },
    {
      title: 'Payments',
      icon: FiCreditCard,
      href: '/admin/payments'
    },
    {
      title: 'Reports',
      icon: FiBarChart3,
      href: '/admin/reports'
    },
    {
      title: 'Emails',
      icon: FiMail,
      href: '/admin/emails'
    },
    {
      title: 'Settings',
      icon: FiSettings,
      href: '/admin/settings'
    }
  ]

  const isActive = (href, exact = false) => {
    if (exact) {
      return router.pathname === href
    }
    return router.pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-dark-900 border-r border-dark-700 flex flex-col h-screen"
    >
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-bold text-white">Math LMS</h2>
              <p className="text-sm text-gray-400">Admin Panel</p>
            </motion.div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
          >
            {collapsed ? (
              <FiChevronRight className="w-4 h-4" />
            ) : (
              <FiChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`
                  flex items-center px-3 py-2 rounded-lg transition-all cursor-pointer
                  ${active 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                  }
                  ${collapsed ? 'justify-center' : 'space-x-3'}
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.1 }}
                    className="font-medium"
                  >
                    {item.title}
                  </motion.span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-dark-700">
        {!collapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-2">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </motion.div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}