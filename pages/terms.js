import { motion } from 'framer-motion'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function Terms({ user }) {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using MathPro Academy, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
    },
    {
      title: '2. Use License',
      content: `Permission is granted to temporarily access the materials (courses, videos, documents) on MathPro Academy for personal, non-commercial use only. This is the grant of a license, not a transfer of title.`
    },
    {
      title: '3. Account Registration',
      content: `To access certain features of our platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.`
    },
    {
      title: '4. Course Enrollment and Access',
      content: `Upon successful payment, you will receive lifetime access to the enrolled course(s). Access is granted to the individual who purchased the course and cannot be shared or transferred to others.`
    },
    {
      title: '5. Payment Terms',
      content: `All payments are processed securely through our payment partners (PayHere, Stripe, or Bank Transfer). Prices are listed in Sri Lankan Rupees (LKR) and are subject to change without notice.`
    },
    {
      title: '6. Refund Policy',
      content: `We offer a 7-day money-back guarantee for all courses. If you are not satisfied with a course, you may request a refund within 7 days of purchase. Refunds are processed within 5-10 business days.`
    },
    {
      title: '7. Intellectual Property',
      content: `All content on MathPro Academy, including but not limited to text, graphics, logos, images, audio clips, video clips, and software, is the property of MathPro Academy and is protected by international copyright laws.`
    },
    {
      title: '8. User Conduct',
      content: `You agree not to:
      • Share your account credentials with others
      • Download, copy, or redistribute course content
      • Use the platform for any illegal or unauthorized purpose
      • Interfere with or disrupt the platform's services
      • Attempt to gain unauthorized access to any part of the platform`
    },
    {
      title: '9. Privacy Policy',
      content: `Your use of our platform is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the Site and informs users of our data collection practices.`
    },
    {
      title: '10. Disclaimer',
      content: `The materials on MathPro Academy are provided on an 'as is' basis. MathPro Academy makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.`
    },
    {
      title: '11. Limitations',
      content: `In no event shall MathPro Academy or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MathPro Academy, even if MathPro Academy or a MathPro Academy authorized representative has been notified orally or in writing of the possibility of such damage.`
    },
    {
      title: '12. Modifications',
      content: `MathPro Academy may revise these terms of service at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of service.`
    },
    {
      title: '13. Governing Law',
      content: `These terms and conditions are governed by and construed in accordance with the laws of Sri Lanka and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.`
    },
    {
      title: '14. Contact Information',
      content: `If you have any questions about these Terms of Service, please contact us at:
      
      Email: legal@mathpro.lk
      Phone: +94 77 123 4567
      Address: Colombo, Sri Lanka`
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
              Terms of Service
            </h1>
            <p className="text-gray-400 text-center mb-2">
              Last updated: January 1, 2025
            </p>
            <p className="text-gray-400 text-center mb-12">
              Please read these terms carefully before using our service.
            </p>
            
            <div className="space-y-8">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="card"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">
                    {section.title}
                  </h2>
                  <div className="text-gray-400 whitespace-pre-line">
                    {section.content}
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mt-12 p-6 bg-primary-500/10 border border-primary-500/30 rounded-lg"
            >
              <p className="text-center text-gray-300">
                By using MathPro Academy, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}