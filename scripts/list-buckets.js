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

async function listBuckets() {
  try {
    console.log('Listing all storage buckets...')
    
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {
      throw error
    }
    
    console.log('✅ Available buckets:')
    data.forEach((bucket, index) => {
      console.log(`${index + 1}. ${bucket.name} (public: ${bucket.public})`)
    })
    
  } catch (error) {
    console.error('❌ Error listing buckets:', error.message)
  }
}

listBuckets()