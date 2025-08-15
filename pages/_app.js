import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Toaster } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    // Check for user session
    checkUser()
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        checkUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/')
      }
    })
    
    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])
  
  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setUser({ ...user, ...profile })
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <div className="h-20 w-20 rounded-full bg-primary-500 opacity-20"></div>
          </div>
          <div className="relative h-20 w-20 rounded-full bg-primary-500 flex items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <>
      <Component {...pageProps} user={user} setUser={setUser} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '10px',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            padding: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}

export default MyApp