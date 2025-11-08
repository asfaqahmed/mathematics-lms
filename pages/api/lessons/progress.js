/**
 * Lesson Progress API - Track Learning Progress
 *
 * Handles lesson progress tracking, completion status, and course completion detection.
 * Includes comprehensive validation, access control, and performance optimization.
 *
 * @route POST /api/lessons/progress - Update lesson progress
 */

import { z } from 'zod'
import { supabaseAdmin } from '../../../src/lib/supabase-admin'
import { logger } from '../../../src/lib/logger'
import {
  withMiddleware,
  createSuccessResponse,
  createErrorResponse,
  checkCourseAccess,
  getCached,
  setCached,
  invalidateCache
} from '../../../src/lib/api-utils'
import { progressSchema } from '../../../src/lib/validations'
import {
  ValidationError,
  AuthError,
  createNotFoundError,
  ErrorCode
} from '../../../src/lib/errors'

// Extended validation schema
const lessonProgressSchema = progressSchema.extend({
  course_id: z.string().uuid('Invalid course ID format'),
  watch_time: z.number().min(0, 'Watch time must be positive').optional().default(0),
  completed: z.boolean().optional().default(false)
})

/**
 * @typedef {Object} LessonProgress
 * @property {string} id
 * @property {string} lesson_id
 * @property {string} user_id
 * @property {number} progress_percentage
 * @property {number} watch_time
 * @property {boolean} completed
 * @property {string} last_watched_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ProgressResponse
 * @property {boolean} success
 * @property {LessonProgress} [progress]
 * @property {boolean} [course_completed]
 * @property {string} [message]
 */

/**
 * @typedef {Object} CourseCompletion
 * @property {string} user_id
 * @property {string} course_id
 * @property {string} completed_at
 * @property {number} completion_percentage
 */

/**
 * Main progress tracking handler
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse<ProgressResponse>} res
 * @returns {Promise<void>}
 */
async function trackProgressHandler(req, res) {
  const startTime = Date.now()

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed')
    }

    // Parse and validate request body
    const validatedData = lessonProgressSchema.parse(req.body)
    const {
      lesson_id: lessonId,
      progress_percentage: progressPercentage,
      watch_time: watchTime,
      completed,
      course_id: courseId
    } = validatedData

    // Get user ID from authentication context (would be set by middleware)
    const userId = req.body.user_id // Temporary - should come from auth context

    if (!userId) {
      throw new AuthError('User authentication required', ErrorCode.UNAUTHORIZED)
    }

    logger.info('Tracking lesson progress', 'PROGRESS', {
      lessonId,
      userId,
      courseId,
      progressPercentage,
      completed
    })

    // Validate lesson and course relationship
    const lesson = await validateLessonAccess(lessonId, courseId)

    // Check if user has access to this course
    const hasAccess = await checkCourseAccess(userId, courseId)
    if (!hasAccess) {
      throw new AuthError('Access denied to this course', ErrorCode.FORBIDDEN)
    }

    // Update lesson progress
    const progress = await upsertLessonProgress(
      lessonId,
      userId,
      progressPercentage,
      watchTime,
      completed
    )

    let courseCompleted = false

    // If lesson is completed, check course completion
    if (completed) {
      const completionStatus = await checkCourseCompletion(userId, courseId)

      if (completionStatus.completed) {
        try {
          await markCourseCompleted(userId, courseId)
          courseCompleted = true

          logger.info('Course completion detected', 'PROGRESS', {
            userId,
            courseId,
            totalLessons: completionStatus.totalLessons,
            completedLessons: completionStatus.completedLessons
          })
        } catch (error) {
          logger.error('Failed to mark course as completed', 'PROGRESS', {
            userId,
            courseId,
            error
          })
          // Don't fail the request if course completion marking fails
        }
      }
    }

    // Invalidate progress-related caches
    invalidateCache(`lesson_progress:${userId}:${lessonId}`)
    invalidateCache(`course_progress:${userId}:${courseId}`)

    const duration = Date.now() - startTime
    logger.performance('Progress tracking', duration)

    logger.info('Lesson progress updated successfully', 'PROGRESS', {
      lessonId,
      userId,
      courseId,
      progressPercentage: progress.progress_percentage,
      completed: progress.completed,
      courseCompleted,
      duration
    })

    return res.status(200).json({
      success: true,
      progress: {
        id: progress.id,
        lesson_id: progress.lesson_id,
        user_id: progress.user_id,
        progress_percentage: progress.progress_percentage,
        watch_time: progress.watch_time,
        completed: progress.completed,
        last_watched_at: progress.last_watched_at,
        updated_at: progress.updated_at
      },
      course_completed: courseCompleted,
      message: courseCompleted
        ? 'Lesson progress updated and course completed!'
        : 'Lesson progress updated successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        { validationErrors: error.errors }
      )

      logger.error('Progress tracking validation failed', 'PROGRESS', {
        error: validationError,
        duration
      })

      return res.status(400).json(validationError.toJSON())
    }

    if (error instanceof ValidationError || error instanceof AuthError) {
      logger.error('Progress tracking failed', 'PROGRESS', { error, duration })
      return res.status(error.statusCode).json(error.toJSON())
    }

    logger.error('Unexpected progress tracking error', 'PROGRESS', { error, duration })

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while tracking progress'
    })
  }
}

/**
 * Validate lesson exists and belongs to course
 * @param {string} lessonId
 * @param {string} courseId
 * @returns {Promise<{ id: string, course_id: string, title: string }>}
 */
async function validateLessonAccess(lessonId, courseId) {
  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select('id, course_id, title')
    .eq('id', lessonId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('Lesson')
    }
    logger.error('Database error fetching lesson', 'PROGRESS', { lessonId, error })
    throw new ValidationError('Failed to validate lesson access')
  }

  if (lesson.course_id !== courseId) {
    logger.warn('Lesson does not belong to specified course', 'PROGRESS', {
      lessonId,
      lessonCourseId: lesson.course_id,
      requestedCourseId: courseId
    })
    throw new ValidationError('Lesson does not belong to the specified course')
  }

  return lesson
}

/**
 * Update or create lesson progress record
 * @param {string} lessonId
 * @param {string} userId
 * @param {number} progressPercentage
 * @param {number} watchTime
 * @param {boolean} completed
 * @returns {Promise<LessonProgress>}
 */
async function upsertLessonProgress(lessonId, userId, progressPercentage, watchTime, completed) {
  const progressData = {
    lesson_id: lessonId,
    user_id: userId,
    progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
    watch_time: Math.max(0, watchTime),
    completed,
    last_watched_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: progress, error } = await supabaseAdmin
    .from('lesson_progress')
    .upsert(progressData, {
      onConflict: 'lesson_id,user_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    logger.error('Database error updating lesson progress', 'PROGRESS', {
      lessonId,
      userId,
      progressData,
      error
    })
    throw new ValidationError('Failed to update lesson progress')
  }

  return progress
}

/**
 * Get course lessons for completion checking
 * @param {string} courseId
 * @returns {Promise<string[]>}
 */
async function getCourseLessons(courseId) {
  const cacheKey = `course_lessons_ids:${courseId}`
  const cached = getCached(cacheKey)

  if (cached) {
    return cached
  }

  const { data: lessons, error } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('is_published', true)

  if (error) {
    logger.error('Database error fetching course lessons', 'PROGRESS', {
      courseId,
      error
    })
    throw new ValidationError('Failed to fetch course lessons')
  }

  const lessonIds = lessons.map(lesson => lesson.id)
  setCached(cacheKey, lessonIds, 300000) // Cache for 5 minutes

  return lessonIds
}

/**
 * Check if all course lessons are completed
 * @param {string} userId
 * @param {string} courseId
 * @returns {Promise<{ completed: boolean, totalLessons: number, completedLessons: number }>}
 */
async function checkCourseCompletion(userId, courseId) {
  try {
    // Get all published lessons in the course
    const lessonIds = await getCourseLessons(courseId)

    if (lessonIds.length === 0) {
      return { completed: false, totalLessons: 0, completedLessons: 0 }
    }

    // Get user's completed lessons for this course
    const { data: completedLessons, error } = await supabaseAdmin
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('completed', true)
      .in('lesson_id', lessonIds)

    if (error) {
      logger.error('Database error fetching lesson progress', 'PROGRESS', {
        userId,
        courseId,
        error
      })
      return { completed: false, totalLessons: lessonIds.length, completedLessons: 0 }
    }

    const completedCount = completedLessons?.length || 0
    const totalCount = lessonIds.length

    return {
      completed: completedCount === totalCount && totalCount > 0,
      totalLessons: totalCount,
      completedLessons: completedCount
    }
  } catch (error) {
    logger.error('Error checking course completion', 'PROGRESS', {
      userId,
      courseId,
      error
    })
    return { completed: false, totalLessons: 0, completedLessons: 0 }
  }
}

/**
 * Mark course as completed
 * @param {string} userId
 * @param {string} courseId
 * @returns {Promise<CourseCompletion>}
 */
async function markCourseCompleted(userId, courseId) {
  const completionData = {
    user_id: userId,
    course_id: courseId,
    completed_at: new Date().toISOString(),
    completion_percentage: 100
  }

  const { data: completion, error } = await supabaseAdmin
    .from('course_completions')
    .upsert(completionData, {
      onConflict: 'user_id,course_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    logger.error('Database error marking course as completed', 'PROGRESS', {
      userId,
      courseId,
      error
    })
    throw new ValidationError('Failed to mark course as completed')
  }

  // Invalidate relevant caches
  invalidateCache(`user_courses:${userId}`)
  invalidateCache(`course_stats:${courseId}`)

  logger.info('Course marked as completed', 'PROGRESS', {
    userId,
    courseId,
    completedAt: completion.completed_at
  })

  return completion
}

// Export with middleware
export default withMiddleware(trackProgressHandler, {
  auth: true, // Require authentication
  cors: true,
  validation: {
    schema: lessonProgressSchema,
    target: 'body'
  }
})