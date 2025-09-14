import React, { forwardRef, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        outline: 'border border-primary-600 text-primary-400 hover:bg-primary-600 hover:text-white focus-visible:ring-primary-500',
        secondary: 'bg-dark-700 text-white border border-dark-600 hover:bg-dark-600 focus-visible:ring-primary-500',
        ghost: 'text-gray-300 hover:text-white hover:bg-dark-700 focus-visible:ring-primary-500',
        link: 'text-primary-400 underline-offset-4 hover:underline focus-visible:ring-primary-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus-visible:ring-yellow-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6',
        xl: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * If set to `true`, the button will be rendered as a child within the component.
   * This child component must be a valid React component.
   */
  asChild?: boolean
  /**
   * If set to `true`, the button will show a loading spinner and be disabled.
   */
  loading?: boolean
  /**
   * The loading text to show when loading is true.
   */
  loadingText?: string
  /**
   * Icon to display before the button text.
   */
  startIcon?: ReactNode
  /**
   * Icon to display after the button text.
   */
  endIcon?: ReactNode
}

/**
 * Button component with multiple variants and states.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" loading={isLoading}>
 *   Save Changes
 * </Button>
 *
 * <Button variant="outline" startIcon={<Icon />}>
 *   With Icon
 * </Button>
 * ```
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      loadingText,
      startIcon,
      endIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Spinner
            size="sm"
            className="mr-2"
            aria-hidden="true"
          />
        )}
        {!loading && startIcon && (
          <span className="mr-2" aria-hidden="true">
            {startIcon}
          </span>
        )}
        {loading && loadingText ? loadingText : children}
        {!loading && endIcon && (
          <span className="ml-2" aria-hidden="true">
            {endIcon}
          </span>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }