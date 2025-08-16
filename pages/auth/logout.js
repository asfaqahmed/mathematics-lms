import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await supabase.auth.signOut()
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } catch (error) {
        console.error('Logout error:', error)
        router.push('/')
      }
    }

    performLogout()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <FiCheck className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Logged Out Successfully
        </h1>
        <p className="text-gray-400">
          Redirecting you to the homepage...
        </p>
      </motion.div>
    </div>
  )
}