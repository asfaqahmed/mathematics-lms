/**
 * Central Utilities Export
 * Main entry point for all utility modules
 */

// API utilities
export * from './api';

// Authentication utilities
export * from './auth';

// Validation utilities
export * from './validation';

// Formatting utilities
export * from './format';

// File handling utilities
export * from './file';

// Course utilities
export * from './course';

// Storage utilities
export * from './storage';

// Error handling utilities
export * from './error';

// Constants
export * from './constants';

// Video utilities
export * from './video';

/**
 * Re-export commonly used utilities with shorter names for convenience
 */

// API
export {
  get as apiGet,
  post as apiPost,
  put as apiPut,
  del as apiDelete,
  createApiClient,
  createApiResponse,
  handleApiResponse,
} from './api';

// Auth
export {
  TokenManager as Auth,
  JWTUtils as JWT,
  SessionManager as Session,
  permissions,
} from './auth';

// Validation
export {
  validateForm as validate,
  validateField,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  sanitize,
} from './validation';

// Formatting
export {
  formatCurrency as currency,
  formatDate as date,
  formatDuration as duration,
  formatNumber as number,
  formatPercentage as percentage,
  formatFileSize as fileSize,
} from './format';

// File handling
export {
  validateFile,
  validateFiles,
  fileToBase64,
  getImageDimensions,
  resizeImage,
  FileUploadTracker,
} from './file';

// Course utilities
export {
  calculateCourseProgress,
  calculateDetailedProgress,
  getNextLesson,
  generateCertificateData,
  estimateCompletionTime,
} from './course';

// Storage utilities
export {
  localStorage as storage,
  sessionStorage,
  secureStorage,
  expiringStorage,
  storageUtils,
} from './storage';

// Error handling
export {
  logger,
  errorHandler,
  getUserFriendlyMessage,
  createErrorBoundary,
  errorUtils,
} from './error';

// Video utilities
export {
  getVideoType,
  validateVideoUrl,
  getYouTubeEmbedUrl,
  getVideoThumbnail,
  getVideoMetadata,
  extractYouTubeId,
} from './video';

/**
 * @typedef {Object} UtilsNamespace
 * @property {Object} api - API utilities
 * @property {function} api.get - HTTP GET request
 * @property {function} api.post - HTTP POST request
 * @property {function} api.put - HTTP PUT request
 * @property {function} api.delete - HTTP DELETE request
 * @property {function} api.uploadFile - File upload request
 * @property {function} api.createClient - Create API client
 * @property {function} api.createResponse - Create API response
 * @property {function} api.handleResponse - Handle API response
 * 
 * @property {Object} auth - Authentication utilities
 * @property {Object} auth.TokenManager - Token management
 * @property {Object} auth.JWTUtils - JWT utilities
 * @property {Object} auth.SessionManager - Session management
 * @property {Object} auth.permissions - Permission constants
 * @property {function} auth.hasRole - Role check
 * @property {function} auth.isAdmin - Admin check
 * @property {function} auth.isStudent - Student check
 * 
 * @property {Object} validation - Validation utilities
 * @property {function} validation.validateForm - Form validation
 * @property {function} validation.validateField - Field validation
 * @property {function} validation.isValidEmail - Email validation
 * @property {function} validation.isValidPhone - Phone validation
 * @property {function} validation.isValidUrl - URL validation
 * @property {function} validation.validatePassword - Password validation
 * @property {Object} validation.sanitize - Sanitization utilities
 * 
 * @property {Object} format - Formatting utilities
 * @property {function} format.currency - Currency formatting
 * @property {function} format.date - Date formatting
 * @property {function} format.duration - Duration formatting
 * @property {function} format.number - Number formatting
 * @property {function} format.percentage - Percentage formatting
 * @property {function} format.fileSize - File size formatting
 * @property {function} format.phone - Phone formatting
 * @property {function} format.name - Name formatting
 * @property {function} format.initials - Get initials
 * @property {function} format.slug - Create slug
 * @property {function} format.truncate - Truncate text
 * 
 * @property {Object} file - File utilities
 * @property {function} file.validate - File validation
 * @property {function} file.validateMultiple - Multiple files validation
 * @property {function} file.toBase64 - Convert to Base64
 * @property {function} file.toText - Convert to text
 * @property {function} file.getImageDimensions - Get image dimensions
 * @property {function} file.resizeImage - Resize image
 * @property {function} file.createThumbnail - Create thumbnail
 * @property {function} file.download - Download file
 * @property {function} file.sanitizeFilename - Sanitize filename
 * @property {Object} file.UploadTracker - Upload tracking
 * 
 * @property {Object} course - Course utilities
 * @property {function} course.calculateProgress - Calculate progress
 * @property {function} course.calculateDetailedProgress - Detailed progress
 * @property {function} course.getNextLesson - Get next lesson
 * @property {function} course.getRecommendations - Get recommendations
 * @property {function} course.generateCertificate - Generate certificate
 * @property {function} course.estimateCompletion - Estimate completion
 * @property {function} course.calculateStats - Calculate stats
 * @property {function} course.searchCourses - Search courses
 * @property {function} course.sortCourses - Sort courses
 * 
 * @property {Object} storage - Storage utilities
 * @property {Object} storage.local - Local storage
 * @property {Object} storage.session - Session storage
 * @property {Object} storage.secure - Secure storage
 * @property {Object} storage.expiring - Expiring storage
 * @property {Object} storage.utils - Storage utilities
 * 
 * @property {Object} error - Error utilities
 * @property {Object} error.Logger - Logger
 * @property {Object} error.ErrorHandler - Error handler
 * @property {Object} error.logger - Logger instance
 * @property {function} error.handler - Error handler
 * @property {function} error.getUserMessage - Get user message
 * @property {function} error.createBoundary - Create error boundary
 * @property {Object} error.utils - Error utilities
 * 
 * @property {Object} video - Video utilities
 * @property {function} video.getType - Get video type
 * @property {function} video.validate - Validate video URL
 * @property {function} video.getYouTubeEmbed - Get YouTube embed URL
 * @property {function} video.getThumbnail - Get video thumbnail
 * @property {function} video.getMetadata - Get video metadata
 * @property {function} video.extractYouTubeId - Extract YouTube ID
 * @property {function} video.formatDuration - Format duration
 * @property {function} video.checkSupport - Check format support
 */

/**
 * Utility collection object for namespace access
 * @type {UtilsNamespace}
 */
export const utils = {
  // API utilities
  api: {
    get: require('./api').get,
    post: require('./api').post,
    put: require('./api').put,
    delete: require('./api').del,
    uploadFile: require('./api').uploadFile,
    createClient: require('./api').createApiClient,
    createResponse: require('./api').createApiResponse,
    handleResponse: require('./api').handleApiResponse,
  },

  // Authentication utilities
  auth: {
    TokenManager: require('./auth').TokenManager,
    JWTUtils: require('./auth').JWTUtils,
    SessionManager: require('./auth').SessionManager,
    permissions: require('./auth').permissions,
    hasRole: require('./auth').hasRole,
    isAdmin: require('./auth').isAdmin,
    isStudent: require('./auth').isStudent,
  },

  // Validation utilities
  validation: {
    validateForm: require('./validation').validateForm,
    validateField: require('./validation').validateField,
    isValidEmail: require('./validation').isValidEmail,
    isValidPhone: require('./validation').isValidPhone,
    isValidUrl: require('./validation').isValidUrl,
    validatePassword: require('./validation').validatePassword,
    sanitize: require('./validation').sanitize,
  },

  // Formatting utilities
  format: {
    currency: require('./format').formatCurrency,
    date: require('./format').formatDate,
    duration: require('./format').formatDuration,
    number: require('./format').formatNumber,
    percentage: require('./format').formatPercentage,
    fileSize: require('./format').formatFileSize,
    phone: require('./format').formatPhone,
    name: require('./format').formatName,
    initials: require('./format').getInitials,
    slug: require('./format').slugify,
    truncate: require('./format').truncate,
  },

  // File utilities
  file: {
    validate: require('./file').validateFile,
    validateMultiple: require('./file').validateFiles,
    toBase64: require('./file').fileToBase64,
    toText: require('./file').fileToText,
    getImageDimensions: require('./file').getImageDimensions,
    resizeImage: require('./file').resizeImage,
    createThumbnail: require('./file').createThumbnail,
    download: require('./file').downloadFile,
    sanitizeFilename: require('./file').sanitizeFilename,
    UploadTracker: require('./file').FileUploadTracker,
  },

  // Course utilities
  course: {
    calculateProgress: require('./course').calculateCourseProgress,
    calculateDetailedProgress: require('./course').calculateDetailedProgress,
    getNextLesson: require('./course').getNextLesson,
    getRecommendations: require('./course').getLessonRecommendations,
    generateCertificate: require('./course').generateCertificateData,
    estimateCompletion: require('./course').estimateCompletionTime,
    calculateStats: require('./course').calculateCourseStats,
    searchCourses: require('./course').searchCourses,
    sortCourses: require('./course').sortCourses,
  },

  // Storage utilities
  storage: {
    local: require('./storage').localStorage,
    session: require('./storage').sessionStorage,
    secure: require('./storage').secureStorage,
    expiring: require('./storage').expiringStorage,
    utils: require('./storage').storageUtils,
  },

  // Error utilities
  error: {
    Logger: require('./error').Logger,
    ErrorHandler: require('./error').ErrorHandler,
    logger: require('./error').logger,
    handler: require('./error').errorHandler,
    getUserMessage: require('./error').getUserFriendlyMessage,
    createBoundary: require('./error').createErrorBoundary,
    utils: require('./error').errorUtils,
  },

  // Video utilities
  video: {
    getType: require('./video').getVideoType,
    validate: require('./video').validateVideoUrl,
    getYouTubeEmbed: require('./video').getYouTubeEmbedUrl,
    getThumbnail: require('./video').getVideoThumbnail,
    getMetadata: require('./video').getVideoMetadata,
    extractYouTubeId: require('./video').extractYouTubeId,
    formatDuration: require('./video').formatVideoDuration,
    checkSupport: require('./video').checkVideoFormatSupport,
  },
};

/**
 * Default export for convenience
 */
export default utils;

/**
 * Version information
 * @type {string}
 */
export const VERSION = '1.0.0';

/**
 * Utility metadata
 * @type {{
 *   version: string,
 *   modules: string[],
 *   created: string,
 *   description: string
 * }}
 */
export const UTILS_INFO = {
  version: VERSION,
  modules: [
    'api',
    'auth',
    'validation',
    'format',
    'file',
    'course',
    'storage',
    'error',
    'constants',
    'video',
  ],
  created: '2025-01-13',
  description: 'Comprehensive utility library for MathPro Academy LMS',
};