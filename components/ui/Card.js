import { forwardRef } from 'react'

const Card = forwardRef(({ 
  children, 
  variant = 'default', 
  padding = 'md',
  className = '',
  ...props 
}, ref) => {
  const variants = {
    default: 'bg-dark-800 border border-dark-700',
    glass: 'bg-dark-800/50 backdrop-blur-sm border border-dark-700/50',
    gradient: 'bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700',
    solid: 'bg-dark-700 border border-dark-600',
    transparent: 'bg-transparent border border-dark-600'
  }
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  }
  
  return (
    <div
      ref={ref}
      className={`
        rounded-lg
        ${variants[variant]}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
)

const CardBody = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`mt-4 pt-4 border-t border-dark-600 ${className}`} {...props}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-white ${className}`} {...props}>
    {children}
  </h3>
)

const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-gray-400 ${className}`} {...props}>
    {children}
  </p>
)

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter
Card.Title = CardTitle
Card.Description = CardDescription

export default Card