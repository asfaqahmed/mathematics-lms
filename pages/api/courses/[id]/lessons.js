/**
 * Course Lessons API - Bulk Operations
 *
 * Handles bulk operations for course lessons including fetching all lessons
 * for a course and performing bulk updates, inserts, and deletions.
 *
 * @route GET /api/courses/[id]/lessons - Get all lessons for a course
 * @route POST /api/courses/[id]/lessons - Bulk update/create/delete lessons
 */

import { z } from 'zod'
import { supabaseAdmin } from '../../../../src/lib/supabase-admin'
import { logger } from '../../../../src/lib/logger'
import {
  createSuccessResponse,
  createErrorResponse,
  getCached,
  setCached,
  invalidateCache,
  sanitizeObject
} from '../../../../src/lib/api-utils'
import { lessonSchema } from '../../../../src/lib/validations'
import {
  ValidationError,
  AuthError,
  createNotFoundError,
  ErrorCode
} from '../../../../src/lib/errors'

// Validation schemas
const courseIdSchema = z.object({
  id: z.string().uuid('Invalid course ID format')
})

const lessonUpdateSchema = lessonSchema.partial().extend({
  id: z.string().uuid().optional(),
  type: z.enum(['video', 'text', 'quiz', 'assignment']).optional(),
  content: z.string().optional(),
  is_preview: z.boolean().optional().default(false),
  is_free: z.boolean().optional().default(false)
})

const bulkLessonsSchema = z.object({
  action: z.enum(['bulk_update']),
  lessons: z.array(lessonUpdateSchema).min(1, 'At least one lesson is required'),
  deletedLessons: z.array(z.string().uuid()).optional().default([])
})

/**
 * @typedef {Object} LessonData
 * @property {string} id
 * @property {string} course_id
 * @property {string} title
 * @property {string} [description]
 * @property {string} type
 * @property {string} [content]
 * @property {string} [video_url]
 * @property {number} duration
 * @property {number} order
 * @property {boolean} is_preview
 * @property {boolean} is_free
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} LessonsResponse
 * @property {boolean} success
 * @property {LessonData[]} [data]
 * @property {LessonData[]} [lessons]
 * @property {string} [message]
 */

/**
 * @typedef {Object} BulkUpdateResponse
 * @property {boolean} success
 * @property {LessonData[]} [data]
 * @property {LessonData[]} [lessons]
 * @property {string} message
 */

/**
 * Validate course ID parameter
 * @param {any} query
 * @returns {string}
 */
function validateCourseId(query) {
  const result = courseIdSchema.parse(query)
  return result.id
}

/**
 * Check if course exists
 * @param {string} courseId
 * @returns {Promise<void>}
 */
async function validateCourseExists(courseId) {
  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('Course')
    }
    throw new Error('Failed to validate course existence')
  }
}

/**
 * Transform lesson data for response
 * @param {any} lesson
 * @returns {LessonData}
 */
function transformLesson(lesson) {
  return {
    id: lesson.id,
    course_id: lesson.course_id,
    title: lesson.title,
    description: lesson.description,
    type: lesson.type || 'video',
    content: lesson.content,
    video_url: lesson.video_url,
    duration: lesson.duration || 0,
    order: lesson.order || lesson.order_index || 0,
    is_preview: lesson.is_preview || false,
    is_free: lesson.is_free || false,
    created_at: lesson.created_at,
    updated_at: lesson.updated_at
  }
}

/**
 * GET handler - Fetch all lessons for a course
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse<LessonsResponse>} res
 * @returns {Promise<void>}
 */
async function getLessons(req, res) {
  const startTime = Date.now()

  try {
    const courseId = validateCourseId(req.query)
    logger.info('Fetching course lessons', 'API', { courseId })

    // Validate course exists
    await validateCourseExists(courseId)

    // Check cache first
    const cacheKey = `course_lessons:${courseId}`
    const cached = getCached(cacheKey)

    if (cached) {
      logger.info('Serving lessons from cache', 'API', { courseId, count: cached.length })
      return res.status(200).json({
        success: true,
        data: cached,
        lessons: cached // For compatibility
      })
    }

    // Fetch from database
    const { data: lessons, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order', { ascending: true })

    if (error) {
      logger.error('Database error fetching lessons', 'API', { error, courseId })
      throw new Error('Failed to fetch lessons from database')
    }

    // Transform lessons
    const transformedLessons = (lessons || []).map(transformLesson)

    // Cache the results (5 minutes TTL)
    setCached(cacheKey, transformedLessons, 300000)

    const duration = Date.now() - startTime
    logger.performance('Lessons fetch', duration)

    logger.info('Lessons fetched successfully', 'API', {
      courseId,
      count: transformedLessons.length,
      duration
    })

    return res.status(200).json({
      success: true,
      data: transformedLessons,
      lessons: transformedLessons // For compatibility
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Invalid course ID: ${error.errors.map(e => e.message).join(', ')}`
      )

      logger.error('Course ID validation failed', 'API', { error, duration })
      return res.status(400).json(validationError.toJSON())
    }

    if (error instanceof ValidationError) {
      logger.error('Lessons fetch validation failed', 'API', { error, duration })
      return res.status(error.statusCode).json(error.toJSON())
    }

    logger.error('Unexpected error fetching lessons', 'API', { error, duration })

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while fetching lessons'
    })
  }
}

/**
 * Update existing lesson
 * @param {any} lessonData
 * @param {string} courseId
 * @param {number} order
 * @returns {Promise<LessonData[]>}
 */
async function updateLesson(lessonData, courseId, order) {
  const sanitizedData = sanitizeObject(lessonData)

  const updateData = {
    title: sanitizedData.title,
    description: sanitizedData.description,
    type: sanitizedData.type || 'video',
    content: sanitizedData.content,
    video_url: sanitizedData.video_url,
    duration: parseInt(sanitizedData.duration) || 0,
    order,
    is_preview: sanitizedData.is_preview || false,
    is_free: sanitizedData.is_free || false,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .update(updateData)
    .eq('id', sanitizedData.id)
    .eq('course_id', courseId) // Ensure lesson belongs to this course
    .select()

  if (error) {
    logger.error('Failed to update lesson', 'API', {
      lessonId: sanitizedData.id,
      courseId,
      error
    })
    throw new Error(`Failed to update lesson ${sanitizedData.id}`)
  }

  return data || []
}

/**
 * Create new lesson
 * @param {any} lessonData
 * @param {string} courseId
 * @param {number} order
 * @returns {Promise<LessonData[]>}
 */
async function createLesson(lessonData, courseId, order) {
  const sanitizedData = sanitizeObject(lessonData)

  const insertData = {
    course_id: courseId,
    title: sanitizedData.title,
    description: sanitizedData.description,
    type: sanitizedData.type || 'video',
    content: sanitizedData.content,
    video_url: sanitizedData.video_url,
    duration: parseInt(sanitizedData.duration) || 0,
    order,
    is_preview: sanitizedData.is_preview || false,
    is_free: sanitizedData.is_free || false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .insert([insertData])
    .select()

  if (error) {
    logger.error('Failed to create lesson', 'API', {
      courseId,
      title: sanitizedData.title,
      error
    })
    throw new Error(`Failed to create lesson: ${sanitizedData.title}`)
  }

  return data || []
}

/**
 * Delete lessons by IDs
 * @param {string[]} lessonIds
 * @param {string} courseId
 * @returns {Promise<void>}
 */
async function deleteLessons(lessonIds, courseId) {
  if (lessonIds.length === 0) return

  const { error } = await supabaseAdmin
    .from('lessons')
    .delete()
    .in('id', lessonIds)
    .eq('course_id', courseId) // Ensure lessons belong to this course

  if (error) {
    logger.error('Failed to delete lessons', 'API', {
      lessonIds,
      courseId,
      error
    })
    throw new Error('Failed to delete lessons')
  }

  logger.info('Lessons deleted successfully', 'API', {
    courseId,
    deletedCount: lessonIds.length,
    deletedIds: lessonIds
  })
}

/**
 * POST handler - Bulk update/create/delete lessons
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse<BulkUpdateResponse>} res
 * @returns {Promise<void>}
 */
async function bulkUpdateLessons(req, res) {
  const startTime = Date.now()

  try {
    const courseId = validateCourseId(req.query)
    const validatedData = bulkLessonsSchema.parse(req.body)

    logger.info('Bulk updating course lessons', 'API', {
      courseId,
      action: validatedData.action,
      lessonsCount: validatedData.lessons.length,
      deletedCount: validatedData.deletedLessons.length
    })

    // Validate course exists
    await validateCourseExists(courseId)

    const results = []

    // Delete lessons first
    if (validatedData.deletedLessons.length > 0) {
      await deleteLessons(validatedData.deletedLessons, courseId)
    }

    // Process lessons (update existing or create new)
    for (let i = 0; i < validatedData.lessons.length; i++) {
      const lesson = validatedData.lessons[i]
      const order = i + 1

      logger.debug(`Processing lesson ${i + 1}/${validatedData.lessons.length}`, 'API', {
        courseId,
        lessonId: lesson.id,
        title: lesson.title,
        order
      })

      try {
        if (lesson.id && !validatedData.deletedLessons.includes(lesson.id)) {
          // Update existing lesson
          const updatedLessons = await updateLesson(lesson, courseId, order)
          results.push(...updatedLessons.map(transformLesson))
        } else {
          // Create new lesson
          const createdLessons = await createLesson(lesson, courseId, order)
          results.push(...createdLessons.map(transformLesson))
        }
      } catch (lessonError) {
        logger.error(`Failed to process lesson ${i + 1}`, 'API', {
          courseId,
          lessonData: lesson,
          error: lessonError
        })
        throw lessonError
      }
    }

    // Invalidate caches
    invalidateCache(`course_lessons:${courseId}`)
    invalidateCache(`course:${courseId}`)

    const duration = Date.now() - startTime
    logger.performance('Bulk lessons update', duration)

    logger.info('Bulk lessons update completed successfully', 'API', {
      courseId,
      processedCount: results.length,
      deletedCount: validatedData.deletedLessons.length,
      duration
    })

    return res.status(200).json({
      success: true,
      data: results,
      lessons: results, // For compatibility
      message: 'Lessons updated successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        { validationErrors: error.errors }
      )

      logger.error('Bulk lessons update validation failed', 'API', {
        error: validationError,
        duration
      })

      return res.status(400).json(validationError.toJSON())
    }

    if (error instanceof ValidationError) {
      logger.error('Bulk lessons update failed', 'API', { error, duration })
      return res.status(error.statusCode).json(error.toJSON())
    }

    logger.error('Unexpected error in bulk lessons update', 'API', { error, duration })

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while updating lessons'
    })
  }
}

/**
 * Main handler with method routing
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 * @returns {Promise<void>}
 */
async function lessonsHandler(req, res) {
  const method = req.method

  try {
    switch (method) {
      case 'GET':
        return await getLessons(req, res)

      case 'POST':
        // In production, add authentication middleware for admin only
        return await bulkUpdateLessons(req, res)

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        })
    }
  } catch (error) {
    logger.error('Lessons API handler error', 'API', { method, error })

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

export default lessonsHandler

// For production with authentication middleware:
// export default withMiddleware(lessonsHandler, {
//   cors: true,
//   rateLimit: DEFAULT_RATE_LIMIT,
//   auth: false, // GET doesn't require auth
//   // Custom logic needed for POST requiring admin auth
// })