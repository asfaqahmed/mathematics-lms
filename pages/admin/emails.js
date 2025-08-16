import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  FiMail, FiSend, FiCheck, FiX, FiSearch,
  FiFilter, FiUsers, FiEdit, FiEye, FiClock,
  FiAlertCircle, FiCheckCircle, FiRefreshCw
} from 'react-icons/fi'
import { supabase, isAdmin } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function AdminEmails({ user }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [emailLogs, setEmailLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [composeOpen, setComposeOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('custom')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sending, setSending] = useState(false)
  
  const [emailData, setEmailData] = useState({
    recipients: 'all',
    customRecipients: '',
    subject: '',
    template: 'custom',
    content: ''
  })
  
  const emailTemplates = [
    { id: 'custom', name: 'Custom Message', icon: FiEdit },
    { id: 'welcome', name: 'Welcome Email', icon: FiMail },
    { id: 'announcement', name: 'Announcement', icon: FiAlertCircle },
    { id: 'promotion', name: 'Promotion', icon: FiSend },
    { id: 'reminder', name: 'Course Reminder', icon: FiClock }
  ]
  
  useEffect(() => {
    checkAdminAccess()
  }, [user])
  
  useEffect(() => {
    filterEmailLogs()
  }, [emailLogs, searchTerm, statusFilter])
  
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
    
    fetchEmailLogs()
  }
  
  const fetchEmailLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      setEmailLogs(data || [])
      setFilteredLogs(data || [])
    } catch (error) {
      console.error('Error fetching email logs:', error)
      toast.error('Failed to load email logs')
    } finally {
      setLoading(false)
    }
  }
  
  const filterEmailLogs = () => {
    let filtered = [...emailLogs]
    
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.to_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log =>
        statusFilter === 'success' ? log.success : !log.success
      )
    }
    
    setFilteredLogs(filtered)
  }
  
  const sendBulkEmail = async () => {
    if (!emailData.subject || (!emailData.content && emailData.template === 'custom')) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setSending(true)
    
    try {
      // Get recipients based on selection
      let recipients = []
      
      if (emailData.recipients === 'all') {
        const { data: users } = await supabase
          .from('profiles')
          .select('email, name')
        recipients = users || []
      } else if (emailData.recipients === 'students') {
        const { data: users } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('role', 'student')
        recipients = users || []
      } else if (emailData.recipients === 'custom') {
        const emails = emailData.customRecipients.split(',').map(e => e.trim())
        recipients = emails.map(email => ({ email, name: '' }))
      }
      
      // Send emails
      const promises = recipients.map(recipient =>
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient.email,
            type: emailData.template === 'custom' ? 'custom' : emailData.template,
            data: {
              name: recipient.name || 'Student',
              subject: emailData.subject,
              content: emailData.content
            }
          })
        })
      )
      
      await Promise.all(promises)
      
      toast.success(`Emails sent to ${recipients.length} recipients`)
      setComposeOpen(false)
      setEmailData({
        recipients: 'all',
        customRecipients: '',
        subject: '',
        template: 'custom',
        content: ''
      })
      
      // Refresh logs
      setTimeout(fetchEmailLogs, 2000)
      
    } catch (error) {
      console.error('Error sending emails:', error)
      toast.error('Failed to send emails')
    } finally {
      setSending(false)
    }
  }
  
  const resendEmail = async (log) => {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: log.to_email,
          type: log.template_type || 'custom',
          data: {
            subject: log.subject
          }
        })
      })
      
      if (response.ok) {
        toast.success('Email resent successfully')
        fetchEmailLogs()
      } else {
        throw new Error('Failed to resend')
      }
    } catch (error) {
      console.error('Error resending email:', error)
      toast.error('Failed to resend email')
    }
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const stats = {
    total: emailLogs.length,
    success: emailLogs.filter(log => log.success).length,
    failed: emailLogs.filter(log => !log.success).length,
    successRate: emailLogs.length > 0 
      ? ((emailLogs.filter(log => log.success).length / emailLogs.length) * 100).toFixed(1)
      : 0
  }
  
  if (!user) return null
  
  return (
    <AdminLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Email Management
            </h1>
            <p className="text-gray-400">
              Send bulk emails and view email logs
            </p>
          </div>
          
          <button
            onClick={() => setComposeOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FiSend />
            <span>Compose Email</span>
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
                <p className="text-gray-400 text-sm">Total Sent</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <FiMail className="w-8 h-8 text-primary-400" />
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
                <p className="text-gray-400 text-sm">Successful</p>
                <p className="text-2xl font-bold text-green-400">{stats.success}</p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-400" />
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
                <p className="text-gray-400 text-sm">Failed</p>
                <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
              </div>
              <FiX className="w-8 h-8 text-red-400" />
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
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
              </div>
              <FiCheck className="w-8 h-8 text-blue-400" />
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
                  placeholder="Search by email or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="success">Successful</option>
              <option value="failed">Failed</option>
            </select>
            
            <button
              onClick={fetchEmailLogs}
              className="btn-ghost flex items-center space-x-2"
            >
              <FiRefreshCw />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Email Logs Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FiMail className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No emails found</h3>
              <p className="text-gray-400">Start by sending your first email</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Template</th>
                    <th>Status</th>
                    <th>Sent At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-medium text-white">
                        {log.to_email}
                      </td>
                      <td>{log.subject || '-'}</td>
                      <td>
                        <span className="badge badge-primary">
                          {log.template_type || 'custom'}
                        </span>
                      </td>
                      <td>
                        {log.success ? (
                          <span className="badge badge-success">
                            <FiCheckCircle className="w-3 h-3 mr-1" />
                            Sent
                          </span>
                        ) : (
                          <span className="badge badge-danger">
                            <FiX className="w-3 h-3 mr-1" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="text-sm text-gray-400">
                        {formatDate(log.created_at)}
                      </td>
                      <td>
                        {!log.success && (
                          <button
                            onClick={() => resendEmail(log)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Resend"
                          >
                            <FiRefreshCw className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Compose Email Modal */}
        {composeOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setComposeOpen(false)}
            />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 z-50 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Compose Email</h3>
                  <button
                    onClick={() => setComposeOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Recipients */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Recipients
                    </label>
                    <select
                      value={emailData.recipients}
                      onChange={(e) => setEmailData({ ...emailData, recipients: e.target.value })}
                      className="input w-full"
                    >
                      <option value="all">All Users</option>
                      <option value="students">Students Only</option>
                      <option value="custom">Custom Recipients</option>
                    </select>
                  </div>
                  
                  {emailData.recipients === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Addresses (comma-separated)
                      </label>
                      <textarea
                        value={emailData.customRecipients}
                        onChange={(e) => setEmailData({ ...emailData, customRecipients: e.target.value })}
                        className="input w-full h-20 resize-none"
                        placeholder="email1@example.com, email2@example.com"
                      />
                    </div>
                  )}
                  
                  {/* Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Template
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {emailTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setEmailData({ ...emailData, template: template.id })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            emailData.template === template.id
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-dark-600 hover:border-dark-500'
                          }`}
                        >
                          <template.icon className="w-5 h-5 text-primary-400 mb-1" />
                          <p className="text-sm text-white">{template.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={emailData.subject}
                      onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                      className="input w-full"
                      placeholder="Enter email subject"
                    />
                  </div>
                  
                  {/* Content */}
                  {emailData.template === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Message
                      </label>
                      <textarea
                        value={emailData.content}
                        onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                        className="input w-full h-40 resize-none"
                        placeholder="Write your message here..."
                      />
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-dark-700">
                    <button
                      onClick={() => setComposeOpen(false)}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendBulkEmail}
                      disabled={sending}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {sending ? (
                        <div className="spinner w-5 h-5 border-2"></div>
                      ) : (
                        <>
                          <FiSend />
                          <span>Send Email</span>
                        </>
                      )}
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
}