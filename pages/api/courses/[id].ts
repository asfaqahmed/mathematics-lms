/**
 * Course API - Individual Course Operations
 *
 * Handles CRUD operations for individual courses including fetching,
 * updating, and deletion with proper validation and authorization.
 *
 * @route GET /api/courses/[id] - Get single course with lessons
 * @route PUT /api/courses/[id] - Update course (admin only)
 * @route DELETE /api/courses/[id] - Delete course (admin only)
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '../../../src/lib/supabase-admin'
import { logger } from '../../../src/lib/logger'
import {
  createSuccessResponse,
  createErrorResponse,
  getCached,
  setCached,
  invalidateCache,
  sanitizeObject
} from '../../../src/lib/api-utils'
import { courseSchema } from '../../../src/lib/validations'
import {
  ValidationError,
  AuthError,
  createNotFoundError,
  ErrorCode
} from '../../../src/lib/errors'

// Validation schemas
const courseIdSchema = z.object({
  id: z.string().uuid('Invalid course ID format')
})

const updateCourseSchema = courseSchema.partial().extend({
  category: z.string().min(1, 'Category is required').optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
  preview_video: z.string().url('Invalid preview video URL').optional(),
  intro_video: z.string().url('Invalid intro video URL').optional(),
  what_you_learn: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional()
})

// Response types
interface CourseWithLessons {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  level: string
  status: string
  thumbnail?: string
  preview_video?: string
  intro_video?: string
  what_you_learn: string[]
  requirements: string[]
  featured: boolean
  published?: boolean
  lessons: Lesson[]
  created_at: string
  updated_at: string
}

interface Lesson {
  id: string
  title: string
  description?: string
  duration: number
  video_url?: string
  order_index: number
  is_free: boolean
}

interface CourseResponse {
  success: boolean
  data?: CourseWithLessons
  message?: string
}

interface DeleteResponse {
  success: boolean
  message: string
}

/**
 * Validate course ID parameter
 */
function validateCourseId(query: any): string {
  const result = courseIdSchema.parse(query)
  return result.id
}

/**
 * Transform database course to response format
 */
function transformCourse(course: any): CourseWithLessons {
  // Sort lessons by order_index
  const lessons = (course.lessons || [])
    .map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration || 0,
      video_url: lesson.video_url,
      order_index: lesson.order_index || 0,
      is_free: lesson.is_free || false
    }))
    .sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    price: course.price,
    currency: course.currency || 'USD',
    category: course.category,
    level: course.level,
    status: course.status,
    thumbnail: course.thumbnail,
    preview_video: course.preview_video || course.intro_video,
    intro_video: course.intro_video || course.preview_video,
    what_you_learn: course.what_you_learn || [],
    requirements: course.requirements || [],
    featured: course.featured || false,
    published: course.published || false,
    lessons,
    created_at: course.created_at,
    updated_at: course.updated_at
  }
}

/**
 * GET handler - Fetch single course with lessons
 */
async function getCourse(req: NextApiRequest, res: NextApiResponse<CourseResponse>) {
  const startTime = Date.now()

  try {
    const courseId = validateCourseId(req.query)
    logger.info('Fetching course', 'API', { courseId })

    // Check cache first
    const cacheKey = `course:${courseId}`
    const cached = getCached<CourseWithLessons>(cacheKey)

    if (cached) {
      logger.info('Serving course from cache', 'API', { courseId })
      return res.status(200).json({
        success: true,
        data: cached
      })
    }

    // Fetch from database
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        lessons!lessons_course_id_fkey (
          id,
          title,
          description,
          duration,
          video_url,
          order_index,
          is_free
        )
      `)
      .eq('id', courseId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('Course not found', 'API', { courseId })
        throw createNotFoundError('Course')
      }

      logger.error('Database error fetching course', 'API', { error, courseId })
      throw new Error('Failed to fetch course from database')
    }

    // Transform and cache
    const transformedCourse = transformCourse(course)
    setCached(cacheKey, transformedCourse, 300000) // 5 minutes TTL

    const duration = Date.now() - startTime
    logger.performance('Course fetch', duration)

    logger.info('Course fetched successfully', 'API', {
      courseId,
      title: course.title,
      lessonCount: transformedCourse.lessons.length,
      duration
    })

    return res.status(200).json({
      success: true,
      data: transformedCourse
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Invalid course ID: ${error.errors.map(e => e.message).join(', ')}`
      )

      logger.error('Course ID validation failed', 'API', { error, duration })
      return res.status(400).json(validationError.toJSON() as any)
    }

    if (error instanceof ValidationError) {
      logger.error('Course fetch validation failed', 'API', { error, duration })
      return res.status(error.statusCode).json(error.toJSON() as any)
    }

    logger.error('Unexpected error fetching course', 'API', { error, duration })

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while fetching the course'
    })
  }
}

/**
 * PUT handler - Update course (admin only)
 */
async function updateCourse(req: NextApiRequest, res: NextApiResponse<CourseResponse>) {
  const startTime = Date.now()

  try {
    const courseId = validateCourseId(req.query)
    const validatedData = updateCourseSchema.parse(req.body)
    const sanitizedData = sanitizeObject(validatedData)

    logger.info('Updating course', 'API', {
      courseId,
      updateFields: Object.keys(sanitizedData)
    })

    // Check if course exists
    const { data: existingCourse, error: fetchError } = await supabaseAdmin
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw createNotFoundError('Course')
      }
      throw new Error('Failed to fetch course for update')
    }

    // Prepare update data
    const updateData = {
      ...sanitizedData,
      updated_at: new Date().toISOString()
    }

    // Handle field name compatibility
    if (sanitizedData.preview_video && !sanitizedData.intro_video) {
      updateData.intro_video = sanitizedData.preview_video
    }

    // Ensure arrays are properly formatted
    if (sanitizedData.what_you_learn) {
      updateData.what_you_learn = Array.isArray(sanitizedData.what_you_learn)
        ? sanitizedData.what_you_learn
        : []
    }

    if (sanitizedData.requirements) {
      updateData.requirements = Array.isArray(sanitizedData.requirements)
        ? sanitizedData.requirements
        : []
    }

    logger.debug('Course update data', 'API', { courseId, updateData })

    // Perform update
    const { data: updatedCourse, error } = await supabaseAdmin
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select(`
        *,
        lessons!lessons_course_id_fkey (
          id,
          title,
          description,
          duration,
          video_url,
          order_index,
          is_free
        )
      `)
      .single()

    if (error) {
      logger.error('Database error updating course', 'API', { error, courseId })
      throw new Error('Failed to update course in database')
    }

    // Transform response
    const transformedCourse = transformCourse(updatedCourse)

    // Invalidate caches
    invalidateCache(`course:${courseId}`)
    invalidateCache('courses:') // Pattern to clear course list caches

    const duration = Date.now() - startTime
    logger.performance('Course update', duration)

    logger.info('Course updated successfully', 'API', {
      courseId,
      title: updatedCourse.title,
      updateFields: Object.keys(sanitizedData),
      duration
    })

    return res.status(200).json({
      success: true,
      data: transformedCourse,
      message: 'Course updated successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        { validationErrors: error.errors }
      )

      logger.error('Course update validation failed', 'API', { error, duration })
      return res.status(400).json(validationError.toJSON() as any)
    }

    if (error instanceof ValidationError) {
      logger.error('Course update failed', 'API', { error, duration })
      return res.status(error.statusCode).json(error.toJSON() as any)
    }

    logger.error('Unexpected error updating course', 'API', { error, duration })

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while updating the course'
    })
  }
}

/**
 * DELETE handler - Delete course and associated lessons (admin only)
 */
async function deleteCourse(req: NextApiRequest, res: NextApiResponse<DeleteResponse>) {
  const startTime = Date.now()

  try {
    const courseId = validateCourseId(req.query)
    logger.info('Deleting course', 'API', { courseId })

    // Check if course exists
    const { data: existingCourse, error: fetchError } = await supabaseAdmin
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw createNotFoundError('Course')
      }
      throw new Error('Failed to fetch course for deletion')
    }

    // Check for enrolled students
    const { data: purchases, error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('course_id', courseId)
      .eq('access_granted', true)

    if (purchaseError) {
      logger.warn('Failed to check course purchases', 'API', { courseId, purchaseError })
    } else if (purchases && purchases.length > 0) {
      logger.warn('Attempting to delete course with active enrollments', 'API', {
        courseId,
        enrollmentCount: purchases.length
      })

      throw new ValidationError(
        `Cannot delete course with active enrollments (${purchases.length} students enrolled)`
      )
    }

    // Delete associated lessons first (cascade should handle this, but being explicit)
    const { error: lessonsError } = await supabaseAdmin
      .from('lessons')
      .delete()
      .eq('course_id', courseId)

    if (lessonsError) {
      logger.error('Failed to delete course lessons', 'API', { courseId, lessonsError })
      throw new Error('Failed to delete course lessons')
    }

    // Delete the course
    const { error: courseError } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (courseError) {
      logger.error('Failed to delete course', 'API', { courseId, courseError })
      throw new Error('Failed to delete course')
    }

    // Invalidate caches
    invalidateCache(`course:${courseId}`)
    invalidateCache('courses:') // Pattern to clear course list caches

    const duration = Date.now() - startTime
    logger.performance('Course deletion', duration)

    logger.info('Course deleted successfully', 'API', {
      courseId,
      title: existingCourse.title,
      duration
    })

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Invalid course ID: ${error.errors.map(e => e.message).join(', ')}`
      )

      logger.error('Course deletion validation failed', 'API', { error, duration })
      return res.status(400).json(validationError.toJSON() as any)
    }

    if (error instanceof ValidationError) {
      logger.error('Course deletion failed', 'API', { error, duration })
      return res.status(error.statusCode).json(error.toJSON() as any)
    }

    logger.error('Unexpected error deleting course', 'API', { error, duration })

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while deleting the course'
    })
  }
}

/**
 * Main handler with method routing
 */
async function courseHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method

  try {
    switch (method) {
      case 'GET':
        return await getCourse(req, res)

      case 'PUT':
        // In production, add authentication middleware
        return await updateCourse(req, res)

      case 'DELETE':
        // In production, add authentication middleware
        return await deleteCourse(req, res)

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        })
    }
  } catch (error) {
    logger.error('Course API handler error', 'API', { method, error })

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

export default courseHandler

// For production with authentication middleware:
// export default withMiddleware(courseHandler, {
//   cors: true,
//   rateLimit: DEFAULT_RATE_LIMIT,
//   auth: false, // GET doesn't require auth
//   // Custom logic needed for PUT/DELETE requiring admin auth
// })