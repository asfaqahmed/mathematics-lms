import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSave, FiX, FiUpload, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { H2, P } from '@/components/ui/Typography'
import { Stack, Grid } from '@/components/ui/Layout'
import { FormField, Textarea, Select } from '@/components/forms/FormField'

export interface Course {
  id?: string
  title: string
  description: string
  price: number
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  duration?: string
  thumbnail?: string
  intro_video?: string
  is_published: boolean
}

export interface CourseFormProps {
  /**
   * Course data for editing (undefined for creating new course).
   */
  course?: Course
  /**
   * Callback function when form is saved successfully.
   */
  onSave: (courseData: Omit<Course, 'id'>) => Promise<void>
  /**
   * Callback function when form is cancelled.
   */
  onCancel: () => void
  /**
   * Whether the form is in a loading state.
   */
  isLoading?: boolean
  /**
   * Additional CSS class names.
   */
  className?: string
}

const COURSE_LEVELS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
] as const

const COURSE_CATEGORIES = [
  { value: 'grade-6', label: 'Grade 6 Mathematics' },
  { value: 'grade-7', label: 'Grade 7 Mathematics' },
  { value: 'grade-8', label: 'Grade 8 Mathematics' },
  { value: 'grade-9', label: 'Grade 9 Mathematics' },
  { value: 'algebra', label: 'Algebra' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'calculus', label: 'Calculus' },
  { value: 'statistics', label: 'Statistics' },
  { value: 'trigonometry', label: 'Trigonometry' },
] as const

/**
 * Course form component for creating and editing courses.
 *
 * @example
 * ```tsx
 * <CourseForm
 *   course={course}
 *   onSave={handleSave}
 *   onCancel={() => router.back()}
 *   isLoading={isSubmitting}
 * />
 * ```
 */
export function CourseForm({
  course,
  onSave,
  onCancel,
  isLoading = false,
  className,
}: CourseFormProps) {
  const [formData, setFormData] = useState<Omit<Course, 'id'>>({
    title: '',
    description: '',
    price: 0,
    category: '',
    level: 'Beginner',
    duration: '',
    thumbnail: '',
    intro_video: '',
    is_published: false,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof Course, string>>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize form data when course prop changes
  useEffect(() => {
    if (course) {
      const { id, ...courseData } = course
      setFormData(courseData)
    } else {
      // Reset form for new course
      setFormData({
        title: '',
        description: '',
        price: 0,
        category: '',
        level: 'Beginner',
        duration: '',
        thumbnail: '',
        intro_video: '',
        is_published: false,
      })
    }
    setErrors({})
    setHasChanges(false)
  }, [course])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }))

    // Mark as changed
    setHasChanges(true)

    // Clear error when user starts typing
    if (errors[name as keyof Course]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Course, string>> = {}

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required'
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Course title must be at least 3 characters'
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Course title must not exceed 100 characters'
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Course description must be at least 10 characters'
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = 'Course description must not exceed 1000 characters'
    }

    // Price validation
    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    } else if (formData.price > 1000000) {
      newErrors.price = 'Price cannot exceed LKR 1,000,000'
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = 'Please select a category'
    }

    // URL validations
    if (formData.thumbnail && !isValidUrl(formData.thumbnail)) {
      newErrors.thumbnail = 'Please enter a valid thumbnail URL'
    }

    if (formData.intro_video && !isValidUrl(formData.intro_video)) {
      newErrors.intro_video = 'Please enter a valid video URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors and try again')
      return
    }

    try {
      await onSave(formData)
      toast.success(course ? 'Course updated successfully!' : 'Course created successfully!')
      setHasChanges(false)
    } catch (error) {
      // Error handling is done by parent component
      console.error('Form submission error:', error)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel()
      }
    } else {
      onCancel()
    }
  }

  const isEditing = !!course

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <form onSubmit={handleSubmit}>
        <Card variant="glass" padding="lg">
          <Stack space={6}>
            {/* Form Header */}
            <Card.Header>
              <H2>{isEditing ? 'Edit Course' : 'Create New Course'}</H2>
              <P color="muted">
                {isEditing
                  ? 'Update course information and settings'
                  : 'Fill in the details to create a new course'}
              </P>
            </Card.Header>

            {/* Basic Information Section */}
            <Stack space={4}>
              <H3 className="text-lg font-semibold text-white border-b border-dark-600 pb-2">
                Basic Information
              </H3>

              <Grid cols={1} gap={4} className="md:grid-cols-2">
                <FormField
                  name="title"
                  label="Course Title"
                  placeholder="Enter course title"
                  value={formData.title}
                  onChange={handleChange}
                  error={errors.title}
                  required
                  disabled={isLoading}
                  helperText={`${formData.title.length}/100 characters`}
                />

                <Select
                  name="category"
                  label="Category"
                  placeholder="Select a category"
                  value={formData.category}
                  onChange={handleChange}
                  error={errors.category}
                  options={COURSE_CATEGORIES}
                  required
                  disabled={isLoading}
                />
              </Grid>

              <Textarea
                name="description"
                label="Course Description"
                placeholder="Describe what students will learn in this course"
                value={formData.description}
                onChange={handleChange}
                error={errors.description}
                rows={4}
                required
                disabled={isLoading}
                helperText={`${formData.description.length}/1000 characters`}
              />
            </Stack>

            {/* Course Details Section */}
            <Stack space={4}>
              <H3 className="text-lg font-semibold text-white border-b border-dark-600 pb-2">
                Course Details
              </H3>

              <Grid cols={1} gap={4} className="md:grid-cols-3">
                <FormField
                  name="price"
                  label="Price (LKR)"
                  type="number"
                  placeholder="0.00"
                  value={formData.price.toString()}
                  onChange={handleChange}
                  error={errors.price}
                  min="0"
                  step="0.01"
                  required
                  disabled={isLoading}
                  helperText="Enter 0 for free courses"
                />

                <Select
                  name="level"
                  label="Difficulty Level"
                  value={formData.level}
                  onChange={handleChange}
                  options={COURSE_LEVELS}
                  required
                  disabled={isLoading}
                />

                <FormField
                  name="duration"
                  label="Duration"
                  placeholder="e.g., 8 weeks, 12 hours"
                  value={formData.duration}
                  onChange={handleChange}
                  disabled={isLoading}
                  helperText="Estimated completion time"
                />
              </Grid>
            </Stack>

            {/* Media Section */}
            <Stack space={4}>
              <H3 className="text-lg font-semibold text-white border-b border-dark-600 pb-2">
                Course Media
              </H3>

              <Grid cols={1} gap={4} className="md:grid-cols-2">
                <FormField
                  name="thumbnail"
                  label="Course Thumbnail URL"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  error={errors.thumbnail}
                  disabled={isLoading}
                  helperText="Recommended: 400x225px (16:9 ratio)"
                />

                <FormField
                  name="intro_video"
                  label="Introduction Video URL"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={formData.intro_video}
                  onChange={handleChange}
                  error={errors.intro_video}
                  disabled={isLoading}
                  helperText="Optional course preview video"
                />
              </Grid>
            </Stack>

            {/* Publishing Section */}
            <Stack space={4}>
              <H3 className="text-lg font-semibold text-white border-b border-dark-600 pb-2">
                Publishing
              </H3>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                  disabled={isLoading}
                />
                <label htmlFor="is_published" className="text-gray-300 select-none cursor-pointer">
                  <strong>Publish course</strong>
                  <P variant="bodySmall" color="muted" className="mt-1">
                    When published, the course will be visible to students and available for enrollment.
                  </P>
                </label>
              </div>
            </Stack>

            {/* Form Actions */}
            <Card.Footer>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={isLoading}
                  startIcon={<FiX className="w-4 h-4" />}
                  className="sm:order-1"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  loading={isLoading}
                  loadingText={isEditing ? 'Updating...' : 'Creating...'}
                  disabled={isLoading || !hasChanges}
                  startIcon={!isLoading ? <FiSave className="w-4 h-4" /> : undefined}
                  className="sm:order-2"
                >
                  {isEditing ? 'Update Course' : 'Create Course'}
                </Button>
              </div>
            </Card.Footer>
          </Stack>
        </Card>
      </form>
    </motion.div>
  )
}

export default CourseForm