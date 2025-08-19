import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  FiCheck, FiX, FiEye, FiDownload, FiFilter,
  FiSearch, FiDollarSign, FiClock, FiCheckCircle,
  FiAlertCircle, FiXCircle, FiMoreVertical
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { supabase, isAdmin } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function AdminPayments({ user }) {
  const router = useRouter()
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  
  useEffect(() => {
    checkAdminAccess()
  }, [user])
  
  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, statusFilter, methodFilter])
  
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
    
    fetchPayments()
  }
  
  const fetchPayments = async () => {
    try {
      // First try with joins
      let { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          profiles (
            name,
            email
          ),
          courses (
            title,
            price
          )
        `)
        .order('created_at', { ascending: false })

      // If join fails, try without joins
      if (error) {
        console.warn('Join query failed, trying simple query:', error)
        const { data: simpleData, error: simpleError } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (simpleError) throw simpleError
        data = simpleData
      }

      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }
  
  const filterPayments = () => {
    let filtered = payments
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }
    
    // Method filter  
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.payment_method === methodFilter)
    }
    
    setFilteredPayments(filtered)
  }
  
  const handleApprovePayment = async (paymentId) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'approved'
        })
        .eq('id', paymentId)

      if (error) throw error

      toast.success('Payment approved successfully')
      fetchPayments()
    } catch (error) {
      console.error('Error approving payment:', error)
      toast.error('Failed to approve payment')
    }
  }
  
  const handleRejectPayment = async (paymentId) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'rejected'
        })
        .eq('id', paymentId)

      if (error) throw error

      toast.success('Payment rejected')
      fetchPayments()
    } catch (error) {
      console.error('Error rejecting payment:', error)
      toast.error('Failed to reject payment')
    }
  }
  
  const formatCurrency = (amount) => {
    return `LKR ${(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FiCheckCircle className="w-5 h-5 text-green-400" />
      case 'pending':
        return <FiClock className="w-5 h-5 text-yellow-400" />
      case 'rejected':
        return <FiXCircle className="w-5 h-5 text-red-400" />
      case 'failed':
        return <FiAlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <FiClock className="w-5 h-5 text-gray-400" />
    }
  }
  
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      failed: 'badge-danger'
    }
    return badges[status] || 'badge-primary'
  }

  if (!user) return null

  return (
    <AdminLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Payment Management
            </h1>
            <p className="text-gray-400">
              Review and manage student payments
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Search
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Method
              </label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Methods</option>
                <option value="payhere">PayHere</option>
                <option value="stripe">Stripe</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setMethodFilter('all')
                }}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No payments found</h3>
              <p className="text-gray-400">No payments match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <div>
                          <div className="font-medium text-white">
                            {payment.profiles?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.profiles?.email}
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-300">
                        {payment.courses?.title || 'N/A'}
                      </td>
                      <td className="font-mono text-green-400">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td>
                        <span className="text-gray-300 capitalize">
                          {payment.payment_method?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="text-gray-400 text-sm">
                        {formatDate(payment.created_at)}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprovePayment(payment.id)}
                                className="text-green-400 hover:text-green-300"
                                title="Approve"
                              >
                                <FiCheck className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleRejectPayment(payment.id)}
                                className="text-red-400 hover:text-red-300"
                                title="Reject"
                              >
                                <FiX className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          
                          {payment.status === 'approved' && (
                            <a
                              href={`/api/invoice/generate?paymentId=${payment.id}`}
                              className="text-blue-400 hover:text-blue-300"
                              title="Download Invoice"
                            >
                              <FiDownload className="w-5 h-5" />
                            </a>
                          )}
                          
                          <button
                            onClick={() => {
                              setSelectedPayment(payment)
                              setDetailsModalOpen(true)
                            }}
                            className="text-gray-400 hover:text-white"
                            title="View Details"
                          >
                            <FiEye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Details Modal */}
        {selectedPayment && detailsModalOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setDetailsModalOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-dark-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between p-6 border-b border-dark-600">
                  <h2 className="text-xl font-bold text-white">Payment Details</h2>
                  <button
                    onClick={() => setDetailsModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Payment Info</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-400">Order ID:</span>
                          <span className="text-white ml-2 font-mono">{selectedPayment.order_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-white ml-2">{formatCurrency(selectedPayment.amount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Method:</span>
                          <span className="text-white ml-2 capitalize">{selectedPayment.payment_method?.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <span className={`ml-2 badge ${getStatusBadge(selectedPayment.status)}`}>
                            {selectedPayment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Student Info</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-400">Name:</span>
                          <span className="text-white ml-2">{selectedPayment.profiles?.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Email:</span>
                          <span className="text-white ml-2">{selectedPayment.profiles?.email}</span>
                        </div>
                        {/* <div>
                          <span className="text-gray-400">Phone:</span>
                          <span className="text-white ml-2">{selectedPayment.profiles?.phone || 'N/A'}</span>
                        </div> */}
                        <div>
                          <span className="text-gray-400">Course:</span>
                          <span className="text-white ml-2">{selectedPayment.courses?.title}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-dark-600">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-400">
                        Created: {formatDate(selectedPayment.created_at)}
                        {selectedPayment.updated_at !== selectedPayment.created_at && (
                          <div>Updated: {formatDate(selectedPayment.updated_at)}</div>
                        )}
                      </div>
                      
                      {selectedPayment.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              handleRejectPayment(selectedPayment.id)
                              setDetailsModalOpen(false)
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              handleApprovePayment(selectedPayment.id)
                              setDetailsModalOpen(false)
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}