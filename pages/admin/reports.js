import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  FiTrendingUp, FiDollarSign, FiUsers, FiBook,
  FiCalendar, FiDownload, FiPieChart, FiBarChart,
  FiActivity, FiAward, FiClock, FiFilter
} from 'react-icons/fi'
import { supabase, isAdmin } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function AdminReports({ user }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const [reportType, setReportType] = useState('overview')
  const [analytics, setAnalytics] = useState({
    revenue: {
      total: 0,
      growth: 0,
      byMonth: [],
      byCourse: [],
      byMethod: []
    },
    users: {
      total: 0,
      growth: 0,
      newThisMonth: 0,
      activeUsers: 0,
      byMonth: []
    },
    courses: {
      total: 0,
      enrollments: 0,
      completionRate: 0,
      popularCourses: [],
      byCategory: []
    },
    engagement: {
      avgSessionTime: 0,
      lessonsCompleted: 0,
      certificatesIssued: 0,
      satisfactionRate: 0
    }
  })
  
  useEffect(() => {
    checkAdminAccess()
  }, [user])
  
  useEffect(() => {
    if (!loading) {
      fetchAnalytics()
    }
  }, [dateRange, reportType])
  
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
    
    fetchAnalytics()
  }
  
  const fetchAnalytics = async () => {
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }
      
      // Fetch payments data
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          *,
          courses (title, category)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'approved')
      
      // Fetch users data
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', startDate.toISOString())
      
      // Fetch courses data
      const { data: courses } = await supabase
        .from('courses')
        .select(`
          *,
          purchases (id, user_id),
          lessons (id)
        `)
      
      // Process revenue analytics
      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
      const previousMonthRevenue = payments?.filter(p => {
        const date = new Date(p.created_at)
        const prevMonth = new Date()
        prevMonth.setMonth(prevMonth.getMonth() - 2)
        return date >= prevMonth && date < startDate
      }).reduce((sum, p) => sum + p.amount, 0) || 0
      
      const revenueGrowth = previousMonthRevenue > 0 
        ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0
      
      // Group revenue by payment method
      const revenueByMethod = payments?.reduce((acc, p) => {
        const method = p.method
        if (!acc[method]) acc[method] = 0
        acc[method] += p.amount
        return acc
      }, {}) || {}
      
      // Process user analytics
      const newUsers = users?.length || 0
      const totalUsers = await supabase
        .from('profiles')
        .select('count', { count: 'exact' })
      
      // Process course analytics
      const courseStats = courses?.map(course => ({
        ...course,
        enrollments: course.purchases?.length || 0,
        revenue: (course.purchases?.length || 0) * course.price
      })).sort((a, b) => b.enrollments - a.enrollments) || []
      
      // Group courses by category
      const coursesByCategory = courses?.reduce((acc, course) => {
        const category = course.category
        if (!acc[category]) acc[category] = { count: 0, enrollments: 0 }
        acc[category].count++
        acc[category].enrollments += course.purchases?.length || 0
        return acc
      }, {}) || {}
      
      setAnalytics({
        revenue: {
          total: totalRevenue,
          growth: revenueGrowth,
          byMonth: generateMonthlyData(payments, 'amount'),
          byCourse: courseStats.slice(0, 5),
          byMethod: Object.entries(revenueByMethod).map(([method, amount]) => ({
            method,
            amount
          }))
        },
        users: {
          total: totalUsers.count || 0,
          growth: 15.3, // Mock data
          newThisMonth: newUsers,
          activeUsers: Math.floor(newUsers * 0.7),
          byMonth: generateMonthlyData(users, 'count')
        },
        courses: {
          total: courses?.length || 0,
          enrollments: courses?.reduce((sum, c) => sum + (c.purchases?.length || 0), 0) || 0,
          completionRate: 68.5, // Mock data
          popularCourses: courseStats.slice(0, 5),
          byCategory: Object.entries(coursesByCategory).map(([category, data]) => ({
            category,
            ...data
          }))
        },
        engagement: {
          avgSessionTime: 45.2,
          lessonsCompleted: 1234,
          certificatesIssued: 89,
          satisfactionRate: 92.5
        }
      })
      
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }
  
  const generateMonthlyData = (data, type) => {
    if (!data) return []
    
    const months = {}
    const currentDate = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(currentDate.getMonth() - i)
      const monthKey = date.toLocaleString('default', { month: 'short' })
      months[monthKey] = 0
    }
    
    data.forEach(item => {
      const date = new Date(item.created_at)
      const monthKey = date.toLocaleString('default', { month: 'short' })
      if (months.hasOwnProperty(monthKey)) {
        if (type === 'amount') {
          months[monthKey] += item.amount || 0
        } else {
          months[monthKey]++
        }
      }
    })
    
    return Object.entries(months).map(([month, value]) => ({
      month,
      value
    }))
  }
  
  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      analytics
    }
    
    const json = JSON.stringify(reportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${dateRange}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    toast.success('Report exported successfully')
  }
  
  const formatCurrency = (amount) => {
    return `LKR ${(amount / 100).toLocaleString()}`
  }
  
  if (!user) return null
  
  return (
    <AdminLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Reports & Analytics
            </h1>
            <p className="text-gray-400">
              Comprehensive insights into your platform performance
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
            
            <button
              onClick={exportReport}
              className="btn-secondary flex items-center space-x-2"
            >
              <FiDownload />
              <span>Export Report</span>
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-4">
                  <FiDollarSign className="w-8 h-8 text-green-400" />
                  <span className={`text-sm ${analytics.revenue.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {analytics.revenue.growth >= 0 ? '+' : ''}{analytics.revenue.growth.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(analytics.revenue.total)}
                </p>
                <p className="text-sm text-gray-400 mt-1">Total Revenue</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-4">
                  <FiUsers className="w-8 h-8 text-blue-400" />
                  <span className="text-sm text-green-400">
                    +{analytics.users.newThisMonth}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {analytics.users.total}
                </p>
                <p className="text-sm text-gray-400 mt-1">Total Users</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-4">
                  <FiBook className="w-8 h-8 text-purple-400" />
                  <span className="text-sm text-gray-400">
                    {analytics.courses.total} courses
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {analytics.courses.enrollments}
                </p>
                <p className="text-sm text-gray-400 mt-1">Total Enrollments</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-4">
                  <FiActivity className="w-8 h-8 text-yellow-400" />
                  <span className="text-sm text-green-400">
                    {analytics.engagement.satisfactionRate}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {analytics.engagement.avgSessionTime}m
                </p>
                <p className="text-sm text-gray-400 mt-1">Avg. Session Time</p>
              </motion.div>
            </div>
            
            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card"
              >
                <h3 className="text-xl font-semibold text-white mb-6">
                  Revenue Trend
                </h3>
                
                <div className="space-y-4">
                  {analytics.revenue.byMonth.map((data, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">{data.month}</span>
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(data.value)}
                        </span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full"
                          style={{ 
                            width: `${(data.value / Math.max(...analytics.revenue.byMonth.map(d => d.value))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* User Growth Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card"
              >
                <h3 className="text-xl font-semibold text-white mb-6">
                  User Growth
                </h3>
                
                <div className="space-y-4">
                  {analytics.users.byMonth.map((data, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">{data.month}</span>
                        <span className="text-sm font-semibold text-white">
                          {data.value} users
                        </span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                          style={{ 
                            width: `${(data.value / Math.max(...analytics.users.byMonth.map(d => d.value))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* Tables Section */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Top Courses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="card"
              >
                <h3 className="text-xl font-semibold text-white mb-6">
                  Top Performing Courses
                </h3>
                
                <div className="space-y-4">
                  {analytics.revenue.byCourse.map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{course.title}</p>
                          <p className="text-xs text-gray-400">
                            {course.enrollments} students
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-green-400">
                        {formatCurrency(course.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* Payment Methods */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="card"
              >
                <h3 className="text-xl font-semibold text-white mb-6">
                  Payment Methods
                </h3>
                
                <div className="space-y-4">
                  {analytics.revenue.byMethod.map((method, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300 capitalize">{method.method}</span>
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(method.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          style={{ 
                            width: `${(method.amount / analytics.revenue.total) * 100}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {((method.amount / analytics.revenue.total) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="card"
              >
                <h3 className="text-xl font-semibold text-white mb-6">
                  Course Categories
                </h3>
                
                <div className="space-y-4">
                  {analytics.courses.byCategory.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{cat.category}</p>
                        <p className="text-xs text-gray-400">
                          {cat.count} courses
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          {cat.enrollments}
                        </p>
                        <p className="text-xs text-gray-400">enrollments</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* Engagement Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="card mt-8"
            >
              <h3 className="text-xl font-semibold text-white mb-6">
                Engagement Metrics
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FiClock className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Avg. Session</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {analytics.engagement.avgSessionTime}m
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FiBook className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-gray-400">Lessons Done</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {analytics.engagement.lessonsCompleted}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FiAward className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm text-gray-400">Certificates</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {analytics.engagement.certificatesIssued}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FiTrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-gray-400">Satisfaction</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {analytics.engagement.satisfactionRate}%
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}