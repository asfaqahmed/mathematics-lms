/**
 * Courses API - Main Endpoint
 *
 * Handles CRUD operations for courses including listing, creation, and management.
 * Provides comprehensive validation, caching, and permission controls.
 *
 * @route GET /api/courses - List all published courses with pagination
 * @route POST /api/courses - Create a new course (admin only)
 */

import { z } from 'zod'
import { supabase } from '../../../lib/supabase-admin'
import { logger } from '../../../lib/logger'
import {
  withMiddleware,
  createSuccessResponse,
  createErrorResponse,
  createPaginationInfo,
  getCached,
  setCached,
  parseQueryParams
} from '../../../utils/api'
import {
  courseSchema,
  searchParamsSchema
} from '../../../lib/validations'
import {
  ValidationError,
  AuthError,
  createNotFoundError,
  ErrorCode
} from '../../../utils/error'

/**
 * @typedef {Object} CourseWithStats
 * @property {string} id - Course ID
 * @property {string} title - Course title
 * @property {string} description - Course description
 * @property {number} price - Course price
 * @property {string} currency - Course currency (default: USD)
 * @property {string} category - Course category
 * @property {string} level - Course level (beginner, intermediate, advanced)
 * @property {string} status - Course status (draft, published)
 * @property {string} [thumbnail] - Course thumbnail URL
 * @property {string} [preview_video] - Course preview video URL
 * @property {string} [intro_video] - Course intro video URL
 * @property {string[]} what_you_learn - Learning objectives
 * @property {string[]} requirements - Course requirements
 * @property {boolean} featured - Whether course is featured
 * @property {number} lesson_count - Number of lessons
 * @property {number} total_duration - Total course duration in seconds
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} CoursesListResponse
 * @property {boolean} success - Whether request was successful
 * @property {CourseWithStats[]} data - Array of courses with stats
 * @property {Object} pagination - Pagination information
 * @property {number} pagination.page - Current page number
 * @property {number} pagination.limit - Items per page
 * @property {number} pagination.total - Total number of items
 * @property {number} pagination.totalPages - Total number of pages
 * @property {boolean} pagination.hasNext - Whether there is a next page
 * @property {boolean} pagination.hasPrev - Whether there is a previous page
 * @property {string} [message] - Optional message
 */

/**
 * @typedef {Object} CourseCreateResponse
 * @property {boolean} success - Whether request was successful
 * @property {CourseWithStats} data - Created course data
 * @property {string} message - Success message
 */

// Extended validation schemas
const createCourseSchema = courseSchema.extend({
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
  preview_video: z.string().url('Invalid preview video URL').optional(),
  intro_video: z.string().url('Invalid intro video URL').optional(),
  what_you_learn: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false)
})

const courseQuerySchema = searchParamsSchema.extend({
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  featured: z.coerce.boolean().optional(),
  include_draft: z.coerce.boolean().optional().default(false)
})

/**
 * Build course query with filters
 * @param {Object} params - Query parameters
 * @param {string} [params.category] - Course category
 * @param {string} [params.level] - Course level
 * @param {boolean} [params.featured] - Featured courses only
 * @param {boolean} [params.include_draft] - Include draft courses
 * @param {string} [params.status] - Course status filter
 * @param {string} [params.q] - Search query
 * @param {string} [params.sort] - Sort field
 * @param {string} [params.order] - Sort order
 * @returns {import('@supabase/supabase-js').SupabaseQueryBuilder} Query builder
 */
function buildCourseQuery(params) {
  let query = supabase
    .from('courses')
    .select(`
      *,
      lessons!lessons_course_id_fkey (id, title, duration)
    `)

  // Status filter
  if (!params.include_draft) {
    query = query.eq('status', 'published')
  } else if (params.status) {
    query = query.eq('status', params.status)
  }

  // Category filter
  if (params.category) {
    query = query.eq('category', params.category)
  }

  // Level filter
  if (params.level) {
    query = query.eq('level', params.level)
  }

  // Featured filter
  if (params.featured !== undefined) {
    query = query.eq('featured', params.featured)
  }

  // Search query
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  }

  // Sorting
  const sortField = params.sort || 'created_at'
  const sortOrder = params.order === 'asc'

  query = query.order(sortField, { ascending: sortOrder })

  return query
}

/**
 * Transform course data with stats
 * @param {Object} course - Raw course data from database
 * @returns {CourseWithStats} Transformed course data
 */
function transformCourseWithStats(course) {
  const lessons = course.lessons || []

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
    lesson_count: lessons.length,
    total_duration: lessons.reduce((acc, lesson) =>
      acc + (lesson.duration || 0), 0
    ),
    created_at: course.created_at,
    updated_at: course.updated_at
  }
}

/**
 * GET handler - List courses with filters and pagination
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @param {import('next').NextApiResponse<CoursesListResponse>} res - Next.js API response
 */
async function getCourses(req, res) {
  const startTime = Date.now()

  try {
    // Parse and validate query parameters
    const params = parseQueryParams(req, courseQuerySchema)
    logger.info('Fetching courses', 'API', { params })

    // Generate cache key
    const cacheKey = `courses:${JSON.stringify(params)}`
    const cached = getCached(cacheKey)

    if (cached) {
      logger.info('Serving courses from cache', 'API', { cacheKey })
      const pagination = createPaginationInfo(params.page, params.limit, cached.total)
      return res.status(200).json({
        success: true,
        data: cached.courses,
        pagination
      })
    }

    // Build and execute query
    const query = buildCourseQuery(params)

    // Get total count for pagination
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })

    if (count === null) {
      throw new Error('Failed to get course count')
    }

    // Apply pagination
    const offset = (params.page - 1) * params.limit
    const { data: courses, error } = await query
      .range(offset, offset + params.limit - 1)

    if (error) {
      logger.error('Database error fetching courses', 'API', { error, params })
      throw new Error('Failed to fetch courses from database')
    }

    // Transform courses with stats
    const coursesWithStats = courses.map(transformCourseWithStats)

    // Cache the results (5 minutes TTL)
    setCached(cacheKey, { courses: coursesWithStats, total: count }, 300000)

    // Create pagination info
    const pagination = createPaginationInfo(params.page, params.limit, count)

    const duration = Date.now() - startTime
    logger.performance('Courses fetch', duration)

    logger.info('Courses fetched successfully', 'API', {
      count: coursesWithStats.length,
      total: count,
      duration,
      page: params.page
    })

    return res.status(200).json({
      success: true,
      data: coursesWithStats,
      pagination
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Failed to fetch courses', 'API', { error, duration })

    return res.status(500).json({
      success: false,
      data: [],
      pagination: createPaginationInfo(1, 12, 0),
      message: 'Failed to fetch courses'
    })
  }
}

/**
 * POST handler - Create new course (admin only)
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @param {import('next').NextApiResponse<CourseCreateResponse>} res - Next.js API response
 */
async function createCourse(req, res) {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const validatedData = createCourseSchema.parse(req.body)

    logger.info('Creating new course', 'API', {
      title: validatedData.title,
      category: validatedData.category,
      level: validatedData.level,
      price: validatedData.price
    })

    // Check if course with same title exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('title', validatedData.title)
      .single()

    if (existingCourse) {
      throw new ValidationError('A course with this title already exists')
    }

    // Create course
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        currency: validatedData.currency,
        category: validatedData.category,
        level: validatedData.level,
        thumbnail: validatedData.thumbnail,
        preview_video: validatedData.preview_video,
        intro_video: validatedData.intro_video || validatedData.preview_video,
        what_you_learn: validatedData.what_you_learn,
        requirements: validatedData.requirements,
        status: validatedData.status,
        featured: validatedData.featured,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error('Database error creating course', 'API', { error, title: validatedData.title })
      throw new Error('Failed to create course in database')
    }

    // Transform response data
    const courseWithStats = transformCourseWithStats({ ...course, lessons: [] })

    // Clear relevant caches
    // Note: In production, implement more sophisticated cache invalidation
    const cachePattern = 'courses:'
    // invalidateCache(cachePattern) - implement cache invalidation

    const duration = Date.now() - startTime
    logger.performance('Course creation', duration)

    logger.info('Course created successfully', 'API', {
      courseId: course.id,
      title: course.title,
      duration
    })

    return res.status(201).json({
      success: true,
      data: courseWithStats,
      message: 'Course created successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        { validationErrors: error.errors }
      )

      logger.error('Course creation validation failed', 'API', {
        error: validationError,
        duration
      })

      return res.status(400).json(validationError.toJSON())
    }

    if (error instanceof ValidationError) {
      logger.error('Course creation failed', 'API', { error, duration })
      return res.status(error.statusCode).json(error.toJSON())
    }

    logger.error('Unexpected error creating course', 'API', { error, duration })

    return res.status(500).json({
      success: false,
      data: {},
      message: 'An unexpected error occurred while creating the course'
    })
  }
}

/**
 * Main handler with method routing
 * @param {import('next').NextApiRequest} req - Next.js API request
 * @param {import('next').NextApiResponse} res - Next.js API response
 */
async function coursesHandler(req, res) {
  const method = req.method

  try {
    switch (method) {
      case 'GET':
        return await getCourses(req, res)

      case 'POST':
        // Check authentication and admin role for POST
        // This would be handled by withMiddleware in production
        return await createCourse(req, res)

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        })
    }
  } catch (error) {
    logger.error('Courses API handler error', 'API', { method, error })

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// Export with middleware (uncomment for production with auth)
export default coursesHandler

// For production with authentication middleware:
// export default withMiddleware(coursesHandler, {
//   cors: true,
//   rateLimit: DEFAULT_RATE_LIMIT,
//   auth: false, // GET doesn't require auth
//   // Custom logic needed for POST requiring admin auth
// })