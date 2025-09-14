import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiUserPlus, FiMail, FiLock, FiUser, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { H2, P } from '@/components/ui/Typography'
import { Stack } from '@/components/ui/Layout'
import { FormField } from './FormField'
import { supabase } from '@/lib/supabase'

export interface RegisterFormData {
  name: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export interface RegisterFormProps {
  /**
   * Callback function called when registration is successful.
   */
  onSuccess?: (user: any) => void
  /**
   * Callback function called when form submission fails.
   */
  onError?: (error: string) => void
  /**
   * Whether to redirect after successful registration.
   */
  redirectTo?: string
  /**
   * Whether to show phone number field.
   */
  showPhoneField?: boolean
  /**
   * Whether to show login link.
   */
  showLoginLink?: boolean
  /**
   * Additional CSS class names.
   */
  className?: string
}

/**
 * Registration form component with validation and user creation.
 *
 * @example
 * ```tsx
 * <RegisterForm
 *   onSuccess={(user) => console.log('Registered:', user)}
 *   redirectTo="/welcome"
 *   showPhoneField
 *   showLoginLink
 * />
 * ```
 */
export function RegisterForm({
  onSuccess,
  onError,
  redirectTo,
  showPhoneField = true,
  showLoginLink = true,
  className,
}: RegisterFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    // Clear general error
    if (generalError) {
      setGeneralError('')
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation (if field is shown and has value)
    if (showPhoneField && formData.phone && formData.phone.trim()) {
      if (!/^[+]?[\d\s\-()]+$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setGeneralError('')

    try {
      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone || null,
          },
        },
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // If user needs email confirmation
        if (!data.session) {
          toast.success('Please check your email to confirm your account.')
        } else {
          toast.success('Account created successfully! Welcome aboard!')
        }

        if (onSuccess) {
          onSuccess(data.user)
        }

        // Redirect if specified
        if (redirectTo) {
          router.push(redirectTo)
        } else if (data.session) {
          router.push('/dashboard')
        } else {
          router.push('/auth/verify-email')
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.message === 'User already registered'
          ? 'An account with this email already exists. Please sign in instead.'
          : error.message || 'Registration failed. Please try again.'

      setGeneralError(errorMessage)

      if (onError) {
        onError(errorMessage)
      }

      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card variant="glass" padding="lg" className="w-full max-w-md mx-auto">
        <Stack space={6}>
          <Stack space={2} align="center">
            <H2>Create Account</H2>
            <P color="muted" className="text-center">
              Join MathPro Academy and start your learning journey
            </P>
          </Stack>

          {generalError && (
            <Alert variant="destructive" dismissible onDismiss={() => setGeneralError('')}>
              {generalError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack space={4}>
              <FormField
                name="name"
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                startIcon={<FiUser className="w-4 h-4" />}
                autoComplete="name"
                required
                disabled={isLoading}
              />

              <FormField
                name="email"
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                startIcon={<FiMail className="w-4 h-4" />}
                autoComplete="email"
                required
                disabled={isLoading}
              />

              {showPhoneField && (
                <FormField
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter your phone number (optional)"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  startIcon={<FiPhone className="w-4 h-4" />}
                  autoComplete="tel"
                  disabled={isLoading}
                />
              )}

              <FormField
                name="password"
                label="Password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                startIcon={<FiLock className="w-4 h-4" />}
                autoComplete="new-password"
                helperText="Must be 8+ characters with uppercase, lowercase, and number"
                required
                disabled={isLoading}
              />

              <FormField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                startIcon={<FiLock className="w-4 h-4" />}
                autoComplete="new-password"
                required
                disabled={isLoading}
              />

              <div>
                <label className="flex items-start space-x-2 text-sm">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2 mt-0.5"
                    disabled={isLoading}
                  />
                  <span className="text-gray-300 leading-5">
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="text-primary-400 hover:text-primary-300 transition-colors"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link
                      href="/privacy"
                      className="text-primary-400 hover:text-primary-300 transition-colors"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-400 mt-1">{errors.acceptTerms}</p>
                )}
              </div>

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                loadingText="Creating account..."
                startIcon={!isLoading ? <FiUserPlus className="w-4 h-4" /> : undefined}
              >
                Create Account
              </Button>
            </Stack>
          </form>

          {showLoginLink && (
            <P className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
              >
                Sign in here
              </Link>
            </P>
          )}
        </Stack>
      </Card>
    </motion.div>
  )
}