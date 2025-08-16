import { motion } from 'framer-motion'
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiClock } from 'react-icons/fi'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function RefundPolicy({ user }) {
  const eligibleReasons = [
    'Course content significantly different from description',
    'Technical issues preventing course access',
    'Duplicate purchase',
    'Course quality not meeting reasonable expectations',
    'Instructor not delivering promised content'
  ]
  
  const nonEligibleReasons = [
    'Change of mind after 7 days',
    'Completed more than 50% of the course',
    'Downloaded course materials',
    'Violation of terms of service',
    'Purchase made more than 7 days ago'
  ]
  
  const refundProcess = [
    {
      step: 1,
      title: 'Submit Request',
      description: 'Contact our support team within 7 days of purchase',
      icon: FiAlertCircle
    },
    {
      step: 2,
      title: 'Review Process',
      description: 'We review your request within 24-48 hours',
      icon: FiClock
    },
    {
      step: 3,
      title: 'Decision',
      description: 'You receive an email with our decision',
      icon: FiCheckCircle
    },
    {
      step: 4,
      title: 'Refund Processing',
      description: 'Approved refunds processed within 5-10 business days',
      icon: FiCheckCircle
    }
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      <section className="relative pt-20 pb-16">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 text-center">
              Refund Policy
            </h1>
            <p className="text-gray-400 text-center mb-12">
              We want you to be satisfied with your purchase. Here's our refund policy.
            </p>
            
            {/* 7-Day Guarantee */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="card bg-gradient-to-r from-green-600/20 to-emerald-600/20 mb-12"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
                  <FiCheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  7-Day Money-Back Guarantee
                </h2>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  If you're not satisfied with your course purchase, you can request a full refund within 7 days of purchase, no questions asked.
                </p>
              </div>
            </motion.div>
            
            {/* Eligible Reasons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="card mb-8"
            >
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <FiCheckCircle className="mr-3 text-green-400" />
                Eligible for Refund
              </h2>
              <ul className="space-y-3">
                {eligibleReasons.map((reason, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <FiCheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{reason}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            {/* Non-Eligible Reasons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="card mb-8"
            >
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <FiXCircle className="mr-3 text-red-400" />
                Not Eligible for Refund
              </h2>
              <ul className="space-y-3">
                {nonEligibleReasons.map((reason, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <FiXCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{reason}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            {/* Refund Process */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Refund Process
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                {refundProcess.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 mb-4">
                      <item.icon className="w-8 h-8 text-primary-400" />
                    </div>
                    <div className="text-3xl font-bold text-primary-400 mb-2">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Payment Method Specific */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="card mb-8"
            >
              <h2 className="text-2xl font-semibold text-white mb-6">
                Refund by Payment Method
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">PayHere Payments</h3>
                  <p className="text-gray-400">
                    Refunds are credited back to the original payment method within 5-7 business days.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Stripe Payments</h3>
                  <p className="text-gray-400">
                    Refunds are processed to your card within 5-10 business days, depending on your bank.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Bank Transfers</h3>
                  <p className="text-gray-400">
                    Refunds are transferred to your bank account within 7-14 business days. You'll need to provide your bank details.
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Contact for Refund */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="card bg-gradient-to-r from-primary-600/20 to-purple-600/20 text-center"
            >
              <h2 className="text-2xl font-semibold text-white mb-4">
                Request a Refund
              </h2>
              <p className="text-gray-300 mb-6">
                To request a refund, please contact our support team with your order details:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:refunds@mathpro.lk"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Email: refunds@mathpro.lk
                </a>
                <a
                  href="https://wa.me/94771234567?text=I%20would%20like%20to%20request%20a%20refund"
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  WhatsApp Support
                </a>
              </div>
            </motion.div>
            
            {/* Important Notes */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
            >
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                Important Notes
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Refunds are only available for individual course purchases</li>
                <li>• Bundle purchases have separate refund terms</li>
                <li>• Promotional or discounted purchases may have different refund policies</li>
                <li>• Access to course content is immediately revoked upon refund approval</li>
                <li>• We reserve the right to deny refunds for abuse of this policy</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}