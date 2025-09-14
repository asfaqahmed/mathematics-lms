import React, { forwardRef, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const containerVariants = cva(
  'w-full mx-auto px-4 sm:px-6',
  {
    variants: {
      maxWidth: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full',
        screen: 'max-w-screen-2xl',
      },
      padding: {
        none: 'px-0',
        sm: 'px-4',
        md: 'px-4 sm:px-6',
        lg: 'px-4 sm:px-6 lg:px-8',
      },
    },
    defaultVariants: {
      maxWidth: '7xl',
      padding: 'lg',
    },
  }
)

const flexVariants = cva(
  'flex',
  {
    variants: {
      direction: {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        col: 'flex-col',
        'col-reverse': 'flex-col-reverse',
      },
      justify: {
        start: 'justify-start',
        end: 'justify-end',
        center: 'justify-center',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
      },
      align: {
        start: 'items-start',
        end: 'items-end',
        center: 'items-center',
        baseline: 'items-baseline',
        stretch: 'items-stretch',
      },
      wrap: {
        nowrap: 'flex-nowrap',
        wrap: 'flex-wrap',
        'wrap-reverse': 'flex-wrap-reverse',
      },
      gap: {
        0: 'gap-0',
        1: 'gap-1',
        2: 'gap-2',
        3: 'gap-3',
        4: 'gap-4',
        5: 'gap-5',
        6: 'gap-6',
        8: 'gap-8',
        10: 'gap-10',
        12: 'gap-12',
      },
    },
    defaultVariants: {
      direction: 'row',
      justify: 'start',
      align: 'start',
      wrap: 'nowrap',
      gap: 0,
    },
  }
)

const gridVariants = cva(
  'grid',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
        12: 'grid-cols-12',
      },
      gap: {
        0: 'gap-0',
        1: 'gap-1',
        2: 'gap-2',
        3: 'gap-3',
        4: 'gap-4',
        5: 'gap-5',
        6: 'gap-6',
        8: 'gap-8',
        10: 'gap-10',
        12: 'gap-12',
      },
      responsive: {
        true: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        false: '',
      },
    },
    defaultVariants: {
      cols: 1,
      gap: 4,
      responsive: false,
    },
  }
)

// Container Component
export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  /**
   * Additional CSS class name(s).
   */
  className?: string
  /**
   * Container content.
   */
  children: ReactNode
}

/**
 * Container component that provides consistent max-width and padding.
 *
 * @example
 * ```tsx
 * <Container maxWidth="6xl" padding="lg">
 *   <h1>Content within container</h1>
 * </Container>
 * ```
 */
const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, maxWidth, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(containerVariants({ maxWidth, padding }), className)}
        {...props}
      />
    )
  }
)
Container.displayName = 'Container'

// Flex Component
export interface FlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {
  /**
   * Additional CSS class name(s).
   */
  className?: string
  /**
   * Flex content.
   */
  children: ReactNode
}

/**
 * Flex component that provides flexible layout utilities.
 *
 * @example
 * ```tsx
 * <Flex direction="row" justify="between" align="center" gap={4}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Flex>
 * ```
 */
const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({ className, direction, justify, align, wrap, gap, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(flexVariants({ direction, justify, align, wrap, gap }), className)}
        {...props}
      />
    )
  }
)
Flex.displayName = 'Flex'

// Grid Component
export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  /**
   * Additional CSS class name(s).
   */
  className?: string
  /**
   * Grid content.
   */
  children: ReactNode
}

/**
 * Grid component that provides CSS Grid layout utilities.
 *
 * @example
 * ```tsx
 * <Grid cols={3} gap={6} responsive>
 *   <div>Grid item 1</div>
 *   <div>Grid item 2</div>
 *   <div>Grid item 3</div>
 * </Grid>
 * ```
 */
const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, responsive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants({ cols, gap, responsive }), className)}
        {...props}
      />
    )
  }
)
Grid.displayName = 'Grid'

// Stack Component - vertical flex layout
export interface StackProps extends Omit<FlexProps, 'direction'> {
  /**
   * Space between stack items.
   */
  space?: VariantProps<typeof flexVariants>['gap']
}

/**
 * Stack component for vertical layouts with consistent spacing.
 *
 * @example
 * ```tsx
 * <Stack space={4} align="center">
 *   <h1>Title</h1>
 *   <p>Content</p>
 *   <Button>Action</Button>
 * </Stack>
 * ```
 */
const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ space, ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="col"
        gap={space}
        {...props}
      />
    )
  }
)
Stack.displayName = 'Stack'

// HStack Component - horizontal flex layout
export interface HStackProps extends Omit<FlexProps, 'direction'> {
  /**
   * Space between stack items.
   */
  space?: VariantProps<typeof flexVariants>['gap']
}

/**
 * HStack component for horizontal layouts with consistent spacing.
 *
 * @example
 * ```tsx
 * <HStack space={4} align="center">
 *   <Button>Cancel</Button>
 *   <Button>Save</Button>
 * </HStack>
 * ```
 */
const HStack = forwardRef<HTMLDivElement, HStackProps>(
  ({ space, ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="row"
        gap={space}
        {...props}
      />
    )
  }
)
HStack.displayName = 'HStack'

// Section Component
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Additional CSS class name(s).
   */
  className?: string
  /**
   * Section content.
   */
  children: ReactNode
}

/**
 * Section component for semantic page sections.
 *
 * @example
 * ```tsx
 * <Section className="py-12">
 *   <Container>
 *     <h2>Section Title</h2>
 *     <p>Section content</p>
 *   </Container>
 * </Section>
 * ```
 */
const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn('py-8 md:py-12', className)}
        {...props}
      />
    )
  }
)
Section.displayName = 'Section'

// Box Component - generic container
export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The HTML element to render.
   */
  as?: keyof JSX.IntrinsicElements
  /**
   * Additional CSS class name(s).
   */
  className?: string
  /**
   * Box content.
   */
  children: ReactNode
}

/**
 * Box component - a generic container element.
 *
 * @example
 * ```tsx
 * <Box as="article" className="p-4 border rounded">
 *   Article content
 * </Box>
 * ```
 */
const Box = forwardRef<HTMLDivElement, BoxProps>(
  ({ as: Component = 'div', className, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={className}
        {...props}
      />
    )
  }
)
Box.displayName = 'Box'

export {
  Container,
  Flex,
  Grid,
  Stack,
  HStack,
  Section,
  Box,
  containerVariants,
  flexVariants,
  gridVariants,
}