import handler from '../../pages/api/test-payment'
import { createMockRequestResponse } from '../utils/test-helpers'

// Mock Supabase
jest.mock('../../lib/supabase-admin', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ 
          data: [{ id: 'payment-123' }], 
          error: null 
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}))

const { supabase } = require('../../lib/supabase-admin')

describe('/api/test-payment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle GET method with method not allowed', async () => {
    const { req, res } = createMockRequestResponse('GET', '/api/test-payment')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should successfully test payment insertion and cleanup', async () => {
    const { req, res } = createMockRequestResponse('POST', '/api/test-payment')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    const response = JSON.parse(res._getData())
    
    expect(response).toEqual({
      success: true,
      message: 'Payment table structure is working',
      testData: {
        user_id: 'b525756a-40a8-4efb-b3f6-5a553d708515',
        course_id: '4609a50a-845f-4033-a164-a63db4ddc27d',
        amount: 500000,
        method: 'payhere',
        status: 'pending'
      }
    })
    
    // Verify insert was called
    expect(supabase.from).toHaveBeenCalledWith('payments')
    expect(supabase.from().insert).toHaveBeenCalledWith({
      user_id: 'b525756a-40a8-4efb-b3f6-5a553d708515',
      course_id: '4609a50a-845f-4033-a164-a63db4ddc27d',
      amount: 500000,
      method: 'payhere',
      status: 'pending'
    })
    
    // Verify cleanup was called
    expect(supabase.from().delete).toHaveBeenCalled()
  })

  it('should handle payment insertion error', async () => {
    supabase.from().insert().select.mockResolvedValue({
      data: null,
      error: {
        message: 'Invalid enum value',
        hint: 'Use valid payment method',
        code: '23514'
      }
    })

    const { req, res } = createMockRequestResponse('POST', '/api/test-payment')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(400)
    const response = JSON.parse(res._getData())
    
    expect(response).toEqual({
      error: 'Payment insert failed',
      details: {
        message: 'Invalid enum value',
        hint: 'Use valid payment method',
        code: '23514'
      },
      message: 'Invalid enum value',
      hint: 'Use valid payment method',
      code: '23514'
    })
  })

  it('should handle server error', async () => {
    supabase.from().insert().select.mockRejectedValue(
      new Error('Database connection failed')
    )

    const { req, res } = createMockRequestResponse('POST', '/api/test-payment')
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Server error',
      details: 'Database connection failed'
    })
  })

  it('should handle cleanup error gracefully', async () => {
    // Successful insert
    supabase.from().insert().select.mockResolvedValue({
      data: [{ id: 'payment-123' }],
      error: null
    })
    
    // Failed cleanup
    supabase.from().delete().eq.mockRejectedValue(
      new Error('Cleanup failed')
    )

    const { req, res } = createMockRequestResponse('POST', '/api/test-payment')
    
    await handler(req, res)
    
    // Should still return success even if cleanup fails
    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      message: 'Payment table structure is working',
      testData: {
        user_id: 'b525756a-40a8-4efb-b3f6-5a553d708515',
        course_id: '4609a50a-845f-4033-a164-a63db4ddc27d',
        amount: 500000,
        method: 'payhere',
        status: 'pending'
      }
    })
  })
})