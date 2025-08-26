import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../../../components/ui/Button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('applies default variant and size', () => {
    render(<Button>Default Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('bg-primary-600')
    expect(button).toHaveClass('px-4', 'py-2', 'text-sm')
  })

  it('applies different variants correctly', () => {
    const variants = [
      { variant: 'primary', expectedClass: 'bg-primary-600' },
      { variant: 'secondary', expectedClass: 'bg-dark-700' },
      { variant: 'success', expectedClass: 'bg-green-600' },
      { variant: 'danger', expectedClass: 'bg-red-600' },
      { variant: 'warning', expectedClass: 'bg-yellow-600' },
      { variant: 'ghost', expectedClass: 'text-gray-300' },
      { variant: 'outline', expectedClass: 'border-primary-600' }
    ]

    variants.forEach(({ variant, expectedClass }) => {
      render(<Button variant={variant}>{variant} Button</Button>)
      const button = screen.getByText(`${variant} Button`)
      expect(button).toHaveClass(expectedClass)
    })
  })

  it('applies different sizes correctly', () => {
    const sizes = [
      { size: 'sm', expectedClasses: ['px-3', 'py-1.5', 'text-sm'] },
      { size: 'md', expectedClasses: ['px-4', 'py-2', 'text-sm'] },
      { size: 'lg', expectedClasses: ['px-6', 'py-3', 'text-base'] },
      { size: 'xl', expectedClasses: ['px-8', 'py-4', 'text-lg'] }
    ]

    sizes.forEach(({ size, expectedClasses }) => {
      render(<Button size={size}>{size} Button</Button>)
      const button = screen.getByText(`${size} Button`)
      expectedClasses.forEach(className => {
        expect(button).toHaveClass(className)
      })
    })
  })

  it('handles loading state correctly', () => {
    render(<Button loading>Loading Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(button).toHaveClass('cursor-not-allowed', 'opacity-50')
    // Check for loading spinner (FiLoader icon)
    const spinner = button.querySelector('svg')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('handles disabled state correctly', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(button).toHaveClass('cursor-not-allowed', 'opacity-50')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Clickable Button</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger click when disabled', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('does not trigger click when loading', () => {
    const handleClick = jest.fn()
    render(<Button loading onClick={handleClick}>Loading Button</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('custom-class')
  })

  it('applies custom type attribute', () => {
    render(<Button type="submit">Submit Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Button ref={ref}>Ref Button</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('passes through additional props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom label">Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('data-testid', 'custom-button')
    expect(button).toHaveAttribute('aria-label', 'Custom label')
  })

  it('renders children correctly with complex content', () => {
    render(
      <Button>
        <span>Complex</span>
        <strong>Content</strong>
      </Button>
    )
    
    const button = screen.getByRole('button')
    expect(button).toContainHTML('<span>Complex</span><strong>Content</strong>')
  })

  it('has correct focus styles', () => {
    render(<Button>Focus Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2')
  })

  it('has correct hover styles based on variant', () => {
    render(<Button variant="primary">Hover Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('hover:bg-primary-700')
  })

  it('combines loading and disabled states correctly', () => {
    render(<Button loading disabled>Loading Disabled Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(button).toHaveClass('cursor-not-allowed', 'opacity-50')
    
    const spinner = button.querySelector('svg')
    expect(spinner).toBeInTheDocument()
  })

  it('maintains button display name', () => {
    expect(Button.displayName).toBe('Button')
  })
})