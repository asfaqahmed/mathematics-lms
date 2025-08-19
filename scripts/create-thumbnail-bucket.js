const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local manually
const fs = require('fs')
const path = require('path')

try {
  const envPath = path.join(__dirname, '..', '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
} catch (error) {
  console.log('Could not load .env.local, using existing environment variables')
}

// Create admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createThumbnailBucket() {
  try {
    console.log('Creating course-thumbnails bucket...')
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('course-thumbnails', {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    })
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists!')
        return
      }
      throw error
    }
    
    console.log('✅ Successfully created course-thumbnails bucket:', data)
    
  } catch (error) {
    console.error('❌ Error creating bucket:', error.message)
  }
}

createThumbnailBucket()