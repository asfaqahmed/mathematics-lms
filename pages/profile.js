import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { 
  FiUser, FiMail, FiPhone, FiLock, FiSave, 
  FiCamera, FiEdit2, FiCheck, FiX 
} from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import toast from 'react-hot-toast'

export default function Profile({ user, setUser }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar_url: user.avatar_url || ''
    })
  }, [user])
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      // Update local user state
      setUser({
        ...user,
        name: formData.name,
        phone: formData.phone,
        avatar_url: formData.avatar_url
      })
      
      toast.success('Profile updated successfully')
      setEditMode(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }
  
  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      
      if (error) throw error
      
      toast.success('Password changed successfully')
      setChangingPassword(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password')
    } finally {
      setLoading(false)
    }
  }
  
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      setLoading(true)
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      setFormData({ ...formData, avatar_url: publicUrl })
      toast.success('Avatar uploaded successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setLoading(false)
    }
  }
  
  if (!user) return null
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-display font-bold text-white mb-8">
              My Profile
            </h1>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="card text-center">
                  {/* Avatar */}
                  <div className="relative inline-block mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-primary-500 to-purple-500 p-1">
                      <div className="w-full h-full rounded-full bg-dark-800 flex items-center justify-center">
                        {formData.avatar_url ? (
                          <img 
                            src={formData.avatar_url} 
                            alt={formData.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-4xl font-bold text-white">
                            {formData.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {editMode && (
                      <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
                        <FiCamera className="w-5 h-5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-semibold text-white mb-1">
                    {formData.name || 'Student'}
                  </h2>
                  <p className="text-gray-400 mb-4">{formData.email}</p>
                  
                  <div className="pt-4 border-t border-dark-700">
                    <div className="text-sm text-gray-400 mb-1">Account Type</div>
                    <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}`}>
                      {user.role || 'student'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Profile Form */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      Account Information
                    </h3>
                    
                    {!editMode ? (
                      <button
                        onClick={() => setEditMode(true)}
                        className="btn-ghost flex items-center space-x-2"
                      >
                        <FiEdit2 />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditMode(false)
                            setFormData({
                              name: user.name || '',
                              email: user.email || '',
                              phone: user.phone || '',
                              avatar_url: user.avatar_url || ''
                            })
                          }}
                          className="btn-ghost"
                        >
                          <FiX />
                        </button>
                        <button
                          onClick={handleUpdateProfile}
                          disabled={loading}
                          className="btn-primary flex items-center space-x-2"
                        >
                          {loading ? (
                            <div className="spinner w-4 h-4 border-2"></div>
                          ) : (
                            <>
                              <FiSave />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!editMode}
                          className="input pl-10"
                        />
                      </div>
                    </div>
                    
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <input
                          type="email"
                          value={formData.email}
                          disabled
                          className="input pl-10 opacity-50 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                    
                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={!editMode}
                          className="input pl-10"
                          placeholder="+94 75 660 5254"
                        />
                      </div>
                    </div>
                  </form>
                </div>
                
                {/* Change Password */}
                <div className="card mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      Security
                    </h3>
                    
                    {!changingPassword && (
                      <button
                        onClick={() => setChangingPassword(true)}
                        className="btn-ghost flex items-center space-x-2"
                      >
                        <FiLock />
                        <span>Change Password</span>
                      </button>
                    )}
                  </div>
                  
                  {changingPassword ? (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="input"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="input"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn-primary"
                        >
                          {loading ? 'Updating...' : 'Update Password'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setChangingPassword(false)
                            setPasswordData({
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: ''
                            })
                          }}
                          className="btn-ghost"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-gray-400">
                      Keep your account secure by using a strong password
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}