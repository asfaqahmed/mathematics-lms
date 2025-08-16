import { supabase } from '../../../lib/supabase'
import { validateEmail, validatePassword } from '../../../utils/validators'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { email, password, rememberMe } = req.body
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      // Check for specific error types
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }
      if (error.message.includes('Email not confirmed')) {
        return res.status(401).json({ error: 'Please verify your email before logging in' })
      }
      throw error
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    // Set session cookie
    res.setHeader('Set-Cookie', [
      `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${rememberMe ? 2592000 : 86400}`,
      `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${rememberMe ? 2592000 : 86400}`
    ])
    
    // Log login activity
    await supabase
      .from('login_logs')
      .insert({
        user_id: data.user.id,
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent'],
        success: true
      })
    
    res.status(200).json({
      success: true,
      user: {
        ...data.user,
        ...profile
      },
      session: data.session
    })
    
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      error: 'An error occurred during login. Please try again.' 
    })
  }
}