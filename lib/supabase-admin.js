import { createClient } from '@supabase/supabase-js'

// Admin client with service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Admin auth functions
export const createUser = async (email, password, userData = {}) => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userData
  })
  
  if (error) throw error
  return data
}

export const updateUserById = async (userId, updates) => {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    updates
  )
  
  if (error) throw error
  return data
}

export const deleteUser = async (userId) => {
  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  
  if (error) throw error
  return data
}

export const listUsers = async (page = 1, perPage = 50) => {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage
  })
  
  if (error) throw error
  return data
}

// Database functions with admin privileges
export const getPaymentStats = async () => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('amount, status, created_at')
    .eq('status', 'approved')
  
  if (error) throw error
  
  const total = data.reduce((sum, payment) => sum + payment.amount, 0)
  const count = data.length
  const avgAmount = count > 0 ? total / count : 0
  
  return { total, count, avgAmount }
}

export const getUserStats = async () => {
  const { count: totalUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  const { count: totalStudents } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
  
  const { count: totalAdmins } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')
  
  return { totalUsers, totalStudents, totalAdmins }
}

export const getCourseStats = async () => {
  const { data: courses } = await supabaseAdmin
    .from('courses')
    .select('*, purchases(id)')
  
  const totalCourses = courses?.length || 0
  const totalEnrollments = courses?.reduce((sum, course) => 
    sum + (course.purchases?.length || 0), 0) || 0
  
  return { totalCourses, totalEnrollments }
}

// Bulk operations
export const bulkUpdatePaymentStatus = async (paymentIds, status) => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({ status, approved_at: new Date().toISOString() })
    .in('id', paymentIds)
  
  if (error) throw error
  return data
}

export const bulkDeleteUsers = async (userIds) => {
  // Delete from auth
  const deletePromises = userIds.map(id => deleteUser(id))
  await Promise.all(deletePromises)
  
  // Profiles will be deleted automatically due to cascade
  return true
}

export const bulkEnrollStudents = async (userIds, courseId) => {
  const enrollments = userIds.map(userId => ({
    user_id: userId,
    course_id: courseId,
    access_granted: true,
    purchase_date: new Date().toISOString()
  }))
  
  const { data, error } = await supabaseAdmin
    .from('purchases')
    .insert(enrollments)
  
  if (error) throw error
  return data
}

// Storage operations
export const uploadFile = async (bucket, path, file, options = {}) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, options)
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return { path: data.path, publicUrl }
}

export const deleteFile = async (bucket, path) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path])
  
  if (error) throw error
  return data
}

export const listFiles = async (bucket, folder = '') => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(folder)
  
  if (error) throw error
  return data
}

// Maintenance mode
export const setMaintenanceMode = async (enabled, message = '') => {
  // This would typically update a settings table
  // For now, we'll use a simple implementation
  const { data, error } = await supabaseAdmin
    .from('settings')
    .upsert({
      key: 'maintenance_mode',
      value: { enabled, message },
      updated_at: new Date().toISOString()
    })
  
  if (error) throw error
  return data
}

export default supabaseAdmin