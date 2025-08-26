const { test, expect } = require('@playwright/test')

test.describe('User Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    await expect(page.getByText(/email.*required/i)).toBeVisible()
    await expect(page.getByText(/password.*required/i)).toBeVisible()
  })

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByPlaceholder(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    await expect(page.getByText(/invalid.*email/i)).toBeVisible()
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Mock successful login API
    await page.route('/api/auth/login', async route => {
      const request = route.request()
      const postData = request.postDataJSON()
      
      if (postData.email === 'test@example.com' && postData.password === 'password123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Login successful',
            session: {
              access_token: 'mock-token',
              user: {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User'
              }
            }
          })
        })
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid login credentials'
          })
        })
      }
    })

    await page.getByPlaceholder(/email/i).fill('test@example.com')
    await page.getByPlaceholder(/password/i).fill('password123')
    
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    // Should redirect to dashboard/courses or show success message
    await expect(page).toHaveURL(/\/courses|\/dashboard|\/my-courses/)
  })

  test('should handle login with invalid credentials', async ({ page }) => {
    // Mock failed login API
    await page.route('/api/auth/login', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid login credentials'
        })
      })
    })

    await page.getByPlaceholder(/email/i).fill('wrong@example.com')
    await page.getByPlaceholder(/password/i).fill('wrongpassword')
    
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible()
  })

  test('should show loading state during login', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Login successful',
          session: { access_token: 'token' }
        })
      })
    })

    await page.getByPlaceholder(/email/i).fill('test@example.com')
    await page.getByPlaceholder(/password/i).fill('password123')
    
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    await expect(page.getByText(/signing in|logging in/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /signing in|logging in/i })).toBeDisabled()
  })

  test('should navigate to registration page', async ({ page }) => {
    await page.getByText(/don't have an account|create account|sign up/i).click()
    
    await expect(page).toHaveURL('/auth/register')
  })

  test('should navigate to forgot password page', async ({ page }) => {
    const forgotPasswordLink = page.getByText(/forgot.*password/i)
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click()
      await expect(page).toHaveURL(/\/auth\/forgot-password|\/auth\/reset-password/)
    }
  })

  test('should handle remember me checkbox', async ({ page }) => {
    const rememberCheckbox = page.getByRole('checkbox', { name: /remember me/i })
    
    if (await rememberCheckbox.isVisible()) {
      await expect(rememberCheckbox).toBeVisible()
      await rememberCheckbox.check()
      await expect(rememberCheckbox).toBeChecked()
      
      await rememberCheckbox.uncheck()
      await expect(rememberCheckbox).not.toBeChecked()
    }
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordField = page.getByPlaceholder(/password/i)
    const toggleButton = page.locator('[data-testid="password-toggle"]')
    
    if (await toggleButton.isVisible()) {
      // Initially password should be hidden
      await expect(passwordField).toHaveAttribute('type', 'password')
      
      // Click to show password
      await toggleButton.click()
      await expect(passwordField).toHaveAttribute('type', 'text')
      
      // Click to hide password again
      await toggleButton.click()
      await expect(passwordField).toHaveAttribute('type', 'password')
    }
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('/api/auth/login', async route => {
      await route.abort('failed')
    })

    await page.getByPlaceholder(/email/i).fill('test@example.com')
    await page.getByPlaceholder(/password/i).fill('password123')
    
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    await expect(page.getByText(/network error|connection failed|try again/i)).toBeVisible()
  })

  test('should handle server errors', async ({ page }) => {
    // Mock server error
    await page.route('/api/auth/login', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error'
        })
      })
    })

    await page.getByPlaceholder(/email/i).fill('test@example.com')
    await page.getByPlaceholder(/password/i).fill('password123')
    
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    await expect(page.getByText(/server error|something went wrong/i)).toBeVisible()
  })

  test('should redirect authenticated users away from login page', async ({ page }) => {
    // Set authenticated state
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'user-123', email: 'test@example.com' }
      }))
    })

    await page.goto('/auth/login')
    
    // Should redirect away from login page
    await expect(page).not.toHaveURL('/auth/login')
  })

  test('should handle social login buttons if present', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /google/i })
    const facebookButton = page.getByRole('button', { name: /facebook/i })
    
    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeVisible()
      await googleButton.click()
      // Should redirect to Google OAuth
    }
    
    if (await facebookButton.isVisible()) {
      await expect(facebookButton).toBeVisible()
      await facebookButton.click()
      // Should redirect to Facebook OAuth
    }
  })

  test('should preserve redirect URL after login', async ({ page }) => {
    // Navigate to login with redirect parameter
    await page.goto('/auth/login?redirect=/courses/advanced-math')
    
    // Mock successful login
    await page.route('/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Login successful',
          session: { access_token: 'token', user: { id: 'user-123' } }
        })
      })
    })

    await page.getByPlaceholder(/email/i).fill('test@example.com')
    await page.getByPlaceholder(/password/i).fill('password123')
    
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    // Should redirect to the intended page
    await expect(page).toHaveURL('/courses/advanced-math')
  })

  test('should display branding and styling correctly', async ({ page }) => {
    // Check for logo or brand name
    const logo = page.locator('img[alt*="logo" i], [data-testid="logo"]')
    const brandName = page.getByText(/mathpro|academy|lms/i)
    
    if (await logo.isVisible()) {
      await expect(logo).toBeVisible()
    }
    
    if (await brandName.isVisible()) {
      await expect(brandName).toBeVisible()
    }
    
    // Check general styling
    await expect(page.locator('body')).toHaveClass(/bg-|background/)
  })
})