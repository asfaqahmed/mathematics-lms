import { supabase } from '../../../lib/supabase-admin'

/**
 * API endpoint for tracking lesson progress and completion
 * 
 * POST /api/lessons/progress
 * Body: {
 *   lesson_id: string,
 *   user_id: string,
 *   progress_percentage: number,
 *   watch_time: number,
 *   completed: boolean
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      lesson_id,
      user_id,
      progress_percentage = 0,
      watch_time = 0,
      completed = false,
      course_id
    } = req.body

    // Validate required fields
    if (!lesson_id || !user_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: lesson_id, user_id' 
      })
    }

    // Check if user has access to this lesson's course
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id, course_id')
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .eq('access_granted', true)
      .single()

    if (purchaseError || !purchase) {
      return res.status(403).json({ error: 'Access denied to this course' })
    }

    // Upsert lesson progress
    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .upsert({
        lesson_id,
        user_id,
        progress_percentage: Math.min(100, Math.max(0, progress_percentage)),
        watch_time,
        completed,
        last_watched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'lesson_id,user_id'
      })
      .select()
      .single()

    if (progressError) {
      console.error('Error updating lesson progress:', progressError)
      return res.status(500).json({ error: 'Failed to update progress' })
    }

    // If lesson is completed, check if course is completed
    if (completed && course_id) {
      await checkCourseCompletion(user_id, course_id)
    }

    res.status(200).json({
      success: true,
      progress: progress
    })

  } catch (error) {
    console.error('Progress tracking error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Check if a course is completed by the user
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 */
async function checkCourseCompletion(userId, courseId) {
  try {
    // Get all lessons in the course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('is_published', true)

    if (lessonsError || !lessons) {
      console.error('Error fetching course lessons:', lessonsError)
      return
    }

    // Get user's progress for all lessons
    const { data: completedLessons, error: progressError } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('completed', true)
      .in('lesson_id', lessons.map(l => l.id))

    if (progressError) {
      console.error('Error fetching lesson progress:', progressError)
      return
    }

    // Check if all lessons are completed
    const totalLessons = lessons.length
    const completedCount = completedLessons?.length || 0

    if (totalLessons > 0 && completedCount === totalLessons) {
      // Mark course as completed
      const { error: completionError } = await supabase
        .from('course_completions')
        .upsert({
          user_id: userId,
          course_id: courseId,
          completed_at: new Date().toISOString(),
          completion_percentage: 100
        }, {
          onConflict: 'user_id,course_id'
        })

      if (completionError) {
        console.error('Error marking course as completed:', completionError)
      } else {
        console.log(`Course ${courseId} completed by user ${userId}`)
      }
    }
  } catch (error) {
    console.error('Error checking course completion:', error)
  }
}