import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  FiBook, FiClock, FiTrendingUp, FiAward, 
  FiPlay, FiCheckCircle, FiCalendar, FiDownload 
} from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import toast from 'react-hot-toast'

export default function MyCourses({ user }) {
  const router = useRouter()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('in-progress')
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalHours: 0,
    certificates: 0
  })
  
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchUserCourses()
  }, [user])
  
  const fetchUserCourses = async () => {
    try {
      // Fetch purchased courses
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select(`
          *,
          courses (
            *,
            lessons (*)
          )
        `)
        .eq('user_id', user.id)
        .eq('access_granted', true)
      
      if (error) throw error
      
      // Process courses with progress
      const coursesWithProgress = await Promise.all(
        purchases.map(async (purchase) => {
          const course = purchase.courses
          const totalLessons = course.lessons.length
          
          // Get progress (simulated for now)
          const completedLessons = Math.floor(Math.random() * totalLessons)
          const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
          
          return {
            ...course,
            purchaseDate: purchase.purchase_date,
            progress: Math.round(progress),
            completedLessons,
            totalLessons,
            isCompleted: progress === 100
          }
        })
      )
      
      setCourses(coursesWithProgress)
      
      // Calculate stats
      setStats({
        totalCourses: coursesWithProgress.length,
        completedCourses: coursesWithProgress.filter(c => c.isCompleted).length,
        totalHours: coursesWithProgress.reduce((acc, c) => acc + (c.totalLessons * 15 / 60), 0),
        certificates: coursesWithProgress.filter(c => c.isCompleted).length
      })
      
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load your courses')
    } finally {
      setLoading(false)
    }
  }
  
  const filteredCourses = courses.filter(course => {
    if (activeTab === 'in-progress') return !course.isCompleted
    if (activeTab === 'completed') return course.isCompleted
    return true
  })
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  if (!user) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              My Learning Dashboard
            </h1>
            <p className="text-xl text-gray-400">
              Welcome back, {user.name || user.email}! Continue your learning journey.
            </p>
          </motion.div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <FiBook className="w-8 h-8 text-primary-400" />
                <span className="text-3xl font-bold text-white">{stats.totalCourses}</span>
              </div>
              <h3 className="text-gray-400">Enrolled Courses</h3>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <FiCheckCircle className="w-8 h-8 text-green-400" />
                <span className="text-3xl font-bold text-white">{stats.completedCourses}</span>
              </div>
              <h3 className="text-gray-400">Completed</h3>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <FiClock className="w-8 h-8 text-blue-400" />
                <span className="text-3xl font-bold text-white">{Math.round(stats.totalHours)}h</span>
              </div>
              <h3 className="text-gray-400">Learning Hours</h3>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <FiAward className="w-8 h-8 text-yellow-400" />
                <span className="text-3xl font-bold text-white">{stats.certificates}</span>
              </div>
              <h3 className="text-gray-400">Certificates</h3>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Courses Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex items-center space-x-1 mb-8 bg-dark-800 rounded-lg p-1 w-fit">
            {[
              { id: 'all', label: 'All Courses', count: courses.length },
              { id: 'in-progress', label: 'In Progress', count: courses.filter(c => !c.isCompleted).length },
              { id: 'completed', label: 'Completed', count: courses.filter(c => c.isCompleted).length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 badge badge-primary">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Courses Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-800 mb-4">
                <FiBook className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {activeTab === 'completed' 
                  ? 'No completed courses yet' 
                  : activeTab === 'in-progress'
                  ? 'No courses in progress'
                  : 'No courses found'}
              </h3>
              <p className="text-gray-400 mb-6">
                {activeTab === 'all' && 'Start learning by enrolling in a course'}
              </p>
              {activeTab === 'all' && (
                <Link href="/courses" legacyBehavior>
                  <a className="btn-primary">Browse Courses</a>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="card card-hover h-full flex flex-col">
                    {/* Thumbnail with Progress Overlay */}
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                      <img
                        src={course.thumbnail || '/api/placeholder/400/225'}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white text-sm font-medium">
                              {course.progress}% Complete
                            </span>
                            <span className="text-white text-sm">
                              {course.completedLessons}/{course.totalLessons} lessons
                            </span>
                          </div>
                          <div className="w-full bg-dark-900/50 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      {course.isCompleted && (
                        <div className="absolute top-3 right-3">
                          <span className="badge badge-success">
                            <FiCheckCircle className="mr-1" /> Completed
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {course.title}
                      </h3>
                      
                      <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">
                        {course.description}
                      </p>
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <FiCalendar className="w-4 h-4" />
                          <span>Enrolled {formatDate(course.purchaseDate)}</span>
                        </div>
                        {course.isCompleted && (
                          <button className="text-primary-400 hover:text-primary-300">
                            <FiDownload className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <Link href={`/courses/${course.id}`} legacyBehavior>
                        <a className="w-full btn-primary flex items-center justify-center space-x-2">
                          <FiPlay />
                          <span>{course.isCompleted ? 'Review Course' : 'Continue Learning'}</span>
                        </a>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Recommendations Section */}
      {courses.length > 0 && (
        <section className="py-12 border-t border-dark-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
              <Link href="/courses" legacyBehavior>
                <a className="text-primary-400 hover:text-primary-300 font-medium">
                  View All →
                </a>
              </Link>
            </div>
            
            <div className="text-center text-gray-400 py-8">
              <FiTrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>Personalized recommendations coming soon!</p>
            </div>
          </div>
        </section>
      )}
      
      <Footer />
    </div>
  )
}