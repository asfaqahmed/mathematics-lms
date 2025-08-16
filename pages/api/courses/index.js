import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          *,
          lessons (id, title, duration)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Add lesson count and total duration
      const coursesWithStats = courses.map(course => ({
        ...course,
        lesson_count: course.lessons?.length || 0,
        total_duration: course.lessons?.reduce((acc, lesson) => acc + (lesson.duration || 0), 0) || 0
      }))

      res.status(200).json({ courses: coursesWithStats })
    } catch (error) {
      console.error('Error fetching courses:', error)
      res.status(500).json({ error: 'Failed to fetch courses' })
    }
  } else if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        price,
        category,
        level,
        thumbnail,
        preview_video,
        what_you_learn,
        requirements,
        status = 'draft'
      } = req.body

      // Validate required fields
      if (!title || !description || !price || !category || !level) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const { data: course, error } = await supabase
        .from('courses')
        .insert({
          title,
          description,
          price: parseInt(price),
          category,
          level,
          thumbnail,
          preview_video,
          what_you_learn: Array.isArray(what_you_learn) ? what_you_learn : [],
          requirements: Array.isArray(requirements) ? requirements : [],
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      res.status(201).json({ course })
    } catch (error) {
      console.error('Error creating course:', error)
      res.status(500).json({ error: 'Failed to create course' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}