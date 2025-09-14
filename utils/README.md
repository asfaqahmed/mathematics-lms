# Utilities Documentation

This directory contains a comprehensive set of reusable utility functions for the MathPro Academy LMS application, written in TypeScript with proper type safety and documentation.

## Overview

The utilities are organized into focused modules, each handling a specific domain of functionality:

- **`api.ts`** - HTTP request utilities, error handling, response parsing
- **`auth.ts`** - Authentication helpers, token management, user role checks
- **`validation.ts`** - Form validation helpers, data sanitization
- **`format.ts`** - Data formatting (dates, currency, time, etc.)
- **`file.ts`** - File handling, upload utilities, validation
- **`course.ts`** - Course-specific utilities, progress calculations
- **`storage.ts`** - Local storage, session storage helpers
- **`error.ts`** - Error handling, logging, user-friendly messages
- **`constants.ts`** - Application constants and configuration
- **`video.ts`** - Video utilities for YouTube, Vimeo, and direct videos
- **`types.ts`** - TypeScript type definitions
- **`index.ts`** - Central export file

## Usage

### Basic Import

```typescript
// Import specific utilities
import { formatCurrency, validateEmail, getVideoType } from '../utils'

// Import from specific modules
import { formatCurrency } from '../utils/format'
import { validateEmail } from '../utils/validation'
import { getVideoType } from '../utils/video'
```

### Namespace Import

```typescript
import utils from '../utils'

// Use with namespace
const price = utils.format.currency(1500000)
const isValid = utils.validation.isValidEmail('test@example.com')
const videoType = utils.video.getType('https://youtube.com/watch?v=123')
```

### Legacy Compatibility

The utilities maintain compatibility with existing function names through aliases:

```typescript
// These imports still work
import { formatCurrency as formatPrice } from '../utils/format'
import { isValidEmail } from '../utils/validation'
```

## Key Features

### Type Safety
All utilities are written in TypeScript with comprehensive type definitions:

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[] | Record<string, string>;
}

interface VideoMetadata {
  type: 'youtube' | 'supabase' | 'direct' | 'unknown';
  id?: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
  accessible: boolean;
}
```

### Error Handling
Comprehensive error handling with user-friendly messages:

```typescript
import { errorHandler, getUserFriendlyMessage } from '../utils/error'

try {
  // Some operation
} catch (error) {
  const appError = errorHandler.handleError(error)
  const userMessage = getUserFriendlyMessage(appError)
  showNotification(userMessage)
}
```

### Storage Management
Unified storage interface with encryption and expiration:

```typescript
import { localStorage, secureStorage, expiringStorage } from '../utils/storage'

// Regular storage
localStorage.set('user_preferences', preferences)

// Encrypted storage
secureStorage.set('sensitive_data', data)

// Storage with expiration
expiringStorage.set('temp_data', data, 30 * 60 * 1000) // 30 minutes
```

### Authentication
Complete authentication utilities:

```typescript
import { TokenManager, isAdmin, permissions } from '../utils/auth'

// Token management
TokenManager.setTokens(tokenData)
const isAuthenticated = TokenManager.isAuthenticated()

// Role checking
if (isAdmin(user)) {
  // Admin only functionality
}

// Permission checking
if (permissions.canManageCourses(user)) {
  // Course management functionality
}
```

### API Utilities
Standardized HTTP requests with retries and error handling:

```typescript
import { get, post, createApiClient } from '../utils/api'

// Simple requests
const courses = await get('/api/courses')
const result = await post('/api/courses', courseData)

// API client with base URL and headers
const api = createApiClient('/api', {
  'Authorization': `Bearer ${token}`
})

const courses = await api.get('/courses')
```

### Validation
Comprehensive form and data validation:

```typescript
import { validateForm, isValidEmail, sanitize } from '../utils/validation'

// Form validation
const result = validateForm(formData, {
  email: { required: true, email: true },
  name: { required: true, minLength: 2, maxLength: 50 },
  age: { required: true, min: 18, max: 120 }
})

// Data sanitization
const cleanData = sanitize.html(userInput)
const slug = sanitize.slug(title)
```

### Formatting
Consistent data formatting across the application:

```typescript
import { formatCurrency, formatDate, formatDuration } from '../utils/format'

const price = formatCurrency(1500000) // "Rs. 1,500,000"
const date = formatDate(new Date(), 'long') // "January 13, 2025"
const duration = formatDuration(125) // "2h 5m"
```

### File Handling
Complete file upload and processing utilities:

```typescript
import { validateFile, resizeImage, FileUploadTracker } from '../utils/file'

// File validation
const result = validateFile(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png']
})

// Image processing
const resizedImage = await resizeImage(file, {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.8
})

// Upload tracking
const tracker = new FileUploadTracker()
tracker.addFile('upload-1', file)
tracker.onProgress('upload-1', (progress, status) => {
  console.log(`Upload ${progress}% ${status}`)
})
```

### Course Utilities
Specialized utilities for course management:

```typescript
import {
  calculateCourseProgress,
  getNextLesson,
  generateCertificateData
} from '../utils/course'

// Progress calculation
const progress = calculateCourseProgress(completedLessons, totalLessons)

// Get next lesson
const nextLesson = getNextLesson(lessons, completedLessons)

// Generate certificate
const certificate = generateCertificateData(user, course, progress)
```

### Video Utilities
Enhanced video handling for multiple platforms:

```typescript
import {
  getVideoType,
  validateVideoUrl,
  getYouTubeEmbedUrl,
  getVideoThumbnail
} from '../utils/video'

// Detect video type
const type = getVideoType(url) // 'youtube' | 'vimeo' | 'direct' | 'supabase'

// Validate video
const result = validateVideoUrl(url)
if (result.valid) {
  const embedUrl = getYouTubeEmbedUrl(url)
  const thumbnail = getVideoThumbnail(url)
}
```

## Migration from Legacy Utilities

The new utilities maintain backward compatibility while providing enhanced functionality:

### Old vs New

```typescript
// OLD
import { formatCurrency } from '../utils/formatters'
import { isValidEmail } from '../utils/validators'
import { getYouTubeId } from '../utils/youtube'

// NEW (preferred)
import { formatCurrency, isValidEmail, extractYouTubeId } from '../utils'

// Or from specific modules
import { formatCurrency } from '../utils/format'
import { isValidEmail } from '../utils/validation'
import { extractYouTubeId } from '../utils/video'
```

### Enhanced Functionality

The new utilities provide enhanced features:

- **Type Safety**: Full TypeScript support with intellisense
- **Error Handling**: Consistent error handling across all utilities
- **Documentation**: Comprehensive JSDoc comments
- **Performance**: Optimized implementations with caching
- **Extensibility**: Modular design for easy extension

## Best Practices

1. **Use Type-Safe Imports**: Always import with proper types
2. **Handle Errors**: Use the error utilities for consistent error handling
3. **Validate Data**: Use validation utilities before processing user input
4. **Cache Results**: Utilize storage utilities for caching when appropriate
5. **Log Events**: Use the logging utilities for debugging and monitoring

## Constants and Configuration

All application constants are centralized in `constants.ts`:

```typescript
import {
  API_ENDPOINTS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  FEATURE_FLAGS
} from '../utils/constants'

// API endpoints
const coursesUrl = API_ENDPOINTS.COURSES.LIST

// Validation rules
const nameMinLength = VALIDATION_RULES.NAME.MIN_LENGTH

// Feature flags
if (FEATURE_FLAGS.ENABLE_PAYHERE) {
  // PayHere functionality
}
```

## Development

When adding new utilities:

1. Create focused modules for specific functionality
2. Include comprehensive TypeScript types
3. Add JSDoc documentation
4. Include error handling
5. Write unit tests
6. Update the main index.ts export
7. Update this documentation

## Testing

Test files are located in the `tests/utils/` directory and have been updated to use the new utility structure.

```bash
# Run utility tests
npm test tests/utils/
```