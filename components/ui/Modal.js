import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { createPortal } from 'react-dom'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = ''
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  useEffect(() => {
    if (!closeOnEsc) return

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, closeOnEsc, onClose])

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`
            bg-gradient-to-br from-dark-800 to-dark-900 
            rounded-2xl 
            border border-dark-700 
            shadow-2xl 
            w-full 
            ${sizes[size]} 
            max-h-[90vh] 
            overflow-hidden
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-dark-600">
              {title && (
                <h2 className="text-xl font-semibold text-white">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
            {children}
          </div>
        </motion.div>

        {/* Overlay */}
        {closeOnOverlayClick && (
          <div 
            className="absolute inset-0 -z-10"
            onClick={onClose}
          />
        )}
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}

// Modal compound components
Modal.Header = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-dark-600 ${className}`}>
    {children}
  </div>
)

Modal.Body = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
)

Modal.Footer = ({ children, className = '' }) => (
  <div className={`p-6 border-t border-dark-600 bg-dark-700/30 ${className}`}>
    {children}
  </div>
)