import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  FiSave, FiX, FiPlus, FiTrash2, FiImage,
  FiVideo, FiFileText, FiDollarSign, FiTag,
  FiMove, FiClock, FiLock, FiUnlock
} from 'react-icons/fi'
import { supabase, isAdmin } from '../../../lib/supabase'
import AdminLayout from '../../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function NewCourse({ user }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: 'Algebra',
    price: '',
    thumbnail: '',
    intro_video: '',
    featured: false,
    published: false
  })
  const [lessons, setLessons] = useState([])
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    type: 'video',
    content: '',
    duration: '',
    is_preview: false
  })
  const [addingLesson, setAddingLesson] = useState(false)
  
  useEffect(() => {
    checkAdminAccess()
  }, [user])
  
  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    const adminStatus = await isAdmin(user.id)
    if (!adminStatus) {
      toast.error('Access denied. Admin only.')
      router.push('/')
      return
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!courseData.title || !courseData.price) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setLoading(true)
    
    try {
      // Create course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert([{
          ...courseData,
          price: parseInt(courseData.price) * 100 // Convert to cents
        }])
        .select()
        .single()
      
      if (courseError) throw courseError
      
      // Create lessons
      if (lessons.length > 0) {
        const lessonsToInsert = lessons.map((lesson, index) => ({
          ...lesson,
          course_id: course.id,
          order_index: index + 1,
          duration: parseInt(lesson.duration) || 0
        }))
        
        const { error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonsToInsert)
        
        if (lessonsError) throw lessonsError
      }
      
      toast.success('Course created successfully!')
      router.push('/admin/courses')
      
    } catch (error) {
      console.error('Error creating course:', error)
      toast.error('Failed to create course')
    } finally {
      setLoading(false)
    }
  }
  
  const addLesson = () => {
    if (!newLesson.title || !newLesson.content) {
      toast.error('Please fill in lesson title and content')
      return
    }
    
    setLessons([...lessons, { ...newLesson }])
    setNewLesson({
      title: '',
      description: '',
      type: 'video',
      content: '',
      duration: '',
      is_preview: false
    })
    setAddingLesson(false)
    toast.success('Lesson added')
  }
  
  const removeLesson = (index) => {
    setLessons(lessons.filter((_, i) => i !== index))
    toast.success('Lesson removed')
  }
  
  const moveLesson = (index, direction) => {
    const newLessons = [...lessons]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= lessons.length) return
    
    [newLessons[index], newLessons[newIndex]] = [newLessons[newIndex], newLessons[index]]
    setLessons(newLessons)
  }
  
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      setLoading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `course-${Date.now()}.${fileExt}`
      const filePath = `courses/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath)
      
      setCourseData({ ...courseData, thumbnail: publicUrl })
      toast.success('Thumbnail uploaded')
    } catch (error) {
      console.error('Error uploading thumbnail:', error)
      toast.error('Failed to upload thumbnail')
    } finally {
      setLoading(false)
    }
  }
  
  if (!user) return null
  
  return (
    <AdminLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Create New Course
          </h1>
          <p className="text-gray-400">
            Add a new course to your platform
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h2 className="text-xl font-semibold text-white mb-6">
                  Basic Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={courseData.title}
                      onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                      className="input w-full"
                      placeholder="e.g., Advanced Calculus"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={courseData.description}
                      onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                      className="input w-full h-32 resize-none"
                      placeholder="Describe what students will learn..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category *
                      </label>
                      <select
                        value={courseData.category}
                        onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                        className="input w-full"
                      >
                        <option value="Algebra">Algebra</option>
                        <option value="Calculus">Calculus</option>
                        <option value="Geometry">Geometry</option>
                        <option value="Statistics">Statistics</option>
                        <option value="Trigonometry">Trigonometry</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price (LKR) *
                      </label>
                      <div className="relative">
                        <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <input
                          type="number"
                          value={courseData.price}
                          onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                          className="input w-full pl-10"
                          placeholder="5000"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Intro Video URL
                    </label>
                    <div className="relative">
                      <FiVideo className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        type="url"
                        value={courseData.intro_video}
                        onChange={(e) => setCourseData({ ...courseData, intro_video: e.target.value })}
                        className="input w-full pl-10"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Lessons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Course Lessons
                  </h2>
                  
                  {!addingLesson && (
                    <button
                      type="button"
                      onClick={() => setAddingLesson(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <FiPlus />
                      <span>Add Lesson</span>
                    </button>
                  )}
                </div>
                
                {/* Add Lesson Form */}
                {addingLesson && (
                  <div className="bg-dark-700 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">New Lesson</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Lesson Title
                        </label>
                        <input
                          type="text"
                          value={newLesson.title}
                          onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                          className="input w-full"
                          placeholder="Introduction to Variables"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={newLesson.description}
                          onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                          className="input w-full h-20 resize-none"
                          placeholder="Brief description..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Type
                          </label>
                          <select
                            value={newLesson.type}
                            onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value })}
                            className="input w-full"
                          >
                            <option value="video">Video</option>
                            <option value="post">Article</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={newLesson.duration}
                            onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })}
                            className="input w-full"
                            placeholder="15"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Content {newLesson.type === 'video' ? 'URL' : ''}
                        </label>
                        {newLesson.type === 'video' ? (
                          <input
                            type="url"
                            value={newLesson.content}
                            onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                            className="input w-full"
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        ) : (
                          <textarea
                            value={newLesson.content}
                            onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                            className="input w-full h-32 resize-none"
                            placeholder="Write your article content..."
                          />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newLesson.is_preview}
                            onChange={(e) => setNewLesson({ ...newLesson, is_preview: e.target.checked })}
                            className="w-4 h-4 rounded text-primary-500"
                          />
                          <span className="text-sm text-gray-300">Free Preview</span>
                        </label>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAddingLesson(false)
                            setNewLesson({
                              title: '',
                              description: '',
                              type: 'video',
                              content: '',
                              duration: '',
                              is_preview: false
                            })
                          }}
                          className="btn-ghost"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={addLesson}
                          className="btn-primary"
                        >
                          Add Lesson
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Lessons List */}
                {lessons.length === 0 ? (
                  <div className="text-center py-8 bg-dark-700 rounded-lg">
                    <FiFileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No lessons added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((lesson, index) => (
                      <div
                        key={index}
                        className="bg-dark-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-gray-500 font-mono">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-white">{lesson.title}</h4>
                              {lesson.is_preview && (
                                <span className="badge badge-success text-xs">
                                  <FiUnlock className="w-3 h-3 mr-1" />
                                  Preview
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                              <span className="flex items-center space-x-1">
                                {lesson.type === 'video' ? <FiVideo /> : <FiFileText />}
                                <span>{lesson.type}</span>
                              </span>
                              {lesson.duration && (
                                <span className="flex items-center space-x-1">
                                  <FiClock />
                                  <span>{lesson.duration}m</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => moveLesson(index, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-white disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLesson(index, 'down')}
                            disabled={index === lessons.length - 1}
                            className="text-gray-400 hover:text-white disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLesson(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Thumbnail */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card"
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Course Thumbnail
                </h3>
                
                <div className="aspect-video rounded-lg overflow-hidden bg-dark-700 mb-4">
                  {courseData.thumbnail ? (
                    <img
                      src={courseData.thumbnail}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiImage className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <label className="btn-secondary w-full flex items-center justify-center space-x-2 cursor-pointer">
                  <FiImage />
                  <span>Upload Thumbnail</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                </label>
              </motion.div>
              
              {/* Publishing Options */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Publishing Options
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-300">Featured Course</span>
                    <input
                      type="checkbox"
                      checked={courseData.featured}
                      onChange={(e) => setCourseData({ ...courseData, featured: e.target.checked })}
                      className="w-5 h-5 rounded text-primary-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-gray-300">Publish Immediately</span>
                    <input
                      type="checkbox"
                      checked={courseData.published}
                      onChange={(e) => setCourseData({ ...courseData, published: e.target.checked })}
                      className="w-5 h-5 rounded text-primary-500"
                    />
                  </label>
                </div>
              </motion.div>
              
              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="spinner w-5 h-5 border-2"></div>
                  ) : (
                    <>
                      <FiSave />
                      <span>Create Course</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push('/admin/courses')}
                  className="w-full btn-ghost mt-3"
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}