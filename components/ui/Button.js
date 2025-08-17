import { forwardRef } from 'react'
import { FiLoader } from 'react-icons/fi'

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  className = '',
  type = 'button',
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900'
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-600/50',
    secondary: 'bg-dark-700 text-white border border-dark-600 hover:bg-dark-600 focus:ring-primary-500 disabled:bg-dark-700/50',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-600/50',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-600/50',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 disabled:bg-yellow-600/50',
    ghost: 'text-gray-300 hover:text-white hover:bg-dark-700 focus:ring-primary-500',
    outline: 'border border-primary-600 text-primary-400 hover:bg-primary-600 hover:text-white focus:ring-primary-500'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }
  
  const isDisabled = disabled || loading
  
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <FiLoader className="w-4 h-4 mr-2 animate-spin" />
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button