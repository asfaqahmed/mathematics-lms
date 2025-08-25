import { supabase } from '../../../lib/supabase-admin'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

/**
 * API endpoint for uploading assignment files
 * 
 * POST /api/assignments/upload
 * Body: {
 *   user_id: string,
 *   course_id: string,
 *   lesson_id: string,
 *   assignment_title: string,
 *   file_data: string (base64),
 *   filename: string,
 *   file_type: string
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      user_id,
      course_id,
      lesson_id,
      assignment_title,
      file_data,
      filename,
      file_type,
      description = ''
    } = req.body

    // Validate required fields
    if (!user_id || !course_id || !lesson_id || !assignment_title || !file_data || !filename) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      })
    }

    // Check if user has access to this course
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .eq('access_granted', true)
      .single()

    if (purchaseError || !purchase) {
      return res.status(403).json({ error: 'Access denied to this course' })
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(file_data, 'base64')
    
    // Generate unique filename
    const fileExt = filename.split('.').pop()
    const uniqueFilename = `assignment-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `assignments/${course_id}/${lesson_id}/${uniqueFilename}`

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(filePath, buffer, {
        contentType: file_type || 'application/octet-stream',
        upsert: false
      })

    if (uploadError) {
      // If bucket doesn't exist, try to create it
      if (uploadError.statusCode === 404) {
        console.log('Creating assignments bucket...')
        await fetch('/api/storage/setup', { method: 'POST' })
        
        // Retry upload
        const retryResult = await supabase.storage
          .from('assignments')
          .upload(filePath, buffer, {
            contentType: file_type || 'application/octet-stream',
            upsert: false
          })
          
        if (retryResult.error) {
          throw retryResult.error
        }
      } else {
        throw uploadError
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assignments')
      .getPublicUrl(filePath)

    // Save assignment record to database
    const { data: assignment, error: dbError } = await supabase
      .from('assignments')
      .insert({
        user_id,
        course_id,
        lesson_id,
        title: assignment_title,
        description,
        file_url: publicUrl,
        file_path: filePath,
        original_filename: filename,
        file_type: file_type || 'application/octet-stream',
        file_size: buffer.length,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving assignment to database:', dbError)
      // Try to clean up uploaded file
      await supabase.storage.from('assignments').remove([filePath])
      return res.status(500).json({ error: 'Failed to save assignment' })
    }

    res.status(200).json({
      success: true,
      assignment: assignment,
      message: 'Assignment uploaded successfully'
    })

  } catch (error) {
    console.error('Assignment upload error:', error)
    res.status(500).json({ 
      error: 'Failed to upload assignment',
      details: error.message 
    })
  }
}