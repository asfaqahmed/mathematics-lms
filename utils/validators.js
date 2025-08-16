// Email validation
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Phone validation (Sri Lankan format)
export const isValidPhone = (phone) => {
  // Accepts formats: +94XXXXXXXXX, 94XXXXXXXXX, 0XXXXXXXXX
  const regex = /^(?:\+94|94|0)?[0-9]{9}$/
  return regex.test(phone.replace(/\s/g, ''))
}

// Password validation
export const validatePassword = (password, policy = 'medium') => {
  const errors = []
  
  if (policy === 'low') {
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters')
    }
  } else if (policy === 'medium') {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number')
    }
  } else if (policy === 'high') {
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain a special character')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// URL validation
export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// YouTube URL validation
export const isValidYouTubeUrl = (url) => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/
  return regex.test(url)
}

// Price validation
export const isValidPrice = (price) => {
  const num = parseFloat(price)
  return !isNaN(num) && num >= 0
}

// Name validation
export const isValidName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50
}

// Credit card validation (basic)
export const isValidCreditCard = (number) => {
  const regex = /^[0-9]{13,19}$/
  if (!regex.test(number.replace(/\s/g, ''))) return false
  
  // Luhn algorithm
  const digits = number.replace(/\s/g, '').split('').map(Number)
  let sum = 0
  let isEven = false
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i]
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [],
    allowedExtensions = []
  } = options
  
  const errors = []
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`)
  }
  
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop().toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File extension must be one of: ${allowedExtensions.join(', ')}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Form validation
export const validateForm = (data, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach(field => {
    const value = data[field]
    const fieldRules = rules[field]
    
    // Required
    if (fieldRules.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${fieldRules.label || field} is required`
      return
    }
    
    // Email
    if (fieldRules.email && value && !isValidEmail(value)) {
      errors[field] = 'Invalid email address'
      return
    }
    
    // Phone
    if (fieldRules.phone && value && !isValidPhone(value)) {
      errors[field] = 'Invalid phone number'
      return
    }
    
    // Min length
    if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
      errors[field] = `${fieldRules.label || field} must be at least ${fieldRules.minLength} characters`
      return
    }
    
    // Max length
    if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
      errors[field] = `${fieldRules.label || field} must be at most ${fieldRules.maxLength} characters`
      return
    }
    
    // Min value
    if (fieldRules.min !== undefined && value && parseFloat(value) < fieldRules.min) {
      errors[field] = `${fieldRules.label || field} must be at least ${fieldRules.min}`
      return
    }
    
    // Max value
    if (fieldRules.max !== undefined && value && parseFloat(value) > fieldRules.max) {
      errors[field] = `${fieldRules.label || field} must be at most ${fieldRules.max}`
      return
    }
    
    // Pattern
    if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.message || `Invalid ${fieldRules.label || field}`
      return
    }
    
    // Custom validation
    if (fieldRules.custom && value) {
      const customError = fieldRules.custom(value, data)
      if (customError) {
        errors[field] = customError
      }
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Bank account validation
export const isValidBankAccount = (accountNumber) => {
  // Basic validation - adjust based on Sri Lankan bank account format
  return /^[0-9]{10,16}$/.test(accountNumber.replace(/\s/g, ''))
}

// SWIFT code validation
export const isValidSwiftCode = (code) => {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(code)
}