/**
 * Central Utilities Export
 * Main entry point for all utility modules
 */

// Type definitions
export type * from './types';

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
 * Utility collection object for namespace access
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
} as const;

/**
 * Default export for convenience
 */
export default utils;

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Utility metadata
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
} as const;