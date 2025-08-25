import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

/**
 * Custom hook for tracking lesson progress and completion
 * @param {Object} user - Current user object
 * @param {string} courseId - Course ID
 * @returns {Object} Progress tracking functions and state
 */
export function useLessonProgress(user, courseId) {
  const [progressData, setProgressData] = useState({})
  const [updating, setUpdating] = useState(false)
  const progressUpdateTimeouts = useRef({})

  /**
   * Update lesson progress in database
   * Debounced to avoid too many API calls
   */
  const updateProgress = useCallback(async (lessonId, progressPercentage, watchTime, completed = false) => {
    if (!user || !courseId || !lessonId) return

    // Clear existing timeout for this lesson
    if (progressUpdateTimeouts.current[lessonId]) {
      clearTimeout(progressUpdateTimeouts.current[lessonId])
    }

    // Debounce progress updates (update every 5 seconds)
    progressUpdateTimeouts.current[lessonId] = setTimeout(async () => {
      try {
        setUpdating(true)

        const response = await fetch('/api/lessons/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lesson_id: lessonId,
            user_id: user.id,
            course_id: courseId,
            progress_percentage: Math.round(progressPercentage),
            watch_time: Math.round(watchTime),
            completed
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update progress')
        }

        const result = await response.json()
        
        // Update local progress data
        setProgressData(prev => ({
          ...prev,
          [lessonId]: {
            progress_percentage: progressPercentage,
            watch_time: watchTime,
            completed,
            last_watched_at: new Date().toISOString()
          }
        }))

        // Show completion message
        if (completed) {
          toast.success('Lesson completed! 🎉', {
            duration: 3000,
            icon: '✅'
          })
        }

      } catch (error) {
        console.error('Error updating lesson progress:', error)
        toast.error('Failed to save progress')
      } finally {
        setUpdating(false)
      }
    }, completed ? 0 : 5000) // Immediate update for completion, 5s delay for progress

  }, [user, courseId])

  /**
   * Mark lesson as completed
   */
  const markLessonComplete = useCallback((lessonId, watchTime = 0) => {
    updateProgress(lessonId, 100, watchTime, true)
  }, [updateProgress])

  /**
   * Handle video progress updates from CoursePlayer
   */
  const handleVideoProgress = useCallback((lessonId, progressPercentage, currentTime, duration) => {
    // Update progress periodically
    updateProgress(lessonId, progressPercentage, currentTime)

    // Auto-complete if watched 90% or more
    if (progressPercentage >= 90) {
      markLessonComplete(lessonId, currentTime)
    }
  }, [updateProgress, markLessonComplete])

  /**
   * Fetch initial progress data for lessons
   */
  const fetchLessonProgress = useCallback(async (lessonIds) => {
    if (!user || !lessonIds || lessonIds.length === 0) return

    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id, progress_percentage, watch_time, completed, last_watched_at')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds)

      if (error) {
        console.error('Error fetching lesson progress:', error)
        return
      }

      // Convert array to object for easy lookup
      const progressMap = {}
      if (data) {
        data.forEach(item => {
          progressMap[item.lesson_id] = item
        })
      }

      setProgressData(progressMap)
    } catch (error) {
      console.error('Error fetching lesson progress:', error)
    }
  }, [user])

  /**
   * Get progress data for a specific lesson
   */
  const getLessonProgress = useCallback((lessonId) => {
    return progressData[lessonId] || {
      progress_percentage: 0,
      watch_time: 0,
      completed: false,
      last_watched_at: null
    }
  }, [progressData])

  /**
   * Check if lesson is completed
   */
  const isLessonCompleted = useCallback((lessonId) => {
    return getLessonProgress(lessonId).completed
  }, [getLessonProgress])

  /**
   * Get completion percentage for lessons
   */
  const getCompletionStats = useCallback((lessonIds) => {
    if (!lessonIds || lessonIds.length === 0) {
      return { completed: 0, total: 0, percentage: 0 }
    }

    const completed = lessonIds.filter(id => isLessonCompleted(id)).length
    const total = lessonIds.length
    const percentage = total > 0 ? (completed / total) * 100 : 0

    return { completed, total, percentage: Math.round(percentage) }
  }, [isLessonCompleted])

  return {
    // State
    progressData,
    updating,
    
    // Functions
    updateProgress,
    markLessonComplete,
    handleVideoProgress,
    fetchLessonProgress,
    getLessonProgress,
    isLessonCompleted,
    getCompletionStats
  }
}