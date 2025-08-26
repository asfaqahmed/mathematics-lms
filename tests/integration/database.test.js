import { createClient } from '@supabase/supabase-js'

// Integration tests for database operations
// Note: These tests require a test database instance
describe('Database Integration Tests', () => {
  let supabase
  let testUserId
  let testCourseId
  let testPaymentId

  beforeAll(async () => {
    // Initialize test Supabase client
    supabase = createClient(
      process.env.SUPABASE_TEST_URL || 'http://localhost:54321',
      process.env.SUPABASE_TEST_ANON_KEY || 'test-anon-key'
    )

    // Create test data
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Test User'
    }

    const { data: authData } = await supabase.auth.signUp(testUser)
    testUserId = authData.user?.id

    const { data: courseData } = await supabase
      .from('courses')
      .insert({
        title: 'Test Course',
        description: 'A test course',
        price: 1000,
        instructor_id: testUserId
      })
      .select()
      .single()

    testCourseId = courseData?.id
  })

  afterAll(async () => {
    // Cleanup test data
    if (testPaymentId) {
      await supabase.from('payments').delete().eq('id', testPaymentId)
    }
    if (testCourseId) {
      await supabase.from('courses').delete().eq('id', testCourseId)
    }
    if (testUserId) {
      await supabase.from('profiles').delete().eq('id', testUserId)
    }
  })

  describe('User Management', () => {
    it('should create user profile on registration', async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single()

      expect(error).toBeNull()
      expect(profile).toBeDefined()
      expect(profile.email).toMatch(/test-.*@example\.com/)
    })

    it('should update user profile', async () => {
      const updatedName = 'Updated Test User'
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ name: updatedName })
        .eq('id', testUserId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.name).toBe(updatedName)
    })

    it('should handle duplicate email constraint', async () => {
      const duplicateUser = {
        id: 'different-user-id',
        email: 'test@example.com', // Assuming this exists
        name: 'Duplicate User'
      }

      const { error } = await supabase
        .from('profiles')
        .insert(duplicateUser)

      expect(error).toBeDefined()
      expect(error.code).toBe('23505') // Unique constraint violation
    })
  })

  describe('Course Management', () => {
    it('should create course with valid data', async () => {
      const courseData = {
        title: 'Integration Test Course',
        description: 'Course created during integration test',
        price: 2000,
        instructor_id: testUserId
      }

      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.title).toBe(courseData.title)
      expect(data.price).toBe(courseData.price)

      // Cleanup
      await supabase.from('courses').delete().eq('id', data.id)
    })

    it('should fetch courses with pagination', async () => {
      const { data, error, count } = await supabase
        .from('courses')
        .select('*', { count: 'exact' })
        .range(0, 9)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data).toBeInstanceOf(Array)
      expect(data.length).toBeLessThanOrEqual(10)
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should filter courses by price range', async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .gte('price', 500)
        .lte('price', 5000)

      expect(error).toBeNull()
      expect(data).toBeInstanceOf(Array)
      
      data.forEach(course => {
        expect(course.price).toBeGreaterThanOrEqual(500)
        expect(course.price).toBeLessThanOrEqual(5000)
      })
    })
  })

  describe('Payment System', () => {
    it('should create payment record', async () => {
      const paymentData = {
        user_id: testUserId,
        course_id: testCourseId,
        amount: 1000,
        method: 'payhere',
        status: 'pending'
      }

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.amount).toBe(paymentData.amount)
      expect(data.status).toBe('pending')

      testPaymentId = data.id
    })

    it('should update payment status', async () => {
      if (!testPaymentId) {
        throw new Error('Test payment not created')
      }

      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          payhere_payment_id: 'ph_test_123'
        })
        .eq('id', testPaymentId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.status).toBe('completed')
      expect(data.payhere_payment_id).toBe('ph_test_123')
    })

    it('should enforce payment method enum constraint', async () => {
      const invalidPayment = {
        user_id: testUserId,
        course_id: testCourseId,
        amount: 1000,
        method: 'invalid_method', // Should fail
        status: 'pending'
      }

      const { error } = await supabase
        .from('payments')
        .insert(invalidPayment)

      expect(error).toBeDefined()
      expect(error.code).toBe('23514') // Check constraint violation
    })
  })

  describe('Purchase System', () => {
    it('should create purchase record after payment', async () => {
      const purchaseData = {
        user_id: testUserId,
        course_id: testCourseId,
        payment_id: testPaymentId,
        access_granted: true,
        purchase_date: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.access_granted).toBe(true)

      // Cleanup
      await supabase.from('purchases').delete().eq('id', data.id)
    })

    it('should prevent duplicate purchases', async () => {
      // Create first purchase
      const purchaseData = {
        user_id: testUserId,
        course_id: testCourseId,
        payment_id: testPaymentId,
        access_granted: true
      }

      const { data: firstPurchase } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single()

      // Try to create duplicate
      const { error } = await supabase
        .from('purchases')
        .insert(purchaseData)

      expect(error).toBeDefined()
      // Should fail due to unique constraint on user_id + course_id

      // Cleanup
      await supabase.from('purchases').delete().eq('id', firstPurchase.id)
    })
  })

  describe('Lessons and Progress', () => {
    let testLessonId

    beforeAll(async () => {
      // Create test lesson
      const { data: lessonData } = await supabase
        .from('lessons')
        .insert({
          title: 'Test Lesson',
          course_id: testCourseId,
          video_url: 'https://example.com/video.mp4',
          duration: 1800,
          order: 1
        })
        .select()
        .single()

      testLessonId = lessonData?.id
    })

    afterAll(async () => {
      if (testLessonId) {
        await supabase.from('lessons').delete().eq('id', testLessonId)
      }
    })

    it('should track lesson progress', async () => {
      const progressData = {
        user_id: testUserId,
        lesson_id: testLessonId,
        watched_duration: 900, // 15 minutes
        completed: false,
        last_watched_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('lesson_progress')
        .insert(progressData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.watched_duration).toBe(900)
      expect(data.completed).toBe(false)

      // Cleanup
      await supabase.from('lesson_progress').delete().eq('id', data.id)
    })

    it('should calculate course completion percentage', async () => {
      // This would typically be done via a database function or view
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', testCourseId)

      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', testUserId)
        .eq('completed', true)
        .in('lesson_id', lessons.map(l => l.id))

      const completionPercentage = (completedLessons.length / lessons.length) * 100

      expect(completionPercentage).toBeGreaterThanOrEqual(0)
      expect(completionPercentage).toBeLessThanOrEqual(100)
    })
  })

  describe('Database Constraints and Relationships', () => {
    it('should enforce foreign key constraints', async () => {
      const invalidPayment = {
        user_id: 'non-existent-user-id',
        course_id: testCourseId,
        amount: 1000,
        method: 'payhere',
        status: 'pending'
      }

      const { error } = await supabase
        .from('payments')
        .insert(invalidPayment)

      expect(error).toBeDefined()
      expect(error.code).toBe('23503') // Foreign key violation
    })

    it('should cascade delete related records', async () => {
      // Create a temporary course
      const { data: tempCourse } = await supabase
        .from('courses')
        .insert({
          title: 'Temp Course for Deletion Test',
          price: 500,
          instructor_id: testUserId
        })
        .select()
        .single()

      // Create related lesson
      const { data: tempLesson } = await supabase
        .from('lessons')
        .insert({
          title: 'Temp Lesson',
          course_id: tempCourse.id,
          order: 1
        })
        .select()
        .single()

      // Delete the course
      await supabase
        .from('courses')
        .delete()
        .eq('id', tempCourse.id)

      // Check that related lesson was deleted (if cascade is set up)
      const { data: deletedLesson } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', tempLesson.id)
        .single()

      expect(deletedLesson).toBeNull()
    })
  })

  describe('Real-time Subscriptions', () => {
    it('should receive real-time updates for payment status changes', (done) => {
      if (!testPaymentId) {
        done()
        return
      }

      const channel = supabase
        .channel('payment-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'payments',
            filter: `id=eq.${testPaymentId}`
          },
          (payload) => {
            expect(payload.new.status).toBe('completed')
            channel.unsubscribe()
            done()
          }
        )
        .subscribe()

      // Trigger an update
      setTimeout(async () => {
        await supabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('id', testPaymentId)
      }, 100)
    }, 10000) // 10 second timeout for real-time test
  })

  describe('Database Performance', () => {
    it('should execute complex queries efficiently', async () => {
      const startTime = Date.now()

      // Complex query joining multiple tables
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          price,
          instructor:profiles(name),
          lessons(count),
          purchases(count)
        `)
        .limit(10)

      const endTime = Date.now()
      const queryTime = endTime - startTime

      expect(error).toBeNull()
      expect(data).toBeInstanceOf(Array)
      expect(queryTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle concurrent operations correctly', async () => {
      // Simulate concurrent payment updates
      const promises = Array.from({ length: 5 }, (_, i) =>
        supabase
          .from('payments')
          .update({ 
            updated_at: new Date().toISOString(),
            notes: `Concurrent update ${i}`
          })
          .eq('id', testPaymentId)
      )

      const results = await Promise.all(promises)
      
      results.forEach(({ error }) => {
        expect(error).toBeNull()
      })
    })
  })
})