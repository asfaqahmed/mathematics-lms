import React, { forwardRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Button } from './Button'

const modalVariants = cva(
  'relative bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl border border-dark-700 shadow-2xl overflow-hidden',
  {
    variants: {
      size: {
        sm: 'max-w-md',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-7xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export interface ModalProps extends VariantProps<typeof modalVariants> {
  /**
   * Whether the modal is open.
   */
  isOpen: boolean
  /**
   * Callback function to close the modal.
   */
  onClose: () => void
  /**
   * Modal title displayed in the header.
   */
  title?: string
  /**
   * Modal content.
   */
  children: ReactNode
  /**
   * Whether to show the close button in the header.
   */
  showCloseButton?: boolean
  /**
   * Whether clicking the overlay closes the modal.
   */
  closeOnOverlayClick?: boolean
  /**
   * Whether pressing Escape closes the modal.
   */
  closeOnEsc?: boolean
  /**
   * Additional CSS class name(s).
   */
  className?: string
  /**
   * Custom header content. If provided, title and showCloseButton are ignored.
   */
  header?: ReactNode
  /**
   * Custom footer content.
   */
  footer?: ReactNode
}

/**
 * Modal component with overlay, animations, and accessibility features.
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   size="lg"
 * >
 *   <Modal.Body>
 *     Are you sure you want to delete this item?
 *   </Modal.Body>
 *   <Modal.Footer>
 *     <Button variant="secondary" onClick={() => setIsOpen(false)}>
 *       Cancel
 *     </Button>
 *     <Button variant="destructive" onClick={handleDelete}>
 *       Delete
 *     </Button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 */
const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      size,
      showCloseButton = true,
      closeOnOverlayClick = true,
      closeOnEsc = true,
      className,
      header,
      footer,
    },
    ref
  ) => {
    // Handle Escape key
    useEffect(() => {
      if (!closeOnEsc || !isOpen) return

      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }, [isOpen, closeOnEsc, onClose])

    // Manage body scroll
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = 'unset'
        }
      }
    }, [isOpen])

    // Focus management
    useEffect(() => {
      if (isOpen) {
        // Focus trap implementation could be added here
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                lastElement?.focus()
                e.preventDefault()
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement?.focus()
                e.preventDefault()
              }
            }
          }
        }

        document.addEventListener('keydown', handleTabKey)
        return () => document.removeEventListener('keydown', handleTabKey)
      }
    }, [isOpen])

    if (!isOpen) return null

    const modalContent = (
      <AnimatePresence>
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              modalVariants({ size }),
              'w-full max-h-[90vh] overflow-hidden',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(header || title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-dark-600">
                {header ? (
                  header
                ) : (
                  <>
                    {title && (
                      <h2 id="modal-title" className="text-xl font-semibold text-white">
                        {title}
                      </h2>
                    )}
                    {showCloseButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                        aria-label="Close modal"
                      >
                        <FiX className="w-5 h-5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-dark-600 bg-dark-700/30">
                {footer}
              </div>
            )}
          </motion.div>

          {/* Overlay */}
          {closeOnOverlayClick && (
            <div
              className="absolute inset-0 -z-10"
              onClick={onClose}
              aria-hidden="true"
            />
          )}
        </div>
      </AnimatePresence>
    )

    return createPortal(modalContent, document.body)
  }
)

Modal.displayName = 'Modal'

/**
 * Modal header component.
 */
const ModalHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 border-b border-dark-600', className)}
      {...props}
    />
  )
)
ModalHeader.displayName = 'Modal.Header'

/**
 * Modal body component for main content.
 */
const ModalBody = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
)
ModalBody.displayName = 'Modal.Body'

/**
 * Modal footer component.
 */
const ModalFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end space-x-2 p-6 border-t border-dark-600 bg-dark-700/30', className)}
      {...props}
    />
  )
)
ModalFooter.displayName = 'Modal.Footer'

// Compound components
Modal.Header = ModalHeader
Modal.Body = ModalBody
Modal.Footer = ModalFooter

export { Modal, ModalHeader, ModalBody, ModalFooter, modalVariants }