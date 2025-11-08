/**
 * Course Seeding Script
 * Run this script to populate the database with sample courses.
 */

import { supabase } from '../../lib/supabase-admin'

const sampleCourses = [
  {
    title: 'Advanced Calculus Fundamentals',
    description: 'Master the fundamentals of calculus with comprehensive lessons covering limits, derivatives, and integrals. Perfect for university-level mathematics.',
    price: 750000, // LKR 7,500 in cents
    category: 'Calculus',
    thumbnail: '/api/placeholder/400/300',
    intro_video: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    title: 'Linear Algebra for Engineers',
    description: 'Comprehensive linear algebra course designed for engineering students. Covers matrices, vector spaces, and eigenvalues.',
    price: 650000, // LKR 6,500 in cents
    category: 'Algebra',
    thumbnail: '/api/placeholder/400/300',
    intro_video: 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    title: 'Statistics and Probability',
    description: 'Learn statistical analysis and probability theory with real-world applications. Includes hypothesis testing and regression analysis.',
    price: 550000, // LKR 5,500 in cents
    category: 'Statistics',
    thumbnail: '/api/placeholder/400/300',
    intro_video: 'https://www.youtube.com/watch?v=uhxtUt_-GyM',
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    title: 'Geometry and Trigonometry',
    description: 'Comprehensive geometry and trigonometry course covering shapes, angles, and trigonometric functions.',
    price: 450000, // LKR 4,500 in cents
    category: 'Geometry',
    thumbnail: '/api/placeholder/400/300',
    intro_video: 'https://www.youtube.com/watch?v=mhd9FXYdf4s',
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    title: 'Discrete Mathematics',
    description: 'Essential discrete mathematics for computer science students. Covers logic, sets, functions, and graph theory.',
    price: 600000, // LKR 6,000 in cents
    category: 'Algebra',
    thumbnail: '/api/placeholder/400/300',
    intro_video: 'https://www.youtube.com/watch?v=rdXw7Ps9vxc',
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

async function seedCourses() {
  try {
    // Check if courses already exist
    const { data: existingCourses, error: checkError } = await supabase
      .from('courses')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('Error checking existing courses:', checkError)
      throw new Error('Failed to check existing courses')
    }

    if (existingCourses && existingCourses.length > 0) {
      console.log('Courses already exist in database')
      return existingCourses
    }

    // Insert sample courses
    const { data, error } = await supabase
      .from('courses')
      .insert(sampleCourses)
      .select()

    if (error) {
      console.error('Error inserting courses:', error)
      throw new Error('Failed to insert courses')
    }

    console.log(`Created ${data.length} sample courses successfully`)
    return data

  } catch (error) {
    console.error('Seed courses error:', error)
    throw error
  }
}

// Allow running directly or importing
if (require.main === module) {
  seedCourses()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

export { seedCourses, sampleCourses }