import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiX, FiFilter, FiTrendingUp } from 'react-icons/fi'
import { debounce } from '@/lib/utils'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Stack, HStack, Flex } from '@/components/ui/Layout'
import { FormField, Select } from './FormField'

export interface SearchFormData {
  query: string
  category: string
  level: string
  priceRange: string
  sortBy: string
}

export interface SearchFormProps {
  /**
   * Callback function called when search is performed.
   */
  onSearch?: (data: SearchFormData) => void
  /**
   * Callback function called when search query changes (for real-time search).
   */
  onQueryChange?: (query: string) => void
  /**
   * Initial search data.
   */
  initialData?: Partial<SearchFormData>
  /**
   * Whether to show advanced filters.
   */
  showFilters?: boolean
  /**
   * Whether to enable real-time search as user types.
   */
  enableRealTimeSearch?: boolean
  /**
   * Debounce delay for real-time search (in milliseconds).
   */
  debounceDelay?: number
  /**
   * Placeholder text for search input.
   */
  placeholder?: string
  /**
   * Popular/trending search terms to display.
   */
  trendingSearches?: string[]
  /**
   * Recent search history.
   */
  recentSearches?: string[]
  /**
   * Available categories for filtering.
   */
  categories?: Array<{ value: string; label: string }>
  /**
   * Available levels for filtering.
   */
  levels?: Array<{ value: string; label: string }>
  /**
   * Available price ranges for filtering.
   */
  priceRanges?: Array<{ value: string; label: string }>
  /**
   * Available sort options.
   */
  sortOptions?: Array<{ value: string; label: string }>
  /**
   * Additional CSS class names.
   */
  className?: string
}

const defaultCategories = [
  { value: '', label: 'All Categories' },
  { value: 'grade-6', label: 'Grade 6' },
  { value: 'grade-7', label: 'Grade 7' },
  { value: 'grade-8', label: 'Grade 8' },
  { value: 'grade-9', label: 'Grade 9' },
  { value: 'algebra', label: 'Algebra' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'calculus', label: 'Calculus' },
]

const defaultLevels = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const defaultPriceRanges = [
  { value: '', label: 'Any Price' },
  { value: 'free', label: 'Free' },
  { value: '0-5000', label: 'LKR 0 - 5,000' },
  { value: '5000-10000', label: 'LKR 5,000 - 10,000' },
  { value: '10000-20000', label: 'LKR 10,000 - 20,000' },
  { value: '20000+', label: 'LKR 20,000+' },
]

const defaultSortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'rating', label: 'Highest Rated' },
]

const defaultTrendingSearches = [
  'Algebra basics',
  'Calculus fundamentals',
  'Geometry formulas',
  'Statistics',
  'Trigonometry',
]

/**
 * Search form component with advanced filtering and real-time search capabilities.
 *
 * @example
 * ```tsx
 * <SearchForm
 *   onSearch={(data) => console.log('Search:', data)}
 *   enableRealTimeSearch
 *   showFilters
 *   trendingSearches={['Algebra', 'Calculus']}
 * />
 * ```
 */
export function SearchForm({
  onSearch,
  onQueryChange,
  initialData = {},
  showFilters = false,
  enableRealTimeSearch = false,
  debounceDelay = 300,
  placeholder = 'Search courses...',
  trendingSearches = defaultTrendingSearches,
  recentSearches = [],
  categories = defaultCategories,
  levels = defaultLevels,
  priceRanges = defaultPriceRanges,
  sortOptions = defaultSortOptions,
  className,
}: SearchFormProps) {
  const [formData, setFormData] = useState<SearchFormData>({
    query: '',
    category: '',
    level: '',
    priceRange: '',
    sortBy: 'relevance',
    ...initialData,
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Debounced search function for real-time search
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        if (onQueryChange) {
          onQueryChange(query)
        }
      }, debounceDelay),
    [onQueryChange, debounceDelay]
  )

  useEffect(() => {
    if (enableRealTimeSearch && formData.query) {
      debouncedSearch(formData.query)
    }
  }, [formData.query, enableRealTimeSearch, debouncedSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'query') {
      setShowSuggestions(value.length > 0)
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Trigger search on filter change if real-time search is enabled
    if (enableRealTimeSearch && onSearch) {
      onSearch({ ...formData, [name]: value })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(formData)
    }
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setFormData((prev) => ({ ...prev, query: suggestion }))
    setShowSuggestions(false)
    if (onSearch) {
      onSearch({ ...formData, query: suggestion })
    }
  }

  const clearSearch = () => {
    setFormData((prev) => ({ ...prev, query: '' }))
    setShowSuggestions(false)
    if (onQueryChange) {
      onQueryChange('')
    }
  }

  const clearAllFilters = () => {
    const clearedData = {
      query: formData.query,
      category: '',
      level: '',
      priceRange: '',
      sortBy: 'relevance',
    }
    setFormData(clearedData)
    if (onSearch) {
      onSearch(clearedData)
    }
  }

  const activeFiltersCount = [
    formData.category,
    formData.level,
    formData.priceRange,
  ].filter(Boolean).length

  const suggestions = useMemo(() => {
    if (!formData.query || formData.query.length < 2) return []

    const allSuggestions = [...trendingSearches, ...recentSearches]
    return allSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(formData.query.toLowerCase())
    )
  }, [formData.query, trendingSearches, recentSearches])

  return (
    <div className={className}>
      <form onSubmit={handleSubmit}>
        <Stack space={4}>
          {/* Main Search Bar */}
          <div className="relative">
            <div className="relative">
              <FormField
                name="query"
                placeholder={placeholder}
                value={formData.query}
                onChange={handleInputChange}
                startIcon={<FiSearch className="w-5 h-5" />}
                endIcon={
                  formData.query ? (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  ) : undefined
                }
                onFocus={() => setShowSuggestions(formData.query.length > 0)}
                onBlur={() => {
                  // Delay hiding suggestions to allow clicking on them
                  setTimeout(() => setShowSuggestions(false), 200)
                }}
                className="pr-24"
              />

              {/* Search Button */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Button type="submit" size="sm">
                  Search
                </Button>
              </div>
            </div>

            {/* Search Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl overflow-hidden"
                >
                  <div className="p-2">
                    {recentSearches.length > 0 && (
                      <>
                        <p className="text-xs text-gray-400 mb-2 px-2">Recent searches</p>
                        {recentSearches.slice(0, 3).map((search, index) => (
                          <button
                            key={`recent-${index}`}
                            type="button"
                            onClick={() => handleSuggestionClick(search)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 rounded transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </>
                    )}

                    {trendingSearches.length > 0 && (
                      <>
                        <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2 px-2 pt-2">
                          <FiTrendingUp className="w-3 h-3" />
                          <span>Trending</span>
                        </div>
                        {suggestions.slice(0, 5).map((search, index) => (
                          <button
                            key={`trending-${index}`}
                            type="button"
                            onClick={() => handleSuggestionClick(search)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 rounded transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filters Toggle */}
          {showFilters && (
            <HStack justify="between" align="center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                startIcon={<FiFilter className="w-4 h-4" />}
              >
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="primary" size="sm" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {activeFiltersCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  Clear all
                </Button>
              )}
            </HStack>
          )}

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-dark-800/50 rounded-lg border border-dark-600">
                  <Select
                    name="category"
                    label="Category"
                    value={formData.category}
                    onChange={handleSelectChange}
                    options={categories}
                  />

                  <Select
                    name="level"
                    label="Level"
                    value={formData.level}
                    onChange={handleSelectChange}
                    options={levels}
                  />

                  <Select
                    name="priceRange"
                    label="Price Range"
                    value={formData.priceRange}
                    onChange={handleSelectChange}
                    options={priceRanges}
                  />

                  <Select
                    name="sortBy"
                    label="Sort By"
                    value={formData.sortBy}
                    onChange={handleSelectChange}
                    options={sortOptions}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      </form>
    </div>
  )
}