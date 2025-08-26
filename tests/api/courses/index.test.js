import handler from '../../../pages/api/courses/index'
import { createMockRequestResponse, mockCourse } from '../../utils/test-helpers'

// Mock Supabase
jest.mock('../../../lib/supabase-admin', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [mockCourse],
          error: null
        }))
      }))
    }))
  }
}))

const { supabase } = require('../../../lib/supabase-admin')

describe('/api/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle GET method and return courses', async () => {
    const { req, res } = createMockRequestResponse('GET', '/api/courses')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    const response = JSON.parse(res._getData())
    
    expect(response).toEqual({
      success: true,
      data: [mockCourse]
    })
    
    expect(supabase.from).toHaveBeenCalledWith('courses')
    expect(supabase.from().select).toHaveBeenCalledWith('*')
  })

  it('should handle POST method with method not allowed', async () => {
    const { req, res } = createMockRequestResponse('POST', '/api/courses')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should handle database error', async () => {
    supabase.from().select().order.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' }
    })

    const { req, res } = createMockRequestResponse('GET', '/api/courses')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to fetch courses',
      details: 'Database connection failed'
    })
  })

  it('should handle empty courses list', async () => {
    supabase.from().select().order.mockResolvedValue({
      data: [],
      error: null
    })

    const { req, res } = createMockRequestResponse('GET', '/api/courses')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      data: []
    })
  })

  it('should handle server error', async () => {
    supabase.from().select().order.mockRejectedValue(
      new Error('Unexpected server error')
    )

    const { req, res } = createMockRequestResponse('GET', '/api/courses')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Server error',
      details: 'Unexpected server error'
    })
  })
})