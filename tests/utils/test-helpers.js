import { createMocks } from 'node-mocks-http'

export function createMockRequestResponse(method = 'GET', url = '/', body = {}) {
  const { req, res } = createMocks({ method, url, body })
  return { req, res }
}

export const mockUser = {
  id: 'b525756a-40a8-4efb-b3f6-5a553d708515',
  email: 'test@example.com',
  role: 'authenticated'
}

export const mockCourse = {
  id: '4609a50a-845f-4033-a164-a63db4ddc27d',
  title: 'Advanced Mathematics',
  description: 'Learn advanced mathematical concepts',
  price: 5000,
  thumbnail_url: 'https://example.com/thumb.jpg',
  created_at: '2024-01-01T00:00:00Z'
}

export const mockLesson = {
  id: 'lesson-1',
  title: 'Introduction to Calculus',
  course_id: mockCourse.id,
  video_url: 'https://example.com/video.mp4',
  duration: 1800,
  order: 1
}

export const mockPayment = {
  id: 'payment-1',
  user_id: mockUser.id,
  course_id: mockCourse.id,
  amount: 500000,
  method: 'payhere',
  status: 'completed',
  created_at: '2024-01-01T00:00:00Z'
}

// Mock Supabase client
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockUser, error: null }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [mockPayment], error: null }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [mockPayment], error: null }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
    getSession: jest.fn(() => Promise.resolve({ data: { session: { user: mockUser } }, error: null }))
  }
}