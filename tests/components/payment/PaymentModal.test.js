import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { toast } from 'react-hot-toast'
import PaymentModal from '../../../components/payment/PaymentModal'
import { supabase } from '../../../lib/supabase'
import axios from 'axios'

// Mock dependencies
jest.mock('react-hot-toast')
jest.mock('axios')
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'payment-123' },
            error: null
          }))
        }))
      }))
    }))
  }
}))

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    redirectToCheckout: jest.fn()
  }))
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <div>{children}</div>
}))

// Mock global PayHere
const mockPayHere = {
  startPayment: jest.fn(),
  onCompleted: null,
  onDismissed: null,
  onError: null
}

Object.defineProperty(window, 'payhere', {
  value: mockPayHere,
  writable: true
})

const mockCourse = {
  id: 'course-1',
  title: 'Advanced Mathematics',
  description: 'Learn advanced math concepts',
  price: 5000,
  thumbnail: 'https://example.com/thumb.jpg',
  category: 'Mathematics'
}

const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+94771234567'
}

global.fetch = jest.fn()

describe('PaymentModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    toast.success = jest.fn()
    toast.error = jest.fn()
    toast.info = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders payment modal when open', () => {
    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    expect(screen.getByText('Complete Your Purchase')).toBeInTheDocument()
    expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument()
    expect(screen.getByText('LKR 5,000')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <PaymentModal 
        isOpen={false} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    expect(screen.queryByText('Complete Your Purchase')).not.toBeInTheDocument()
  })

  it('closes modal when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <PaymentModal 
        isOpen={true} 
        onClose={onClose} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('selects different payment methods', () => {
    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    // Default selection should be PayHere
    expect(screen.getByText('PayHere').closest('div')).toHaveClass('border-primary-500')

    // Click Stripe
    fireEvent.click(screen.getByText('Stripe'))
    expect(screen.getByText('Stripe').closest('div')).toHaveClass('border-primary-500')

    // Click Bank Transfer
    fireEvent.click(screen.getByText('Bank Transfer'))
    expect(screen.getByText('Bank Transfer').closest('div')).toHaveClass('border-primary-500')
  })

  it('shows bank transfer details when selected', () => {
    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    fireEvent.click(screen.getByText('Bank Transfer'))

    expect(screen.getByText('Bank Details:')).toBeInTheDocument()
    expect(screen.getByText('Commercial Bank of Ceylon')).toBeInTheDocument()
    expect(screen.getByText('Upload Transfer Receipt')).toBeInTheDocument()
  })

  it('handles PayHere payment initiation', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        hash: 'test-hash',
        merchant_id: 'test-merchant',
        order_id: 'test-order',
        amount: '5000.00'
      })
    })

    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    fireEvent.click(screen.getByText(`Pay LKR 5,000`))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/payments/payhere?action=start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: 'course-1',
          userId: 'user-1',
          amount: '5000',
          title: 'Advanced Mathematics'
        })
      })
    })

    expect(mockPayHere.startPayment).toHaveBeenCalled()
  })

  it('handles PayHere payment completion', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        hash: 'test-hash',
        merchant_id: 'test-merchant',
        order_id: 'test-order',
        amount: '5000.00'
      })
    })

    const onClose = jest.fn()
    delete window.location
    window.location = { reload: jest.fn() }

    render(
      <PaymentModal 
        isOpen={true} 
        onClose={onClose} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    fireEvent.click(screen.getByText(`Pay LKR 5,000`))

    await waitFor(() => {
      expect(mockPayHere.startPayment).toHaveBeenCalled()
    })

    // Simulate PayHere completion callback
    mockPayHere.onCompleted('test-order')

    expect(toast.success).toHaveBeenCalledWith('Payment completed successfully!')
    expect(onClose).toHaveBeenCalled()
    expect(window.location.reload).toHaveBeenCalled()
  })

  it('handles Stripe payment', async () => {
    const { loadStripe } = require('@stripe/stripe-js')
    const mockStripe = await loadStripe()
    
    axios.post.mockResolvedValue({
      data: { sessionId: 'cs_test_123' }
    })

    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    fireEvent.click(screen.getByText('Stripe'))
    fireEvent.click(screen.getByText(`Pay LKR 5,000`))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/payments/create-checkout', {
        courseId: 'course-1',
        userId: 'user-1'
      })
    })

    expect(mockStripe.redirectToCheckout).toHaveBeenCalledWith({
      sessionId: 'cs_test_123'
    })
  })

  it('handles bank transfer submission', async () => {
    const mockFile = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' })
    
    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    fireEvent.click(screen.getByText('Bank Transfer'))
    
    const fileInput = screen.getByLabelText('Upload Transfer Receipt')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    fireEvent.click(screen.getByText(`Pay LKR 5,000`))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('payments')
      expect(toast.success).toHaveBeenCalledWith('Bank transfer submitted for verification')
    })
  })

  it('requires receipt file for bank transfer', () => {
    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    fireEvent.click(screen.getByText('Bank Transfer'))
    fireEvent.click(screen.getByText(`Pay LKR 5,000`))

    expect(toast.error).toHaveBeenCalledWith('Please upload your bank transfer receipt')
  })

  it('disables pay button when loading', async () => {
    global.fetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    const payButton = screen.getByText(`Pay LKR 5,000`)
    fireEvent.click(payButton)

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(payButton).toBeDisabled()
    })
  })

  it('handles payment errors', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))

    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    fireEvent.click(screen.getByText(`Pay LKR 5,000`))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Payment initialization failed')
    })
  })

  it('handles PayHere payment dismissal', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        hash: 'test-hash',
        merchant_id: 'test-merchant',
        order_id: 'test-order',
        amount: '5000.00'
      })
    })

    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    fireEvent.click(screen.getByText(`Pay LKR 5,000`))

    await waitFor(() => {
      expect(mockPayHere.startPayment).toHaveBeenCalled()
    })

    // Simulate PayHere dismissal
    mockPayHere.onDismissed()

    expect(toast.info).toHaveBeenCalledWith('Payment was cancelled')
  })

  it('formats price correctly', () => {
    const expensiveCourse = { ...mockCourse, price: 15000 }
    
    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={expensiveCourse} 
        user={mockUser} 
      />
    )

    expect(screen.getByText('LKR 15,000')).toBeInTheDocument()
    expect(screen.getByText(`Pay LKR 15,000`)).toBeInTheDocument()
  })

  it('displays course information correctly', () => {
    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument()
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByAltText('Advanced Mathematics')).toHaveAttribute('src', 'https://example.com/thumb.jpg')
  })

  it('shows WhatsApp support link', () => {
    render(
      <PaymentModal 
        isOpen={true} 
        onClose={jest.fn()} 
        course={mockCourse} 
        user={mockUser} 
      />
    )

    const whatsappLink = screen.getByText('WhatsApp Support').closest('a')
    expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/94771234567')
  })
})