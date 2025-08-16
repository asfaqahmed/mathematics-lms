import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    // Get the access token from cookies
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {})
    
    const accessToken = cookies?.['sb-access-token']
    
    if (accessToken) {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase signout error:', error)
      }
    }
    
    // Clear session cookies
    res.setHeader('Set-Cookie', [
      'sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      'sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      'sb-auth-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    ])
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
    
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, clear cookies and return success
    res.setHeader('Set-Cookie', [
      'sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      'sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      'sb-auth-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    ])
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
  }
}