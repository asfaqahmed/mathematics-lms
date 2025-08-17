import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSave, FiX, FiPlay, FiBook } from 'react-icons/fi'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import toast from 'react-hot-toast'

export default function LessonForm({ lesson, courseId, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'video',
    duration: '',
    order: 1,
    is_preview: false,
    is_published: false
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        content: lesson.content || '',
        type: lesson.type || 'video',
        duration: lesson.duration || '',
        order: lesson.order || 1,
        is_preview: lesson.is_preview || false,
        is_published: lesson.is_published || false
      })
    }
  }, [lesson])

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
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }
    
    if (formData.type === 'video' && formData.content && !isValidVideoUrl(formData.content)) {
      newErrors.content = 'Please enter a valid YouTube URL'
    }
    
    if (formData.order && (isNaN(formData.order) || parseInt(formData.order) < 1)) {
      newErrors.order = 'Order must be a positive number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidVideoUrl = (url) => {
    const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    return youtubeRegex.test(url)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors and try again')
      return
    }
    
    const lessonData = {
      ...formData,
      course_id: courseId,
      order: parseInt(formData.order),
      duration: formData.duration ? parseInt(formData.duration) : null
    }
    
    await onSave(lessonData)
  }

  const lessonTypes = [
    { value: 'video', label: 'Video', icon: FiPlay },
    { value: 'article', label: 'Article', icon: FiBook }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Card>
        <Card.Header>
          <Card.Title>
            {lesson ? 'Edit Lesson' : 'Create New Lesson'}
          </Card.Title>
          <Card.Description>
            {lesson ? 'Update lesson content' : 'Add a new lesson to the course'}
          </Card.Description>
        </Card.Header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              
              <Input
                label="Lesson Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                placeholder="Enter lesson title"
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
                  rows={3}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-white placeholder-gray-400 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 focus:outline-none"
                  placeholder="Brief description of the lesson"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Order"
                  name="order"
                  type="number"
                  value={formData.order}
                  onChange={handleChange}
                  error={errors.order}
                  min="1"
                  required
                />
                
                <Input
                  label="Duration (minutes)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Lesson Type & Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Lesson Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lesson Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {lessonTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <label
                        key={type.value}
                        className={`
                          flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                          ${formData.type === type.value
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-600 hover:border-dark-500'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type.value}
                          checked={formData.type === type.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <Icon className="w-5 h-5 text-primary-400" />
                        <span className="text-white font-medium">{type.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="is_preview"
                    checked={formData.is_preview}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="text-gray-300">
                    Free Preview (allow non-enrolled students to view)
                  </span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="text-gray-300">
                    Publish lesson (make it visible to students)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Content</h3>
            
            {formData.type === 'video' ? (
              <div>
                <Input
                  label="Video URL"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  error={errors.content}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
                <p className="text-sm text-gray-400 mt-1">
                  Currently supports YouTube videos. Paste the full YouTube URL.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Article Content
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={10}
                  className={`
                    w-full px-4 py-2.5 bg-dark-700 border border-dark-600 
                    text-white placeholder-gray-400 rounded-lg
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                    transition-all duration-200 focus:outline-none
                    ${errors.content ? 'border-red-500' : ''}
                  `}
                  placeholder="Write your lesson content here. You can use HTML formatting."
                  required
                />
                {errors.content && (
                  <p className="text-sm text-red-400 mt-1">{errors.content}</p>
                )}
                <p className="text-sm text-gray-400 mt-1">
                  You can use basic HTML tags for formatting (p, h1-h6, strong, em, ul, ol, li).
                </p>
              </div>
            )}
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
                {lesson ? 'Update Lesson' : 'Create Lesson'}
              </Button>
            </div>
          </Card.Footer>
        </form>
      </Card>
    </motion.div>
  )
}