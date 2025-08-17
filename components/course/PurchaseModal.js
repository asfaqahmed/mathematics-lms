import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiX, FiCheck, FiCreditCard, FiDollarSign, FiGift,
  FiClock, FiUsers, FiBook, FiStar, FiShield, FiZap
} from 'react-icons/fi'
import StripeButton from '../payment/StripeButton'
import PayHereButton from '../payment/PayHereButton'
import BankTransferModal from '../payment/BankTransferModal'

export default function PurchaseModal({ 
  isOpen, 
  onClose, 
  course, 
  user,
  onPurchaseSuccess
}) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe')
  const [showBankTransfer, setShowBankTransfer] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [showCouponInput, setShowCouponInput] = useState(false)

  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      description: 'Pay securely with your card',
      icon: FiCreditCard,
      badge: 'Instant Access',
      color: 'blue'
    },
    {
      id: 'payhere',
      name: 'PayHere',
      description: 'Sri Lankan payment gateway',
      icon: FiDollarSign,
      badge: 'Local Payment',
      color: 'green'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      icon: FiDollarSign,
      badge: '24h Verification',
      color: 'yellow'
    }
  ]

  const courseFeatures = [
    { icon: FiBook, text: `${course?.lesson_count || 0} comprehensive lessons` },
    { icon: FiClock, text: `${course?.duration || '6+ hours'} of content` },
    { icon: FiUsers, text: 'Expert instructor support' },
    { icon: FiCheck, text: 'Certificate of completion' },
    { icon: FiShield, text: 'Lifetime access' },
    { icon: FiZap, text: 'Mobile & desktop compatible' }
  ]

  const applyCoupon = () => {
    // Mock coupon validation
    const validCoupons = {
      'STUDENT10': 10,
      'WELCOME20': 20,
      'EARLYBIRD': 15
    }
    
    if (validCoupons[couponCode.toUpperCase()]) {
      setDiscount(validCoupons[couponCode.toUpperCase()])
      setShowCouponInput(false)
    } else {
      alert('Invalid coupon code')
    }
  }

  const finalPrice = course?.price ? course.price * (1 - discount / 100) : 0

  const handlePaymentSuccess = (paymentData) => {
    if (onPurchaseSuccess) {
      onPurchaseSuccess(paymentData)
    }
    onClose()
  }

  const handleBankTransfer = () => {
    setShowBankTransfer(true)
  }

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-dark-700"
          >
            {/* Header */}
            <div className="sticky top-0 bg-dark-800/95 backdrop-blur-sm p-6 border-b border-dark-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Purchase Course</h2>
                <p className="text-gray-400">Get instant access to all course content</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Course Information */}
                <div>
                  <div className="mb-6">
                    <img
                      src={course?.thumbnail || '/api/placeholder/400/225'}
                      alt={course?.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <h3 className="text-xl font-bold text-white mb-2">
                      {course?.title}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {course?.description}
                    </p>
                    
                    {/* Course Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-dark-700/50 rounded-lg">
                        <FiStar className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">4.8</div>
                        <div className="text-xs text-gray-400">Rating</div>
                      </div>
                      <div className="text-center p-3 bg-dark-700/50 rounded-lg">
                        <FiUsers className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">245</div>
                        <div className="text-xs text-gray-400">Students</div>
                      </div>
                      <div className="text-center p-3 bg-dark-700/50 rounded-lg">
                        <FiBook className="w-5 h-5 text-green-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">{course?.lesson_count || 12}</div>
                        <div className="text-xs text-gray-400">Lessons</div>
                      </div>
                    </div>
                  </div>

                  {/* What's Included */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4">What's included:</h4>
                    <div className="space-y-3">
                      {courseFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <feature.icon className="w-5 h-5 text-primary-400 flex-shrink-0" />
                          <span className="text-gray-300">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Money Back Guarantee */}
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FiShield className="w-5 h-5 text-green-400" />
                      <span className="font-semibold text-green-400">30-Day Money Back Guarantee</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Not satisfied? Get a full refund within 30 days of purchase.
                    </p>
                  </div>
                </div>

                {/* Payment Section */}
                <div>
                  {/* Pricing */}
                  <div className="mb-6 p-6 bg-dark-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400">Course Price:</span>
                      <div className="text-right">
                        {discount > 0 && (
                          <div className="text-gray-500 line-through">
                            LKR {course?.price?.toFixed(2)}
                          </div>
                        )}
                        <div className="text-2xl font-bold text-primary-400">
                          LKR {finalPrice.toFixed(2)}
                        </div>
                        {discount > 0 && (
                          <div className="text-green-400 text-sm">
                            Save {discount}% with coupon!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Coupon Code */}
                    <div className="border-t border-dark-600 pt-4">
                      {!showCouponInput ? (
                        <button
                          onClick={() => setShowCouponInput(true)}
                          className="text-primary-400 hover:text-primary-300 text-sm flex items-center space-x-1"
                        >
                          <FiGift className="w-4 h-4" />
                          <span>Have a coupon code?</span>
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1 px-3 py-2 bg-dark-600 border border-dark-500 rounded text-white placeholder-gray-400"
                          />
                          <button
                            onClick={applyCoupon}
                            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Choose Payment Method:</h4>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedPaymentMethod === method.id
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-dark-600 hover:border-dark-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <method.icon className={`w-6 h-6 text-${method.color}-400`} />
                              <div>
                                <div className="font-medium text-white">{method.name}</div>
                                <div className="text-sm text-gray-400">{method.description}</div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full bg-${method.color}-500/20 text-${method.color}-400`}>
                              {method.badge}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="space-y-3">
                    {selectedPaymentMethod === 'stripe' && (
                      <StripeButton
                        course={course}
                        user={user}
                        onSuccess={handlePaymentSuccess}
                        className="w-full"
                      />
                    )}
                    
                    {selectedPaymentMethod === 'payhere' && (
                      <PayHereButton
                        course={course}
                        user={user}
                        onSuccess={handlePaymentSuccess}
                        className="w-full"
                      />
                    )}
                    
                    {selectedPaymentMethod === 'bank' && (
                      <button
                        onClick={handleBankTransfer}
                        className="w-full btn-primary flex items-center justify-center space-x-2"
                      >
                        <FiDollarSign className="w-5 h-5" />
                        <span>Continue with Bank Transfer</span>
                      </button>
                    )}

                    <button
                      onClick={onClose}
                      className="w-full px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Security Notice */}
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-400 text-sm">
                      <FiShield className="w-4 h-4" />
                      <span>Your payment information is secure and encrypted</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Bank Transfer Modal */}
      <BankTransferModal
        isOpen={showBankTransfer}
        onClose={() => setShowBankTransfer(false)}
        course={course}
        user={user}
      />
    </>
  )
}