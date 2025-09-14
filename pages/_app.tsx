import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Toaster } from 'react-hot-toast'
import type { AppProps } from 'next/app'
import { supabase } from '../lib/supabase'
import { User } from '@/utils/types'
import '../styles/globals.css'

// Extended App Props to include user-related props
interface MyAppProps extends AppProps {
  pageProps: AppProps['pageProps'] & {
    user?: User | null
    setUser?: (user: User | null) => void
  }
}

/**
 * Main App component that wraps all pages
 * Handles authentication state management and provides global UI components
 */
function MyApp({ Component, pageProps }: MyAppProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()

  useEffect(() => {
    // Check for user session on app initialization
    checkUser()

    // Listen for authentication state changes
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

  /**
   * Checks current user session and updates user state
   */
  const checkUser = async (): Promise<void> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        // Get user profile data
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
          setUser(null)
          return
        }

        // Merge auth user with profile data
        const fullUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: profile?.name || authUser.user_metadata?.name || '',
          role: profile?.role || 'student',
          created_at: profile?.created_at || authUser.created_at,
          avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url
        }

        setUser(fullUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error checking user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Loading state with improved accessibility
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex items-center justify-center">
        <div className="relative" role="status" aria-label="Loading application">
          <div className="absolute inset-0 animate-ping">
            <div className="h-20 w-20 rounded-full bg-primary-500 opacity-20"></div>
          </div>
          <div className="relative h-20 w-20 rounded-full bg-primary-500 flex items-center justify-center">
            <svg
              className="animate-spin h-10 w-10 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <span className="sr-only">Loading...</span>
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