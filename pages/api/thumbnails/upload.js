import { supabase } from '../../../lib/supabase-admin'
import { isAdmin } from '../../../lib/supabase'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { user_id, image_data, filename } = req.body

    // Verify admin access
    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const adminStatus = await isAdmin(user_id)
    if (!adminStatus) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    if (!image_data || !filename) {
      return res.status(400).json({ error: 'Image data and filename are required' })
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(image_data, 'base64')
    
    // Generate unique filename
    const fileExt = filename.split('.').pop().toLowerCase()
    const uniqueFilename = `course-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `courses/${uniqueFilename}`

    // Map file extensions to proper MIME types
    const mimeTypeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    }
    
    const contentType = mimeTypeMap[fileExt] || 'image/jpeg'

    console.log(`Uploading to course-thumbnails bucket: ${filePath} (${contentType})`)

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('course-thumbnails')
      .upload(filePath, buffer, {
        contentType: contentType,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return res.status(500).json({ error: 'Failed to upload thumbnail', details: error.message })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-thumbnails')
      .getPublicUrl(filePath)

    res.status(200).json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      path: filePath
    })

  } catch (error) {
    console.error('Thumbnail upload error:', error)
    res.status(500).json({ error: 'Failed to upload thumbnail', details: error.message })
  }
}