import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FiUsers, FiBook, FiDollarSign, FiTrendingUp,
  FiClock, FiCheckCircle, FiAlertCircle, FiArrowUp,
  FiArrowDown, FiMoreVertical, FiEye, FiEdit
} from 'react-icons/fi'
import { supabase, isAdmin } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function AdminDashboard({ user }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    userGrowth: 0,
    revenueGrowth: 0,
    courseGrowth: 0,
    paymentGrowth: 0
  })
  const [recentPayments, setRecentPayments] = useState([])
  const [popularCourses, setPopularCourses] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  
  // Handle client-side auth check
  useEffect(() => {
    const handleAuth = async () => {
      // If no user prop, check auth directly
      if (!user) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login?redirectTo=/admin')
          return
        }
        // Wait for _app.js to set the user
        return
      }
      
      setAuthChecked(true)
      checkAdminAccess()
    }
    
    handleAuth()
  }, [user])
  
  useEffect(() => {
    if (authChecked) {
      checkAdminAccess()
    }
  }, [user, authChecked])
  
  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    const adminStatus = await isAdmin(user.id)
    if (!adminStatus) {
      toast.error('Access denied. Admin only.')
      router.push('/')
      return
    }
    
    fetchDashboardData()
  }
  
  const fetchDashboardData = async () => {
    try {
      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (usersError) throw usersError
      
      // Fetch courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
      
      if (coursesError) throw coursesError
      
      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          profiles (name, email),
          courses (title)
        `)
        .order('created_at', { ascending: false })
      
      if (paymentsError) throw paymentsError
      
      // Calculate stats
      const totalRevenue = payments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0)
      
      const pendingPayments = payments.filter(p => p.status === 'pending').length
      
      // Calculate growth (mock data for demo)
      const userGrowth = 12.5
      const revenueGrowth = 23.8
      const courseGrowth = 8.3
      const paymentGrowth = -5.2
      
      setStats({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalRevenue,
        pendingPayments,
        userGrowth,
        revenueGrowth,
        courseGrowth,
        paymentGrowth
      })
      
      // Set recent data
      setRecentPayments(payments.slice(0, 5))
      setRecentUsers(users.slice(0, 5))
      
      // Calculate popular courses (mock enrollment count)
      const coursesWithEnrollment = courses.map(course => ({
        ...course,
        enrollments: Math.floor(Math.random() * 100) + 10
      })).sort((a, b) => b.enrollments - a.enrollments)
      
      setPopularCourses(coursesWithEnrollment.slice(0, 5))
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }
  
  const formatCurrency = (amount) => {
    return `LKR ${(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      failed: 'badge-danger'
    }
    return badges[status] || 'badge-primary'
  }
  
  if (!user) return null
  
  return (
    <AdminLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <FiUsers className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className={`flex items-center text-sm ${
                    stats.userGrowth >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stats.userGrowth >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                    <span className="ml-1">{Math.abs(stats.userGrowth)}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.totalUsers}
                </div>
                <div className="text-sm text-gray-400">Total Users</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <FiDollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div className={`flex items-center text-sm ${
                    stats.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stats.revenueGrowth >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                    <span className="ml-1">{Math.abs(stats.revenueGrowth)}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <div className="text-sm text-gray-400">Total Revenue</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FiBook className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className={`flex items-center text-sm ${
                    stats.courseGrowth >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stats.courseGrowth >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                    <span className="ml-1">{Math.abs(stats.courseGrowth)}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.totalCourses}
                </div>
                <div className="text-sm text-gray-400">Active Courses</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <FiAlertCircle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <Link href="/admin/payments" legacyBehavior>
                    <a className="text-sm text-primary-400 hover:text-primary-300">
                      View All →
                    </a>
                  </Link>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.pendingPayments}
                </div>
                <div className="text-sm text-gray-400">Pending Payments</div>
              </motion.div>
            </div>
            
            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Recent Payments */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Recent Payments</h2>
                    <Link href="/admin/payments" legacyBehavior>
                      <a className="text-sm text-primary-400 hover:text-primary-300">
                        View All →
                      </a>
                    </Link>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="table-auto">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Course</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td>
                              <div>
                                <div className="font-medium text-white">
                                  {payment.profiles?.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {payment.profiles?.email}
                                </div>
                              </div>
                            </td>
                            <td>{payment.courses?.title || 'N/A'}</td>
                            <td className="font-mono">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(payment.status)}`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="text-gray-400 text-sm">
                              {formatDate(payment.created_at)}
                            </td>
                            <td>
                              <button className="text-gray-400 hover:text-white">
                                <FiMoreVertical />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Popular Courses */}
                <div className="card mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Popular Courses</h2>
                    <Link href="/admin/courses" legacyBehavior>
                      <a className="text-sm text-primary-400 hover:text-primary-300">
                        Manage →
                      </a>
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    {popularCourses.map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center font-bold text-primary-400">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{course.title}</h4>
                            <p className="text-sm text-gray-400">{course.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            {course.enrollments} students
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatCurrency(course.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Recent Users */}
              <div className="lg:col-span-1">
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">New Users</h2>
                    <Link href="/admin/users" legacyBehavior>
                      <a className="text-sm text-primary-400 hover:text-primary-300">
                        View All →
                      </a>
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">
                            {user.name || 'Unknown'}
                          </h4>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                        <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="card mt-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
                  
                  <div className="space-y-3">
                    <Link href="/admin/courses/new" legacyBehavior>
                      <a className="w-full btn-primary flex items-center justify-center space-x-2">
                        <FiBook />
                        <span>Add New Course</span>
                      </a>
                    </Link>
                    
                    <Link href="/admin/payments" legacyBehavior>
                      <a className="w-full btn-secondary flex items-center justify-center space-x-2">
                        <FiCheckCircle />
                        <span>Review Payments</span>
                      </a>
                    </Link>
                    
                    <Link href="/admin/users" legacyBehavior>
                      <a className="w-full btn-ghost flex items-center justify-center space-x-2">
                        <FiUsers />
                        <span>Manage Users</span>
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}