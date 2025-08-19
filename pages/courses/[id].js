import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlay, FiLock, FiUnlock, FiClock, FiBook, FiStar, 
  FiCheck, FiChevronDown, FiChevronUp, FiDownload,
  FiUsers, FiAward, FiTrendingUp
} from 'react-icons/fi'
import { supabase, getCourse } from '../../lib/supabase'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import PaymentModal from '../../components/payment/PaymentModal'
import toast from 'react-hot-toast'

export default function CourseDetail({ user }) {
  const router = useRouter()
  const { id } = router.query
  
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [videoProgress, setVideoProgress] = useState({})
  
  useEffect(() => {
    if (id) {
      fetchCourseData()
    }
  }, [id, user])

  useEffect(() => {
    // Check for Stripe success redirect
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const sessionId = urlParams.get('session_id')
    
    if (success === 'true' && sessionId) {
      handlePaymentSuccess(sessionId)
    }
  }, [])

  const handlePaymentSuccess = async (sessionId) => {
    try {
      const response = await fetch(`/api/payments/verify-session?session_id=${sessionId}`)
      const data = await response.json()
      
      if (data.success) {
        toast.success('Payment successful! You now have access to this course.')
        // Refresh course data to show new access
        fetchCourseData()
        // Clean up URL
        window.history.replaceState({}, '', `/courses/${id}`)
      } else {
        toast.error('Payment verification failed. Please contact support.')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast.error('Error verifying payment. Please refresh the page.')
    }
  }
  
  const fetchCourseData = async () => {
    try {
      console.log('Fetching course with ID:', id);
      
      let currentCourse = null;
      
      // Use the getCourse helper which properly joins lessons
      try {
        currentCourse = await getCourse(id)
        console.log('Course data fetched:', currentCourse);
        
        setCourse(currentCourse)
        setLessons(currentCourse.lessons || [])
        
        // Set first lesson as active
        if (currentCourse.lessons && currentCourse.lessons.length > 0) {
          setActiveLesson(currentCourse.lessons[0])
        }
      } catch (courseError) {
        // If getCourse fails and the ID doesn't look like a UUID, try searching by slug/intro_video
        if (courseError && !id.includes('-')) {
          console.log('Course not found by ID, trying to find by slug or intro_video');
          const { data: courseBySlug, error: slugError } = await supabase
            .from('courses')
            .select(`
              *,
              lessons (*)
            `)
            .eq('intro_video', id)
            .single()
          
          if (slugError) {
            console.error('Course fetch error:', slugError);
            throw slugError;
          }
          
          currentCourse = courseBySlug
          setCourse(currentCourse)
          setLessons(currentCourse.lessons || [])
          
          if (currentCourse.lessons && currentCourse.lessons.length > 0) {
            setActiveLesson(currentCourse.lessons[0])
          }
        } else {
          throw courseError;
        }
      }
      
      // Check if user has access via purchases table
      if (user && currentCourse) {
        console.log('Checking access for user:', user.id, 'course:', currentCourse.id);
        
        // Try purchases table first
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', currentCourse.id)
          .eq('access_granted', true)
          .single()
        
        if (purchaseError) {
          console.log('Purchase check error:', purchaseError);
          
          // If purchases table fails, fall back to payments table
          console.log('Falling back to payments table check');
          const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', currentCourse.id)
            .eq('status', 'approved')
            .single()
          
          if (paymentError) {
            console.log('Payment check error:', paymentError);
          }
          
          setHasAccess(!!payment);
        } else {
          setHasAccess(!!purchase);
        }
      }
      
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }
  
  const handleLessonClick = (lesson) => {
    if (!hasAccess && !lesson.is_preview) {
      setPaymentModalOpen(true)
      return
    }
    setActiveLesson(lesson)
  }
  
  const handleEnroll = () => {
    if (!user) {
      toast.error('Please sign in to enroll')
      router.push('/auth/login')
      return
    }
    setPaymentModalOpen(true)
  }
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }
  
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }
  
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return ''
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }
  
  // if (!course) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
  //       <Header user={user} />
  //       <div className="flex items-center justify-center py-32">
  //         <div className="text-center">
  //           <h2 className="text-2xl font-bold text-white mb-4">Course not found</h2>
  //           <button onClick={() => router.push('/courses')} className="btn-primary">
  //             Browse Courses
  //           </button>
  //         </div>
  //       </div>
  //       <Footer />
  //     </div>
  //   )
  // }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      {/* Course Header */}
      <section className="relative pt-20 pb-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Course Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <span className="badge badge-primary">{course?.category || 'Course'}</span>
                {hasAccess && (
                  <span className="badge badge-success">
                    <FiCheck className="mr-1" /> Enrolled
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                {course?.title || 'Course Title'}
              </h1>
              
              <p className="text-xl text-gray-400 mb-6">
                {course?.description || 'Course description'}
              </p>
              
              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass rounded-lg p-4">
                  <FiBook className="w-5 h-5 text-primary-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{lessons.length}</div>
                  <div className="text-sm text-gray-400">Lessons</div>
                </div>
                <div className="glass rounded-lg p-4">
                  <FiClock className="w-5 h-5 text-primary-400 mb-2" />
                  <div className="text-2xl font-bold text-white">6h 30m</div>
                  <div className="text-sm text-gray-400">Duration</div>
                </div>
                <div className="glass rounded-lg p-4">
                  <FiUsers className="w-5 h-5 text-primary-400 mb-2" />
                  <div className="text-2xl font-bold text-white">245</div>
                  <div className="text-sm text-gray-400">Students</div>
                </div>
                <div className="glass rounded-lg p-4">
                  <FiStar className="w-5 h-5 text-yellow-400 mb-2" />
                  <div className="text-2xl font-bold text-white">4.8</div>
                  <div className="text-sm text-gray-400">Rating</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              {!hasAccess ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleEnroll}
                    className="btn-primary flex items-center justify-center space-x-2"
                  >
                    <span>Enroll Now</span>
                    <span className="text-xl font-bold">
                      LKR {course?.price?.toLocaleString() || '0'}
                    </span>
                  </button>
                  <button className="btn-secondary flex items-center justify-center space-x-2">
                    <FiPlay />
                    <span>Watch Preview</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="text-green-400 flex items-center space-x-2">
                    <FiCheck className="w-5 h-5" />
                    <span>You have full access to this course</span>
                  </div>
                  <button className="btn-secondary flex items-center space-x-2">
                    <FiDownload />
                    <span>Download Certificate</span>
                  </button>
                </div>
              )}
            </motion.div>
            
            {/* Video Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl overflow-hidden glass">
                {course?.intro_video ? (
                  <iframe
                    src={getYouTubeEmbedUrl(course.intro_video)}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={course?.thumbnail || '/api/placeholder/800/450'}
                    alt={course?.title || 'Course'}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Course Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2">
              {activeLesson ? (
                <motion.div
                  key={activeLesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="glass rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      {activeLesson.title}
                    </h2>
                    
                    {activeLesson.type === 'video' ? (
                      <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-dark-800">
                        {hasAccess || activeLesson.is_preview ? (
                          <iframe
                            src={getYouTubeEmbedUrl(activeLesson.content)}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <FiLock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">
                                This lesson is locked
                              </h3>
                              <p className="text-gray-400 mb-4">
                                Enroll in the course to unlock this lesson
                              </p>
                              <button onClick={handleEnroll} className="btn-primary">
                                Enroll Now
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="prose prose-invert max-w-none mb-6">
                        {hasAccess || activeLesson.is_preview ? (
                          <div dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                        ) : (
                          <div className="text-center py-12">
                            <FiLock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">
                              This content is locked
                            </h3>
                            <p className="text-gray-400 mb-4">
                              Enroll in the course to unlock this content
                            </p>
                            <button onClick={handleEnroll} className="btn-primary">
                              Enroll Now
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-gray-400">
                      {activeLesson.description}
                    </p>
                    
                    {/* Lesson Navigation */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-700">
                      <button
                        className="btn-ghost flex items-center space-x-2"
                        disabled={lessons.indexOf(activeLesson) === 0}
                        onClick={() => {
                          const currentIndex = lessons.indexOf(activeLesson)
                          if (currentIndex > 0) {
                            handleLessonClick(lessons[currentIndex - 1])
                          }
                        }}
                      >
                        <span>← Previous</span>
                      </button>
                      
                      <button
                        className="btn-ghost flex items-center space-x-2"
                        disabled={lessons.indexOf(activeLesson) === lessons.length - 1}
                        onClick={() => {
                          const currentIndex = lessons.indexOf(activeLesson)
                          if (currentIndex < lessons.length - 1) {
                            handleLessonClick(lessons[currentIndex + 1])
                          }
                        }}
                      >
                        <span>Next →</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="glass rounded-2xl p-6">
                  <div className="text-center py-12">
                    <FiPlay className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Content Available
                    </h3>
                    <p className="text-gray-400">
                      This course doesn't have any lessons yet. Please check back later.
                    </p>
                  </div>
                </div>
              )}
              
              {/* What You'll Learn */}
              <div className="glass rounded-2xl p-6 mt-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <FiTrendingUp className="mr-2 text-primary-400" />
                  What You'll Learn
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'Fundamental concepts and principles',
                    'Problem-solving techniques',
                    'Real-world applications',
                    'Practice exercises with solutions',
                    'Tips and tricks for exams',
                    'Advanced topics and extensions'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <FiCheck className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Lessons Sidebar */}
            <div className="lg:col-span-1">
              <div className="glass rounded-2xl p-6 sticky top-24">
                <h3 className="text-xl font-bold text-white mb-4">
                  Course Content
                </h3>
                
                <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {lessons.length === 0 ? (
                    <div className="text-center py-8">
                      <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No lessons available yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Course content will be added soon
                      </p>
                    </div>
                  ) : (
                    lessons.map((lesson, index) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                      <button
                        onClick={() => handleLessonClick(lesson)}
                        className={`w-full text-left p-4 rounded-lg transition-all ${
                          activeLesson?.id === lesson.id
                            ? 'bg-primary-500/20 border border-primary-500/50'
                            : 'hover:bg-dark-700'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {hasAccess || lesson.is_preview ? (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                videoProgress[lesson.id]?.completed
                                  ? 'bg-green-500'
                                  : 'bg-dark-600'
                              }`}>
                                {videoProgress[lesson.id]?.completed ? (
                                  <FiCheck className="w-4 h-4 text-white" />
                                ) : (
                                  <FiPlay className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                            ) : (
                              <FiLock className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-medium ${
                                activeLesson?.id === lesson.id
                                  ? 'text-primary-400'
                                  : 'text-white'
                              }`}>
                                Lesson {index + 1}: {lesson.title}
                              </h4>
                              {lesson.is_preview && (
                                <span className="text-xs text-green-400">Free</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500">
                                {lesson.type === 'video' ? (
                                  <>
                                    <FiPlay className="inline mr-1" />
                                    {lesson.duration ? formatDuration(lesson.duration) : 'Video'}
                                  </>
                                ) : (
                                  <>
                                    <FiBook className="inline mr-1" />
                                    Article
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                    ))
                  )}
                </div>
                
                {/* Course Progress */}
                {hasAccess && (
                  <div className="mt-6 pt-6 border-t border-dark-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Progress</span>
                      <span className="text-sm font-semibold text-white">
                        {Math.round(
                          (Object.values(videoProgress).filter(p => p.completed).length / 
                          lessons.length) * 100
                        )}%
                      </span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(Object.values(videoProgress).filter(p => p.completed).length / 
                            lessons.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        course={course}
        user={user}
      />
      
      <Footer />
    </div>
  )
}