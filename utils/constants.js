/**
 * Application Constants
 * Centralized configuration and constants with proper JSDoc types
 * @typedef {'student' | 'admin'} UserRole
 * @typedef {'payhere' | 'stripe' | 'bank'} PaymentMethod
 * @typedef {'pending' | 'approved' | 'rejected' | 'failed'} PaymentStatus
 * @typedef {'video' | 'post'} LessonType
 * @typedef {'welcome' | 'payment-success' | 'bank-approval' | 'password-reset' | 'course-reminder' | 'announcement'} EmailTemplate
 */

/**
 * Application Information
 * @type {const}
 */
export const APP_INFO = {
  NAME: 'MathPro Academy',
  DESCRIPTION: 'Excellence in Mathematics Education',
  URL: process.env.NEXT_PUBLIC_APP_URL || 'https://www.mathpro.lk',
  LOGO: '/logo.svg',
  VERSION: '1.0.0',
};

/**
 * Currency Configuration
 * @type {const}
 */
export const CURRENCY = {
  CODE: 'LKR',
  SYMBOL: 'Rs.',
  DECIMAL_PLACES: 0,
  CONVERSION_RATE: 100, // For cents conversion
};

/**
 * Course Categories
 * @type {const}
 */
export const COURSE_CATEGORIES = [
  { value: 'algebra', label: 'Algebra', description: 'Linear and quadratic equations, matrices, and algebraic structures' },
  { value: 'calculus', label: 'Calculus', description: 'Differential and integral calculus, limits, and derivatives' },
  { value: 'geometry', label: 'Geometry', description: 'Euclidean geometry, coordinate geometry, and geometric proofs' },
  { value: 'statistics', label: 'Statistics', description: 'Probability, data analysis, and statistical inference' },
  { value: 'trigonometry', label: 'Trigonometry', description: 'Trigonometric functions, identities, and applications' },
  { value: 'discrete', label: 'Discrete Mathematics', description: 'Set theory, logic, combinatorics, and graph theory' },
  { value: 'analysis', label: 'Mathematical Analysis', description: 'Real analysis, complex analysis, and measure theory' },
  { value: 'linear-algebra', label: 'Linear Algebra', description: 'Vector spaces, linear transformations, and eigenvalues' },
];

/** @type {Record<string, UserRole>} */
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

/** @type {const} */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.STUDENT]: [
    'view_courses',
    'purchase_courses',
    'access_purchased_courses',
    'view_progress',
    'update_profile',
  ],
  [USER_ROLES.ADMIN]: [
    'view_courses',
    'create_courses',
    'update_courses',
    'delete_courses',
    'manage_users',
    'view_payments',
    'approve_payments',
    'view_analytics',
    'send_notifications',
    'manage_settings',
  ],
};

/** @type {Record<string, PaymentMethod>} */
export const PAYMENT_METHODS = {
  PAYHERE: 'payhere',
  STRIPE: 'stripe',
  BANK: 'bank',
};

/** @type {Record<string, PaymentStatus>} */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FAILED: 'failed',
};

/** @type {Record<string, LessonType>} */
export const LESSON_TYPES = {
  VIDEO: 'video',
  POST: 'post',
};

/** @type {Record<string, EmailTemplate>} */
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PAYMENT_SUCCESS: 'payment-success',
  BANK_APPROVAL: 'bank-approval',
  PASSWORD_RESET: 'password-reset',
  COURSE_REMINDER: 'course-reminder',
  ANNOUNCEMENT: 'announcement',
};

/** @type {const} */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  ADMIN_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SEARCH_RESULTS_SIZE: 10,
};

/** @type {const} */
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
};

/** @type {const} */
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEOS: ['video/mp4', 'video/webm', 'video/ogg'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
};

/** @type {const} */
export const SESSION = {
  TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
};

/**
 * API Endpoints
 * @type {const}
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    REFRESH_TOKEN: '/api/auth/refresh',
  },
  COURSES: {
    LIST: '/api/courses',
    /**
     * @param {string} id
     * @returns {string}
     */
    DETAIL: (id) => `/api/courses/${id}`,
    CREATE: '/api/courses',
    /**
     * @param {string} id
     * @returns {string}
     */
    UPDATE: (id) => `/api/courses/${id}`,
    /**
     * @param {string} id
     * @returns {string}
     */
    DELETE: (id) => `/api/courses/${id}`,
    /**
     * @param {string} id
     * @returns {string}
     */
    ENROLL: (id) => `/api/courses/${id}/enroll`,
  },
  LESSONS: {
    /**
     * @param {string} courseId
     * @returns {string}
     */
    LIST: (courseId) => `/api/courses/${courseId}/lessons`,
    /**
     * @param {string} courseId
     * @param {string} lessonId
     * @returns {string}
     */
    DETAIL: (courseId, lessonId) => `/api/courses/${courseId}/lessons/${lessonId}`,
    /**
     * @param {string} courseId
     * @returns {string}
     */
    CREATE: (courseId) => `/api/courses/${courseId}/lessons`,
    /**
     * @param {string} courseId
     * @param {string} lessonId
     * @returns {string}
     */
    UPDATE: (courseId, lessonId) => `/api/courses/${courseId}/lessons/${lessonId}`,
    /**
     * @param {string} courseId
     * @param {string} lessonId
     * @returns {string}
     */
    DELETE: (courseId, lessonId) => `/api/courses/${courseId}/lessons/${lessonId}`,
    /**
     * @param {string} courseId
     * @param {string} lessonId
     * @returns {string}
     */
    COMPLETE: (courseId, lessonId) => `/api/courses/${courseId}/lessons/${lessonId}/complete`,
  },
  PAYMENTS: {
    CREATE_CHECKOUT: '/api/payments/create-checkout',
    PAYHERE_CALLBACK: '/api/payments/payhere-callback',
    STRIPE_WEBHOOK: '/api/payments/stripe-webhook',
    /**
     * @param {string} id
     * @returns {string}
     */
    APPROVE_BANK: (id) => `/api/payments/${id}/approve`,
    /**
     * @param {string} id
     * @returns {string}
     */
    REJECT_BANK: (id) => `/api/payments/${id}/reject`,
    LIST: '/api/payments',
    /**
     * @param {string} id
     * @returns {string}
     */
    DETAIL: (id) => `/api/payments/${id}`,
  },
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/change-password',
    MY_COURSES: '/api/users/my-courses',
    PROGRESS: '/api/users/progress',
  },
  EMAIL: {
    SEND: '/api/email/send',
  },
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    USERS: '/api/admin/users',
    COURSES: '/api/admin/courses',
    PAYMENTS: '/api/admin/payments',
    ANALYTICS: '/api/admin/analytics',
    SETTINGS: '/api/admin/settings',
  },
  UPLOAD: {
    IMAGE: '/api/upload/image',
    VIDEO: '/api/upload/video',
    DOCUMENT: '/api/upload/document',
  },
};

/** @type {const} */
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You don\'t have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a valid file.',
  PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  COURSE_ACCESS_DENIED: 'You need to purchase this course to access its content.',
  ALREADY_ENROLLED: 'You are already enrolled in this course.',
  COURSE_FULL: 'This course is full. No more enrollments are accepted.',
};

/** @type {const} */
export const SUCCESS_MESSAGES = {
  LOGIN: 'Welcome back!',
  REGISTER: 'Registration successful! Please check your email for verification.',
  LOGOUT: 'You have been logged out successfully.',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  EMAIL_VERIFIED: 'Email verified successfully!',
  COURSE_CREATED: 'Course created successfully!',
  COURSE_UPDATED: 'Course updated successfully!',
  COURSE_DELETED: 'Course deleted successfully!',
  LESSON_COMPLETED: 'Lesson completed! Great job!',
  PAYMENT_SUCCESS: 'Payment successful! You now have access to the course.',
  EMAIL_SENT: 'Email sent successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
};

/** @type {const} */
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  EMAIL: {
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  PHONE: {
    MIN_LENGTH: 9,
    MAX_LENGTH: 15,
  },
  COURSE_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  COURSE_DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 5000,
  },
  LESSON_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  MESSAGE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 1000,
  },
  PRICE: {
    MIN: 0,
    MAX: 999999,
  },
};

/** @type {const} */
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/mathproacademy',
  TWITTER: 'https://twitter.com/mathproacademy',
  INSTAGRAM: 'https://instagram.com/mathproacademy',
  YOUTUBE: 'https://youtube.com/mathproacademy',
  LINKEDIN: 'https://linkedin.com/company/mathproacademy',
  TELEGRAM: 'https://t.me/mathproacademy',
};

/** @type {const} */
export const CONTACT_INFO = {
  EMAIL: 'support@mathpro.lk',
  PHONE: '+94 75 660 5254',
  WHATSAPP: '+94 77 123 4567',
  ADDRESS: 'Colombo, Sri Lanka',
  BUSINESS_HOURS: 'Monday - Friday: 9:00 AM - 6:00 PM',
};

/** @type {const} */
export const BANK_DETAILS = {
  NAME: process.env.NEXT_PUBLIC_BANK_NAME || 'Commercial Bank of Ceylon',
  ACCOUNT_NUMBER: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '1234567890',
  ACCOUNT_NAME: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'MathPro Academy',
  BRANCH: process.env.NEXT_PUBLIC_BANK_BRANCH || 'Colombo Branch',
  SWIFT: process.env.NEXT_PUBLIC_BANK_SWIFT || 'CCEYLKLX',
  ROUTING: process.env.NEXT_PUBLIC_BANK_ROUTING || '',
};

/** @type {const} */
export const META_TAGS = {
  TITLE_SUFFIX: ' | MathPro Academy',
  DEFAULT_TITLE: 'MathPro Academy - Excellence in Mathematics Education',
  DEFAULT_DESCRIPTION: 'Learn mathematics with expert instructors. Comprehensive courses in Algebra, Calculus, Geometry, Statistics, and more. Start your mathematical journey today!',
  DEFAULT_KEYWORDS: [
    'mathematics',
    'math courses',
    'online learning',
    'algebra',
    'calculus',
    'geometry',
    'statistics',
    'trigonometry',
    'sri lanka',
    'education',
    'e-learning',
  ],
  OG_IMAGE: '/og-image.png',
  TWITTER_HANDLE: '@mathproacademy',
  SITE_NAME: 'MathPro Academy',
};

/** @type {const} */
export const FEATURE_FLAGS = {
  ENABLE_PAYHERE: process.env.NEXT_PUBLIC_ENABLE_PAYHERE === 'true',
  ENABLE_STRIPE: process.env.NEXT_PUBLIC_ENABLE_STRIPE === 'true',
  ENABLE_BANK_TRANSFER: process.env.NEXT_PUBLIC_ENABLE_BANK_TRANSFER !== 'false',
  ENABLE_EMAIL_VERIFICATION: process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION === 'true',
  ENABLE_2FA: process.env.NEXT_PUBLIC_ENABLE_2FA === 'true',
  ENABLE_COURSE_CERTIFICATES: process.env.NEXT_PUBLIC_ENABLE_CERTIFICATES !== 'false',
  ENABLE_COURSE_RATINGS: process.env.NEXT_PUBLIC_ENABLE_RATINGS !== 'false',
  ENABLE_DISCUSSION_FORUMS: process.env.NEXT_PUBLIC_ENABLE_FORUMS === 'true',
  ENABLE_LIVE_CHAT: process.env.NEXT_PUBLIC_ENABLE_LIVE_CHAT === 'true',
  MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
};

/** @type {const} */
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION: 30 * 60 * 1000, // 30 minutes
  },
  API_REQUESTS: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  PAYMENT_ATTEMPTS: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
  EMAIL_SENDING: {
    MAX_EMAILS: 5,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
};

/** @type {const} */
export const CACHE_TTL = {
  COURSES: 5 * 60 * 1000, // 5 minutes
  USER_PROFILE: 10 * 60 * 1000, // 10 minutes
  PAYMENT_STATUS: 30 * 1000, // 30 seconds
  ANALYTICS: 15 * 60 * 1000, // 15 minutes
  SETTINGS: 30 * 60 * 1000, // 30 minutes
};

/** @type {const} */
export const VIDEO_PLAYER = {
  DEFAULT_VOLUME: 0.8,
  PLAYBACK_RATES: [0.5, 0.75, 1, 1.25, 1.5, 2],
  QUALITY_LEVELS: ['auto', '1080p', '720p', '480p', '360p'],
  SKIP_FORWARD_TIME: 10, // seconds
  SKIP_BACKWARD_TIME: 10, // seconds
  PROGRESS_SAVE_INTERVAL: 5000, // 5 seconds
};

/** @type {const} */
export const NOTIFICATIONS = {
  DEFAULT_TIMEOUT: 5000, // 5 seconds
  SUCCESS_TIMEOUT: 3000, // 3 seconds
  ERROR_TIMEOUT: 8000, // 8 seconds
  WARNING_TIMEOUT: 6000, // 6 seconds
  MAX_NOTIFICATIONS: 5,
  POSITION: 'top-right',
};

/** @type {const} */
export const THEMES = {
  DEFAULT: 'light',
  AVAILABLE: ['light', 'dark', 'auto'],
};

/** @type {const} */
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

/** @type {const} */
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
};

/** @type {const} */
export const DEBUG = {
  ENABLE_CONSOLE_LOGS: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_METRICS: process.env.NODE_ENV === 'development',
  SHOW_REDUX_DEVTOOLS: process.env.NODE_ENV === 'development',
  API_DELAY_MS: process.env.NODE_ENV === 'development' ? 500 : 0,
};