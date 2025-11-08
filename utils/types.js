/**
 * Common types used across the application
 * These are defined using JSDoc for better IDE support while keeping JavaScript
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {'student' | 'admin'} role
 * @property {string} [created_at]
 * @property {string} [avatar_url]
 */

/**
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {number} price
 * @property {string} [thumbnail_url]
 * @property {boolean} featured
 * @property {string} category
 * @property {string} created_at
 * @property {Lesson[]} [lessons]
 */

/**
 * @typedef {Object} Lesson
 * @property {string} id
 * @property {string} course_id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [video_url]
 * @property {number} order
 * @property {'video' | 'post'} type
 * @property {string} [content]
 * @property {number} [duration]
 * @property {string} created_at
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} user_id
 * @property {string} course_id
 * @property {number} amount
 * @property {'pending' | 'approved' | 'rejected' | 'failed'} status
 * @property {'payhere' | 'stripe' | 'bank'} method
 * @property {string} created_at
 * @property {string} [approved_at]
 */

/**
 * @typedef {Object} Purchase
 * @property {string} id
 * @property {string} user_id
 * @property {string} course_id
 * @property {string} payment_id
 * @property {boolean} access_granted
 * @property {string} purchase_date
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {T} [data]
 * @property {string} [error]
 * @property {string} [message]
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {string[] | Object.<string, string>} errors
 */

/**
 * @typedef {Object} VideoMetadata
 * @property {'youtube' | 'supabase' | 'direct' | 'unknown'} type
 * @property {string} [id]
 * @property {string} [title]
 * @property {number} [duration]
 * @property {string} [thumbnail]
 * @property {boolean} accessible
 */

/**
 * @typedef {Object} UploadOptions
 * @property {number} [maxSize]
 * @property {string[]} [allowedTypes]
 * @property {string[]} [allowedExtensions]
 */

/**
 * @typedef {Object} CourseProgress
 * @property {string} courseId
 * @property {string[]} completedLessons
 * @property {number} totalLessons
 * @property {number} progressPercentage
 * @property {string} lastAccessedAt
 */

/**
 * @template T
 * @typedef {Object} StorageItem
 * @property {T} value
 * @property {number} [expiry]
 */

/**
 * @typedef {'info' | 'warn' | 'error' | 'debug'} LogLevel
 */

/**
 * @typedef {Object} ErrorContext
 * @property {string} [component]
 * @property {string} [action]
 * @property {string} [userId]
 * @property {Object.<string, any>} [additionalData]
 */

// Export empty object as this is just for JSDoc types
export default {};