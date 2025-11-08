# Testing Guide

This document provides comprehensive information about the testing setup and practices for the Mathematics LMS application.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Setup Instructions](#setup-instructions)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The Mathematics LMS uses a comprehensive testing strategy that includes:

- **Unit Tests**: Testing individual functions and components in isolation
- **Integration Tests**: Testing interactions between different parts of the system
- **End-to-End (E2E) Tests**: Testing complete user workflows
- **Database Tests**: Testing database operations and constraints

### Testing Stack

- **Jest**: Unit and integration testing framework
- **React Testing Library**: React component testing utilities
- **Playwright**: End-to-end testing framework
- **MSW (Mock Service Worker)**: API mocking for tests
- **Supertest**: HTTP assertion library for API testing

## Test Types

### 1. Unit Tests

Unit tests focus on testing individual functions, components, and modules in isolation.

**Location**: `tests/api/`, `tests/components/`, `tests/utils/`

**Examples**:
- API route handlers
- React components
- Utility functions (validators, formatters)
- Business logic functions

### 2. Integration Tests

Integration tests verify that different parts of the system work correctly together.

**Location**: `tests/integration/`

**Examples**:
- Payment processing workflows
- Database operations with multiple tables
- API endpoints with external services

### 3. End-to-End Tests

E2E tests simulate real user interactions with the complete application.

**Location**: `tests/e2e/`

**Examples**:
- User registration and login flows
- Course purchase workflows
- Payment processing end-to-end

### 4. Database Tests

Database tests verify data integrity, constraints, and complex queries.

**Location**: `tests/integration/database.test.js`

**Examples**:
- Foreign key constraints
- Data validation rules
- Performance of complex queries

## Setup Instructions

### Prerequisites

1. Node.js (version 18 or higher)
2. npm or yarn package manager
3. Test database (Supabase local instance recommended)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables for testing:
```bash
# Create .env.test file
cp .env.example .env.test

# Update test environment variables
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-key
STRIPE_SECRET_KEY=sk_test_your-test-key
PAYHERE_MERCHANT_ID=test-merchant
PAYHERE_SECRET=test-secret
```

3. Set up test database (if using Supabase local):
```bash
npx supabase start
npx supabase db reset
```

4. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
# or
npx jest --testPathPattern="tests/(api|components|utils)"
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### E2E Tests with UI
```bash
npm run test:e2e:ui
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Writing Tests

### Unit Test Example

```javascript
// tests/utils/validators.test.js
import { isValidEmail } from '../../utils/validators'

describe('isValidEmail', () => {
  it('should validate correct email formats', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
  })

  it('should reject invalid email formats', () => {
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})
```

### Component Test Example

```javascript
// tests/components/ui/Button.test.js
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../../../components/ui/Button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Clickable</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### API Test Example

```javascript
// tests/api/auth/login.test.js
import handler from '../../../pages/api/auth/login'
import { createMockRequestResponse } from '../../utils/test-helpers'

describe('/api/auth/login', () => {
  it('should handle successful login', async () => {
    const { req, res } = createMockRequestResponse('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const response = JSON.parse(res._getData())
    expect(response.message).toBe('Login successful')
  })
})
```

### E2E Test Example

```javascript
// tests/e2e/user-login.spec.js
const { test, expect } = require('@playwright/test')

test('should login successfully', async ({ page }) => {
  await page.goto('/auth/login')
  
  await page.fill('[placeholder*="email"]', 'test@example.com')
  await page.fill('[placeholder*="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
})
```

## Test Structure

```
tests/
├── mocks/
│   ├── handlers.js          # MSW request handlers
│   └── server.js            # MSW server setup
├── utils/
│   ├── test-helpers.js      # Test utility functions
│   ├── validators.test.js   # Validator utility tests
│   └── formatters.test.js   # Formatter utility tests
├── api/
│   ├── auth/
│   │   ├── login.test.js
│   │   └── register.test.js
│   ├── courses/
│   │   └── index.test.js
│   └── test-payment.test.js
├── components/
│   ├── ui/
│   │   └── Button.test.js
│   ├── course/
│   │   └── CourseCard.test.js
│   └── payment/
│       └── PaymentModal.test.js
├── integration/
│   ├── payment-flow.test.js
│   └── database.test.js
└── e2e/
    ├── user-login.spec.js
    ├── user-registration.spec.js
    └── course-purchase.spec.js
```

## Best Practices

### General Guidelines

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
3. **Isolation**: Each test should be independent and not rely on other tests
4. **Mocking**: Mock external dependencies to ensure tests are reliable and fast

### Unit Testing

- Test one thing at a time
- Use meaningful assertions
- Test both happy path and error cases
- Mock external dependencies

### Integration Testing

- Test realistic scenarios
- Use actual database connections when needed
- Test error handling and edge cases
- Verify data consistency

### E2E Testing

- Test critical user journeys
- Use realistic test data
- Keep tests maintainable
- Run against staging environment when possible

### Component Testing

- Test user interactions, not implementation details
- Use semantic queries (by role, label, text)
- Test accessibility features
- Mock external API calls

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## Troubleshooting

### Common Issues

#### Jest Tests Not Running
```bash
# Clear Jest cache
npx jest --clearCache

# Check Jest configuration
npx jest --showConfig
```

#### Playwright Tests Failing
```bash
# Update browser binaries
npx playwright install

# Run with debug mode
npx playwright test --debug
```

#### Database Connection Issues
```bash
# Check Supabase local instance
npx supabase status

# Reset test database
npx supabase db reset
```

#### Mock Service Worker Issues
```bash
# Verify MSW setup in jest.setup.js
# Check handler configuration in tests/mocks/handlers.js
```

### Environment Variables

Make sure all required environment variables are set in your test environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `PAYHERE_MERCHANT_ID`
- `PAYHERE_SECRET`

### Test Database Setup

For integration and database tests, ensure you have a separate test database:

1. Use Supabase local development setup
2. Or create a dedicated test database instance
3. Apply all necessary migrations
4. Seed with test data if needed

## Test Coverage Goals

- **Unit Tests**: Aim for 80%+ code coverage
- **Integration Tests**: Cover all critical business workflows
- **E2E Tests**: Cover primary user journeys
- **API Tests**: Test all endpoints with various scenarios

## Continuous Improvement

Regularly review and update tests:

1. Add tests for new features
2. Update tests when requirements change
3. Remove or refactor flaky tests
4. Monitor test performance and optimize slow tests
5. Review test coverage reports

For questions or issues with testing, please refer to the project documentation or create an issue in the repository.