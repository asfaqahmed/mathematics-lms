import React, { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const typographyVariants = cva(
  'text-white',
  {
    variants: {
      variant: {
        h1: 'scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl',
        h2: 'scroll-m-20 text-3xl font-semibold tracking-tight lg:text-4xl',
        h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
        h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
        h5: 'scroll-m-20 text-lg font-semibold tracking-tight',
        h6: 'scroll-m-20 text-base font-semibold tracking-tight',
        body: 'leading-7',
        bodyLarge: 'text-lg leading-7',
        bodySmall: 'text-sm leading-6',
        caption: 'text-sm text-gray-400',
        lead: 'text-xl text-gray-300 leading-7',
        muted: 'text-sm text-gray-500',
        code: 'relative rounded bg-dark-700 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-gray-300',
        blockquote: 'mt-6 border-l-2 border-primary-500 pl-6 italic text-gray-300',
      },
      color: {
        default: 'text-white',
        muted: 'text-gray-400',
        primary: 'text-primary-400',
        success: 'text-green-400',
        warning: 'text-yellow-400',
        destructive: 'text-red-400',
        info: 'text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'body',
      color: 'default',
    },
  }
)

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  /**
   * If set to `true`, the typography will be rendered as a child within the component.
   */
  asChild?: boolean
  /**
   * The HTML element to render. Defaults based on variant.
   */
  as?: keyof JSX.IntrinsicElements
}

const defaultElements = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body: 'p',
  bodyLarge: 'p',
  bodySmall: 'p',
  caption: 'span',
  lead: 'p',
  muted: 'p',
  code: 'code',
  blockquote: 'blockquote',
} as const

/**
 * Typography component for consistent text styling throughout the application.
 *
 * @example
 * ```tsx
 * <Typography variant="h1">Main Heading</Typography>
 * <Typography variant="body" color="muted">
 *   This is body text with muted color.
 * </Typography>
 * <Typography variant="code">console.log('Hello World')</Typography>
 * ```
 */
const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'body', color, asChild = false, as, ...props }, ref) => {
    const Comp = asChild
      ? Slot
      : (as || (variant && defaultElements[variant]) || 'p')

    return (
      <Comp
        ref={ref}
        className={cn(typographyVariants({ variant, color }), className)}
        {...props}
      />
    )
  }
)

Typography.displayName = 'Typography'

/**
 * Heading 1 component - shorthand for Typography variant="h1"
 */
const H1 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="h1" as="h1" {...props} />
  )
)
H1.displayName = 'H1'

/**
 * Heading 2 component - shorthand for Typography variant="h2"
 */
const H2 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="h2" as="h2" {...props} />
  )
)
H2.displayName = 'H2'

/**
 * Heading 3 component - shorthand for Typography variant="h3"
 */
const H3 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="h3" as="h3" {...props} />
  )
)
H3.displayName = 'H3'

/**
 * Heading 4 component - shorthand for Typography variant="h4"
 */
const H4 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="h4" as="h4" {...props} />
  )
)
H4.displayName = 'H4'

/**
 * Heading 5 component - shorthand for Typography variant="h5"
 */
const H5 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="h5" as="h5" {...props} />
  )
)
H5.displayName = 'H5'

/**
 * Heading 6 component - shorthand for Typography variant="h6"
 */
const H6 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="h6" as="h6" {...props} />
  )
)
H6.displayName = 'H6'

/**
 * Paragraph component - shorthand for Typography variant="body"
 */
const P = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="body" as="p" {...props} />
  )
)
P.displayName = 'P'

/**
 * Lead paragraph component - shorthand for Typography variant="lead"
 */
const Lead = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="lead" as="p" {...props} />
  )
)
Lead.displayName = 'Lead'

/**
 * Muted text component - shorthand for Typography variant="muted"
 */
const Muted = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="muted" as="p" {...props} />
  )
)
Muted.displayName = 'Muted'

/**
 * Code component - shorthand for Typography variant="code"
 */
const Code = forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="code" as="code" {...props} />
  )
)
Code.displayName = 'Code'

/**
 * Blockquote component - shorthand for Typography variant="blockquote"
 */
const Blockquote = forwardRef<HTMLQuoteElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography ref={ref} variant="blockquote" as="blockquote" {...props} />
  )
)
Blockquote.displayName = 'Blockquote'

export {
  Typography,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  P,
  Lead,
  Muted,
  Code,
  Blockquote,
  typographyVariants,
}