/**
 * Validation Utilities
 * Provides comprehensive form validation helpers and data sanitization
 */

import type { ValidationResult } from './types';

export interface ValidationRule {
  required?: boolean;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  creditCard?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any, allValues?: Record<string, any>) => string | null;
  message?: string;
  label?: string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

/**
 * Email validation with comprehensive regex
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Phone validation (supports multiple formats)
 */
export const isValidPhone = (phone: string, country = 'LK'): boolean => {
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
 */
export const isValidUrl = (url: string): boolean => {
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
 */
export const isValidCreditCard = (number: string): boolean => {
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

/**
 * Password strength validation
 */
export interface PasswordPolicy {
  minLength?: number;
  requireLowercase?: boolean;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  maxLength?: number;
  noCommonPasswords?: boolean;
}

export interface PasswordValidationResult extends ValidationResult {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
}

const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890'
];

export const validatePassword = (
  password: string,
  policy: PasswordPolicy = {}
): PasswordValidationResult => {
  const {
    minLength = 8,
    requireLowercase = true,
    requireUppercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
    maxLength = 128,
    noCommonPasswords = true,
  } = policy;

  const errors: string[] = [];
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

  let strength: PasswordValidationResult['strength'] = 'weak';
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
 */
export const validateField = (
  value: any,
  rule: ValidationRule,
  allValues?: Record<string, any>
): string | null => {
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
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  schema: ValidationSchema
): ValidationResult => {
  const errors: Record<string, string> = {};

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
   */
  html: (input: string): string => {
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
   */
  alphanumeric: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input.replace(/[^a-zA-Z0-9\s]/g, '');
  },

  /**
   * Remove non-numeric characters
   */
  numeric: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input.replace(/[^0-9]/g, '');
  },

  /**
   * Normalize phone number
   */
  phone: (input: string, country = 'LK'): string => {
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
   */
  email: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input.trim().toLowerCase();
  },

  /**
   * Trim whitespace and normalize spaces
   */
  text: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/\s+/g, ' ');
  },

  /**
   * Create URL-friendly slug
   */
  slug: (input: string): string => {
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
} as const;