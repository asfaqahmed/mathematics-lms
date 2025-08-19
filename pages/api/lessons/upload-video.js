import { supabase } from '../../../lib/supabase-admin'
import { isAdmin } from '../../../lib/supabase'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { user_id, video_data, filename } = req.body

    // Verify admin access
    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const adminStatus = await isAdmin(user_id)
    if (!adminStatus) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    if (!video_data || !filename) {
      return res.status(400).json({ error: 'Video data and filename are required' })
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(video_data, 'base64')
    
    // Generate unique filename
    const fileExt = filename.split('.').pop()
    const uniqueFilename = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `lessons/videos/${uniqueFilename}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, buffer, {
        contentType: `video/${fileExt}`,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return res.status(500).json({ error: 'Failed to upload video', details: error.message })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)

    res.status(200).json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      path: filePath
    })

  } catch (error) {
    console.error('Video upload error:', error)
    res.status(500).json({ error: 'Failed to upload video', details: error.message })
  }
}