import handler from '../../../pages/api/auth/register'
import { createMockRequestResponse } from '../../utils/test-helpers'

// Mock dependencies
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    auth: {
      signUp: jest.fn()
    }
  }
}))

jest.mock('../../../lib/email', () => ({
  sendEmail: jest.fn()
}))

jest.mock('../../../utils/validators', () => ({
  isValidEmail: jest.fn(() => true),
  isValidName: jest.fn(() => true),
  validatePassword: jest.fn(() => ({ isValid: true, errors: [] }))
}))

const { supabase } = require('../../../lib/supabase')
const { sendEmail } = require('../../../lib/email')
const { isValidEmail, isValidName, validatePassword } = require('../../../utils/validators')

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  it('should handle GET method with method not allowed', async () => {
    const { req, res } = createMockRequestResponse('GET', '/api/auth/register')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should handle successful registration', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      confirmation_token: 'token-123'
    }

    supabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    sendEmail.mockResolvedValue(true)

    const { req, res } = createMockRequestResponse('POST', '/api/auth/register', {
      name: 'John Doe',
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'StrongPass123!'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'John Doe'
      }
    })
  })

  it('should handle missing required fields', async () => {
    const { req, res } = createMockRequestResponse('POST', '/api/auth/register', {
      email: 'test@example.com'
      // missing name and password
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Name, email, and password are required'
    })
  })

  it('should handle invalid name validation', async () => {
    isValidName.mockReturnValue(false)

    const { req, res } = createMockRequestResponse('POST', '/api/auth/register', {
      name: 'A',
      email: 'test@example.com',
      password: 'StrongPass123!'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Name must be between 2 and 50 characters'
    })
  })

  it('should handle invalid email validation', async () => {
    isValidEmail.mockReturnValue(false)

    const { req, res } = createMockRequestResponse('POST', '/api/auth/register', {
      name: 'John Doe',
      email: 'invalid-email',
      password: 'StrongPass123!'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid email address'
    })
  })

  it('should handle password validation errors', async () => {
    validatePassword.mockReturnValue({
      isValid: false,
      errors: ['Password too short', 'Password must contain uppercase']
    })

    const { req, res } = createMockRequestResponse('POST', '/api/auth/register', {
      name: 'John Doe',
      email: 'test@example.com',
      password: 'weak'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Password too short. Password must contain uppercase'
    })
  })

  it('should handle existing user', async () => {
    supabase.from().select().eq().single.mockResolvedValue({
      data: { id: 'existing-user' },
      error: null
    })

    const { req, res } = createMockRequestResponse('POST', '/api/auth/register', {
      name: 'John Doe',
      email: 'existing@example.com',
      password: 'StrongPass123!'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'An account with this email already exists'
    })
  })

  it('should handle Supabase auth error', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already registered' }
    })

    const { req, res } = createMockRequestResponse('POST', '/api/auth/register', {
      name: 'John Doe',
      email: 'test@example.com',
      password: 'StrongPass123!'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'An account with this email already exists'
    })
  })

  it('should handle server error', async () => {
    supabase.auth.signUp.mockRejectedValue(new Error('Database error'))

    const { req, res } = createMockRequestResponse('POST', '/api/auth/register', {
      name: 'John Doe',
      email: 'test@example.com',
      password: 'StrongPass123!'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'An error occurred during registration. Please try again.'
    })
  })

  it('should handle profile creation error gracefully', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }

    supabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    supabase.from().insert.mockResolvedValue({
      data: null,
      error: { message: 'Profile creation failed' }
    })

    const { req, res } = createMockRequestResponse('POST', '/api/auth/register', {
      name: 'John Doe',
      email: 'test@example.com',
      password: 'StrongPass123!'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    // Should still succeed despite profile error
  })
})