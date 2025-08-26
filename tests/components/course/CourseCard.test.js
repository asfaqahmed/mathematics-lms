import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import CourseCard from '../../../components/course/CourseCard'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}))

const mockCourse = {
  id: 'course-1',
  title: 'Advanced Mathematics',
  description: 'Learn advanced mathematical concepts including calculus, algebra, and statistics',
  price: 5000,
  thumbnail: 'https://example.com/thumbnail.jpg',
  category: 'Mathematics'
}

const mockCourseWithoutOptionalFields = {
  id: 'course-2',
  title: 'Basic Physics',
  description: 'Introduction to physics',
  price: 3000
}

describe('CourseCard', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    useRouter.mockReturnValue({
      push: mockPush,
      pathname: '/',
      query: {}
    })
    jest.clearAllMocks()
  })

  it('renders course information correctly', () => {
    render(<CourseCard course={mockCourse} />)
    
    expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument()
    expect(screen.getByText('Learn advanced mathematical concepts including calculus, algebra, and statistics')).toBeInTheDocument()
    expect(screen.getByText('LKR 5,000')).toBeInTheDocument()
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('View Course')).toBeInTheDocument()
  })

  it('renders course without optional fields', () => {
    render(<CourseCard course={mockCourseWithoutOptionalFields} />)
    
    expect(screen.getByText('Basic Physics')).toBeInTheDocument()
    expect(screen.getByText('LKR 3,000')).toBeInTheDocument()
    expect(screen.queryByText('Mathematics')).not.toBeInTheDocument()
  })

  it('displays correct thumbnail image', () => {
    render(<CourseCard course={mockCourse} />)
    
    const image = screen.getByAltText('Advanced Mathematics')
    expect(image).toHaveAttribute('src', 'https://example.com/thumbnail.jpg')
  })

  it('displays placeholder image when thumbnail is not provided', () => {
    render(<CourseCard course={mockCourseWithoutOptionalFields} />)
    
    const image = screen.getByAltText('Basic Physics')
    expect(image).toHaveAttribute('src', '/api/placeholder/400/225')
  })

  it('formats price correctly with thousands separator', () => {
    const expensiveCourse = { ...mockCourse, price: 15000 }
    render(<CourseCard course={expensiveCourse} />)
    
    expect(screen.getByText('LKR 15,000')).toBeInTheDocument()
  })

  it('handles price formatting for large numbers', () => {
    const expensiveCourse = { ...mockCourse, price: 1500000 }
    render(<CourseCard course={expensiveCourse} />)
    
    expect(screen.getByText('LKR 1,500,000')).toBeInTheDocument()
  })

  it('has correct link href', () => {
    render(<CourseCard course={mockCourse} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/courses/course-1')
  })

  it('applies hover effects classes', () => {
    render(<CourseCard course={mockCourse} />)
    
    const card = screen.getByRole('link')
    expect(card).toHaveClass('group')
    
    const image = screen.getByAltText('Advanced Mathematics')
    expect(image).toHaveClass('group-hover:scale-110')
  })

  it('shows all course stats', () => {
    render(<CourseCard course={mockCourse} />)
    
    expect(screen.getByText('12 Lessons')).toBeInTheDocument()
    expect(screen.getByText('6 Hours')).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
  })

  it('displays play button overlay', () => {
    render(<CourseCard course={mockCourse} />)
    
    // Check if play icon exists (would be rendered by react-icons)
    const playElements = document.querySelectorAll('svg')
    expect(playElements.length).toBeGreaterThan(0)
  })

  it('handles missing description gracefully', () => {
    const courseWithoutDescription = { ...mockCourse, description: null }
    render(<CourseCard course={courseWithoutDescription} />)
    
    expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument()
    // Should not crash and should still render other content
    expect(screen.getByText('View Course')).toBeInTheDocument()
  })

  it('handles empty string description', () => {
    const courseWithEmptyDescription = { ...mockCourse, description: '' }
    render(<CourseCard course={courseWithEmptyDescription} />)
    
    expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument()
    expect(screen.getByText('View Course')).toBeInTheDocument()
  })

  it('handles zero price correctly', () => {
    const freeCourse = { ...mockCourse, price: 0 }
    render(<CourseCard course={freeCourse} />)
    
    expect(screen.getByText('LKR 0')).toBeInTheDocument()
  })

  it('applies correct CSS classes for styling', () => {
    render(<CourseCard course={mockCourse} />)
    
    const cardContainer = screen.getByRole('link')
    expect(cardContainer).toHaveClass('block', 'group')
    
    const title = screen.getByText('Advanced Mathematics')
    expect(title).toHaveClass('group-hover:text-primary-400')
  })

  it('truncates long descriptions with line-clamp', () => {
    const longDescription = 'This is a very long description that should be truncated with line-clamp-2 class to ensure it does not take up too much space in the card layout and maintains a consistent design'
    const courseWithLongDesc = { ...mockCourse, description: longDescription }
    
    render(<CourseCard course={courseWithLongDesc} />)
    
    const description = screen.getByText(longDescription)
    expect(description).toHaveClass('line-clamp-2')
  })
})