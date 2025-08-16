import { supabase } from '../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // First get some course IDs to attach lessons to
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .limit(3)

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return res.status(500).json({ error: 'Failed to fetch courses', details: coursesError })
    }

    if (!courses || courses.length === 0) {
      return res.status(400).json({ error: 'No courses found. Please create courses first.' })
    }

    // Check if lessons already exist
    const { data: existingLessons, error: checkError } = await supabase
      .from('lessons')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('Error checking existing lessons:', checkError)
      return res.status(500).json({ error: 'Failed to check existing lessons', details: checkError })
    }

    if (existingLessons && existingLessons.length > 0) {
      return res.status(200).json({ 
        message: 'Lessons already exist in database',
        count: existingLessons.length 
      })
    }

    // Sample lessons for each course
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
      return res.status(500).json({ error: 'Failed to insert lessons', details: error })
    }

    res.status(200).json({ 
      message: 'Sample lessons created successfully',
      lessons: data,
      count: data.length,
      coursesWithLessons: courses.length
    })

  } catch (error) {
    console.error('Seed lessons error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}