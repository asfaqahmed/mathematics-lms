import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSave, FiX, FiUpload, FiTrash2 } from 'react-icons/fi'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import toast from 'react-hot-toast'

export default function CourseForm({ course, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    level: 'Beginner',
    duration: '',
    thumbnail: '',
    intro_video: '',
    is_published: false
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        price: course.price || '',
        category: course.category || '',
        level: course.level || 'Beginner',
        duration: course.duration || '',
        thumbnail: course.thumbnail || '',
        intro_video: course.intro_video || '',
        is_published: course.is_published || false
      })
    }
  }, [course])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Valid price is required'
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors and try again')
      return
    }
    
    const courseData = {
      ...formData,
      price: parseFloat(formData.price)
    }
    
    await onSave(courseData)
  }

  const levels = ['Beginner', 'Intermediate', 'Advanced']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Card>
        <Card.Header>
          <Card.Title>
            {course ? 'Edit Course' : 'Create New Course'}
          </Card.Title>
          <Card.Description>
            {course ? 'Update course information' : 'Fill in the details to create a new course'}
          </Card.Description>
        </Card.Header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              
              <Input
                label="Course Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                placeholder="Enter course title"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`
                    w-full px-4 py-2.5 bg-dark-700 border border-dark-600 
                    text-white placeholder-gray-400 rounded-lg
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                    transition-all duration-200 focus:outline-none
                    ${errors.description ? 'border-red-500' : ''}
                  `}
                  placeholder="Enter course description"
                  required
                />
                {errors.description && (
                  <p className="text-sm text-red-400 mt-1">{errors.description}</p>
                )}
              </div>
              
              <Input
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                error={errors.category}
                placeholder="e.g., Grade 6, Algebra, Calculus"
                required
              />
            </div>

            {/* Course Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Course Details</h3>
              
              <Input
                label="Price (LKR)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                error={errors.price}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 focus:outline-none"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <Input
                label="Duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g., 8 weeks, 12 hours"
              />
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Media</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Thumbnail URL"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
              
              <Input
                label="Intro Video URL"
                name="intro_video"
                value={formData.intro_video}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>

          {/* Publishing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Publishing</h3>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
              />
              <span className="text-gray-300">
                Publish course (make it visible to students)
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <Card.Footer>
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                <FiX className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isLoading}
                disabled={isLoading}
              >
                <FiSave className="w-4 h-4 mr-2" />
                {course ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </Card.Footer>
        </form>
      </Card>
    </motion.div>
  )
}