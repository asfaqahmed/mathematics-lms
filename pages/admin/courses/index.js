import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FiPlus, FiEdit, FiTrash2, FiEye, FiSearch,
  FiBook, FiUsers, FiToggleLeft,
  FiToggleRight, FiMoreVertical, FiVideo, FiFileText
} from 'react-icons/fi'
import { FaRupeeSign } from "react-icons/fa6";
import { supabase, isAdmin } from '../../../lib/supabase'
import AdminLayout from '../../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function AdminCourses({ user }) {
  const router = useRouter()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState(null)
  
  useEffect(() => {
    checkAdminAccess()
  }, [user])
  
  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, categoryFilter, statusFilter])
  
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
    
    fetchCourses()
  }
  
  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          lessons (id),
          purchases (id)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Process courses with additional data
      const processedCourses = data.map(course => ({
        ...course,
        lessonCount: course.lessons?.length || 0,
        enrollmentCount: course.purchases?.length || 0,
        revenue: (course.purchases?.length || 0) * course.price
      }))
      
      setCourses(processedCourses)
      setFilteredCourses(processedCourses)
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }
  
  const filterCourses = () => {
    let filtered = [...courses]
    
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter)
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => 
        statusFilter === 'published' ? course.published : !course.published
      )
    }
    
    setFilteredCourses(filtered)
  }
  
  const toggleCourseStatus = async (courseId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ published: !currentStatus })
        .eq('id', courseId)
      
      if (error) throw error
      
      toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'}`)
      fetchCourses()
    } catch (error) {
      console.error('Error toggling course status:', error)
      toast.error('Failed to update course status')
    }
  }
  
  const toggleFeatured = async (courseId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ featured: !currentStatus })
        .eq('id', courseId)
      
      if (error) throw error
      
      toast.success(`Course ${!currentStatus ? 'featured' : 'unfeatured'}`)
      fetchCourses()
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast.error('Failed to update featured status')
    }
  }
  
  const deleteCourse = async () => {
    if (!courseToDelete) return
    
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id)
      
      if (error) throw error
      
      toast.success('Course deleted successfully')
      setDeleteModalOpen(false)
      setCourseToDelete(null)
      fetchCourses()
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course. It may have associated data.')
    }
  }
  
  const formatCurrency = (amount) => {
    return `LKR ${(amount).toLocaleString()}`
  }
  
  const categories = ['all', 'Algebra', 'Calculus', 'Geometry', 'Statistics', 'Trigonometry']
  
  if (!user) return null
  
  return (
    <AdminLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Course Management
            </h1>
            <p className="text-gray-400">
              Manage your courses, lessons, and content
            </p>
          </div>
          
          <Link href="/admin/courses/new" legacyBehavior>
            <a className="btn-primary flex items-center space-x-2">
              <FiPlus />
              <span>Add New Course</span>
            </a>
          </Link>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Courses</p>
                <p className="text-2xl font-bold text-white">{courses.length}</p>
              </div>
              <FiBook className="w-8 h-8 text-primary-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Published</p>
                <p className="text-2xl font-bold text-green-400">
                  {courses.filter(c => c.published).length}
                </p>
              </div>
              <FiToggleRight className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Enrollments</p>
                <p className="text-2xl font-bold text-blue-400">
                  {courses.reduce((sum, c) => sum + c.enrollmentCount, 0)}
                </p>
              </div>
              <FiUsers className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(courses.reduce((sum, c) => sum + c.revenue, 0))}
                </p>
              </div>
              
              <FaRupeeSign className="w-8 h-8 text-green-400" />
              
            </div>
          </motion.div>
        </div>
        
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        
        {/* Courses Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <FiBook className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
              <p className="text-gray-400">Create your first course to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Lessons</th>
                    <th>Students</th>
                    <th>Revenue</th>
                    {/* <th>Status</th> */}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <img
                            src={course.thumbnail || '/api/placeholder/60/40'}
                            alt={course.title}
                            className="w-12 h-8 rounded object-cover"
                          />
                          <div>
                            <div className="font-medium text-white">
                              {course.title}
                            </div>
                            {course.featured && (
                              <span className="text-xs text-yellow-400">★ Featured</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          {course.category}
                        </span>
                      </td>
                      <td className="font-mono">
                        {formatCurrency(course.price)}
                      </td>
                      <td>
                        <div className="flex items-center space-x-1">
                          <FiVideo className="w-4 h-4 text-gray-400" />
                          <span>{course.lessonCount}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-1">
                          <FiUsers className="w-4 h-4 text-gray-400" />
                          <span>{course.enrollmentCount}</span>
                        </div>
                      </td>
                      <td className="font-semibold text-green-400">
                        {formatCurrency(course.revenue)}
                      </td>
                      {/* <td>
                        <button
                          onClick={() => toggleCourseStatus(course.id, course.published)}
                          className={`badge ${course.published ? 'badge-success' : 'badge-warning'} cursor-pointer`}
                        >
                          {course.published ? 'Published' : 'Draft'}
                        </button>
                      </td> */}
                      <td>
                        <div className="flex items-center space-x-2">
                          <Link href={`/courses/${course.id}`} legacyBehavior>
                            <a className="text-gray-400 hover:text-white" title="View">
                              <FiEye className="w-5 h-5" />
                            </a>
                          </Link>
                          
                          <Link href={`/admin/courses/${course.id}/edit`} legacyBehavior>
                            <a className="text-blue-400 hover:text-blue-300" title="Edit">
                              <FiEdit className="w-5 h-5" />
                            </a>
                          </Link>
                          
                          <button
                            onClick={() => toggleFeatured(course.id, course.featured)}
                            className={`${course.featured ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-300`}
                            title="Toggle Featured"
                          >
                            ★
                          </button>
                          
                          <button
                            onClick={() => {
                              setCourseToDelete(course)
                              setDeleteModalOpen(true)
                            }}
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Delete Confirmation Modal */}
        {deleteModalOpen && courseToDelete && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setDeleteModalOpen(false)}
            />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 z-50 max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Delete Course</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete "{courseToDelete.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteCourse}
                  className="btn-primary bg-red-500 hover:bg-red-600"
                >
                  Delete Course
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}