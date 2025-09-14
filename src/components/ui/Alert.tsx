import React, { forwardRef, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi'
import { Button } from './Button'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-dark-800 text-white border-dark-600',
        destructive: 'border-red-500/50 text-red-400 bg-red-500/10 [&>svg]:text-red-400',
        success: 'border-green-500/50 text-green-400 bg-green-500/10 [&>svg]:text-green-400',
        warning: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10 [&>svg]:text-yellow-400',
        info: 'border-blue-500/50 text-blue-400 bg-blue-500/10 [&>svg]:text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * The title of the alert.
   */
  title?: string
  /**
   * Custom icon to display. If not provided, default icons will be used based on variant.
   */
  icon?: ReactNode
  /**
   * Whether to show the default icon.
   */
  showIcon?: boolean
  /**
   * Whether the alert can be dismissed.
   */
  dismissible?: boolean
  /**
   * Callback function when alert is dismissed.
   */
  onDismiss?: () => void
}

const defaultIcons = {
  default: FiInfo,
  destructive: FiAlertCircle,
  success: FiCheckCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
}

/**
 * Alert component for displaying important messages to users.
 *
 * @example
 * ```tsx
 * <Alert variant="success" title="Success!">
 *   Your changes have been saved successfully.
 * </Alert>
 *
 * <Alert variant="destructive" dismissible onDismiss={() => setShowAlert(false)}>
 *   <Alert.Title>Error</Alert.Title>
 *   <Alert.Description>
 *     Something went wrong. Please try again.
 *   </Alert.Description>
 * </Alert>
 * ```
 */
const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'default',
      title,
      icon,
      showIcon = true,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const IconComponent = defaultIcons[variant || 'default']

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && (
          <>
            {icon || <IconComponent className="h-4 w-4" />}
          </>
        )}

        <div className="flex-1">
          {title && (
            <h5 className="mb-1 font-medium leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-sm [&_p]:leading-relaxed">
            {children}
          </div>
        </div>

        {dismissible && onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 rounded-md hover:bg-black/10"
            onClick={onDismiss}
            aria-label="Dismiss alert"
          >
            <FiX className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }
)

Alert.displayName = 'Alert'

/**
 * Alert title component.
 */
const AlertTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
)
AlertTitle.displayName = 'Alert.Title'

/**
 * Alert description component.
 */
const AlertDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
)
AlertDescription.displayName = 'Alert.Description'

// Compound components
Alert.Title = AlertTitle
Alert.Description = AlertDescription

export { Alert, AlertTitle, AlertDescription, alertVariants }