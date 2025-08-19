import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check and create buckets if they don't exist
    const buckets = [
      {
        name: 'course-videos',
        public: true,
        fileSizeLimit: 500 * 1024 * 1024, // 500MB
        allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/x-msvideo']
      },
      {
        name: 'course-thumbnails',
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      }
    ]

    const results = []

    for (const bucket of buckets) {
      try {
        // Try to get bucket
        const { data: existingBucket, error: getError } = await supabase.storage
          .getBucket(bucket.name)

        if (getError && getError.statusCode === 404) {
          // Bucket doesn't exist, create it
          const { data: newBucket, error: createError } = await supabase.storage
            .createBucket(bucket.name, {
              public: bucket.public,
              fileSizeLimit: bucket.fileSizeLimit,
              allowedMimeTypes: bucket.allowedMimeTypes
            })

          if (createError) {
            console.error(`Error creating ${bucket.name} bucket:`, createError)
            results.push({
              bucket: bucket.name,
              status: 'error',
              error: createError.message
            })
          } else {
            console.log(`Created ${bucket.name} bucket successfully`)
            results.push({
              bucket: bucket.name,
              status: 'created',
              data: newBucket
            })
          }
        } else if (getError) {
          console.error(`Error checking ${bucket.name} bucket:`, getError)
          results.push({
            bucket: bucket.name,
            status: 'error',
            error: getError.message
          })
        } else {
          console.log(`${bucket.name} bucket already exists`)
          results.push({
            bucket: bucket.name,
            status: 'exists',
            data: existingBucket
          })
        }
      } catch (error) {
        console.error(`Unexpected error with ${bucket.name} bucket:`, error)
        results.push({
          bucket: bucket.name,
          status: 'error',
          error: error.message
        })
      }
    }

    res.status(200).json({
      success: true,
      message: 'Storage setup completed',
      results
    })

  } catch (error) {
    console.error('Storage setup error:', error)
    res.status(500).json({
      error: 'Failed to setup storage',
      details: error.message
    })
  }
}