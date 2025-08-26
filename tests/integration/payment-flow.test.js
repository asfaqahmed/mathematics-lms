import request from 'supertest'
import { createMocks } from 'node-mocks-http'
import crypto from 'crypto'

// Mock external services
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(() => ({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123'
        }))
      }
    }
  }))
})

jest.mock('../../lib/supabase-admin', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { id: 'payment-123' }, 
            error: null 
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'payment-123',
                user_id: 'user-1',
                course_id: 'course-1'
              }, 
              error: null 
            }))
          }))
        }))
      }))
    }))
  }
}))

const { supabase } = require('../../lib/supabase-admin')
const Stripe = require('stripe')

describe('Payment Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID = 'test-merchant'
    process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_SECRET = 'test-secret'
  })

  describe('Stripe Checkout Flow', () => {
    it('should create stripe checkout session successfully', async () => {
      const payhereHandler = require('../../pages/api/payments/create-checkout').default
      
      // Mock course data
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'course-1',
          title: 'Test Course',
          description: 'Test Description',
          price: 5000
        },
        error: null
      }).mockResolvedValueOnce({
        data: {
          id: 'user-1',
          email: 'test@example.com'
        },
        error: null
      })

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          'x-forwarded-proto': 'http'
        },
        body: {
          courseId: 'course-1',
          userId: 'user-1'
        }
      })

      await payhereHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      
      expect(response).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      })

      expect(Stripe().checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Course',
              description: 'Test Description',
            },
            unit_amount: 1667, // 5000 LKR / 300 * 100
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: expect.stringContaining('/payment/success'),
        cancel_url: expect.stringContaining('/courses/course-1'),
        customer_email: 'test@example.com',
        metadata: {
          userId: 'user-1',
          courseId: 'course-1',
          paymentId: 'payment-123'
        },
      })
    })
  })

  describe('PayHere Payment Flow', () => {
    it('should start PayHere payment successfully', async () => {
      const payhereHandler = require('../../pages/api/payments/payhere').default
      
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/payments/payhere?action=start',
        body: {
          courseId: 'course-1',
          userId: 'user-1',
          amount: 5000,
          title: 'Test Course'
        }
      })

      await payhereHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      
      expect(response).toHaveProperty('hash')
      expect(response).toHaveProperty('merchant_id', 'test-merchant')
      expect(response).toHaveProperty('order_id')
      expect(response).toHaveProperty('amount', '5000.00')
      
      expect(supabase.from).toHaveBeenCalledWith('payments')
      expect(supabase.from().insert).toHaveBeenCalled()
    })

    it('should verify PayHere payment notification successfully', async () => {
      const payhereHandler = require('../../pages/api/payments/payhere').default
      
      const order_id = 'test-order-123'
      const amount = '5000.00'
      const merchant_secret = 'test-secret'
      const merchant_id = 'test-merchant'
      
      // Generate valid hash
      const md5sig = crypto
        .createHash('md5')
        .update(
          merchant_id +
            order_id +
            amount +
            'LKR' +
            '2' +
            crypto
              .createHash('md5')
              .update(merchant_secret)
              .digest('hex')
              .toUpperCase()
        )
        .digest('hex')
        .toUpperCase()

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/payments/payhere?action=notify',
        body: {
          order_id,
          payhere_amount: amount,
          payhere_currency: 'LKR',
          status_code: '2',
          md5sig,
          payment_id: 'ph_123'
        }
      })

      await payhereHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      
      expect(response).toEqual({ status: 'success' })
      
      expect(supabase.from().update).toHaveBeenCalledWith({
        status: 'completed',
        payhere_payment_id: 'ph_123'
      })
    })

    it('should reject invalid PayHere payment notification', async () => {
      const payhereHandler = require('../../pages/api/payments/payhere').default
      
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/payments/payhere?action=notify',
        body: {
          order_id: 'test-order-123',
          payhere_amount: '5000.00',
          payhere_currency: 'LKR',
          status_code: '2',
          md5sig: 'invalid-hash',
          payment_id: 'ph_123'
        }
      })

      await payhereHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      
      expect(response).toEqual({ error: 'Invalid payment' })
    })
  })

  describe('End-to-End Payment Scenarios', () => {
    it('should handle complete payment workflow with course access', async () => {
      // 1. Create checkout session
      const createCheckoutHandler = require('../../pages/api/payments/create-checkout').default
      
      supabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { id: 'course-1', title: 'Test Course', price: 5000 },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'user-1', email: 'test@example.com' },
          error: null
        })

      const { req: createReq, res: createRes } = createMocks({
        method: 'POST',
        body: { courseId: 'course-1', userId: 'user-1' }
      })

      await createCheckoutHandler(createReq, createRes)
      expect(createRes._getStatusCode()).toBe(200)

      // 2. Simulate payment completion via webhook/notification
      const payhereHandler = require('../../pages/api/payments/payhere').default
      
      // Mock purchase creation
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // No existing purchase
      })

      const order_id = 'payment-123'
      const { req: notifyReq, res: notifyRes } = createMocks({
        method: 'POST',
        url: '/api/payments/payhere?action=notify',
        body: {
          order_id,
          payhere_amount: '5000.00',
          payhere_currency: 'LKR',
          status_code: '2',
          md5sig: crypto
            .createHash('md5')
            .update(
              'test-merchant' +
                order_id +
                '5000.00' +
                'LKR' +
                '2' +
                crypto
                  .createHash('md5')
                  .update('test-secret')
                  .digest('hex')
                  .toUpperCase()
            )
            .digest('hex')
            .toUpperCase(),
          payment_id: 'ph_123'
        }
      })

      await payhereHandler(notifyReq, notifyRes)
      expect(notifyRes._getStatusCode()).toBe(200)

      // Verify purchase record creation was attempted
      expect(supabase.from).toHaveBeenCalledWith('purchases')
    })

    it('should handle payment failure scenarios', async () => {
      const payhereHandler = require('../../pages/api/payments/payhere').default
      
      // Mock database error during payment update
      supabase.from().update().eq().select().single.mockRejectedValue(
        new Error('Database connection failed')
      )

      const order_id = 'payment-123'
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/payments/payhere?action=notify',
        body: {
          order_id,
          payhere_amount: '5000.00',
          payhere_currency: 'LKR',
          status_code: '2',
          md5sig: crypto
            .createHash('md5')
            .update(
              'test-merchant' +
                order_id +
                '5000.00' +
                'LKR' +
                '2' +
                crypto
                  .createHash('md5')
                  .update('test-secret')
                  .digest('hex')
                  .toUpperCase()
            )
            .digest('hex')
            .toUpperCase(),
          payment_id: 'ph_123'
        }
      })

      await payhereHandler(req, res)
      
      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Failed to update payment'
      })
    })
  })
})