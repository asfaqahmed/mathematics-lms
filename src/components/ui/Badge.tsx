import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gray-600 text-gray-100 hover:bg-gray-600/80',
        secondary: 'border-transparent bg-dark-600 text-gray-300 hover:bg-dark-600/80',
        destructive: 'border-transparent bg-red-600 text-white hover:bg-red-600/80',
        success: 'border-transparent bg-green-600 text-white hover:bg-green-600/80',
        warning: 'border-transparent bg-yellow-600 text-white hover:bg-yellow-600/80',
        info: 'border-transparent bg-blue-600 text-white hover:bg-blue-600/80',
        primary: 'border-transparent bg-primary-600 text-white hover:bg-primary-600/80',
        outline: 'border-gray-600 text-gray-300 hover:bg-gray-600/10',
        'outline-destructive': 'border-red-600 text-red-400 hover:bg-red-600/10',
        'outline-success': 'border-green-600 text-green-400 hover:bg-green-600/10',
        'outline-warning': 'border-yellow-600 text-yellow-400 hover:bg-yellow-600/10',
        'outline-info': 'border-blue-600 text-blue-400 hover:bg-blue-600/10',
        'outline-primary': 'border-primary-600 text-primary-400 hover:bg-primary-600/10',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Additional CSS class name(s).
   */
  className?: string
}

/**
 * Badge component for labels, status indicators, and tags.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="outline-warning">Pending</Badge>
 * <Badge variant="destructive" size="lg">Error</Badge>
 * ```
 */
const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

/**
 * Status badge component with predefined status variants.
 */
const StatusBadge = forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant'> & {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'error' | 'warning'
}>(
  ({ status, className, ...props }, ref) => {
    const statusVariants = {
      active: 'success',
      inactive: 'secondary',
      pending: 'warning',
      completed: 'success',
      error: 'destructive',
      warning: 'warning',
    } as const

    return (
      <Badge
        ref={ref}
        variant={statusVariants[status]}
        className={className}
        {...props}
      />
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

/**
 * Dot badge component for notification indicators.
 */
const DotBadge = forwardRef<HTMLDivElement, Omit<BadgeProps, 'children'> & {
  /**
   * Whether to show the dot badge.
   */
  show?: boolean
  /**
   * Position of the dot relative to its parent.
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}>(
  ({ show = true, position = 'top-right', className, variant = 'destructive', ...props }, ref) => {
    if (!show) return null

    const positionClasses = {
      'top-right': 'absolute -top-1 -right-1',
      'top-left': 'absolute -top-1 -left-1',
      'bottom-right': 'absolute -bottom-1 -right-1',
      'bottom-left': 'absolute -bottom-1 -left-1',
    }

    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size: 'sm' }),
          positionClasses[position],
          'w-2 h-2 p-0 rounded-full',
          className
        )}
        {...props}
      />
    )
  }
)

DotBadge.displayName = 'DotBadge'

export { Badge, StatusBadge, DotBadge, badgeVariants }