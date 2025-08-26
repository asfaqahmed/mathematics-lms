const { test, expect } = require('@playwright/test')

test.describe('Course Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      }))
    })
  })

  test('should display course details and purchase button', async ({ page }) => {
    // Mock course API
    await page.route('/api/courses/course-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'course-1',
          title: 'Advanced Mathematics',
          description: 'Learn advanced mathematical concepts',
          price: 5000,
          thumbnail: 'https://example.com/thumb.jpg'
        })
      })
    })

    await page.goto('/courses/course-1')
    
    await expect(page.getByRole('heading', { name: 'Advanced Mathematics' })).toBeVisible()
    await expect(page.getByText('Learn advanced mathematical concepts')).toBeVisible()
    await expect(page.getByText('LKR 5,000')).toBeVisible()
    await expect(page.getByRole('button', { name: /Purchase|Buy|Enroll/ })).toBeVisible()
  })

  test('should open payment modal when purchase button is clicked', async ({ page }) => {
    await page.route('/api/courses/course-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'course-1',
          title: 'Advanced Mathematics',
          price: 5000
        })
      })
    })

    await page.goto('/courses/course-1')
    await page.getByRole('button', { name: /Purchase|Buy|Enroll/ }).click()
    
    await expect(page.getByText('Complete Your Purchase')).toBeVisible()
    await expect(page.getByText('Choose Payment Method')).toBeVisible()
  })

  test('should handle PayHere payment flow', async ({ page }) => {
    // Mock PayHere SDK
    await page.addInitScript(() => {
      window.payhere = {
        startPayment: (config) => {
          console.log('PayHere payment started with config:', config)
          // Simulate successful payment
          setTimeout(() => {
            if (window.payhere.onCompleted) {
              window.payhere.onCompleted(config.order_id)
            }
          }, 100)
        },
        onCompleted: null,
        onDismissed: null,
        onError: null
      }
    })

    // Mock APIs
    await page.route('/api/courses/course-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'course-1',
          title: 'Advanced Mathematics',
          price: 5000
        })
      })
    })

    await page.route('/api/payments/payhere?action=start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hash: 'test-hash',
          merchant_id: 'test-merchant',
          order_id: 'order-123',
          amount: '5000.00'
        })
      })
    })

    await page.goto('/courses/course-1')
    await page.getByRole('button', { name: /Purchase|Buy|Enroll/ }).click()
    
    // Select PayHere (should be default)
    await expect(page.getByText('PayHere')).toBeVisible()
    
    await page.getByRole('button', { name: /Pay LKR/ }).click()
    
    // Wait for payment completion
    await expect(page.getByText('Payment completed successfully!')).toBeVisible()
  })

  test('should handle Stripe payment flow', async ({ page }) => {
    // Mock APIs
    await page.route('/api/courses/course-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'course-1',
          title: 'Advanced Mathematics',
          price: 5000
        })
      })
    })

    await page.route('/api/payments/create-checkout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123'
        })
      })
    })

    // Mock Stripe redirect
    await page.addInitScript(() => {
      window.Stripe = () => ({
        redirectToCheckout: ({ sessionId }) => {
          console.log('Redirecting to Stripe with session:', sessionId)
          return Promise.resolve()
        }
      })
    })

    await page.goto('/courses/course-1')
    await page.getByRole('button', { name: /Purchase|Buy|Enroll/ }).click()
    
    // Select Stripe
    await page.getByText('Stripe').click()
    await page.getByRole('button', { name: /Pay LKR/ }).click()
    
    // Should initiate Stripe checkout
    await page.waitForTimeout(500) // Allow time for API call
  })

  test('should handle bank transfer payment', async ({ page }) => {
    await page.route('/api/courses/course-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'course-1',
          title: 'Advanced Mathematics',
          price: 5000
        })
      })
    })

    await page.goto('/courses/course-1')
    await page.getByRole('button', { name: /Purchase|Buy|Enroll/ }).click()
    
    // Select Bank Transfer
    await page.getByText('Bank Transfer').click()
    
    // Bank details should appear
    await expect(page.getByText('Bank Details:')).toBeVisible()
    await expect(page.getByText('Commercial Bank of Ceylon')).toBeVisible()
    
    // Upload receipt
    const fileInput = page.getByLabel('Upload Transfer Receipt')
    await fileInput.setInputFiles({
      name: 'receipt.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    })
    
    // Mock payment submission
    await page.route('/api/supabase', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })
    
    await page.getByRole('button', { name: /Pay LKR/ }).click()
    
    await expect(page.getByText('Bank transfer submitted for verification')).toBeVisible()
  })

  test('should require receipt file for bank transfer', async ({ page }) => {
    await page.route('/api/courses/course-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'course-1',
          title: 'Advanced Mathematics',
          price: 5000
        })
      })
    })

    await page.goto('/courses/course-1')
    await page.getByRole('button', { name: /Purchase|Buy|Enroll/ }).click()
    
    // Select Bank Transfer
    await page.getByText('Bank Transfer').click()
    
    // Try to pay without uploading receipt
    await page.getByRole('button', { name: /Pay LKR/ }).click()
    
    await expect(page.getByText('Please upload your bank transfer receipt')).toBeVisible()
  })

  test('should close payment modal', async ({ page }) => {
    await page.route('/api/courses/course-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'course-1',
          title: 'Advanced Mathematics',
          price: 5000
        })
      })
    })

    await page.goto('/courses/course-1')
    await page.getByRole('button', { name: /Purchase|Buy|Enroll/ }).click()
    
    await expect(page.getByText('Complete Your Purchase')).toBeVisible()
    
    // Close via X button
    await page.getByRole('button', { name: /close/i }).click()
    
    await expect(page.getByText('Complete Your Purchase')).not.toBeVisible()
  })

  test('should show loading state during payment', async ({ page }) => {
    await page.route('/api/courses/course-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'course-1',
          title: 'Advanced Mathematics',
          price: 5000
        })
      })
    })

    // Mock slow PayHere response
    await page.route('/api/payments/payhere?action=start', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hash: 'test-hash',
          merchant_id: 'test-merchant',
          order_id: 'order-123',
          amount: '5000.00'
        })
      })
    })

    await page.goto('/courses/course-1')
    await page.getByRole('button', { name: /Purchase|Buy|Enroll/ }).click()
    
    await page.getByRole('button', { name: /Pay LKR/ }).click()
    
    await expect(page.getByText('Processing...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Processing...' })).toBeDisabled()
  })

  test('should handle payment errors', async ({ page }) => {
    await page.route('/api/courses/course-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'course-1',
          title: 'Advanced Mathematics',
          price: 5000
        })
      })
    })

    // Mock payment error
    await page.route('/api/payments/payhere?action=start', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Payment service unavailable'
        })
      })
    })

    await page.goto('/courses/course-1')
    await page.getByRole('button', { name: /Purchase|Buy|Enroll/ }).click()
    
    await page.getByRole('button', { name: /Pay LKR/ }).click()
    
    await expect(page.getByText('Payment initialization failed')).toBeVisible()
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear auth token
    await page.addInitScript(() => {
      window.localStorage.clear()
    })

    await page.goto('/courses/course-1')
    
    // Should redirect to login or show login prompt
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should display WhatsApp support link', async ({ page }) => {
    await page.route('/api/courses/course-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'course-1',
          title: 'Advanced Mathematics',
          price: 5000
        })
      })
    })

    await page.goto('/courses/course-1')
    await page.getByRole('button', { name: /Purchase|Buy|Enroll/ }).click()
    
    const whatsappLink = page.getByText('WhatsApp Support')
    await expect(whatsappLink).toBeVisible()
    
    const href = await whatsappLink.getAttribute('href')
    expect(href).toContain('wa.me')
  })
})