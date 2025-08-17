import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiCopy, FiCheck, FiDollarSign, FiUpload } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function BankTransferModal({ isOpen, onClose, course, user }) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  const bankDetails = {
    bankName: 'Commercial Bank of Ceylon',
    accountName: 'Mathematics LMS (Pvt) Ltd',
    accountNumber: '8001234567',
    branch: 'Colombo Branch',
    swiftCode: 'CCEYLKLX'
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(''), 2000)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB')
        return
      }
      setReceipt(file)
      toast.success('Receipt uploaded successfully!')
    }
  }

  const handleSubmitBankTransfer = async () => {
    if (!receipt) {
      toast.error('Please upload payment receipt')
      return
    }

    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('receipt', receipt)
      formData.append('courseId', course.id)
      formData.append('userId', user.id)
      formData.append('amount', course.price)
      formData.append('paymentMethod', 'bank_transfer')

      const response = await axios.post('/api/payments/bank-transfer', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setOrderSubmitted(true)
        toast.success('Payment submitted for verification!')
      }
    } catch (error) {
      console.error('Bank transfer error:', error)
      toast.error('Failed to submit payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  if (orderSubmitted) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-8 max-w-md w-full border border-dark-700"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Payment Submitted!</h2>
              <p className="text-gray-400 mb-6">
                Your payment has been submitted for verification. You'll receive course access within 24 hours after verification.
              </p>
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-8 max-w-lg w-full border border-dark-700 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Bank Transfer Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Course Info */}
          <div className="mb-6 p-4 rounded-lg bg-dark-700/50">
            <h3 className="font-semibold text-white mb-2">{course?.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Amount to Transfer:</span>
              <span className="text-2xl font-bold text-primary-400">
                LKR {course?.price?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Bank Details */}
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <h4 className="text-white font-medium mb-3 flex items-center">
              <FiDollarSign className="mr-2 text-blue-400" />
              Bank Transfer Details
            </h4>
            <div className="space-y-3">
              {Object.entries(bankDetails).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono text-sm">{value}</span>
                    <button
                      onClick={() => copyToClipboard(value, key)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {copied === key ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <h4 className="text-white font-medium mb-2">Instructions:</h4>
            <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
              <li>Transfer the exact amount to the bank account above</li>
              <li>Include your name and course ID in the transfer reference</li>
              <li>Take a photo/screenshot of the transfer receipt</li>
              <li>Upload the receipt below</li>
              <li>Click submit to complete your order</li>
            </ol>
          </div>

          {/* Receipt Upload */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">
              Upload Payment Receipt *
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="receipt-upload"
              />
              <label htmlFor="receipt-upload" className="cursor-pointer">
                <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 mb-2">
                  {receipt ? receipt.name : 'Click to upload receipt'}
                </p>
                <p className="text-xs text-gray-500">
                  Supports: JPG, PNG, PDF (Max 5MB)
                </p>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitBankTransfer}
              disabled={loading || !receipt}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}