import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiGrid, FiList } from 'react-icons/fi'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import CourseCard from '../../components/course/CourseCard'
import { handleError } from '@/utils/error'
import { formatPrice } from '@/utils/format'

/**
 * Courses page component
 * Displays all available courses with filtering and sorting capabilities
 */
export default function Courses({ user }) {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')

  // Static filter options
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Algebra', label: 'Algebra' },
    { value: 'Calculus', label: 'Calculus' },
    { value: 'Geometry', label: 'Geometry' },
    { value: 'Statistics', label: 'Statistics' },
    { value: 'Trigonometry', label: 'Trigonometry' }
  ]

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-250000', label: 'Under LKR 2,500' },
    { value: '250000-500000', label: 'LKR 2,500 - 5,000' },
    { value: '500000-750000', label: 'LKR 5,000 - 7,500' },
    { value: '750000+', label: 'Above LKR 7,500' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' }
  ]

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchTerm, selectedCategory, priceRange, sortBy])

  /**
   * Fetches all courses from the database
   */
  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Fetched courses:', data)

      if (error) throw error

      const coursesData = data || []
      setCourses(coursesData)
      setFilteredCourses(coursesData)
    } catch (error) {
      console.error('Error fetching courses:', error)
      handleError(error, {
        component: 'Courses',
        action: 'fetchCourses',
        userId: user?.id
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Filters and sorts courses based on current filter criteria
   */
  const filterAndSortCourses = () => {
    let filtered = [...courses]

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(lowerSearchTerm) ||
        course.description.toLowerCase().includes(lowerSearchTerm) ||
        course.category.toLowerCase().includes(lowerSearchTerm)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    // Apply price filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(p => p.replace('+', ''))
      const minPrice = parseInt(min, 10)
      const maxPrice = max ? parseInt(max, 10) : Infinity

      filtered = filtered.filter(course => {
        const price = course.price * 100 // Convert to cents for comparison
        return maxPrice === Infinity ? price >= minPrice : (price >= minPrice && price <= maxPrice)
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'popular':
          // Fallback to newest if no enrollment count available
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

    setFilteredCourses(filtered)
  }

  /**
   * Handles search input changes
   */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  /**
   * Handles category filter changes
   */
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
  }

  /**
   * Handles price range filter changes
   */
  const handlePriceRangeChange = (e) => {
    setPriceRange(e.target.value)
  }

  /**
   * Handles sort option changes
   */
  const handleSortChange = (e) => {
    setSortBy(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-12">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Explore Our <span className="gradient-text">Courses</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Choose from our comprehensive selection of mathematics courses designed to help you excel
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="input pl-12 w-full"
                  aria-label="Search courses"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="input"
                aria-label="Filter by category"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              {/* Price Filter */}
              <select
                value={priceRange}
                onChange={handlePriceRangeChange}
                className="input"
                aria-label="Filter by price range"
              >
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="input"
                aria-label="Sort courses"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-dark-800 rounded-lg border border-dark-600" role="group" aria-label="View mode">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-colors ${
                    viewMode === 'grid' ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-colors ${
                    viewMode === 'list' ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-gray-400">
            Showing <span className="text-white font-semibold">{filteredCourses.length}</span> courses
          </div>
        </div>
      </section>

      {/* Courses Grid/List */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-12" role="status" aria-label="Loading courses">
              <div className="spinner"></div>
              <span className="sr-only">Loading courses...</span>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-800 mb-4">
                <FiSearch className="w-10 h-10 text-gray-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
              <p className="text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'}
            >
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {viewMode === 'grid' ? (
                    <CourseCard course={course} />
                  ) : (
                    // List View
                    <div className="card flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3">
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <img
                            src={course.thumbnail_url || '/api/placeholder/400/225'}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                        <p className="text-gray-400 mb-4 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-white">
                            {formatPrice(course.price)}
                          </span>
                          <Link
                            href={`/courses/${course.id}`}
                            className="btn-primary"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}