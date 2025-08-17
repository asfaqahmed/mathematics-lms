import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  FiSave, FiX, FiPlus, FiTrash2, FiImage,
  FiVideo, FiFileText, FiDollarSign, FiTag,
  FiMove, FiClock, FiLock, FiUnlock, FiArrowLeft
} from 'react-icons/fi'
import { supabase, isAdmin } from '../../../../lib/supabase'
import AdminLayout from '../../../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function EditCourse({ user }) {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
  const [deletedLessons, setDeletedLessons] = useState([])
  
  useEffect(() => {
    if (user && id) {
      checkAdminAndFetchCourse()
    }
  }, [user, id])
  
  const checkAdminAndFetchCourse = async () => {
    const adminStatus = await isAdmin(user.id)
    if (!adminStatus) {
      toast.error('Access denied. Admin only.')
      router.push('/')
      return
    }
    
    fetchCourseData()
  }
  
  const fetchCourseData = async () => {
    try {
      // Fetch course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()
      
      if (courseError) throw courseError
      
      setCourseData({
        ...course,
        price: course.price // Convert from cents
      })
      
      // Fetch lessons
      const { data: courseLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order_index')
      
      if (lessonsError) throw lessonsError
      
      setLessons(courseLessons || [])
      
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error('Failed to load course')
      router.push('/admin/courses')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!courseData.title || !courseData.price) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setSaving(true)
    
    try {
      // Update course
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: courseData.title,
          description: courseData.description,
          category: courseData.category,
          price: parseInt(courseData.price) * 100,
          thumbnail: courseData.thumbnail,
          intro_video: courseData.intro_video,
          featured: courseData.featured,
          published: courseData.published,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (courseError) throw courseError
      
      // Delete removed lessons
      if (deletedLessons.length > 0) {
        const { error: deleteError } = await supabase
          .from('lessons')
          .delete()
          .in('id', deletedLessons)
        
        if (deleteError) throw deleteError
      }
      
      // Update existing lessons and add new ones
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i]
        
        if (lesson.id) {
          // Update existing lesson
          const { error } = await supabase
            .from('lessons')
            .update({
              title: lesson.title,
              description: lesson.description,
              type: lesson.type,
              content: lesson.content,
              duration: parseInt(lesson.duration) || 0,
              order_index: i + 1,
              is_preview: lesson.is_preview
            })
            .eq('id', lesson.id)
          
          if (error) throw error
        } else {
          // Insert new lesson
          const { error } = await supabase
            .from('lessons')
            .insert({
              course_id: id,
              title: lesson.title,
              description: lesson.description,
              type: lesson.type,
              content: lesson.content,
              duration: parseInt(lesson.duration) || 0,
              order_index: i + 1,
              is_preview: lesson.is_preview
            })
          
          if (error) throw error
        }
      }
      
      toast.success('Course updated successfully!')
      router.push('/admin/courses')
      
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error('Failed to update course')
    } finally {
      setSaving(false)
    }
  }
  
  const addLesson = () => {
    if (!newLesson.title || !newLesson.content) {
      toast.error('Please fill in lesson title and content')
      return
    }
    
    setLessons([...lessons, { ...newLesson, isNew: true }])
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
    const lessonToRemove = lessons[index]
    
    if (lessonToRemove.id) {
      // Mark existing lesson for deletion
      setDeletedLessons([...deletedLessons, lessonToRemove.id])
    }
    
    setLessons(lessons.filter((_, i) => i !== index))
    toast.success('Lesson removed')
  }
  
  const updateLesson = (index, field, value) => {
    const updatedLessons = [...lessons]
    updatedLessons[index] = {
      ...updatedLessons[index],
      [field]: value
    }
    setLessons(updatedLessons)
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
      setSaving(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `course-${id}-${Date.now()}.${fileExt}`
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
      setSaving(false)
    }
  }
  
  if (!user) return null
  
  if (loading) {
    return (
      <AdminLayout user={user}>
        <div className="flex justify-center items-center h-screen">
          <div className="spinner"></div>
        </div>
      </AdminLayout>
    )
  }
  
  return (
    <AdminLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/admin/courses')}
            className="mr-4 text-gray-400 hover:text-white"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Edit Course
            </h1>
            <p className="text-gray-400">
              Update course details and content
            </p>
          </div>
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
                    Course Lessons ({lessons.length})
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
                      <input
                        type="text"
                        value={newLesson.title}
                        onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                        className="input w-full"
                        placeholder="Lesson title"
                      />
                      
                      <textarea
                        value={newLesson.description}
                        onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                        className="input w-full h-20 resize-none"
                        placeholder="Description"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          value={newLesson.type}
                          onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value })}
                          className="input"
                        >
                          <option value="video">Video</option>
                          <option value="post">Article</option>
                        </select>
                        
                        <input
                          type="number"
                          value={newLesson.duration}
                          onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })}
                          className="input"
                          placeholder="Duration (min)"
                        />
                      </div>
                      
                      {newLesson.type === 'video' ? (
                        <input
                          type="url"
                          value={newLesson.content}
                          onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                          className="input w-full"
                          placeholder="Video URL"
                        />
                      ) : (
                        <textarea
                          value={newLesson.content}
                          onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                          className="input w-full h-32 resize-none"
                          placeholder="Article content"
                        />
                      )}
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newLesson.is_preview}
                          onChange={(e) => setNewLesson({ ...newLesson, is_preview: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-300">Free Preview</span>
                      </label>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setAddingLesson(false)}
                          className="btn-ghost"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={addLesson}
                          className="btn-primary"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Lessons List */}
                <div className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <div key={lesson.id || `new-${index}`} className="bg-dark-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-500">#{index + 1}</span>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLesson(index, 'title', e.target.value)}
                            className="input"
                            placeholder="Lesson title"
                          />
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
                      
                      <div className="grid grid-cols-3 gap-3">
                        <select
                          value={lesson.type}
                          onChange={(e) => updateLesson(index, 'type', e.target.value)}
                          className="input"
                        >
                          <option value="video">Video</option>
                          <option value="post">Article</option>
                        </select>
                        
                        <input
                          type="number"
                          value={lesson.duration}
                          onChange={(e) => updateLesson(index, 'duration', e.target.value)}
                          className="input"
                          placeholder="Duration"
                        />
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={lesson.is_preview}
                            onChange={(e) => updateLesson(index, 'is_preview', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-300">Preview</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <span>Change Thumbnail</span>
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
                    <span className="text-gray-300">Published</span>
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
                  disabled={saving}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <div className="spinner w-5 h-5 border-2"></div>
                  ) : (
                    <>
                      <FiSave />
                      <span>Save Changes</span>
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