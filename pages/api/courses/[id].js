import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const { data: course, error } = await supabase
        .from('courses')
        .select(`
          *,
          lessons!lessons_course_id_fkey (
            id,
            title,
            description,
            duration,
            video_url,
            order_index,
            is_free
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (!course) {
        return res.status(404).json({ error: 'Course not found' })
      }

      // Sort lessons by order_index
      if (course.lessons) {
        course.lessons.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      }

      res.status(200).json({ course })
    } catch (error) {
      console.error('Error fetching course:', error)
      res.status(500).json({ error: 'Failed to fetch course' })
    }
  } else if (req.method === 'PUT') {
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
        status
      } = req.body

      const updateData = {
        updated_at: new Date().toISOString()
      }

      // Only update provided fields
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (price !== undefined) updateData.price = parseInt(price)
      if (category !== undefined) updateData.category = category
      if (level !== undefined) updateData.level = level
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail
      if (preview_video !== undefined) updateData.preview_video = preview_video
      if (what_you_learn !== undefined) updateData.what_you_learn = Array.isArray(what_you_learn) ? what_you_learn : []
      if (requirements !== undefined) updateData.requirements = Array.isArray(requirements) ? requirements : []
      if (status !== undefined) updateData.status = status

      const { data: course, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (!course) {
        return res.status(404).json({ error: 'Course not found' })
      }

      res.status(200).json({ course })
    } catch (error) {
      console.error('Error updating course:', error)
      res.status(500).json({ error: 'Failed to update course' })
    }
  } else if (req.method === 'DELETE') {
    try {
      // First check if course exists
      const { data: existingCourse, error: fetchError } = await supabase
        .from('courses')
        .select('id')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (!existingCourse) {
        return res.status(404).json({ error: 'Course not found' })
      }

      // Delete associated lessons first
      const { error: lessonsError } = await supabase
        .from('lessons')
        .delete()
        .eq('course_id', id)

      if (lessonsError) throw lessonsError

      // Delete the course
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (courseError) throw courseError

      res.status(200).json({ message: 'Course deleted successfully' })
    } catch (error) {
      console.error('Error deleting course:', error)
      res.status(500).json({ error: 'Failed to delete course' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}