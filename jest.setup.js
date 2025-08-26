import '@testing-library/jest-dom'
import { server } from './tests/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
process.env.PAYHERE_MERCHANT_ID = 'test-merchant'
process.env.PAYHERE_SECRET = 'test-secret'