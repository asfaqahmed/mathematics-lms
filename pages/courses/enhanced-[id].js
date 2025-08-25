import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlay, FiLock, FiUnlock, FiClock, FiBook, FiStar, 
  FiCheck, FiChevronDown, FiChevronUp, FiDownload,
  FiUsers, FiAward, FiTrendingUp, FiUpload, FiCheckCircle
} from 'react-icons/fi'
import { supabase, getCourse } from '../../lib/supabase'
import { useLessonProgress } from '../../hooks/useLessonProgress'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import PaymentModal from '../../components/payment/PaymentModal'
import CourseProgress from '../../components/course/CourseProgress'
import AssignmentUpload from '../../components/course/AssignmentUpload'
import UniversalVideoPlayer from '../../components/course/UniversalVideoPlayer'
import { getYouTubeEmbedUrl, isYouTubeUrl } from '../../utils/youtube'
import toast from 'react-hot-toast'

/**
 * Enhanced Course Detail Page with Progress Tracking and Certificate Generation
 */
export default function EnhancedCourseDetail({ user }) {
  const router = useRouter()
  const { id } = router.query
  
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [showAssignmentUpload, setShowAssignmentUpload] = useState(false)
  const [assignments, setAssignments] = useState([])
  
  // Use our custom progress hook
  const {
    progressData,
    updating,
    handleVideoProgress,
    fetchLessonProgress,
    getLessonProgress,
    isLessonCompleted,
    getCompletionStats,
    markLessonComplete
  } = useLessonProgress(user, id)

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
      // Redirect to payment success page
      router.push(`/payment/success?session_id=${sessionId}&course_id=${id}`)
    }
  }, [])

  const fetchCourseData = async () => {
    try {
      const courseData = await getCourse(id)
      if (!courseData) {
        toast.error('Course not found')
        router.push('/courses')
        return
      }

      setCourse(courseData)

      // Fetch lessons
      const { data: courseLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .eq('is_published', true)
        .order('order')

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError)
      } else {
        setLessons(courseLessons || [])
        if (courseLessons && courseLessons.length > 0) {
          setActiveLesson(courseLessons[0])
          // Fetch progress for all lessons
          await fetchLessonProgress(courseLessons.map(l => l.id))
        }
      }

      // Check access
      if (user) {
        const { data: purchase } = await supabase
          .from('purchases')
          .select('access_granted')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .single()

        setHasAccess(!!purchase?.access_granted)

        // Fetch user's assignments for this course
        if (purchase?.access_granted) {
          const { data: userAssignments } = await supabase
            .from('assignments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', id)
            .order('submitted_at', { ascending: false })

          setAssignments(userAssignments || [])
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error)
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    setPaymentModalOpen(true)
  }

  const handleLessonClick = (lesson) => {
    setActiveLesson(lesson)
  }

  const handleVideoComplete = (lessonId) => {
    markLessonComplete(lessonId)
    toast.success('Lesson completed! 🎉')
  }

  const handleAssignmentUpload = (assignment) => {
    setAssignments([assignment, ...assignments])
    toast.success('Assignment uploaded successfully!')
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <Header user={user} />
        <div className="flex items-center justify-center h-screen">
          <div className="spinner"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <Header user={user} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Course not found</h2>
            <button onClick={() => router.push('/courses')} className="btn-primary">
              Back to Courses
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const completionStats = getCompletionStats(lessons.map(l => l.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      {/* Course Header */}
      <section className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium">
                  {course.category}
                </span>
                {hasAccess && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium flex items-center">
                    <FiUnlock className="mr-1" />
                    Enrolled
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                {course.title}
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex items-center space-x-6 mb-8">
                <div className="flex items-center text-gray-300">
                  <FiBook className="mr-2" />
                  <span>{lessons.length} Lessons</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <FiUsers className="mr-2" />
                  <span>Level: Beginner</span>
                </div>
                {hasAccess && (
                  <div className="flex items-center text-primary-400">
                    <FiTrendingUp className="mr-2" />
                    <span>{completionStats.percentage}% Complete</span>
                  </div>
                )}
              </div>
              
              {!hasAccess ? (
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-white">
                    LKR {course.price?.toLocaleString()}
                  </div>
                  <button onClick={handleEnroll} className="btn-primary">
                    Enroll Now
                  </button>
                </div>
              ) : (
                <div className="text-green-400 font-semibold">
                  ✓ You have access to this course
                </div>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl overflow-hidden glass">
                {course.intro_video ? (
                  <UniversalVideoPlayer
                    videoUrl={course.intro_video}
                    title={`${course.title} - Introduction`}
                    hasAccess={true}
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={course.thumbnail || '/api/placeholder/800/450'}
                    alt={course.title}
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
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Active Lesson */}
              {activeLesson && (
                <motion.div
                  key={activeLesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">
                      {activeLesson.title}
                    </h2>
                    {hasAccess && isLessonCompleted(activeLesson.id) && (
                      <div className="flex items-center text-green-400">
                        <FiCheckCircle className="mr-2" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                  
                  {activeLesson.type === 'video' ? (
                    <div className="mb-6">
                      <UniversalVideoPlayer
                        videoUrl={activeLesson.content}
                        title={activeLesson.title}
                        hasAccess={hasAccess || activeLesson.is_preview}
                        onProgress={(progress, currentTime, duration) => {
                          // Integrate with lesson progress hook
                          if (hasAccess) {
                            handleVideoProgress(activeLesson.id, progress, currentTime, duration)
                          }
                        }}
                        onComplete={() => {
                          // Mark lesson as complete
                          if (hasAccess) {
                            markLessonComplete(activeLesson.id)
                          }
                        }}
                        onError={(error) => {
                          console.error('Video player error:', error)
                          toast.error('Unable to load video. Please try refreshing the page.')
                        }}
                        onLoadEnd={() => {
                          console.log('Video loaded successfully')
                        }}
                      />
                      {!hasAccess && !activeLesson.is_preview && (
                        <div className="mt-4 text-center">
                          <button onClick={handleEnroll} className="btn-primary">
                            Enroll Now to Watch
                          </button>
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
                  
                  {activeLesson.description && (
                    <p className="text-gray-400 mb-6">
                      {activeLesson.description}
                    </p>
                  )}

                  {/* Assignment Upload Section */}
                  {hasAccess && (
                    <div className="border-t border-dark-700 pt-6">
                      <button
                        onClick={() => setShowAssignmentUpload(!showAssignmentUpload)}
                        className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 mb-4"
                      >
                        <FiUpload className="w-4 h-4" />
                        <span>Submit Assignment for this Lesson</span>
                        {showAssignmentUpload ? (
                          <FiChevronUp className="w-4 h-4" />
                        ) : (
                          <FiChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <AnimatePresence>
                        {showAssignmentUpload && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <AssignmentUpload
                              user={user}
                              courseId={id}
                              lessonId={activeLesson.id}
                              lessonTitle={activeLesson.title}
                              onUploadSuccess={handleAssignmentUpload}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Lesson List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-6">
                  Course Content ({lessons.length} lessons)
                </h3>
                
                <div className="space-y-2">
                  {lessons.map((lesson, index) => {
                    const progress = getLessonProgress(lesson.id)
                    const completed = isLessonCompleted(lesson.id)
                    
                    return (
                      <div
                        key={lesson.id}
                        className={`
                          p-4 rounded-lg cursor-pointer transition-all duration-200 border
                          ${activeLesson?.id === lesson.id 
                            ? 'bg-primary-500/20 border-primary-500/50' 
                            : 'bg-dark-700/50 border-dark-600 hover:bg-dark-600/50'
                          }
                        `}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {completed ? (
                                <FiCheckCircle className="w-5 h-5 text-green-400" />
                              ) : hasAccess || lesson.is_preview ? (
                                lesson.type === 'video' ? (
                                  <FiPlay className="w-5 h-5 text-primary-400" />
                                ) : (
                                  <FiBook className="w-5 h-5 text-primary-400" />
                                )
                              ) : (
                                <FiLock className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-white">
                                {index + 1}. {lesson.title}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                {lesson.duration && (
                                  <div className="flex items-center">
                                    <FiClock className="mr-1" />
                                    <span>{lesson.duration} min</span>
                                  </div>
                                )}
                                {lesson.is_preview && (
                                  <span className="text-primary-400">Preview</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {hasAccess && progress.progress_percentage > 0 && !completed && (
                            <div className="text-right">
                              <div className="text-primary-400 text-sm font-medium">
                                {Math.round(progress.progress_percentage)}%
                              </div>
                              <div className="w-16 bg-dark-600 rounded-full h-1">
                                <div
                                  className="bg-primary-400 h-1 rounded-full"
                                  style={{ width: `${progress.progress_percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Progress */}
              {hasAccess && (
                <CourseProgress
                  user={user}
                  course={course}
                  lessons={lessons}
                />
              )}

              {/* Course Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  Course Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white">{course.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lessons:</span>
                    <span className="text-white">{lessons.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white">LKR {course.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span className="text-white">Beginner to Advanced</span>
                  </div>
                </div>
              </motion.div>

              {/* My Assignments */}
              {hasAccess && assignments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="glass rounded-2xl p-6"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <FiUpload className="mr-2 text-primary-400" />
                    My Assignments
                  </h3>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {assignments.slice(0, 5).map((assignment) => (
                      <div key={assignment.id} className="p-3 bg-dark-700/50 rounded-lg">
                        <h4 className="font-medium text-white text-sm">
                          {assignment.title}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(assignment.submitted_at).toLocaleDateString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            assignment.status === 'graded' ? 'bg-green-500/20 text-green-400' :
                            assignment.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {assignment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {assignments.length > 5 && (
                    <button className="w-full mt-3 text-primary-400 hover:text-primary-300 text-sm">
                      View all assignments ({assignments.length})
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        course={course}
        user={user}
      />
    </div>
  )
}