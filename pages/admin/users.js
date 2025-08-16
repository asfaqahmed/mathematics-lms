import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  FiUsers, FiSearch, FiMail, FiPhone, FiCalendar,
  FiEdit, FiTrash2, FiMoreVertical, FiUserCheck,
  FiUserX, FiShield, FiUser, FiDownload
} from 'react-icons/fi'
import { supabase, isAdmin } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function AdminUsers({ user }) {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  
  useEffect(() => {
    checkAdminAccess()
  }, [user])
  
  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])
  
  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    const adminStatus = await isAdmin(user.id)
    if (!adminStatus) {
      toast.error('Access denied. Admin only.')
      router.push('/')
      return
    }
    
    fetchUsers()
  }
  
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          purchases (
            id,
            courses (title, price)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Process users with additional data
      const processedUsers = data.map(user => ({
        ...user,
        courseCount: user.purchases?.length || 0,
        totalSpent: user.purchases?.reduce((sum, p) => sum + (p.courses?.price || 0), 0) || 0
      }))
      
      setUsers(processedUsers)
      setFilteredUsers(processedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }
  
  const filterUsers = () => {
    let filtered = [...users]
    
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      )
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }
    
    setFilteredUsers(filtered)
  }
  
  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin'
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
      
      if (error) throw error
      
      toast.success(`User role updated to ${newRole}`)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    }
  }
  
  const deleteUser = async () => {
    if (!selectedUser) return
    
    try {
      // Note: This will only work if you have proper cascade delete setup
      const { error } = await supabase.auth.admin.deleteUser(selectedUser.id)
      
      if (error) throw error
      
      toast.success('User deleted successfully')
      setDeleteModalOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }
  
  const exportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Role', 'Courses', 'Total Spent', 'Joined'],
      ...filteredUsers.map(user => [
        user.name || '',
        user.email,
        user.phone || '',
        user.role,
        user.courseCount,
        `LKR ${(user.totalSpent / 100).toLocaleString()}`,
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    toast.success('Users exported successfully')
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    admins: users.filter(u => u.role === 'admin').length,
    activeToday: users.filter(u => {
      const today = new Date().toDateString()
      return new Date(u.updated_at).toDateString() === today
    }).length
  }
  
  if (!user) return null
  
  return (
    <AdminLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              User Management
            </h1>
            <p className="text-gray-400">
              Manage platform users and permissions
            </p>
          </div>
          
          <button
            onClick={exportUsers}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiDownload />
            <span>Export CSV</span>
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <FiUsers className="w-8 h-8 text-primary-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Students</p>
                <p className="text-2xl font-bold text-blue-400">{stats.students}</p>
              </div>
              <FiUser className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Admins</p>
                <p className="text-2xl font-bold text-red-400">{stats.admins}</p>
              </div>
              <FiShield className="w-8 h-8 text-red-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Today</p>
                <p className="text-2xl font-bold text-green-400">{stats.activeToday}</p>
              </div>
              <FiUserCheck className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>
        </div>
        
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
        
        {/* Users Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
              <p className="text-gray-400">Adjust your filters to see users</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Courses</th>
                    <th>Total Spent</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userData) => (
                    <tr key={userData.id}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {userData.name?.charAt(0).toUpperCase() || userData.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {userData.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {userData.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a href={`mailto:${userData.email}`} className="text-primary-400 hover:text-primary-300">
                          {userData.email}
                        </a>
                      </td>
                      <td>{userData.phone || '-'}</td>
                      <td>
                        <span className={`badge ${userData.role === 'admin' ? 'badge-danger' : 'badge-primary'}`}>
                          {userData.role}
                        </span>
                      </td>
                      <td>{userData.courseCount}</td>
                      <td className="font-semibold">
                        LKR {(userData.totalSpent / 100).toLocaleString()}
                      </td>
                      <td className="text-sm text-gray-400">
                        {formatDate(userData.created_at)}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(userData)
                              setUserModalOpen(true)
                            }}
                            className="text-blue-400 hover:text-blue-300"
                            title="View Details"
                          >
                            <FiEdit className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => toggleUserRole(userData.id, userData.role)}
                            className="text-yellow-400 hover:text-yellow-300"
                            title="Toggle Role"
                          >
                            <FiShield className="w-5 h-5" />
                          </button>
                          
                          {userData.id !== user.id && (
                            <button
                              onClick={() => {
                                setSelectedUser(userData)
                                setDeleteModalOpen(true)
                              }}
                              className="text-red-400 hover:text-red-300"
                              title="Delete"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* User Details Modal */}
        {userModalOpen && selectedUser && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setUserModalOpen(false)}
            />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 z-50 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">User Details</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="text-white">{selectedUser.name || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white">{selectedUser.phone || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Role</p>
                      <span className={`badge ${selectedUser.role === 'admin' ? 'badge-danger' : 'badge-primary'}`}>
                        {selectedUser.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Enrolled Courses</p>
                      <p className="text-white">{selectedUser.courseCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Spent</p>
                      <p className="text-white font-semibold">
                        LKR {(selectedUser.totalSpent / 100).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Joined</p>
                      <p className="text-white">{formatDate(selectedUser.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Last Active</p>
                      <p className="text-white">{formatDate(selectedUser.updated_at)}</p>
                    </div>
                  </div>
                  
                  {selectedUser.purchases && selectedUser.purchases.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-2">Enrolled Courses</h4>
                      <div className="space-y-2">
                        {selectedUser.purchases.map((purchase) => (
                          <div key={purchase.id} className="bg-dark-700 rounded-lg p-3">
                            <p className="text-white">{purchase.courses?.title}</p>
                            <p className="text-sm text-gray-400">
                              LKR {(purchase.courses?.price / 100).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t border-dark-700">
                    <button
                      onClick={() => setUserModalOpen(false)}
                      className="btn-ghost"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedUser && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setDeleteModalOpen(false)}
            />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 z-50 max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Delete User</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete {selectedUser.name || selectedUser.email}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteUser}
                  className="btn-primary bg-red-500 hover:bg-red-600"
                >
                  Delete User
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}