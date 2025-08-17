import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiEye, FiCheck, FiX, FiSearch, FiDollarSign, FiClock } from 'react-icons/fi'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import Card from '../ui/Card'

export default function PaymentTable({ payments = [], onApprove, onReject, onView, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Filter and sort payments
  const filteredPayments = payments
    .filter(payment => {
      const matchesSearch = payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue = a[sortBy] || ''
      let bValue = b[sortBy] || ''
      
      if (sortBy === 'created_at' || sortBy === 'amount') {
        aValue = sortBy === 'created_at' ? new Date(aValue) : parseFloat(aValue)
        bValue = sortBy === 'created_at' ? new Date(bValue) : parseFloat(bValue)
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'danger'
      case 'cancelled': return 'secondary'
      default: return 'default'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const formatAmount = (amount) => {
    return `LKR ${parseFloat(amount || 0).toFixed(2)}`
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading payments...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Card.Title>Payments Management</Card.Title>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card.Header>

      {filteredPayments.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <FiDollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No payments found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Course
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('amount')}
                >
                  Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '‘' : '“')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Method
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('created_at')}
                >
                  Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '‘' : '“')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {filteredPayments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-dark-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-white">
                      {payment.order_id || payment.id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {payment.user?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {payment.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white max-w-xs truncate">
                      {payment.course?.title || 'Unknown Course'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-400">
                      {formatAmount(payment.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(payment.status)}>
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400 capitalize">
                      {payment.payment_method || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDate(payment.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(payment)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <FiEye className="w-4 h-4" />
                      </Button>
                      {payment.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApprove?.(payment)}
                            className="text-green-400 hover:text-green-300"
                          >
                            <FiCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReject?.(payment)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FiX className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card.Footer>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {filteredPayments.length} of {payments.length} payments
          </p>
          <div className="text-sm text-gray-400">
            Total Revenue: {formatAmount(
              payments
                .filter(p => p.status === 'paid')
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
            )}
          </div>
        </div>
      </Card.Footer>
    </Card>
  )
}