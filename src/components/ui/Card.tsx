import React, { forwardRef, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-lg border text-card-foreground',
  {
    variants: {
      variant: {
        default: 'bg-dark-800 border-dark-700',
        glass: 'bg-dark-800/50 backdrop-blur-sm border-dark-700/50',
        gradient: 'bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700',
        solid: 'bg-dark-700 border-dark-600',
        transparent: 'bg-transparent border-dark-600',
        elevated: 'bg-dark-800 border-dark-700 shadow-lg shadow-black/20',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Additional CSS class name(s) to apply to the card.
   */
  className?: string
}

/**
 * Card component for displaying content in a contained layout.
 *
 * @example
 * ```tsx
 * <Card variant="glass" padding="lg">
 *   <Card.Header>
 *     <Card.Title>Card Title</Card.Title>
 *     <Card.Description>Card description</Card.Description>
 *   </Card.Header>
 *   <Card.Body>
 *     Card content goes here
 *   </Card.Body>
 *   <Card.Footer>
 *     Footer content
 *   </Card.Footer>
 * </Card>
 * ```
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

/**
 * Card header component, typically used for titles and descriptions.
 */
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'Card.Header'

/**
 * Card title component with consistent typography.
 */
const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = 'Card.Title'

/**
 * Card description component with muted text color.
 */
const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-400', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'Card.Description'

/**
 * Card body component for main content.
 */
const CardBody = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-0', className)} {...props} />
  )
)
CardBody.displayName = 'Card.Body'

/**
 * Card footer component with top border.
 */
const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 mt-4 border-t border-dark-600', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'Card.Footer'

// Compound component pattern
Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Body = CardBody
Card.Footer = CardFooter

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  cardVariants,
}