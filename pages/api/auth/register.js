import { supabase } from '../../../lib/supabase'
import { sendEmail } from '../../../lib/email'
import { isValidEmail, isValidName, validatePassword } from '../../../utils/validators'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { name, email, phone, password } = req.body
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      })
    }
    
    if (!isValidName(name)) {
      return res.status(400).json({ 
        error: 'Name must be between 2 and 50 characters' 
      })
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      })
    }
    
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: passwordValidation.errors.join('. ') 
      })
    }
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'An account with this email already exists' 
      })
    }
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`
      }
    })
    
    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(400).json({ 
          error: 'An account with this email already exists' 
        })
      }
      throw error
    }
    
    // Create profile record
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          name,
          phone,
          role: 'student',
          created_at: new Date().toISOString()
        })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
    }
    
    // Send welcome email
    try {
      await sendEmail(email, 'welcome', {
        name,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${data.user?.confirmation_token}`
      })
    } catch (emailError) {
      console.error('Welcome email error:', emailError)
      // Don't fail registration if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name
      }
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      error: 'An error occurred during registration. Please try again.' 
    })
  }
}