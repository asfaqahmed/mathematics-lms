import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helpers
export const signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'student'
      }
    }
  })
  
  if (error) throw error
  
  // Create profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          name,
          role: 'student'
        }
      ])
    
    if (profileError) throw profileError
  }
  
  return data
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) return user
  
  return { ...user, ...profile }
}

// Course helpers
export const getCourses = async (featured = false) => {
  let query = supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (featured) {
    query = query.eq('featured', true)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getCourse = async (id) => {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      lessons (*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export const getUserCourses = async (userId) => {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      courses (*)
    `)
    .eq('user_id', userId)
    .eq('access_granted', true)
  
  if (error) throw error
  return data
}

export const checkCourseAccess = async (userId, courseId) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('access_granted', true)
    .single()
  
  return !error && data
}

// Payment helpers
export const createPayment = async (paymentData) => {
  const { data, error } = await supabase
    .from('payments')
    .insert([paymentData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updatePaymentStatus = async (paymentId, status, approvedAt = null) => {
  const updateData = { status }
  if (approvedAt) updateData.approved_at = approvedAt
  
  const { data, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', paymentId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createPurchase = async (userId, courseId, paymentId) => {
  const { data, error } = await supabase
    .from('purchases')
    .insert([{
      user_id: userId,
      course_id: courseId,
      payment_id: paymentId,
      access_granted: true,
      purchase_date: new Date().toISOString()
    }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Admin helpers
export const isAdmin = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  return !error && data?.role === 'admin'
}

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getAllPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      profiles (name, email),
      courses (title)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const approveBankPayment = async (paymentId) => {
  const { data: payment, error: paymentError } = await updatePaymentStatus(
    paymentId,
    'approved',
    new Date().toISOString()
  )
  
  if (paymentError) throw paymentError
  
  // Grant course access
  const { data: purchase, error: purchaseError } = await createPurchase(
    payment.user_id,
    payment.course_id,
    payment.id
  )
  
  if (purchaseError) throw purchaseError
  
  return { payment, purchase }
}