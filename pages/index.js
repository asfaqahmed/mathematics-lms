import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiPlay, FiBook, FiUsers, FiAward, FiCheckCircle, FiArrowRight, FiStar } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import CourseCard from '../components/course/CourseCard'

export default function Home({ user }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchCourses()
  }, [])
  
  const fetchCourses = async () => {
    try {
      console.log('🔍 Fetching featured courses...');
      
      // First try to get featured courses
      let { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(3)
      
      console.log('📊 Featured courses result:', { data, error });
      
      // If no featured courses found, get the latest 3 courses
      if (!error && (!data || data.length === 0)) {
        console.log('🔍 No featured courses, getting latest courses...');
        const fallback = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3)
        
        data = fallback.data
        error = fallback.error
        console.log('📊 Latest courses result:', { data, error });
      }
      
      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      
      console.log('✅ Courses fetched successfully:', data?.length || 0, 'courses');
      setCourses(data || [])
    } catch (error) {
      console.error('💥 Error fetching courses:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } finally {
      setLoading(false)
    }
  }
  
  const stats = [
    { icon: FiUsers, value: '1000+', label: 'Active Students' },
    { icon: FiBook, value: '50+', label: 'Video Lessons' },
    { icon: FiAward, value: '98%', label: 'Success Rate' },
    { icon: FiStar, value: '4.9', label: 'Average Rating' }
  ]
  
  const features = [
    {
      title: 'Expert Instruction',
      description: 'Learn from experienced math educators with proven teaching methods',
      icon: FiAward
    },
    {
      title: 'Interactive Content',
      description: 'Engage with video lessons, practice problems, and real-world applications',
      icon: FiPlay
    },
    {
      title: 'Flexible Learning',
      description: 'Study at your own pace, anywhere, anytime with lifetime access',
      icon: FiBook
    },
    {
      title: 'Community Support',
      description: 'Join a community of learners and get help when you need it',
      icon: FiUsers
    }
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
              <span className="gradient-text">Master Mathematics</span>
              <br />
              <span className="text-white">With Expert Guidance</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Transform your mathematical understanding with our comprehensive courses.
              From fundamentals to advanced topics, we make math accessible and enjoyable.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link legacyBehavior href="/courses">
                <a className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg hover:from-primary-600 hover:to-primary-700 transform hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/25">
                  <span className="relative">Browse Courses</span>
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Link>
              
              <Link href="/auth/register" legacyBehavior>
                <a className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-gray-300 transition-all duration-200 bg-dark-800 border border-dark-600 rounded-lg hover:bg-dark-700 hover:text-white transform hover:scale-105">
                  <span className="relative">Get Started Free</span>
                  <FiPlay className="ml-2" />
                </a>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-primary-500/20">
                    <stat.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience a revolutionary approach to learning mathematics
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="card card-hover p-6 h-full">
                  <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-lg bg-gradient-to-r from-primary-500/20 to-purple-500/20 group-hover:from-primary-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                    <feature.icon className="w-7 h-7 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Courses */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Featured Courses
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Start your learning journey with our most popular courses
            </p>
          </motion.div>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="spinner"></div>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {/* <div className="text-gray-400 mb-4">
                <FiBook className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No courses available yet</h3>
                <p className="text-gray-400 mb-6">Add some courses to showcase them here.</p>
                <button
                  onClick={() => {
                    fetch('/api/seed-courses', { method: 'POST' })
                      .then(res => res.json())
                      .then(data => {
                        console.log('Seed result:', data)
                        if (data.courses) {
                          fetchCourses() // Refresh the courses
                        }
                      })
                      .catch(err => console.error('Seed error:', err))
                  }}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add Sample Courses
                </button>
              </div> */}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/courses" legacyBehavior>
              <a className="inline-flex items-center text-primary-400 hover:text-primary-300 font-semibold group">
                View All Courses
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            
            <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                Ready to Excel in Mathematics?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of students who have transformed their math skills with our expert-led courses
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register" legacyBehavior>
                  <a className="inline-flex items-center justify-center px-8 py-4 font-semibold text-primary-600 bg-white rounded-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200">
                    Start Learning Today
                    <FiArrowRight className="ml-2" />
                  </a>
                </Link>
                
                <Link href="/courses" legacyBehavior>
                  <a className="inline-flex items-center justify-center px-8 py-4 font-semibold text-white bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transform hover:scale-105 transition-all duration-200">
                    Explore Courses
                  </a>
                </Link>
              </div>
              
              <div className="mt-8 flex items-center justify-center space-x-8 text-white/80">
                <div className="flex items-center">
                  <FiCheckCircle className="mr-2" />
                  <span>Lifetime Access</span>
                </div>
                <div className="flex items-center">
                  <FiCheckCircle className="mr-2" />
                  <span>Money Back Guarantee</span>
                </div>
                <div className="flex items-center">
                  <FiCheckCircle className="mr-2" />
                  <span>Certificate of Completion</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}