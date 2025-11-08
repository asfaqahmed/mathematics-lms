/**
 * Lesson Seeding Script
 * Run this script to populate the database with sample lessons.
 * Requires courses to be seeded first.
 */

import { supabase } from '../../lib/supabase-admin'

const sampleLessonsPerCourse = [
  {
    title: 'Introduction and Course Overview',
    description: 'Get started with the fundamentals and learn what we\'ll cover in this course.',
    video_url: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
    duration: 900, // 15 minutes in seconds
    order: 1,
    is_free: true
  },
  {
    title: 'Core Concepts and Theory',
    description: 'Deep dive into the core mathematical concepts and underlying theory.',
    video_url: 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
    duration: 1800, // 30 minutes
    order: 2,
    is_free: false
  },
  {
    title: 'Problem Solving Techniques',
    description: 'Learn proven techniques for solving complex mathematical problems.',
    video_url: 'https://www.youtube.com/watch?v=uhxtUt_-GyM',
    duration: 1200, // 20 minutes
    order: 3,
    is_free: false
  },
  {
    title: 'Practice Problems and Examples',
    description: 'Work through practical examples and reinforce your understanding.',
    video_url: 'https://www.youtube.com/watch?v=mhd9FXYdf4s',
    duration: 1500, // 25 minutes
    order: 4,
    is_free: false
  }
]

async function seedLessons() {
  try {
    // First get some course IDs to attach lessons to
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .limit(3)

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      throw new Error('Failed to fetch courses')
    }

    if (!courses || courses.length === 0) {
      throw new Error('No courses found. Please create courses first.')
    }

    // Check if lessons already exist
    const { data: existingLessons, error: checkError } = await supabase
      .from('lessons')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('Error checking existing lessons:', checkError)
      throw new Error('Failed to check existing lessons')
    }

    if (existingLessons && existingLessons.length > 0) {
      console.log('Lessons already exist in database')
      return existingLessons
    }

    const allLessons = []

    // Create lessons for each course
    courses.forEach(course => {
      sampleLessonsPerCourse.forEach(lessonTemplate => {
        allLessons.push({
          ...lessonTemplate,
          course_id: course.id,
          title: `${lessonTemplate.title} - ${course.title}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      })
    })

    // Insert lessons
    const { data, error } = await supabase
      .from('lessons')
      .insert(allLessons)
      .select()

    if (error) {
      console.error('Error inserting lessons:', error)
      throw new Error('Failed to insert lessons')
    }

    console.log(`Created ${data.length} sample lessons for ${courses.length} courses`)
    return data

  } catch (error) {
    console.error('Seed lessons error:', error)
    throw error
  }
}

// Allow running directly or importing
if (require.main === module) {
  seedLessons()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

export { seedLessons, sampleLessonsPerCourse }