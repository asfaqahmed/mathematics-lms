import { isValidEmail, validatePassword } from '../../utils/validation'

// Helper function for name validation since it's not exported from the new module
const isValidName = (name) => name && name.trim().length >= 2 && name.trim().length <= 50

describe('Validator Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
        'test123@test-domain.com',
        'a@b.co'
      ]

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..name@domain.com',
        '',
        null,
        undefined,
        'user@domain.',
        'user name@domain.com',
        'user@domain .com'
      ]

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false)
      })
    })
  })

  describe('isValidName', () => {
    it('should validate correct names', () => {
      const validNames = [
        'John',
        'John Doe',
        'Mary Jane Watson',
        'José María',
        '李伟',
        'Al-Rahman',
        "O'Connor",
        'Jean-Pierre'
      ]

      validNames.forEach(name => {
        expect(isValidName(name)).toBe(true)
      })
    })

    it('should reject invalid names', () => {
      const invalidNames = [
        '', // Empty string
        'A', // Too short
        'a'.repeat(51), // Too long
        '123', // Numbers only
        'John123', // Contains numbers
        'John@Doe', // Contains special characters
        null,
        undefined,
        '   ', // Only whitespace
        'John  Doe' // Multiple spaces (depending on implementation)
      ]

      invalidNames.forEach(name => {
        expect(isValidName(name)).toBe(false)
      })
    })

    it('should handle edge cases for name length', () => {
      expect(isValidName('Jo')).toBe(true) // Minimum length
      expect(isValidName('a'.repeat(50))).toBe(true) // Maximum length
      expect(isValidName('J')).toBe(false) // Below minimum
      expect(isValidName('a'.repeat(51))).toBe(false) // Above maximum
    })
  })

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password1',
        'Complex#Pass2023',
        'Aa1!bcdefgh',
        'P@ssw0rd123'
      ]

      strongPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject passwords that are too short', () => {
      const shortPasswords = ['123', 'Pass1!', 'Aa1!']

      shortPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must be at least 8 characters long')
      })
    })

    it('should reject passwords without uppercase letters', () => {
      const noUppercase = ['password123!', 'mypassword@1', 'strongpass#2']

      noUppercase.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one uppercase letter')
      })
    })

    it('should reject passwords without lowercase letters', () => {
      const noLowercase = ['PASSWORD123!', 'MYPASSWORD@1', 'STRONGPASS#2']

      noLowercase.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one lowercase letter')
      })
    })

    it('should reject passwords without numbers', () => {
      const noNumbers = ['StrongPass!', 'MyPassword@', 'ComplexPass#']

      noNumbers.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one number')
      })
    })

    it('should reject passwords without special characters', () => {
      const noSpecialChars = ['StrongPass123', 'MyPassword1', 'ComplexPass2']

      noSpecialChars.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one special character')
      })
    })

    it('should accumulate multiple validation errors', () => {
      const weakPassword = 'weak' // Too short, no uppercase, no numbers, no special chars

      const result = validatePassword(weakPassword)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain('Password must be at least 8 characters long')
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
      expect(result.errors).toContain('Password must contain at least one number')
      expect(result.errors).toContain('Password must contain at least one special character')
    })

    it('should handle edge cases', () => {
      // Empty password
      let result = validatePassword('')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')

      // Null password
      result = validatePassword(null)
      expect(result.isValid).toBe(false)

      // Undefined password
      result = validatePassword(undefined)
      expect(result.isValid).toBe(false)

      // Password with only spaces
      result = validatePassword('        ')
      expect(result.isValid).toBe(false)
    })

    it('should accept various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=']

      specialChars.forEach(char => {
        const password = `Password123${char}`
        const result = validatePassword(password)
        expect(result.isValid).toBe(true)
      })
    })

    it('should validate passwords with mixed character sets', () => {
      const mixedPasswords = [
        'Пароль123!', // Cyrillic
        'パスワード123!', // Japanese
        'كلمة123!', // Arabic
        'Contraseña123!' // Spanish with accent
      ]

      mixedPasswords.forEach(password => {
        const result = validatePassword(password)
        // Should handle international characters appropriately
        expect(result.isValid).toBeTruthy()
      })
    })

    it('should validate extremely long passwords', () => {
      const longPassword = 'A1!' + 'a'.repeat(100)
      const result = validatePassword(longPassword)
      expect(result.isValid).toBe(true)
    })

    it('should return consistent error messages', () => {
      const result = validatePassword('weak')
      
      result.errors.forEach(error => {
        expect(typeof error).toBe('string')
        expect(error.length).toBeGreaterThan(0)
        expect(error).toMatch(/^Password must/)
      })
    })
  })

  describe('Integration tests for validators', () => {
    it('should work together in user registration scenario', () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!'
      }

      expect(isValidName(userData.name)).toBe(true)
      expect(isValidEmail(userData.email)).toBe(true)
      expect(validatePassword(userData.password).isValid).toBe(true)
    })

    it('should reject invalid user registration data', () => {
      const invalidUserData = {
        name: 'J', // Too short
        email: 'invalid-email', // Invalid format
        password: 'weak' // Too weak
      }

      expect(isValidName(invalidUserData.name)).toBe(false)
      expect(isValidEmail(invalidUserData.email)).toBe(false)
      expect(validatePassword(invalidUserData.password).isValid).toBe(false)
    })
  })
})