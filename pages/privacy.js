import { motion } from 'framer-motion'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function Privacy({ user }) {
  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us, such as:
      • Account information (name, email, phone number)
      • Payment information (processed securely by our payment partners)
      • Course progress and completion data
      • Communications with our support team
      • Device and usage information`
    },
    {
      title: '2. How We Use Your Information',
      content: `We use the information we collect to:
      • Provide, maintain, and improve our services
      • Process payments and send transaction notifications
      • Send you technical notices and support messages
      • Respond to your comments and questions
      • Monitor and analyze trends and usage
      • Personalize your learning experience`
    },
    {
      title: '3. Information Sharing',
      content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
      • With your consent
      • With service providers who assist in our operations
      • To comply with legal obligations
      • To protect our rights and prevent fraud`
    },
    {
      title: '4. Data Security',
      content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
      • SSL encryption for data transmission
      • Secure servers and databases
      • Regular security audits
      • Limited access to personal information`
    },
    {
      title: '5. Payment Information',
      content: `Payment information is processed securely through our payment partners:
      • PayHere for local Sri Lankan transactions
      • Stripe for international payments
      • We do not store credit card details on our servers
      • All payment data is encrypted and tokenized`
    },
    {
      title: '6. Cookies and Tracking',
      content: `We use cookies and similar tracking technologies to:
      • Keep you logged in
      • Remember your preferences
      • Analyze site traffic and usage
      • Improve our services
      
      You can control cookies through your browser settings.`
    },
    {
      title: '7. Your Rights',
      content: `You have the right to:
      • Access your personal information
      • Correct inaccurate data
      • Request deletion of your data
      • Object to data processing
      • Data portability
      • Withdraw consent at any time`
    },
    {
      title: '8. Children\'s Privacy',
      content: `Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.`
    },
    {
      title: '9. Data Retention',
      content: `We retain your personal information for as long as necessary to:
      • Provide our services
      • Comply with legal obligations
      • Resolve disputes
      • Enforce our agreements
      
      When your account is deleted, we remove your personal information within 90 days.`
    },
    {
      title: '10. International Data Transfers',
      content: `Your information may be transferred to and processed in countries other than Sri Lanka. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.`
    },
    {
      title: '11. Third-Party Links',
      content: `Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.`
    },
    {
      title: '12. Changes to This Policy',
      content: `We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.`
    },
    {
      title: '13. Contact Us',
      content: `If you have any questions about this Privacy Policy, please contact us at:
      
      Email: privacy@mathpro.lk
      Phone: +94 77 123 4567
      Address: Colombo, Sri Lanka
      
      Data Protection Officer: dpo@mathpro.lk`
    }
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      <section className="relative pt-20 pb-16">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 text-center">
              Privacy Policy
            </h1>
            <p className="text-gray-400 text-center mb-2">
              Last updated: January 1, 2025
            </p>
            <p className="text-gray-400 text-center mb-12">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            
            <div className="card mb-8">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400">
                  <strong>GDPR Compliant:</strong> We are committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
                </p>
              </div>
            </div>
            
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
              className="mt-12 card bg-gradient-to-r from-primary-600/20 to-purple-600/20"
            >
              <h3 className="text-lg font-semibold text-white mb-3">
                Your Privacy Matters
              </h3>
              <p className="text-gray-300">
                We are committed to protecting your personal information and being transparent about what information we collect and how we use it. If you have any concerns about your privacy, please don't hesitate to contact us.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}