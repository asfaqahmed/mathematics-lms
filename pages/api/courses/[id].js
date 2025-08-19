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
    console.log('=== API COURSE UPDATE START ===')
    console.log('Course ID:', id)
    console.log('Request body:', req.body)
    
    try {
      const {
        title,
        description,
        price,
        category,
        level,
        thumbnail,
        intro_video,
        preview_video, // Support both field names for compatibility
        what_you_learn,
        requirements,
        status,
        featured,
        published
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
      // Handle both intro_video and preview_video field names
      if (intro_video !== undefined) updateData.intro_video = intro_video
      if (preview_video !== undefined) updateData.intro_video = preview_video
      if (what_you_learn !== undefined) updateData.what_you_learn = Array.isArray(what_you_learn) ? what_you_learn : []
      if (requirements !== undefined) updateData.requirements = Array.isArray(requirements) ? requirements : []
      if (status !== undefined) updateData.status = status
      if (featured !== undefined) updateData.featured = featured
      if (published !== undefined) updateData.published = published

      console.log('Update data to be sent to database:', updateData)

      const { data: course, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      console.log('Database update result:', { data: course, error })

      if (error) {
        console.error('Database update error:', error)
        throw error
      }

      if (!course) {
        console.error('Course not found after update - Course ID:', id)
        return res.status(404).json({ error: 'Course not found' })
      }

      console.log('✅ API course update successful')
      console.log('Updated course:', course)
      console.log('=== API COURSE UPDATE COMPLETED ===')

      res.status(200).json({ course })
    } catch (error) {
      console.error('=== API COURSE UPDATE FAILED ===')
      console.error('Error details:', error)
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      
      res.status(500).json({ 
        error: 'Failed to update course',
        details: error.message,
        code: error.code 
      })
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