import { forwardRef, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  placeholder,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const variants = {
    default: 'bg-dark-700 border-dark-600 text-white placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500/20',
    error: 'bg-dark-700 border-red-500 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20',
    success: 'bg-dark-700 border-green-500 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20'
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const inputVariant = error ? 'error' : variant
  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full
            border
            rounded-lg
            transition-all
            duration-200
            focus:outline-none
            focus:ring-2
            disabled:opacity-50
            disabled:cursor-not-allowed
            ${variants[inputVariant]}
            ${sizes[size]}
            ${type === 'password' ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
          >
            {showPassword ? (
              <FiEyeOff className="w-4 h-4" />
            ) : (
              <FiEye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input