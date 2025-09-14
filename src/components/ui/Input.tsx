import React, { forwardRef, useState, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'

const inputVariants = cva(
  'flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-dark-700 border-dark-600 text-white focus-visible:border-primary-500 focus-visible:ring-primary-500/20',
        error: 'bg-dark-700 border-red-500 text-white focus-visible:border-red-500 focus-visible:ring-red-500/20',
        success: 'bg-dark-700 border-green-500 text-white focus-visible:border-green-500 focus-visible:ring-green-500/20',
      },
      inputSize: {
        default: 'h-10 px-3 py-2',
        sm: 'h-8 px-2 py-1 text-xs',
        lg: 'h-12 px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * The label for the input field.
   */
  label?: string
  /**
   * Error message to display below the input.
   */
  error?: string
  /**
   * Success message to display below the input.
   */
  success?: string
  /**
   * Helper text to display below the input.
   */
  helperText?: string
  /**
   * Icon to display at the start of the input.
   */
  startIcon?: ReactNode
  /**
   * Icon to display at the end of the input.
   */
  endIcon?: ReactNode
  /**
   * Whether the input should take up the full width of its container.
   */
  fullWidth?: boolean
  /**
   * Whether the input is required.
   */
  required?: boolean
}

/**
 * Input component with label, error states, and icon support.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 *   required
 * />
 *
 * <Input
 *   type="password"
 *   label="Password"
 *   placeholder="Enter password"
 * />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      variant,
      inputSize,
      label,
      error,
      success,
      helperText,
      startIcon,
      endIcon,
      fullWidth = true,
      required = false,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    // Determine variant based on error/success state
    const inputVariant = error ? 'error' : success ? 'success' : variant

    // Handle password visibility toggle
    const inputType = type === 'password' && showPassword ? 'text' : type
    const isPasswordType = type === 'password'

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300"
          >
            {label}
            {required && (
              <span className="text-red-400 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {startIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={inputType}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              inputVariants({ variant: inputVariant, inputSize }),
              startIcon && 'pl-10',
              (endIcon || isPasswordType) && 'pr-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : success
                ? `${inputId}-success`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />

          {/* End icon or password toggle */}
          {(endIcon || isPasswordType) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isPasswordType ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-200 transition-colors focus:outline-none focus:text-gray-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <FiEyeOff className="w-4 h-4" />
                  ) : (
                    <FiEye className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="text-gray-400">{endIcon}</span>
              )}
            </div>
          )}
        </div>

        {/* Helper text, error, or success message */}
        {error && (
          <div
            id={`${inputId}-error`}
            className="flex items-center space-x-1 text-sm text-red-400"
            role="alert"
            aria-live="polite"
          >
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!error && success && (
          <p
            id={`${inputId}-success`}
            className="text-sm text-green-400"
            role="status"
            aria-live="polite"
          >
            {success}
          </p>
        )}

        {!error && !success && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input, inputVariants }