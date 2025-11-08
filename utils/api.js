/**
 * HTTP Request Utilities
 * Provides standardized methods for API calls, error handling, and response parsing
 */

/**
 * @typedef {Object} RequestConfig
 * @extends RequestInit
 * @property {number} [timeout]
 * @property {number} [retries]
 * @property {number} [retryDelay]
 */

/**
 * @typedef {Error} HttpError
 * @property {number} [status]
 * @property {string} [statusText]
 * @property {Response} [response]
 */

/**
 * Create a standardized HTTP error
 * @param {string} message
 * @param {number} [status]
 * @param {Response} [response]
 * @returns {HttpError}
 */
export const createHttpError = (message, status, response) => {
  const error = new Error(message);
  error.status = status;
  error.statusText = response?.statusText;
  error.response = response;
  return error;
};

/**
 * Default request configuration
 * @type {RequestConfig}
 */
const DEFAULT_CONFIG = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Sleep utility for retry delays
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if an error is retryable (network errors, 5xx errors)
 * @param {any} error
 * @returns {boolean}
 */
const isRetryableError = (error) => {
  if (!error.status) return true; // Network errors
  return error.status >= 500; // Server errors
};

/**
 * Make an HTTP request with timeout, retries, and error handling
 * @template T
 * @param {string} url
 * @param {RequestConfig} [config]
 * @returns {Promise<T>}
 */
export const makeRequest = async (url, config = {}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { timeout, retries, retryDelay, ...fetchConfig } = mergedConfig;

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
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

      return await response.text();

    } catch (error) {
      lastError = error.name === 'AbortError'
        ? createHttpError('Request timeout', 408)
        : createHttpError(error.message, error.status);

      // Don't retry on final attempt or non-retryable errors
      if (attempt === retries || !isRetryableError(lastError)) {
        break;
      }

      await sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
    }
  }

  throw lastError;
};

/**
 * GET request
 * @template T
 * @param {string} url
 * @param {RequestConfig} [config]
 * @returns {Promise<T>}
 */
export const get = async (url, config = {}) => {
  return makeRequest(url, { ...config, method: 'GET' });
};

/**
 * POST request
 * @template T
 * @param {string} url
 * @param {any} [data]
 * @param {RequestConfig} [config]
 * @returns {Promise<T>}
 */
export const post = async (url, data, config = {}) => {
  return makeRequest(url, {
    ...config,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PUT request
 * @template T
 * @param {string} url
 * @param {any} [data]
 * @param {RequestConfig} [config]
 * @returns {Promise<T>}
 */
export const put = async (url, data, config = {}) => {
  return makeRequest(url, {
    ...config,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PATCH request
 * @template T
 * @param {string} url
 * @param {any} [data]
 * @param {RequestConfig} [config]
 * @returns {Promise<T>}
 */
export const patch = async (url, data, config = {}) => {
  return makeRequest(url, {
    ...config,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * DELETE request
 * @template T
 * @param {string} url
 * @param {RequestConfig} [config]
 * @returns {Promise<T>}
 */
export const del = async (url, config = {}) => {
  return makeRequest(url, { ...config, method: 'DELETE' });
};

/**
 * Upload file with progress tracking
 * @param {string} url
 * @param {File} file
 * @param {(progress: number) => void} [onProgress]
 * @param {RequestConfig} [config]
 * @returns {Promise<any>}
 */
export const uploadFile = async (url, file, onProgress, config = {}) => {
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
 * @template T
 * @param {T} [data]
 * @param {string} [message]
 * @param {boolean} [success=true]
 * @returns {import('./types').ApiResponse<T>}
 */
export const createApiResponse = (data, message, success = true) => {
  if (success) {
    return { success: true, data, message };
  } else {
    return { success: false, error: message };
  }
};

/**
 * Handle API response and extract data
 * @template T
 * @param {import('./types').ApiResponse<T>} response
 * @returns {T}
 */
export const handleApiResponse = (response) => {
  if (response.success && response.data !== undefined) {
    return response.data;
  }

  throw new Error(response.error || 'Unknown API error');
};

/**
 * Create request interceptor for common headers (auth tokens, etc.)
 * @param {string} baseURL
 * @param {Record<string, string>} [defaultHeaders={}]
 */
export const createApiClient = (baseURL, defaultHeaders = {}) => {
  const client = {
    get: (endpoint, config = {}) =>
      get(`${baseURL}${endpoint}`, {
        ...config,
        headers: { ...defaultHeaders, ...config.headers },
      }),

    post: (endpoint, data, config = {}) =>
      post(`${baseURL}${endpoint}`, data, {
        ...config,
        headers: { ...defaultHeaders, ...config.headers },
      }),

    put: (endpoint, data, config = {}) =>
      put(`${baseURL}${endpoint}`, data, {
        ...config,
        headers: { ...defaultHeaders, ...config.headers },
      }),

    patch: (endpoint, data, config = {}) =>
      patch(`${baseURL}${endpoint}`, data, {
        ...config,
        headers: { ...defaultHeaders, ...config.headers },
      }),

    delete: (endpoint, config = {}) =>
      del(`${baseURL}${endpoint}`, {
        ...config,
        headers: { ...defaultHeaders, ...config.headers },
      }),
  };

  return client;
};

/**
 * Common API endpoints - can be imported by other modules
 * @type {const}
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
    DETAIL: (id) => `/api/courses/${id}`,
    CREATE: '/api/courses/create',
    UPDATE: (id) => `/api/courses/${id}/update`,
    DELETE: (id) => `/api/courses/${id}/delete`,
  },
  LESSONS: {
    LIST: (courseId) => `/api/courses/${courseId}/lessons`,
    DETAIL: (courseId, lessonId) => `/api/courses/${courseId}/lessons/${lessonId}`,
    CREATE: (courseId) => `/api/courses/${courseId}/lessons`,
    UPDATE: (courseId, lessonId) => `/api/courses/${courseId}/lessons/${lessonId}`,
    DELETE: (courseId, lessonId) => `/api/courses/${courseId}/lessons/${lessonId}`,
    PROGRESS: (courseId, lessonId) => `/api/courses/${courseId}/lessons/${lessonId}/progress`,
  },
  PAYMENTS: {
    CREATE_CHECKOUT: '/api/payments/create-checkout',
    PAYHERE_CALLBACK: '/api/payments/payhere-callback',
    STRIPE_WEBHOOK: '/api/payments/stripe-webhook',
    APPROVE_BANK: '/api/payments/approve-bank',
    LIST: '/api/payments',
    DETAIL: (id) => `/api/payments/${id}`,
  },
  EMAIL: {
    SEND: '/api/email/send',
  },
  ADMIN: {
    USERS: '/api/admin/users',
    STATS: '/api/admin/stats',
    BULK_ACTIONS: '/api/admin/bulk-actions',
  },
};