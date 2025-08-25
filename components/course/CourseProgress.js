import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FiCheckCircle, FiCircle, FiAward, FiDownload, 
  FiTrendingUp, FiClock, FiPlay 
} from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

/**
 * Course Progress Component
 * Shows overall course completion status and certificate availability
 */
export default function CourseProgress({ 
  user, 
  course, 
  lessons = [],
  className = '' 
}) {
  const [progress, setProgress] = useState({
    completedLessons: 0,
    totalLessons: 0,
    percentage: 0,
    isCompleted: false,
    certificateAvailable: false
  })
  const [lessonProgress, setLessonProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [downloadingCertificate, setDownloadingCertificate] = useState(false)

  useEffect(() => {
    if (user && course && lessons.length > 0) {
      fetchProgress()
    }
  }, [user, course, lessons])

  const fetchProgress = async () => {
    try {
      setLoading(true)

      // Fetch lesson progress
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed, progress_percentage, watch_time')
        .eq('user_id', user.id)
        .in('lesson_id', lessons.map(l => l.id))

      if (progressError) {
        console.error('Error fetching lesson progress:', progressError)
      }

      // Process progress data
      const progressMap = {}
      let completedCount = 0

      if (progressData) {
        progressData.forEach(item => {
          progressMap[item.lesson_id] = item
          if (item.completed) completedCount++
        })
      }

      const totalLessons = lessons.length
      const completionPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0
      const isCompleted = completedCount === totalLessons && totalLessons > 0

      // Check if certificate is available
      let certificateAvailable = false
      if (isCompleted) {
        const { data: completion } = await supabase
          .from('course_completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', course.id)
          .single()
        
        certificateAvailable = !!completion
      }

      setProgress({
        completedLessons: completedCount,
        totalLessons,
        percentage: Math.round(completionPercentage),
        isCompleted,
        certificateAvailable
      })
      setLessonProgress(progressMap)

    } catch (error) {
      console.error('Error fetching course progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = async () => {
    if (!progress.certificateAvailable) {
      toast.error('Certificate not available. Please complete all lessons first.')
      return
    }

    setDownloadingCertificate(true)

    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          course_id: course.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate certificate')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.style.display = 'none'
      link.href = url
      link.download = `certificate-${course.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
      
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Certificate downloaded successfully!')

    } catch (error) {
      console.error('Error downloading certificate:', error)
      toast.error(error.message || 'Failed to download certificate')
    } finally {
      setDownloadingCertificate(false)
    }
  }

  const getLessonStatus = (lessonId) => {
    const progressData = lessonProgress[lessonId]
    if (!progressData) return { completed: false, progress: 0 }
    return {
      completed: progressData.completed,
      progress: progressData.progress_percentage || 0
    }
  }

  const formatWatchTime = (seconds) => {
    if (!seconds) return '0m'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  if (loading) {
    return (
      <div className={`bg-dark-800 rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-dark-600 rounded w-1/3"></div>
          <div className="h-4 bg-dark-600 rounded w-full"></div>
          <div className="h-4 bg-dark-600 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-dark-800 rounded-2xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <FiTrendingUp className="mr-3 text-primary-400" />
          Course Progress
        </h3>
        {progress.isCompleted && (
          <div className="flex items-center text-green-400">
            <FiAward className="mr-2" />
            <span className="text-sm font-medium">Completed!</span>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300">
            {progress.completedLessons} of {progress.totalLessons} lessons completed
          </span>
          <span className="text-white font-semibold">{progress.percentage}%</span>
        </div>
        
        <div className="w-full bg-dark-600 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-gradient-to-r from-primary-500 to-primary-400 h-3 rounded-full"
          />
        </div>
      </div>

      {/* Lesson List */}
      <div className="space-y-3 mb-6">
        <h4 className="text-lg font-semibold text-white">Lessons</h4>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {lessons.map((lesson, index) => {
            const status = getLessonStatus(lesson.id)
            return (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-3 bg-dark-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {status.completed ? (
                      <FiCheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <FiCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{lesson.title}</p>
                    {lesson.duration && (
                      <p className="text-xs text-gray-400 flex items-center">
                        <FiClock className="mr-1" />
                        {lesson.duration} min
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {status.completed ? (
                    <span className="text-green-400 text-sm font-medium">Complete</span>
                  ) : status.progress > 0 ? (
                    <div className="text-right">
                      <div className="text-primary-400 text-sm font-medium">
                        {Math.round(status.progress)}%
                      </div>
                      <div className="w-12 bg-dark-600 rounded-full h-1">
                        <div
                          className="bg-primary-400 h-1 rounded-full"
                          style={{ width: `${status.progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Not started</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Certificate Section */}
      {progress.isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary-500/20 to-primary-400/20 rounded-xl p-4 border border-primary-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white flex items-center">
                <FiAward className="mr-2 text-primary-400" />
                Certificate Available!
              </h4>
              <p className="text-gray-300 text-sm">
                Congratulations! Download your completion certificate.
              </p>
            </div>
            <button
              onClick={downloadCertificate}
              disabled={downloadingCertificate || !progress.certificateAvailable}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {downloadingCertificate ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FiDownload className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Progress Stats */}
      {!progress.isCompleted && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="text-center p-3 bg-dark-700 rounded-lg">
            <div className="text-2xl font-bold text-primary-400">
              {progress.completedLessons}
            </div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="text-center p-3 bg-dark-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-300">
              {progress.totalLessons - progress.completedLessons}
            </div>
            <div className="text-sm text-gray-400">Remaining</div>
          </div>
        </div>
      )}
    </motion.div>
  )
}