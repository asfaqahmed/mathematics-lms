import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  FiCheck, FiX, FiEye, FiDownload, FiFilter,
  FiSearch, FiDollarSign, FiClock, FiCheckCircle,
  FiAlertCircle, FiXCircle, FiMoreVertical
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { supabase, isAdmin, approveBankPayment } from '../../lib/supabase'
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
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          profiles (id, name, email, phone),
          courses (id, title, price)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setPayments(data || [])
      setFilteredPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }
  
  const filterPayments = () => {
    let filtered = [...payments]
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }
    
    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.method === methodFilter)
    }
    
    setFilteredPayments(filtered)
  }
  
  const handleApprovePayment = async (paymentId) => {
    try {
      const result = await approveBankPayment(paymentId)
      
      if (result) {
        toast.success('Payment approved and access granted')
        
        // Send approval email
        const payment = payments.find(p => p.id === paymentId)
        if (payment) {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: payment.profiles.email,
              type: 'bankApproval',
              data: {
                name: payment.profiles.name,
                courseName: payment.courses.title
              }
            })
          })
        }
        
        fetchPayments()
      }
    } catch (error) {
      console.error('Error approving payment:', error)
      toast.error('Failed to approve payment')
    }
  }
  
  const handleRejectPayment = async (paymentId) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'rejected' })
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
    return `LKR ${(amount / 100).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-warning', icon: FiClock },
      approved: { class: 'badge-success', icon: FiCheckCircle },
      rejected: { class: 'badge-danger', icon: FiXCircle },
      failed: { class: 'badge-danger', icon: FiAlertCircle }
    }
    const badge = badges[status] || { class: 'badge-primary', icon: FiAlertCircle }
    const Icon = badge.icon
    
    return (
      <span className={`badge ${badge.class} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{status}</span>
      </span>
    )
  }
  
  const getMethodBadge = (method) => {
    const badges = {
      payhere: 'badge-primary',
      stripe: 'badge-primary',
      bank: 'badge-warning'
    }
    return badges[method] || 'badge-primary'
  }
  
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    totalRevenue: payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0)
  }
  
  if (!user) return null
  
  return (
    <AdminLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Payment Management
          </h1>
          <p className="text-gray-400">
            Review and manage all payment transactions
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Payments</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <FiDollarSign className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No payments found</h3>
              <p className="text-gray-400">Adjust your filters or wait for new payments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto">
                <thead>
                  <tr>
                    <th>Invoice</th>
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
                      <td className="font-mono text-xs">
                        {payment.invoice_number || payment.id.slice(0, 8)}
                      </td>
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
                      <td>{payment.courses?.title || 'N/A'}</td>
                      <td className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td>
                        <span className={`badge ${getMethodBadge(payment.method)}`}>
                          {payment.method}
                        </span>
                      </td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td className="text-sm text-gray-400">
                        {formatDate(payment.created_at)}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {payment.status === 'pending' && payment.method === 'bank' && (
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
                          
                          {payment.receipt_url && (
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                              title="View Receipt"
                            >
                              <FiEye className="w-5 h-5" />
                            </a>
                          )}
                          
                          {payment.invoice_url && (
                            <a
                              href={payment.invoice_url}
                              download
                              className="text-primary-400 hover:text-primary-300"
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
                          >
                            <FiMoreVertical className="w-5 h-5" />
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
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 z-50 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Payment Details</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Payment ID</p>
                      <p className="text-white font-mono">{selectedPayment.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Invoice Number</p>
                      <p className="text-white">{selectedPayment.invoice_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Student</p>
                      <p className="text-white">{selectedPayment.profiles?.name}</p>
                      <p className="text-sm text-gray-500">{selectedPayment.profiles?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Course</p>
                      <p className="text-white">{selectedPayment.courses?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Amount</p>
                      <p className="text-white text-xl font-bold">
                        {formatCurrency(selectedPayment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Payment Method</p>
                      <p className="text-white capitalize">{selectedPayment.method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      {getStatusBadge(selectedPayment.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Created At</p>
                      <p className="text-white">{formatDate(selectedPayment.created_at)}</p>
                    </div>
                  </div>
                  
                  {selectedPayment.payment_id && (
                    <div>
                      <p className="text-sm text-gray-400">Transaction ID</p>
                      <p className="text-white font-mono">{selectedPayment.payment_id}</p>
                    </div>
                  )}
                  
                  {selectedPayment.notes && (
                    <div>
                      <p className="text-sm text-gray-400">Notes</p>
                      <p className="text-white">{selectedPayment.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t border-dark-700">
                    {selectedPayment.status === 'pending' && selectedPayment.method === 'bank' && (
                      <>
                        <button
                          onClick={() => {
                            handleApprovePayment(selectedPayment.id)
                            setDetailsModalOpen(false)
                          }}
                          className="btn-primary"
                        >
                          Approve Payment
                        </button>
                        <button
                          onClick={() => {
                            handleRejectPayment(selectedPayment.id)
                            setDetailsModalOpen(false)
                          }}
                          className="btn-secondary"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => setDetailsModalOpen(false)}
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
      </div>
    </AdminLayout>
  )
}larSign className="w-8 h-8 text-primary-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
              </div>
              <FiClock className="w-8 h-8 text-yellow-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Approved</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{stats.approved}</p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-xl font-bold text-white mt-1">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>
        </div>
        
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            
            {/* Status Filter */}
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
            
            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Methods</option>
              <option value="payhere">PayHere</option>
              <option value="stripe">Stripe</option>
              <option value="bank">Bank Transfer</option>
            </select>
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
              <FiDol