import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi'

const Toast = ({
  toast,
  onDismiss
}) => {
  const variants = {
    success: {
      bg: 'bg-green-600',
      icon: FiCheck,
      iconColor: 'text-green-100'
    },
    error: {
      bg: 'bg-red-600',
      icon: FiX,
      iconColor: 'text-red-100'
    },
    warning: {
      bg: 'bg-yellow-600',
      icon: FiAlertCircle,
      iconColor: 'text-yellow-100'
    },
    info: {
      bg: 'bg-blue-600',
      icon: FiInfo,
      iconColor: 'text-blue-100'
    }
  }

  const variant = variants[toast.type] || variants.info
  const Icon = variant.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`
        ${variant.bg}
        max-w-md
        w-full
        shadow-lg
        rounded-lg
        pointer-events-auto
        flex
        ring-1
        ring-black
        ring-opacity-5
        overflow-hidden
      `}
    >
      <div className="w-0 flex-1 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${variant.iconColor}`} />
          </div>
          <div className="ml-3 w-0 flex-1">
            {toast.title && (
              <p className="text-sm font-medium text-white">
                {toast.title}
              </p>
            )}
            <p className={`text-sm ${toast.title ? 'text-gray-100 mt-1' : 'text-white'}`}>
              {toast.message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 border-opacity-20">
        <button
          onClick={() => onDismiss(toast.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-white hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-0 right-0 z-50 p-6 space-y-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}