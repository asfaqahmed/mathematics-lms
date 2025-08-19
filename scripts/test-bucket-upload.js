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

async function testBucketUpload() {
  try {
    console.log('Testing bucket access...')
    
    // First, let's try to get the bucket
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket('course-thumbnails')
    
    if (bucketError) {
      console.error('❌ Error getting bucket:', bucketError)
      return
    }
    
    console.log('✅ Bucket found:', bucketData)
    
    // Try to create a simple test file with image content
    // Create a minimal PNG data (1x1 pixel transparent PNG)
    const testContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==', 'base64')
    const testPath = `test/test-${Date.now()}.png`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-thumbnails')
      .upload(testPath, testContent, {
        contentType: 'image/png'
      })
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return
    }
    
    console.log('✅ Test upload successful:', uploadData)
    
    // Clean up - delete the test file
    await supabase.storage
      .from('course-thumbnails')
      .remove([testPath])
    
    console.log('✅ Test file cleaned up')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testBucketUpload()