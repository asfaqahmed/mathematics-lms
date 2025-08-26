import handler from '../../../pages/api/auth/login'
import { createMockRequestResponse } from '../../utils/test-helpers'

// Mock Supabase
jest.mock('../../../lib/supabase-admin', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn()
    }
  }
}))

const { supabase } = require('../../../lib/supabase-admin')

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle GET method with method not allowed', async () => {
    const { req, res } = createMockRequestResponse('GET', '/api/auth/login')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should handle successful login', async () => {
    const mockSession = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      user: { id: 'user-1', email: 'test@example.com' }
    }

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: mockSession, user: mockSession.user },
      error: null
    })

    const { req, res } = createMockRequestResponse('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Login successful',
      session: mockSession
    })
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should handle login with invalid credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' }
    })

    const { req, res } = createMockRequestResponse('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid login credentials'
    })
  })

  it('should handle missing email or password', async () => {
    const { req, res } = createMockRequestResponse('POST', '/api/auth/login', {
      email: 'test@example.com'
      // missing password
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Email and password are required'
    })
  })

  it('should handle server error', async () => {
    supabase.auth.signInWithPassword.mockRejectedValue(
      new Error('Database connection failed')
    )

    const { req, res } = createMockRequestResponse('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Server error',
      details: 'Database connection failed'
    })
  })
})