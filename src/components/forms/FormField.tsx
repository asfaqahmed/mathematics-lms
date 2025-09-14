import React, { forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Input, InputProps } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export interface FormFieldProps extends InputProps {
  /**
   * Field name for form handling.
   */
  name: string
  /**
   * Field label.
   */
  label?: string
  /**
   * Helper text to display below the field.
   */
  helperText?: string
  /**
   * Error message to display.
   */
  error?: string
  /**
   * Success message to display.
   */
  success?: string
  /**
   * Whether the field is required.
   */
  required?: boolean
  /**
   * Custom field component to render instead of Input.
   */
  children?: ReactNode
  /**
   * Additional wrapper class names.
   */
  wrapperClassName?: string
}

/**
 * FormField component that wraps form inputs with consistent styling and validation states.
 *
 * @example
 * ```tsx
 * <FormField
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 *   required
 * />
 *
 * // With custom field component
 * <FormField name="description" label="Description" error={errors.description}>
 *   <textarea
 *     name="description"
 *     className="w-full p-3 border rounded-lg"
 *     rows={4}
 *   />
 * </FormField>
 * ```
 */
const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      name,
      label,
      helperText,
      error,
      success,
      required = false,
      children,
      wrapperClassName,
      className,
      ...props
    },
    ref
  ) => {
    // If children is provided, render custom field component
    if (children) {
      return (
        <div className={cn('space-y-1', wrapperClassName)}>
          {label && (
            <label
              htmlFor={name}
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
            {children}
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          {!error && success && (
            <p className="text-sm text-green-400" role="status" aria-live="polite">
              {success}
            </p>
          )}

          {!error && !success && helperText && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )
    }

    // Default Input field
    return (
      <div className={cn('space-y-1', wrapperClassName)}>
        <Input
          ref={ref}
          id={name}
          name={name}
          label={label}
          error={error}
          success={success}
          helperText={helperText}
          required={required}
          className={className}
          {...props}
        />
      </div>
    )
  }
)

FormField.displayName = 'FormField'

/**
 * Textarea component for multi-line text input.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Field label.
   */
  label?: string
  /**
   * Error message to display.
   */
  error?: string
  /**
   * Success message to display.
   */
  success?: string
  /**
   * Helper text to display.
   */
  helperText?: string
  /**
   * Whether the field is required.
   */
  required?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      success,
      helperText,
      required = false,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

    // Determine variant based on error/success state
    const borderColor = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : success
      ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
      : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500/20'

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={textareaId}
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

        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border bg-dark-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical transition-all duration-200',
            borderColor,
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : success
              ? `${textareaId}-success`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          {...props}
        />

        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-sm text-red-400"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        {!error && success && (
          <p
            id={`${textareaId}-success`}
            className="text-sm text-green-400"
            role="status"
            aria-live="polite"
          >
            {success}
          </p>
        )}

        {!error && !success && helperText && (
          <p id={`${textareaId}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

/**
 * Select component for dropdown selections.
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Field label.
   */
  label?: string
  /**
   * Error message to display.
   */
  error?: string
  /**
   * Success message to display.
   */
  success?: string
  /**
   * Helper text to display.
   */
  helperText?: string
  /**
   * Whether the field is required.
   */
  required?: boolean
  /**
   * Select options.
   */
  options?: Array<{ value: string; label: string; disabled?: boolean }>
  /**
   * Placeholder option.
   */
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      success,
      helperText,
      required = false,
      options = [],
      placeholder,
      id,
      children,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

    // Determine variant based on error/success state
    const borderColor = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : success
      ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
      : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500/20'

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={selectId}
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

        <select
          id={selectId}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-dark-700 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            borderColor,
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${selectId}-error`
              : success
              ? `${selectId}-success`
              : helperText
              ? `${selectId}-helper`
              : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
          {children}
        </select>

        {error && (
          <p
            id={`${selectId}-error`}
            className="text-sm text-red-400"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        {!error && success && (
          <p
            id={`${selectId}-success`}
            className="text-sm text-green-400"
            role="status"
            aria-live="polite"
          >
            {success}
          </p>
        )}

        {!error && !success && helperText && (
          <p id={`${selectId}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { FormField, Textarea, Select }