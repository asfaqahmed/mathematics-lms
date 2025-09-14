import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva(
  'animate-spin',
  {
    variants: {
      variant: {
        default: 'text-primary-500',
        white: 'text-white',
        gray: 'text-gray-400',
        success: 'text-green-500',
        warning: 'text-yellow-500',
        destructive: 'text-red-500',
      },
      size: {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        default: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Screen reader label for the spinner.
   */
  'aria-label'?: string
}

/**
 * Loading spinner component with customizable size and color variants.
 *
 * @example
 * ```tsx
 * <Spinner size="lg" variant="primary" />
 *
 * <Spinner size="sm" variant="white" aria-label="Loading..." />
 * ```
 */
const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, variant, size, 'aria-label': ariaLabel = 'Loading...', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ variant, size }), className)}
        role="status"
        aria-label={ariaLabel}
        {...props}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    )
  }
)

Spinner.displayName = 'Spinner'

/**
 * Loading skeleton component for placeholder content.
 */
const Skeleton = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('animate-pulse rounded-md bg-dark-700', className)}
      {...props}
    />
  )
)

Skeleton.displayName = 'Skeleton'

/**
 * Loading dots component for a different loading animation style.
 */
const LoadingDots = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center space-x-1', className)}
      role="status"
      aria-label="Loading..."
      {...props}
    >
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
)

LoadingDots.displayName = 'LoadingDots'

export { Spinner, Skeleton, LoadingDots, spinnerVariants }