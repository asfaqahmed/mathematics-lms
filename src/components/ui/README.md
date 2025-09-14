# UI Components Library

A comprehensive, type-safe UI component library for the Mathematics LMS built with React, TypeScript, and Tailwind CSS.

## Overview

This UI library provides a set of reusable, accessible, and customizable components following modern design patterns and best practices.

### Key Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Accessible**: WCAG 2.1 compliant with proper ARIA attributes
- **Customizable**: Built with class-variance-authority for flexible styling
- **Consistent**: Unified design system with dark theme support
- **Compound Components**: Logical component composition patterns
- **Animation Ready**: Framer Motion integration for smooth transitions

## Installation

The library uses the following key dependencies:

```bash
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

## Quick Start

```tsx
import { Button, Card, Input, Modal } from '@/components/ui'

function Example() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Welcome</Card.Title>
        <Card.Description>Get started with our components</Card.Description>
      </Card.Header>
      <Card.Body>
        <Input label="Email" placeholder="Enter your email" />
      </Card.Body>
      <Card.Footer>
        <Button>Get Started</Button>
      </Card.Footer>
    </Card>
  )
}
```

## Components

### Core Components

#### Button
Versatile button component with multiple variants and states.

```tsx
<Button variant="primary" size="lg" loading={isLoading}>
  Save Changes
</Button>

<Button variant="outline" startIcon={<FiEdit />}>
  Edit
</Button>
```

**Props:**
- `variant`: primary, secondary, destructive, outline, ghost, link, success, warning
- `size`: sm, default, lg, xl, icon
- `loading`: boolean
- `fullWidth`: boolean
- `startIcon`, `endIcon`: ReactNode

#### Input
Form input component with validation states and icons.

```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  startIcon={<FiMail />}
  required
/>
```

**Props:**
- `variant`: default, error, success
- `inputSize`: sm, default, lg
- `label`, `error`, `success`, `helperText`: string
- `startIcon`, `endIcon`: ReactNode

#### Card
Flexible container component with compound pattern.

```tsx
<Card variant="glass" padding="lg">
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

**Props:**
- `variant`: default, glass, gradient, solid, transparent, elevated
- `padding`: none, sm, default, lg, xl

#### Modal
Accessible modal component with animations.

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="lg"
>
  <Modal.Body>Are you sure?</Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="destructive" onClick={handleDelete}>
      Delete
    </Button>
  </Modal.Footer>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: sm, default, lg, xl, full
- `closeOnOverlayClick`, `closeOnEsc`: boolean

### Utility Components

#### Typography
Consistent text styling components.

```tsx
<H1>Main Heading</H1>
<H2 color="primary">Section Title</H2>
<P variant="lead">Lead paragraph text</P>
<Code>console.log('Hello')</Code>
```

#### Layout
Flexible layout components for consistent spacing.

```tsx
<Container maxWidth="6xl">
  <Stack space={6}>
    <H1>Title</H1>
    <HStack space={4} justify="between">
      <Button>Cancel</Button>
      <Button variant="primary">Save</Button>
    </HStack>
  </Stack>
</Container>
```

#### Badge
Status indicators and labels.

```tsx
<Badge variant="success">Active</Badge>
<StatusBadge status="pending" />
<DotBadge show={hasNotifications} position="top-right" />
```

#### Alert
Important message display with variants.

```tsx
<Alert variant="success" title="Success!">
  Your changes have been saved.
</Alert>

<Alert variant="destructive" dismissible onDismiss={handleDismiss}>
  Something went wrong.
</Alert>
```

#### Spinner
Loading indicators with different styles.

```tsx
<Spinner size="lg" variant="primary" />
<LoadingDots className="text-primary-500" />
<Skeleton className="h-4 w-32" />
```

## Form Components

### FormField
Generic form field wrapper with validation.

```tsx
<FormField
  name="email"
  label="Email"
  type="email"
  error={errors.email}
  required
/>

// With custom field
<FormField name="description" label="Description" error={errors.description}>
  <textarea name="description" rows={4} />
</FormField>
```

### Pre-built Forms

#### LoginForm
Complete login form with validation.

```tsx
<LoginForm
  onSuccess={(user) => console.log('Logged in:', user)}
  redirectTo="/dashboard"
  showRegisterLink
/>
```

#### RegisterForm
User registration form.

```tsx
<RegisterForm
  onSuccess={(user) => console.log('Registered:', user)}
  showPhoneField
  showLoginLink
/>
```

#### ContactForm
Contact form with categories.

```tsx
<ContactForm
  title="Get in Touch"
  onSuccess={(data) => handleSubmit(data)}
  showCategory
/>
```

#### SearchForm
Advanced search with filters.

```tsx
<SearchForm
  onSearch={(data) => handleSearch(data)}
  enableRealTimeSearch
  showFilters
  trendingSearches={['Algebra', 'Calculus']}
/>
```

## Styling System

### Variants
Components use class-variance-authority for consistent variant management:

```tsx
const buttonVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white',
        secondary: 'bg-secondary-600 text-white',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        lg: 'px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'sm',
    },
  }
)
```

### Theme
Components follow a consistent dark theme with these key colors:

- **Primary**: Blue/Purple gradient
- **Dark backgrounds**: dark-700, dark-800, dark-900
- **Text**: white, gray-300, gray-400
- **Borders**: dark-600, dark-700
- **Status colors**: red, green, yellow, blue variants

### Custom Styling
Use the `cn()` utility function for conditional classes:

```tsx
import { cn } from '@/lib/utils'

<Button className={cn('custom-class', isActive && 'active-class')} />
```

## Accessibility

All components follow accessibility best practices:

- **Keyboard Navigation**: Tab/Shift+Tab, Arrow keys, Enter, Escape
- **Screen Readers**: ARIA labels, roles, and states
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: WCAG AA compliant color ratios
- **Error Handling**: Clear error messages with proper associations

### ARIA Attributes
Components automatically include appropriate ARIA attributes:

```tsx
<Input
  aria-invalid={!!error}
  aria-describedby={error ? 'input-error' : undefined}
/>

<Modal role="dialog" aria-modal="true" aria-labelledby="modal-title" />

<Alert role="alert" aria-live="polite" />
```

## Animation

Components support Framer Motion animations:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>
  <Card>Content</Card>
</motion.div>
```

## Best Practices

### Component Composition
Use compound components for related functionality:

```tsx
// ✅ Good
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Body>Content</Card.Body>
</Card>

// ❌ Avoid
<Card title="Title">Content</Card>
```

### Type Safety
Always use TypeScript with proper typing:

```tsx
interface MyComponentProps {
  title: string
  optional?: boolean
}

const MyComponent: React.FC<MyComponentProps> = ({ title, optional = false }) => {
  // Component implementation
}
```

### Error Handling
Provide clear error states and messages:

```tsx
<Input
  error={errors.email}
  helperText="We'll never share your email"
/>

<Alert variant="destructive">
  <Alert.Title>Error</Alert.Title>
  <Alert.Description>
    Please fix the errors and try again.
  </Alert.Description>
</Alert>
```

### Loading States
Always provide feedback for async operations:

```tsx
<Button loading={isSubmitting} loadingText="Saving...">
  Save Changes
</Button>

<div className="space-y-2">
  <Skeleton className="h-4 w-32" />
  <Skeleton className="h-4 w-24" />
</div>
```

## Migration Guide

### From Existing Components

To migrate from the existing JavaScript components:

1. **Import from new location:**
   ```tsx
   // Old
   import Button from '../ui/Button'

   // New
   import { Button } from '@/components/ui'
   ```

2. **Update prop names:**
   ```tsx
   // Old
   <Button variant="primary" size="md" />

   // New
   <Button variant="default" size="default" />
   ```

3. **Add TypeScript types:**
   ```tsx
   interface Props {
     onSubmit: (data: FormData) => void
   }
   ```

### Breaking Changes

- Component file extensions changed from `.js` to `.tsx`
- Some prop names have been standardized (e.g., `size="md"` → `size="default"`)
- CSS classes are now managed through variants instead of manual className props
- forwardRef is now properly typed with generic constraints

## Contributing

### Adding New Components

1. Create the component in `/src/components/ui/`
2. Follow the existing patterns (forwardRef, cva variants, TypeScript)
3. Add proper accessibility attributes
4. Include comprehensive JSDoc comments
5. Export from the index.ts file
6. Add documentation and examples

### Modifying Existing Components

1. Ensure backward compatibility when possible
2. Update TypeScript types accordingly
3. Test with existing usage patterns
4. Update documentation

## Support

For questions or issues with the UI library, please:

1. Check the component documentation and examples
2. Review the TypeScript types for available props
3. Look at existing usage in the codebase
4. Create an issue with a minimal reproduction case

## Future Roadmap

- [ ] Storybook integration for component documentation
- [ ] Automated accessibility testing
- [ ] Theme customization system
- [ ] Additional animation presets
- [ ] Component performance optimizations
- [ ] Mobile-specific component variants