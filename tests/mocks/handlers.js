import { http, HttpResponse } from 'msw'

export const handlers = [
  // Supabase auth endpoints
  http.post('http://localhost:54321/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        role: 'authenticated'
      }
    })
  }),

  // Supabase database endpoints
  http.get('http://localhost:54321/rest/v1/courses', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Course',
        description: 'A test course',
        price: 5000,
        thumbnail_url: 'https://example.com/thumb.jpg'
      }
    ])
  }),

  http.get('http://localhost:54321/rest/v1/lessons', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Lesson',
        course_id: '1',
        video_url: 'https://example.com/video.mp4'
      }
    ])
  }),

  // Stripe endpoints
  http.post('https://api.stripe.com/v1/checkout/sessions', () => {
    return HttpResponse.json({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123'
    })
  }),

  // PayHere endpoints
  http.post('https://sandbox.payhere.lk/pay/checkout', () => {
    return HttpResponse.json({
      status: 'success',
      payment_id: 'ph_test_123'
    })
  })
]