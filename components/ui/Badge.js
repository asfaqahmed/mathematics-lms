import { forwardRef } from 'react'

const Badge = forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const variants = {
    default: 'bg-gray-600 text-gray-100',
    primary: 'bg-primary-600 text-white',
    secondary: 'bg-dark-600 text-gray-300',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    danger: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
    outline: 'border border-gray-600 text-gray-300 bg-transparent',
    'outline-primary': 'border border-primary-600 text-primary-400 bg-transparent',
    'outline-success': 'border border-green-600 text-green-400 bg-transparent',
    'outline-warning': 'border border-yellow-600 text-yellow-400 bg-transparent',
    'outline-danger': 'border border-red-600 text-red-400 bg-transparent'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  }

  return (
    <span
      ref={ref}
      className={`
        inline-flex
        items-center
        font-medium
        rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'

export default Badge