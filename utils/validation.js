/**
 * Validation Utilities
 * Provides comprehensive form validation helpers and data sanitization
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string[] | Record<string, string>} errors - Array of error messages or field-specific errors
 */

/**
 * @typedef {Object} ValidationRule
 * @property {boolean} [required] - Whether field is required
 * @property {boolean} [email] - Whether field should be email
 * @property {boolean} [phone] - Whether field should be phone number
 * @property {boolean} [url] - Whether field should be URL
 * @property {boolean} [creditCard] - Whether field should be credit card number
 * @property {number} [minLength] - Minimum length
 * @property {number} [maxLength] - Maximum length
 * @property {number} [min] - Minimum value
 * @property {number} [max] - Maximum value
 * @property {RegExp} [pattern] - Regular expression pattern
 * @property {function(*, Record<string, *>): (string|null)} [custom] - Custom validation function
 * @property {string} [message] - Custom error message
 * @property {string} [label] - Field label for error messages
 */

/**
 * @typedef {Record<string, ValidationRule>} ValidationSchema
 */

/**
 * @typedef {Object} PasswordPolicy
 * @property {number} [minLength] - Minimum password length
 * @property {boolean} [requireLowercase] - Require lowercase letters
 * @property {boolean} [requireUppercase] - Require uppercase letters
 * @property {boolean} [requireNumbers] - Require numbers
 * @property {boolean} [requireSpecialChars] - Require special characters
 * @property {number} [maxLength] - Maximum password length
 * @property {boolean} [noCommonPasswords] - Disallow common passwords
 */

/**
 * @typedef {Object} PasswordValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string[]} errors - Array of error messages
 * @property {'weak' | 'medium' | 'strong' | 'very-strong'} strength - Password strength
 * @property {number} score - Password strength score (0-100)
 */

/**
 * Email validation with comprehensive regex
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Phone validation (supports multiple formats)
 * @param {string} phone - Phone number to validate
 * @param {string} [country='LK'] - Country code
 * @returns {boolean} Whether phone number is valid
 */
export const isValidPhone = (phone, country = 'LK') => {
  if (!phone || typeof phone !== 'string') return false;

  const cleaned = phone.replace(/\s+/g, '');

  switch (country) {
    case 'LK': // Sri Lankan format
      return /^(?:\+94|94|0)?[0-9]{9}$/.test(cleaned);
    case 'US': // US format
      return /^(?:\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(cleaned.replace(/\D/g, ''));
    case 'INTL': // International format
      return /^\+[1-9]\d{1,14}$/.test(cleaned);
    default:
      return /^\+?[0-9]{7,15}$/.test(cleaned);
  }
};

/**
 * URL validation
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    // Try with protocol prefix
    try {
      new URL(`https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Credit card validation using Luhn algorithm
 * @param {string} number - Credit card number to validate
 * @returns {boolean} Whether credit card number is valid
 */
export const isValidCreditCard = (number) => {
  if (!number || typeof number !== 'string') return false;

  const cleaned = number.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;

  // Luhn algorithm
  const digits = cleaned.split('').map(Number).reverse();
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  return sum % 10 === 0;
};

/** @type {string[]} */
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890'
];

/**
 * Password strength validation
 * @param {string} password - Password to validate
 * @param {PasswordPolicy} [policy={}] - Password policy
 * @returns {PasswordValidationResult} Validation result
 */
export const validatePassword = (password, policy = {}) => {
  const {
    minLength = 8,
    requireLowercase = true,
    requireUppercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
    maxLength = 128,
    noCommonPasswords = true,
  } = policy;

  /** @type {string[]} */
  const errors = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
      score: 0,
    };
  }

  // Length checks
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  } else {
    score += Math.min(password.length * 2, 25);
  }

  if (password.length > maxLength) {
    errors.push(`Password must be at most ${maxLength} characters long`);
  }

  // Character type checks
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 10;
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 10;
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/[0-9]/.test(password)) {
    score += 10;
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 15;
  }

  // Common password check
  if (noCommonPasswords && COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a different password.');
    score -= 20;
  }

  // Complexity bonus
  const uniqueChars = new Set(password.toLowerCase()).size;
  score += Math.min(uniqueChars * 2, 20);

  // Repeated characters penalty
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
  }

  // Sequential characters penalty
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  /** @type {'weak' | 'medium' | 'strong' | 'very-strong'} */
  let strength = 'weak';
  if (score >= 80) strength = 'very-strong';
  else if (score >= 60) strength = 'strong';
  else if (score >= 40) strength = 'medium';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
};

/**
 * Validate a single field
 * @param {*} value - Field value to validate
 * @param {ValidationRule} rule - Validation rule
 * @param {Record<string, *>} [allValues] - All form values
 * @returns {string | null} Error message or null if valid
 */
export const validateField = (value, rule, allValues) => {
  const { required, label = 'Field' } = rule;

  // Required check
  if (required && (value === undefined || value === null || value === '')) {
    return `${label} is required`;
  }

  // If field is empty and not required, skip other validations
  if (value === undefined || value === null || value === '') {
    return null;
  }

  // Convert to string for validations
  const stringValue = typeof value === 'string' ? value : String(value);

  // Email validation
  if (rule.email && !isValidEmail(stringValue)) {
    return rule.message || 'Please enter a valid email address';
  }

  // Phone validation
  if (rule.phone && !isValidPhone(stringValue)) {
    return rule.message || 'Please enter a valid phone number';
  }

  // URL validation
  if (rule.url && !isValidUrl(stringValue)) {
    return rule.message || 'Please enter a valid URL';
  }

  // Credit card validation
  if (rule.creditCard && !isValidCreditCard(stringValue)) {
    return rule.message || 'Please enter a valid credit card number';
  }

  // Length validations
  if (rule.minLength && stringValue.length < rule.minLength) {
    return rule.message || `${label} must be at least ${rule.minLength} characters`;
  }

  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return rule.message || `${label} must be at most ${rule.maxLength} characters`;
  }

  // Numeric validations
  if (rule.min !== undefined) {
    const numValue = typeof value === 'number' ? value : parseFloat(stringValue);
    if (isNaN(numValue) || numValue < rule.min) {
      return rule.message || `${label} must be at least ${rule.min}`;
    }
  }

  if (rule.max !== undefined) {
    const numValue = typeof value === 'number' ? value : parseFloat(stringValue);
    if (isNaN(numValue) || numValue > rule.max) {
      return rule.message || `${label} must be at most ${rule.max}`;
    }
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return rule.message || `${label} format is invalid`;
  }

  // Custom validation
  if (rule.custom) {
    return rule.custom(value, allValues);
  }

  return null;
};

/**
 * Validate entire form/object
 * @template T
 * @param {T} data - Form data
 * @param {ValidationSchema} schema - Validation schema
 * @returns {ValidationResult} Validation result
 */
export const validateForm = (data, schema) => {
  /** @type {Record<string, string>} */
  const errors = {};

  Object.keys(schema).forEach(field => {
    const rule = schema[field];
    const value = data[field];

    const error = validateField(value, rule, data);
    if (error) {
      errors[field] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Data sanitization utilities
 */
export const sanitize = {
  /**
   * Remove HTML tags and encode special characters
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  html: (input) => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Remove non-alphanumeric characters except spaces
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  alphanumeric: (input) => {
    if (typeof input !== 'string') return '';
    return input.replace(/[^a-zA-Z0-9\s]/g, '');
  },

  /**
   * Remove non-numeric characters
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  numeric: (input) => {
    if (typeof input !== 'string') return '';
    return input.replace(/[^0-9]/g, '');
  },

  /**
   * Normalize phone number
   * @param {string} input - Input string
   * @param {string} [country='LK'] - Country code
   * @returns {string} Normalized phone number
   */
  phone: (input, country = 'LK') => {
    if (typeof input !== 'string') return '';
    const cleaned = input.replace(/\D/g, '');

    if (country === 'LK') {
      if (cleaned.startsWith('0')) return `94${cleaned.slice(1)}`;
      if (cleaned.startsWith('94')) return cleaned;
      return `94${cleaned}`;
    }

    return cleaned;
  },

  /**
   * Normalize email
   * @param {string} input - Input string
   * @returns {string} Normalized email
   */
  email: (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().toLowerCase();
  },

  /**
   * Trim whitespace and normalize spaces
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  text: (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/\s+/g, ' ');
  },

  /**
   * Create URL-friendly slug
   * @param {string} input - Input string
   * @returns {string} URL-friendly slug
   */
  slug: (input) => {
    if (typeof input !== 'string') return '';
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
};

/**
 * Common validation schemas
 * @type {Record<string, ValidationSchema>}
 */
export const commonSchemas = {
  user: {
    name: {
      required: true,
      label: 'Name',
      minLength: 2,
      maxLength: 50,
    },
    email: {
      required: true,
      label: 'Email',
      email: true,
      maxLength: 255,
    },
    phone: {
      label: 'Phone',
      phone: true,
    },
  },

  course: {
    title: {
      required: true,
      label: 'Course Title',
      minLength: 3,
      maxLength: 200,
    },
    description: {
      required: true,
      label: 'Description',
      minLength: 10,
      maxLength: 5000,
    },
    price: {
      required: true,
      label: 'Price',
      min: 0,
      max: 999999,
    },
  },

  lesson: {
    title: {
      required: true,
      label: 'Lesson Title',
      minLength: 3,
      maxLength: 200,
    },
    video_url: {
      label: 'Video URL',
      url: true,
    },
    order: {
      required: true,
      label: 'Order',
      min: 1,
    },
  },
};