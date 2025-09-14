import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiLogIn, FiMail, FiLock } from 'react-icons/fi'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { H2, P } from '@/components/ui/Typography'
import { HStack, Stack } from '@/components/ui/Layout'
import { FormField } from './FormField'
import { supabase } from '@/lib/supabase'

export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export interface LoginFormProps {
  /**
   * Callback function called when login is successful.
   */
  onSuccess?: (user: any) => void
  /**
   * Callback function called when form submission fails.
   */
  onError?: (error: string) => void
  /**
   * Whether to redirect after successful login.
   */
  redirectTo?: string
  /**
   * Whether to show the "Remember Me" checkbox.
   */
  showRememberMe?: boolean
  /**
   * Whether to show register link.
   */
  showRegisterLink?: boolean
  /**
   * Additional CSS class names.
   */
  className?: string
}

/**
 * Login form component with validation and authentication.
 *
 * @example
 * ```tsx
 * <LoginForm
 *   onSuccess={(user) => console.log('Logged in:', user)}
 *   redirectTo="/dashboard"
 *   showRegisterLink
 * />
 * ```
 */
export function LoginForm({
  onSuccess,
  onError,
  redirectTo = '/dashboard',
  showRememberMe = true,
  showRegisterLink = true,
  className,
}: LoginFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    // Clear general error
    if (generalError) {
      setGeneralError('')
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        toast.success('Welcome back!')

        if (onSuccess) {
          onSuccess(data.user)
        }

        // Redirect if specified
        if (redirectTo) {
          router.push(redirectTo)
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.'
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
            <H2>Welcome back</H2>
            <P color="muted" className="text-center">
              Sign in to your account to continue
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

              <FormField
                name="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                startIcon={<FiLock className="w-4 h-4" />}
                autoComplete="current-password"
                required
                disabled={isLoading}
              />

              <HStack justify="between" align="center">
                {showRememberMe && (
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                      disabled={isLoading}
                    />
                    <span className="text-gray-300">Remember me</span>
                  </label>
                )}

                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </HStack>

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                loadingText="Signing in..."
                startIcon={!isLoading ? <FiLogIn className="w-4 h-4" /> : undefined}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          {showRegisterLink && (
            <P className="text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
              >
                Sign up here
              </Link>
            </P>
          )}
        </Stack>
      </Card>
    </motion.div>
  )
}