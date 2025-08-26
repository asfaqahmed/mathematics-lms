const { test, expect } = require('@playwright/test')

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register')
  })

  test('should display registration form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()
    await expect(page.getByPlaceholder('Full Name')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Phone Number')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText('Name is required')).toBeVisible()
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('invalid-email')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should show validation error for weak password', async ({ page }) => {
    await page.getByPlaceholder('Full Name').fill('John Doe')
    await page.getByPlaceholder('Email').fill('john@example.com')
    await page.getByPlaceholder('Password').fill('123')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText(/Password must be/)).toBeVisible()
  })

  test('should successfully register with valid data', async ({ page }) => {
    // Mock the registration API
    await page.route('/api/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Registration successful! Please check your email to verify your account.',
          user: { id: 'user-123', email: 'john@example.com', name: 'John Doe' }
        })
      })
    })

    await page.getByPlaceholder('Full Name').fill('John Doe')
    await page.getByPlaceholder('Email').fill('john@example.com')
    await page.getByPlaceholder('Phone Number').fill('+94771234567')
    await page.getByPlaceholder('Password').fill('StrongPassword123!')
    
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText('Registration successful!')).toBeVisible()
    await expect(page.getByText('Please check your email to verify')).toBeVisible()
  })

  test('should handle registration error', async ({ page }) => {
    // Mock registration error
    await page.route('/api/auth/register', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'An account with this email already exists'
        })
      })
    })

    await page.getByPlaceholder('Full Name').fill('John Doe')
    await page.getByPlaceholder('Email').fill('existing@example.com')
    await page.getByPlaceholder('Password').fill('StrongPassword123!')
    
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText('An account with this email already exists')).toBeVisible()
  })

  test('should show loading state during registration', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/auth/register', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.getByPlaceholder('Full Name').fill('John Doe')
    await page.getByPlaceholder('Email').fill('john@example.com')
    await page.getByPlaceholder('Password').fill('StrongPassword123!')
    
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText('Creating account...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Creating account...' })).toBeDisabled()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.getByText('Already have an account?').click()
    await page.getByText('Sign In').click()
    
    await expect(page).toHaveURL('/auth/login')
  })

  test('should validate name length', async ({ page }) => {
    await page.getByPlaceholder('Full Name').fill('A')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText('Name must be between 2 and 50 characters')).toBeVisible()
  })

  test('should accept terms and conditions checkbox', async ({ page }) => {
    const termsCheckbox = page.getByRole('checkbox', { name: /I agree to the/ })
    
    if (await termsCheckbox.isVisible()) {
      await expect(termsCheckbox).toBeVisible()
      await termsCheckbox.check()
      await expect(termsCheckbox).toBeChecked()
    }
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('/api/auth/register', async route => {
      await route.abort('failed')
    })

    await page.getByPlaceholder('Full Name').fill('John Doe')
    await page.getByPlaceholder('Email').fill('john@example.com')
    await page.getByPlaceholder('Password').fill('StrongPassword123!')
    
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText(/network error|failed to register/i)).toBeVisible()
  })
})