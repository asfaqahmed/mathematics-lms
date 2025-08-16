// Application Info
export const APP_NAME = 'MathPro Academy'
export const APP_DESCRIPTION = 'Excellence in Mathematics Education'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mathpro.lk'
export const APP_LOGO = '/logo.svg'

// Currency
export const CURRENCY = 'LKR'
export const CURRENCY_SYMBOL = 'Rs.'

// Course Categories
export const COURSE_CATEGORIES = [
  { value: 'algebra', label: 'Algebra' },
  { value: 'calculus', label: 'Calculus' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'statistics', label: 'Statistics' },
  { value: 'trigonometry', label: 'Trigonometry' },
  { value: 'discrete', label: 'Discrete Mathematics' }
]

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin'
}

// Payment Methods
export const PAYMENT_METHODS = {
  PAYHERE: 'payhere',
  STRIPE: 'stripe',
  BANK: 'bank'
}

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FAILED: 'failed'
}

// Lesson Types
export const LESSON_TYPES = {
  VIDEO: 'video',
  POST: 'post'
}

// Email Templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PAYMENT_SUCCESS: 'paymentSuccess',
  BANK_APPROVAL: 'bankApproval',
  PASSWORD_RESET: 'passwordReset',
  COURSE_REMINDER: 'courseReminder',
  ANNOUNCEMENT: 'announcement'
}

// Pagination
export const ITEMS_PER_PAGE = 12
export const ADMIN_ITEMS_PER_PAGE = 20

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

// Session
export const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
export const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password'
  },
  COURSES: {
    LIST: '/api/courses',
    DETAIL: '/api/courses/:id',
    CREATE: '/api/courses/create',
    UPDATE: '/api/courses/:id/update',
    DELETE: '/api/courses/:id/delete'
  },
  PAYMENTS: {
    CREATE_CHECKOUT: '/api/payments/create-checkout',
    PAYHERE_CALLBACK: '/api/payments/payhere-callback',
    STRIPE_WEBHOOK: '/api/payments/stripe-webhook',
    APPROVE_BANK: '/api/payments/approve-bank'
  },
  EMAIL: {
    SEND: '/api/email/send'
  }
}

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Welcome back!',
  REGISTER: 'Registration successful! Please check your email.',
  LOGOUT: 'You have been logged out successfully.',
  COURSE_CREATED: 'Course created successfully!',
  COURSE_UPDATED: 'Course updated successfully!',
  COURSE_DELETED: 'Course deleted successfully!',
  PAYMENT_SUCCESS: 'Payment successful! You now have access to the course.',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  EMAIL_SENT: 'Email sent successfully!'
}

// Validation Rules
export const VALIDATION_RULES = {
  NAME: {
    MIN: 2,
    MAX: 50
  },
  EMAIL: {
    MAX: 100
  },
  PASSWORD: {
    MIN: 6,
    MAX: 100
  },
  PHONE: {
    MIN: 9,
    MAX: 15
  },
  COURSE_TITLE: {
    MIN: 3,
    MAX: 200
  },
  COURSE_DESCRIPTION: {
    MIN: 10,
    MAX: 5000
  },
  MESSAGE: {
    MIN: 10,
    MAX: 1000
  }
}

// Social Links
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/mathproacademy',
  TWITTER: 'https://twitter.com/mathproacademy',
  INSTAGRAM: 'https://instagram.com/mathproacademy',
  YOUTUBE: 'https://youtube.com/mathproacademy',
  LINKEDIN: 'https://linkedin.com/company/mathproacademy'
}

// Contact Info
export const CONTACT_INFO = {
  EMAIL: 'support@mathpro.lk',
  PHONE: '+94 75 660 5254',
  WHATSAPP: '94771234567',
  ADDRESS: 'Colombo, Sri Lanka'
}

// Bank Details
export const BANK_DETAILS = {
  NAME: process.env.NEXT_PUBLIC_BANK_NAME,
  ACCOUNT: process.env.NEXT_PUBLIC_BANK_ACCOUNT,
  ACCOUNT_NAME: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME,
  BRANCH: process.env.NEXT_PUBLIC_BANK_BRANCH,
  SWIFT: process.env.NEXT_PUBLIC_BANK_SWIFT
}

// Meta Tags
export const META_TAGS = {
  TITLE_SUFFIX: ' | MathPro Academy',
  DEFAULT_DESCRIPTION: 'Learn mathematics with expert instructors. Comprehensive courses in Algebra, Calculus, Geometry, and more.',
  DEFAULT_KEYWORDS: 'mathematics, math courses, online learning, algebra, calculus, geometry, sri lanka',
  OG_IMAGE: '/og-image.png',
  TWITTER_HANDLE: '@mathproacademy'
}