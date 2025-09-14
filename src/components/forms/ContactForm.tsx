import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FiSend, FiMail, FiUser, FiMessageCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { H3 } from '@/components/ui/Typography'
import { Stack } from '@/components/ui/Layout'
import { FormField, Textarea, Select } from './FormField'

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  category: string
}

export interface ContactFormProps {
  /**
   * Callback function called when form is submitted successfully.
   */
  onSuccess?: (data: ContactFormData) => void
  /**
   * Callback function called when form submission fails.
   */
  onError?: (error: string) => void
  /**
   * Title for the contact form.
   */
  title?: string
  /**
   * Description text below the title.
   */
  description?: string
  /**
   * Whether to show the category selection.
   */
  showCategory?: boolean
  /**
   * Custom categories for the form.
   */
  categories?: Array<{ value: string; label: string }>
  /**
   * Additional CSS class names.
   */
  className?: string
}

const defaultCategories = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'billing', label: 'Billing Question' },
  { value: 'course', label: 'Course Information' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'feedback', label: 'Feedback' },
]

/**
 * Contact form component with validation and submission handling.
 *
 * @example
 * ```tsx
 * <ContactForm
 *   title="Get in Touch"
 *   description="We'd love to hear from you"
 *   onSuccess={(data) => console.log('Form submitted:', data)}
 *   showCategory
 * />
 * ```
 */
export function ContactForm({
  onSuccess,
  onError,
  title = 'Contact Us',
  description = 'Send us a message and we'll get back to you as soon as possible.',
  showCategory = true,
  categories = defaultCategories,
  className,
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: '',
  })
  const [errors, setErrors] = useState<Partial<ContactFormData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    // Clear success message
    if (successMessage) {
      setSuccessMessage('')
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters'
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    // Category validation (if shown)
    if (showCategory && !formData.category) {
      newErrors.category = 'Please select a category'
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

    try {
      // Simulate API call - replace with actual API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const result = await response.json()

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: '',
      })

      setSuccessMessage('Thank you for your message! We\'ll get back to you soon.')
      toast.success('Message sent successfully!')

      if (onSuccess) {
        onSuccess(formData)
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send message. Please try again.'

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
      <Card variant="glass" padding="lg">
        <Stack space={6}>
          <Stack space={2}>
            <H3>{title}</H3>
            {description && (
              <p className="text-gray-400">{description}</p>
            )}
          </Stack>

          {successMessage && (
            <Alert variant="success" dismissible onDismiss={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack space={4}>
              <FormField
                name="name"
                label="Your Name"
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

              {showCategory && (
                <Select
                  name="category"
                  label="Category"
                  placeholder="Select a category"
                  value={formData.category}
                  onChange={handleChange}
                  error={errors.category}
                  options={categories}
                  required
                  disabled={isLoading}
                />
              )}

              <FormField
                name="subject"
                label="Subject"
                type="text"
                placeholder="What's this about?"
                value={formData.subject}
                onChange={handleChange}
                error={errors.subject}
                startIcon={<FiMessageCircle className="w-4 h-4" />}
                required
                disabled={isLoading}
              />

              <Textarea
                name="message"
                label="Message"
                placeholder="Tell us more about your inquiry..."
                value={formData.message}
                onChange={handleChange}
                error={errors.message}
                rows={5}
                required
                disabled={isLoading}
                helperText={`${formData.message.length}/500 characters`}
                maxLength={500}
              />

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                loadingText="Sending message..."
                startIcon={!isLoading ? <FiSend className="w-4 h-4" /> : undefined}
              >
                Send Message
              </Button>
            </Stack>
          </form>
        </Stack>
      </Card>
    </motion.div>
  )
}