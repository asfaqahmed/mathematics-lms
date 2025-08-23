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
import VideoUpload from '../../../../components/ui/VideoUpload'
import toast from 'react-hot-toast'

export default function EditCourse({ user }) {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
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
    is_preview: false,
    video_source: 'youtube'
  })
  const [addingLesson, setAddingLesson] = useState(false)
  const [deletedLessons, setDeletedLessons] = useState([])
  const [introVideoSource, setIntroVideoSource] = useState('url')
  
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
        price: course.price
      })
      
      // Set intro video source based on current value
      if (course.intro_video) {
        if (course.intro_video.includes('youtube.com') || 
            course.intro_video.includes('youtu.be') || 
            course.intro_video.includes('vimeo.com') ||
            course.intro_video.startsWith('http')) {
          setIntroVideoSource('url')
        } else {
          setIntroVideoSource('upload')
        }
      }
      
      // Fetch lessons
      const { data: courseLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order')
      
      if (lessonsError) throw lessonsError
      
      setLessons(courseLessons || [])
      
    } catch (error) {
      console.error('Error fetching course:', error)
      
      if (error.code === 'PGRST116') {
        setError('Course not found')
        toast.error('Course not found')
      } else {
        setError('Failed to load course: ' + error.message)
        toast.error('Failed to load course: ' + error.message)
      }
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
    
    console.log('=== COURSE UPDATE START ===')
    console.log('Course ID:', id)
    console.log('Course Data:', courseData)
    console.log('Lessons to update:', lessons)
    console.log('Lessons to delete:', deletedLessons)
    
    setSaving(true)
    
    try {
      // Update course using API endpoint
      console.log('Updating course via API with data:', {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        price: parseInt(courseData.price),
        thumbnail: courseData.thumbnail,
        intro_video: courseData.intro_video,
        featured: courseData.featured,
        published: courseData.published
      })
      
      const courseResponse = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: courseData.title,
          description: courseData.description,
          category: courseData.category,
          price: parseInt(courseData.price),
          thumbnail: courseData.thumbnail,
          intro_video: courseData.intro_video,
          featured: courseData.featured,
          published: courseData.published
        })
      })
      
      console.log('Course API response status:', courseResponse.status)
      
      if (!courseResponse.ok) {
        const errorData = await courseResponse.json()
        console.error('Course update API error:', errorData)
        throw new Error(errorData.error || 'Failed to update course')
      }
      
      const courseResult = await courseResponse.json()
      console.log('Course update result:', courseResult)
      console.log('✅ Course updated successfully via API')
      
      // Update lessons using API endpoint
      if (lessons.length > 0 || deletedLessons.length > 0) {
        console.log('Updating lessons via API...')
        const lessonsResponse = await fetch(`/api/courses/${id}/lessons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'bulk_update',
            lessons: lessons,
            deletedLessons: deletedLessons
          })
        })
        
        console.log('Lessons API response status:', lessonsResponse.status)
        
        if (!lessonsResponse.ok) {
          const errorData = await lessonsResponse.json()
          console.error('Lessons update API error:', errorData)
          throw new Error(errorData.error || 'Failed to update lessons')
        }
        
        const lessonsResult = await lessonsResponse.json()
        console.log('Lessons update result:', lessonsResult)
        console.log('✅ All lessons processed successfully via API')
      }
      console.log('=== COURSE UPDATE COMPLETED SUCCESSFULLY ===')
      
      toast.success('Course updated successfully!')
      router.push('/admin/courses')
      
    } catch (error) {
      console.error('=== COURSE UPDATE FAILED ===')
      console.error('Error details:', error)
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      
      // More specific error messages
      if (error.code === 'PGRST301') {
        toast.error('Database constraint violation - check your data')
      } else if (error.code?.startsWith('23')) {
        toast.error('Data validation error - please check all fields')
      } else if (error.message?.includes('foreign key')) {
        toast.error('Related data error - course or lesson references invalid')
      } else {
        toast.error(`Failed to update course: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setSaving(false)
      console.log('=== COURSE UPDATE PROCESS ENDED ===')
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
      is_preview: false,
      video_source: 'youtube'
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
    
    // Check if user is available
    if (!user || !user.id) {
      toast.error('User authentication required. Please refresh the page.')
      return
    }
    
    try {
      setSaving(true)
      
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1] // Remove data:image/...;base64, prefix
          
          const response = await fetch('/api/thumbnails/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              image_data: base64Data,
              filename: file.name
            })
          })
          
          const result = await response.json()
          
          if (!response.ok) {
            throw new Error(result.error || 'Failed to upload thumbnail')
          }
          
          setCourseData({ ...courseData, thumbnail: result.url })
          toast.success('Thumbnail uploaded successfully!')
          
        } catch (error) {
          console.error('Error uploading thumbnail:', error)
          toast.error(error.message || 'Failed to upload thumbnail')
        } finally {
          setSaving(false)
        }
      }
      
      reader.onerror = () => {
        toast.error('Failed to read file')
        setSaving(false)
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading thumbnail:', error)
      toast.error('Failed to upload thumbnail')
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

  if (error) {
    return (
      <AdminLayout user={user}>
        <div className="p-6">
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
            </div>
          </div>
          
          <div className="card text-center py-12">
            <div className="text-red-400 mb-4">
              <FiX className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Course</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/admin/courses')}
                className="btn-secondary"
              >
                Back to Courses
              </button>
              <button
                onClick={() => {
                  setError(null)
                  setLoading(true)
                  fetchCourseData()
                }}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
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
                      Intro Video {introVideoSource === 'url' ? 'URL' : 'Upload'}
                    </label>
                    
                    {/* Video Source Selection */}
                    <div className="flex items-center space-x-4 mb-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="intro_video_source"
                          value="url"
                          checked={introVideoSource === 'url'}
                          onChange={(e) => {
                            setIntroVideoSource(e.target.value)
                            setCourseData({ ...courseData, intro_video: '' })
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-300">YouTube/URL</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="intro_video_source"
                          value="upload"
                          checked={introVideoSource === 'upload'}
                          onChange={(e) => {
                            setIntroVideoSource(e.target.value)
                            setCourseData({ ...courseData, intro_video: '' })
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-300">Upload Video</span>
                      </label>
                    </div>
                    
                    {/* Video Input */}
                    {introVideoSource === 'url' ? (
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
                    ) : (
                      <VideoUpload
                        onUploadSuccess={(videoData) => {
                          setCourseData({ ...courseData, intro_video: videoData.url })
                          toast.success('Intro video uploaded successfully!')
                        }}
                        onUploadError={(error) => {
                          toast.error('Failed to upload intro video')
                        }}
                        maxSizeMB={200}
                      />
                    )}
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
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="video_source"
                                value="youtube"
                                checked={newLesson.video_source !== 'upload'}
                                onChange={(e) => setNewLesson({ ...newLesson, video_source: 'youtube' })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-300">YouTube URL</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="video_source"
                                value="upload"
                                checked={newLesson.video_source === 'upload'}
                                onChange={(e) => setNewLesson({ ...newLesson, video_source: 'upload' })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-300">Upload Video</span>
                            </label>
                          </div>
                          
                          {newLesson.video_source === 'upload' ? (
                            <div className="p-3 border border-dashed border-gray-600 rounded-lg text-center">
                              <p className="text-sm text-gray-400">Video upload available in full lesson editor</p>
                            </div>
                          ) : (
                            <input
                              type="url"
                              value={newLesson.content}
                              onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                              className="input w-full"
                              placeholder="YouTube Video URL"
                            />
                          )}
                        </div>
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