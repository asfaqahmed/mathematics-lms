import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const { data: lesson, error } = await supabase
        .from('lessons')
        .select(`
          *,
          courses (
            id,
            title,
            price
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' })
      }

      res.status(200).json({ lesson })
    } catch (error) {
      console.error('Error fetching lesson:', error)
      res.status(500).json({ error: 'Failed to fetch lesson' })
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        title,
        description,
        video_url,
        duration,
        order_index,
        is_free,
        content
      } = req.body

      const updateData = {
        updated_at: new Date().toISOString()
      }

      // Only update provided fields
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (video_url !== undefined) updateData.video_url = video_url
      if (duration !== undefined) updateData.duration = parseInt(duration)
      if (order_index !== undefined) updateData.order_index = parseInt(order_index)
      if (is_free !== undefined) updateData.is_free = Boolean(is_free)
      if (content !== undefined) updateData.content = content

      const { data: lesson, error } = await supabase
        .from('lessons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' })
      }

      res.status(200).json({ lesson })
    } catch (error) {
      console.error('Error updating lesson:', error)
      res.status(500).json({ error: 'Failed to update lesson' })
    }
  } else if (req.method === 'DELETE') {
    try {
      // First check if lesson exists
      const { data: existingLesson, error: fetchError } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (!existingLesson) {
        return res.status(404).json({ error: 'Lesson not found' })
      }

      // Delete the lesson
      const { error: deleteError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      res.status(200).json({ message: 'Lesson deleted successfully' })
    } catch (error) {
      console.error('Error deleting lesson:', error)
      res.status(500).json({ error: 'Failed to delete lesson' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}