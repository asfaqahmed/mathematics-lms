// Test setup examples and utilities for the Mathematics LMS

/**
 * Example test database setup for integration tests
 */
export const setupTestDatabase = async () => {
  const { createClient } = require('@supabase/supabase-js')
  
  const testSupabase = createClient(
    process.env.SUPABASE_TEST_URL || 'http://localhost:54321',
    process.env.SUPABASE_TEST_SERVICE_KEY || 'test-service-key'
  )

  // Create test user
  const { data: user } = await testSupabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'testpassword123',
    user_metadata: { name: 'Test User' }
  })

  // Create test course
  const { data: course } = await testSupabase
    .from('courses')
    .insert({
      title: 'Test Course',
      description: 'A test course for integration testing',
      price: 5000,
      instructor_id: user.user.id
    })
    .select()
    .single()

  return { testSupabase, user: user.user, course }
}

/**
 * Example cleanup function for integration tests
 */
export const cleanupTestDatabase = async (testSupabase, userId, courseId) => {
  // Clean up in reverse order of dependencies
  await testSupabase.from('lesson_progress').delete().eq('user_id', userId)
  await testSupabase.from('purchases').delete().eq('user_id', userId)
  await testSupabase.from('payments').delete().eq('user_id', userId)
  await testSupabase.from('lessons').delete().eq('course_id', courseId)
  await testSupabase.from('courses').delete().eq('id', courseId)
  await testSupabase.from('profiles').delete().eq('id', userId)
  await testSupabase.auth.admin.deleteUser(userId)
}

/**
 * Mock user factory for consistent test data
 */
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+94771234567',
  role: 'student',
  created_at: new Date().toISOString(),
  ...overrides
})

/**
 * Mock course factory for consistent test data
 */
export const createMockCourse = (overrides = {}) => ({
  id: 'course-123',
  title: 'Advanced Mathematics',
  description: 'Learn advanced mathematical concepts',
  price: 5000,
  thumbnail: 'https://example.com/thumbnail.jpg',
  category: 'Mathematics',
  instructor_id: 'instructor-123',
  created_at: new Date().toISOString(),
  ...overrides
})

/**
 * Mock payment factory for consistent test data
 */
export const createMockPayment = (overrides = {}) => ({
  id: 'payment-123',
  user_id: 'user-123',
  course_id: 'course-123',
  amount: 500000, // 5000 LKR in cents
  method: 'payhere',
  status: 'completed',
  created_at: new Date().toISOString(),
  ...overrides
})

/**
 * Helper to create mock Next.js API request/response
 */
export const createMockApiContext = (method = 'GET', body = null, query = {}) => {
  const req = {
    method,
    body,
    query,
    headers: {},
    url: '/'
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    statusCode: 200,
    headers: {}
  }

  return { req, res }
}

/**
 * Helper to wait for async operations in tests
 */
export const waitFor = (conditionFn, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    
    const check = () => {
      if (conditionFn()) {
        resolve()
      } else if (Date.now() - start >= timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`))
      } else {
        setTimeout(check, 100)
      }
    }
    
    check()
  })
}

/**
 * Mock Stripe for payment testing
 */
export const createMockStripe = () => ({
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        payment_status: 'paid'
      })
    }
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            userId: 'user-123',
            courseId: 'course-123'
          }
        }
      }
    })
  }
})

/**
 * Mock PayHere for payment testing
 */
export const createMockPayHere = () => ({
  startPayment: jest.fn(),
  onCompleted: null,
  onDismissed: null,
  onError: null
})

/**
 * Helper to mock file uploads
 */
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/**
 * Mock Supabase storage for file upload testing
 */
export const createMockStorage = () => ({
  from: jest.fn(() => ({
    upload: jest.fn().mockResolvedValue({
      data: { path: 'test/file.jpg' },
      error: null
    }),
    remove: jest.fn().mockResolvedValue({
      data: null,
      error: null
    }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/test/file.jpg' }
    })
  }))
})

/**
 * Example test scenario builders
 */
export const testScenarios = {
  // Successful user registration
  userRegistration: {
    validData: {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
      phone: '+94771234567'
    },
    expectedResponse: {
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: expect.objectContaining({
        email: 'john@example.com',
        name: 'John Doe'
      })
    }
  },

  // Successful course purchase
  coursePurchase: {
    validData: {
      courseId: 'course-123',
      userId: 'user-123',
      amount: 5000,
      method: 'payhere'
    },
    expectedPayment: {
      status: 'completed',
      amount: 500000, // in cents
      method: 'payhere'
    }
  },

  // Failed payment scenarios
  paymentFailure: {
    invalidCard: {
      error: 'Your card was declined.',
      code: 'card_declined'
    },
    networkError: {
      error: 'Network error occurred',
      code: 'network_error'
    }
  }
}

/**
 * Performance testing utilities
 */
export const performanceHelpers = {
  // Measure function execution time
  measureTime: async (fn) => {
    const start = Date.now()
    const result = await fn()
    const end = Date.now()
    return { result, duration: end - start }
  },

  // Create load test scenario
  createLoadTest: (fn, iterations = 100) => {
    const promises = Array.from({ length: iterations }, () => fn())
    return Promise.all(promises)
  },

  // Memory usage tracker
  trackMemoryUsage: () => {
    const used = process.memoryUsage()
    return {
      rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
    }
  }
}

/**
 * Accessibility testing helpers
 */
export const a11yHelpers = {
  // Check for common accessibility violations
  checkAccessibility: async (page) => {
    // Inject axe-core for accessibility testing
    await page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4/axe.min.js'
    })

    return await page.evaluate(() => {
      return axe.run(document, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'aria-labels': { enabled: true }
        }
      })
    })
  },

  // Test keyboard navigation
  testKeyboardNavigation: async (page) => {
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement.tagName)
    return focusedElement
  }
}

/**
 * Example custom matchers for Jest
 */
export const customMatchers = {
  // Check if an element is properly accessible
  toBeAccessible: (received) => {
    const pass = received.getAttribute('aria-label') !== null || 
                  received.getAttribute('aria-labelledby') !== null ||
                  received.textContent?.trim().length > 0

    return {
      message: () => pass 
        ? `Expected element to not be accessible`
        : `Expected element to be accessible (have aria-label, aria-labelledby, or text content)`,
      pass
    }
  },

  // Check if response has valid API structure
  toBeValidApiResponse: (received) => {
    const hasSuccess = 'success' in received || 'error' in received
    const hasData = 'data' in received || 'message' in received

    const pass = hasSuccess && hasData

    return {
      message: () => pass
        ? `Expected response to not be a valid API response`
        : `Expected response to have success/error field and data/message field`,
      pass
    }
  }
}

// Export all utilities
export default {
  setupTestDatabase,
  cleanupTestDatabase,
  createMockUser,
  createMockCourse,
  createMockPayment,
  createMockApiContext,
  waitFor,
  createMockStripe,
  createMockPayHere,
  createMockFile,
  createMockStorage,
  testScenarios,
  performanceHelpers,
  a11yHelpers,
  customMatchers
}