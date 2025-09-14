/**
 * HTTP Request Utilities
 * Provides standardized methods for API calls, error handling, and response parsing
 */

import type { ApiResponse } from './types';

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
}

/**
 * Create a standardized HTTP error
 */
export const createHttpError = (message: string, status?: number, response?: Response): HttpError => {
  const error = new Error(message) as HttpError;
  error.status = status;
  error.statusText = response?.statusText;
  error.response = response;
  return error;
};

/**
 * Default request configuration
 */
const DEFAULT_CONFIG: RequestConfig = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if an error is retryable (network errors, 5xx errors)
 */
const isRetryableError = (error: any): boolean => {
  if (!error.status) return true; // Network errors
  return error.status >= 500; // Server errors
};

/**
 * Make an HTTP request with timeout, retries, and error handling
 */
export const makeRequest = async <T = any>(
  url: string,
  config: RequestConfig = {}
): Promise<T> => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { timeout, retries, retryDelay, ...fetchConfig } = mergedConfig;

  let lastError: HttpError | null = null;

  for (let attempt = 0; attempt <= retries!; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMessage = await response.text().catch(() => response.statusText);
        throw createHttpError(
          `HTTP ${response.status}: ${errorMessage}`,
          response.status,
          response
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return await response.text() as any;

    } catch (error: any) {
      lastError = error.name === 'AbortError'
        ? createHttpError('Request timeout', 408)
        : createHttpError(error.message, error.status);

      // Don't retry on final attempt or non-retryable errors
      if (attempt === retries || !isRetryableError(lastError)) {
        break;
      }

      await sleep(retryDelay! * Math.pow(2, attempt)); // Exponential backoff
    }
  }

  throw lastError;
};

/**
 * GET request
 */
export const get = async <T = any>(
  url: string,
  config: RequestConfig = {}
): Promise<T> => {
  return makeRequest<T>(url, { ...config, method: 'GET' });
};

/**
 * POST request
 */
export const post = async <T = any>(
  url: string,
  data?: any,
  config: RequestConfig = {}
): Promise<T> => {
  return makeRequest<T>(url, {
    ...config,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PUT request
 */
export const put = async <T = any>(
  url: string,
  data?: any,
  config: RequestConfig = {}
): Promise<T> => {
  return makeRequest<T>(url, {
    ...config,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PATCH request
 */
export const patch = async <T = any>(
  url: string,
  data?: any,
  config: RequestConfig = {}
): Promise<T> => {
  return makeRequest<T>(url, {
    ...config,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * DELETE request
 */
export const del = async <T = any>(
  url: string,
  config: RequestConfig = {}
): Promise<T> => {
  return makeRequest<T>(url, { ...config, method: 'DELETE' });
};

/**
 * Upload file with progress tracking
 */
export const uploadFile = async (
  url: string,
  file: File,
  onProgress?: (progress: number) => void,
  config: RequestConfig = {}
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(createHttpError(`Upload failed: ${xhr.statusText}`, xhr.status));
      }
    });

    xhr.addEventListener('error', () => {
      reject(createHttpError('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(createHttpError('Upload aborted'));
    });

    xhr.open('POST', url);

    // Add headers from config
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        if (key !== 'Content-Type' && typeof value === 'string') {
          xhr.setRequestHeader(key, value);
        }
      });
    }

    xhr.send(formData);
  });
};

/**
 * Create API response wrapper
 */
export const createApiResponse = <T = any>(
  data?: T,
  message?: string,
  success = true
): ApiResponse<T> => {
  if (success) {
    return { success: true, data, message };
  } else {
    return { success: false, error: message };
  }
};

/**
 * Handle API response and extract data
 */
export const handleApiResponse = <T = any>(response: ApiResponse<T>): T => {
  if (response.success && response.data !== undefined) {
    return response.data;
  }

  throw new Error(response.error || 'Unknown API error');
};

/**
 * Create request interceptor for common headers (auth tokens, etc.)
 */
export const createApiClient = (baseURL: string, defaultHeaders: Record<string, string> = {}) => {
  const client = {
    get: <T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> =>
      get<T>(`${baseURL}${endpoint}`, {
        ...config,
        headers: { ...defaultHeaders, ...config.headers },
      }),

    post: <T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> =>
      post<T>(`${baseURL}${endpoint}`, data, {
        ...config,
        headers: { ...defaultHeaders, ...config.headers },
      }),

    put: <T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> =>
      put<T>(`${baseURL}${endpoint}`, data, {
        ...config,
        headers: { ...defaultHeaders, ...config.headers },
      }),

    patch: <T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> =>
      patch<T>(`${baseURL}${endpoint}`, data, {
        ...config,
        headers: { ...defaultHeaders, ...config.headers },
      }),

    delete: <T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> =>
      del<T>(`${baseURL}${endpoint}`, {
        ...config,
        headers: { ...defaultHeaders, ...config.headers },
      }),
  };

  return client;
};

/**
 * Common API endpoints - can be imported by other modules
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    REFRESH: '/api/auth/refresh',
  },
  COURSES: {
    LIST: '/api/courses',
    DETAIL: (id: string) => `/api/courses/${id}`,
    CREATE: '/api/courses/create',
    UPDATE: (id: string) => `/api/courses/${id}/update`,
    DELETE: (id: string) => `/api/courses/${id}/delete`,
  },
  LESSONS: {
    LIST: (courseId: string) => `/api/courses/${courseId}/lessons`,
    DETAIL: (courseId: string, lessonId: string) => `/api/courses/${courseId}/lessons/${lessonId}`,
    CREATE: (courseId: string) => `/api/courses/${courseId}/lessons`,
    UPDATE: (courseId: string, lessonId: string) => `/api/courses/${courseId}/lessons/${lessonId}`,
    DELETE: (courseId: string, lessonId: string) => `/api/courses/${courseId}/lessons/${lessonId}`,
    PROGRESS: (courseId: string, lessonId: string) => `/api/courses/${courseId}/lessons/${lessonId}/progress`,
  },
  PAYMENTS: {
    CREATE_CHECKOUT: '/api/payments/create-checkout',
    PAYHERE_CALLBACK: '/api/payments/payhere-callback',
    STRIPE_WEBHOOK: '/api/payments/stripe-webhook',
    APPROVE_BANK: '/api/payments/approve-bank',
    LIST: '/api/payments',
    DETAIL: (id: string) => `/api/payments/${id}`,
  },
  EMAIL: {
    SEND: '/api/email/send',
  },
  ADMIN: {
    USERS: '/api/admin/users',
    STATS: '/api/admin/stats',
    BULK_ACTIONS: '/api/admin/bulk-actions',
  },
} as const;