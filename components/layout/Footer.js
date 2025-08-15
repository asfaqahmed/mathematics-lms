import Link from 'next/link'
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  const footerLinks = {
    courses: [
      { label: 'Algebra', href: '/courses?category=algebra' },
      { label: 'Calculus', href: '/courses?category=calculus' },
      { label: 'Geometry', href: '/courses?category=geometry' },
      { label: 'Statistics', href: '/courses?category=statistics' }
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' }
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Refund Policy', href: '/refund' }
    ]
  }
  
  const socialLinks = [
    { icon: FiFacebook, href: 'https://web.facebook.com/profile.php?id=61577929092606', label: 'Facebook' },
    { icon: FiTwitter, href: 'https://x.com/asfaqah16919030', label: 'Twitter' },
    { icon: FiInstagram, href: 'https://www.instagram.com/asfaqahmed356/', label: 'Instagram' },
    // { icon: FiYoutube, href: '#', label: 'YouTube' }
  ]
  
  return (
    <footer className="relative bg-dark-900 border-t border-white/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center space-x-3 group mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-lg px-3 py-1.5 font-display font-bold text-xl">
                  MP
                </div>
              </div>
              <span className="text-white font-display font-semibold text-xl">
                MathPro Academy
              </span>
            </Link>
            
            <p className="text-gray-400 mb-6 max-w-sm">
              Empowering students with comprehensive mathematics education through expert-led courses and interactive learning.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-400">
                <FiMail className="w-5 h-5 text-primary-400" />
                <span>mathtutor@asfaqahmed.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <FiPhone className="w-5 h-5 text-primary-400" />
                <span>+94 75 660 5254</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <FiMapPin className="w-5 h-5 text-primary-400" />
                <span>Colombo, Sri Lanka</span>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-gray-400 hover:bg-primary-500/20 hover:text-primary-400 hover:border-primary-500/50 transition-all duration-200"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          
          {/* Courses Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Courses</h3>
            <ul className="space-y-2">
              {footerLinks.courses.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-dark-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} {process.env.NEXT_PUBLIC_APP_NAME}. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link href="/terms" className="hover:text-primary-400 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-primary-400 transition-colors">Privacy</Link>
              <Link href="/cookies" className="hover:text-primary-400 transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}