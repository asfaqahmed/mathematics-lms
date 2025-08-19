import { supabase } from '../../../../lib/supabase-admin'

export default async function handler(req, res) {
  const { id: courseId } = req.query

  if (req.method === 'GET') {
    try {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true })

      if (error) throw error

      res.status(200).json({ lessons: lessons || [] })
    } catch (error) {
      console.error('Error fetching lessons:', error)
      res.status(500).json({ error: 'Failed to fetch lessons' })
    }
  } else if (req.method === 'POST') {
    // Bulk operations for lessons
    try {
      const { 
        action,
        lessons: lessonsData,
        deletedLessons
      } = req.body

      console.log('=== LESSONS API BULK OPERATION ===')
      console.log('Course ID:', courseId)
      console.log('Action:', action)
      console.log('Lessons data:', lessonsData)
      console.log('Deleted lessons:', deletedLessons)

      if (action === 'bulk_update') {
        // Delete removed lessons first
        if (deletedLessons && deletedLessons.length > 0) {
          console.log('Deleting lessons:', deletedLessons)
          const { error: deleteError } = await supabase
            .from('lessons')
            .delete()
            .in('id', deletedLessons)
          
          if (deleteError) {
            console.error('Delete lessons error:', deleteError)
            throw deleteError
          }
          console.log('✅ Deleted lessons successfully')
        }

        // Update/insert lessons
        const results = []
        for (let i = 0; i < lessonsData.length; i++) {
          const lesson = lessonsData[i]
          console.log(`Processing lesson ${i + 1}:`, lesson)
          
          if (lesson.id && !deletedLessons?.includes(lesson.id)) {
            // Update existing lesson
            console.log(`Updating existing lesson ${lesson.id}`)
            const { data: updateData, error } = await supabase
              .from('lessons')
              .update({
                title: lesson.title,
                description: lesson.description,
                type: lesson.type,
                content: lesson.content,
                duration: parseInt(lesson.duration) || 0,
                order: i + 1,
                is_preview: lesson.is_preview
              })
              .eq('id', lesson.id)
              .select()
            
            console.log(`Lesson ${lesson.id} update result:`, { data: updateData, error })
            
            if (error) {
              console.error(`Error updating lesson ${lesson.id}:`, error)
              throw error
            }
            results.push(updateData)
          } else {
            // Insert new lesson
            console.log('Inserting new lesson')
            const { data: insertData, error } = await supabase
              .from('lessons')
              .insert({
                course_id: courseId,
                title: lesson.title,
                description: lesson.description,
                type: lesson.type,
                content: lesson.content,
                duration: parseInt(lesson.duration) || 0,
                order: i + 1,
                is_preview: lesson.is_preview
              })
              .select()
            
            console.log('New lesson insert result:', { data: insertData, error })
            
            if (error) {
              console.error('Error inserting new lesson:', error)
              throw error
            }
            results.push(insertData)
          }
        }

        console.log('✅ All lessons processed successfully')
        console.log('=== LESSONS API OPERATION COMPLETED ===')
        
        res.status(200).json({ 
          message: 'Lessons updated successfully',
          lessons: results.flat()
        })
      } else {
        res.status(400).json({ error: 'Invalid action' })
      }
    } catch (error) {
      console.error('=== LESSONS API OPERATION FAILED ===')
      console.error('Error details:', error)
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      
      res.status(500).json({ 
        error: 'Failed to update lessons',
        details: error.message,
        code: error.code 
      })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}