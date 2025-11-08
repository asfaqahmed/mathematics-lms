/**
 * Storage Utilities
 * Provides unified interface for localStorage, sessionStorage, and memory storage
 * with type safety, expiration, and encryption support
 */

/**
 * @typedef {'localStorage' | 'sessionStorage' | 'memory'} StorageType
 */

/**
 * @typedef {Object} StorageOptions
 * @property {boolean} [encrypt] - Whether to encrypt values
 * @property {boolean} [compress] - Whether to compress values
 * @property {string} [prefix] - Key prefix
 */

/**
 * @typedef {Object} ExpiringStorageOptions
 * @property {boolean} [encrypt] - Whether to encrypt values
 * @property {boolean} [compress] - Whether to compress values
 * @property {string} [prefix] - Key prefix
 * @property {number} [expirationTime] - Default expiration time in milliseconds
 */

/**
 * @typedef {Object} StorageItem
 * @template T
 * @property {T} value - The stored value
 * @property {number} [expiry] - Expiration timestamp
 */

/**
 * Simple encryption/decryption utilities
 * @private
 */
class SimpleEncryption {
  static #key = 'mathpro-lms-key-2025';

  /**
   * @param {string} data - Data to encrypt
   * @returns {string} Encrypted data
   */
  static encrypt(data) {
    // Simple XOR encryption for demo purposes
    // In production, use proper encryption libraries
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ this.#key.charCodeAt(i % this.#key.length)
      );
    }
    return btoa(result);
  }

  /**
   * @param {string} encryptedData - Data to decrypt
   * @returns {string} Decrypted data
   */
  static decrypt(encryptedData) {
    try {
      const data = atob(encryptedData);
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ this.#key.charCodeAt(i % this.#key.length)
        );
      }
      return result;
    } catch {
      return '';
    }
  }
}

/**
 * Memory storage fallback for environments without localStorage/sessionStorage
 * @private
 */
class MemoryStorage {
  #storage = new Map();

  /**
   * @param {string} key - Key to retrieve
   * @returns {string | null} Value or null if not found
   */
  getItem(key) {
    return this.#storage.get(key) ?? null;
  }

  /**
   * @param {string} key - Key to store
   * @param {string} value - Value to store
   */
  setItem(key, value) {
    this.#storage.set(key, value);
  }

  /**
   * @param {string} key - Key to remove
   */
  removeItem(key) {
    this.#storage.delete(key);
  }

  clear() {
    this.#storage.clear();
  }

  /**
   * @returns {number} Number of stored items
   */
  get length() {
    return this.#storage.size;
  }

  /**
   * @param {number} index - Index to retrieve key for
   * @returns {string | null} Key at index or null
   */
  key(index) {
    const keys = Array.from(this.#storage.keys());
    return keys[index] ?? null;
  }
}

/**
 * Storage abstraction class
 */
export class Storage {
  /** @type {Storage | MemoryStorage} */
  #storage;
  /** @type {StorageOptions} */
  #options;

  /**
   * @param {StorageType} [type='localStorage'] - Storage type
   * @param {StorageOptions} [options={}] - Storage options
   */
  constructor(type = 'localStorage', options = {}) {
    this.#options = {
      encrypt: false,
      compress: false,
      prefix: 'app_',
      ...options,
    };

    if (typeof window === 'undefined') {
      this.#storage = new MemoryStorage();
    } else {
      switch (type) {
        case 'sessionStorage':
          this.#storage = window.sessionStorage || new MemoryStorage();
          break;
        case 'memory':
          this.#storage = new MemoryStorage();
          break;
        default:
          this.#storage = window.localStorage || new MemoryStorage();
      }
    }
  }

  /**
   * @private
   * @param {string} key - Key to prefix
   * @returns {string} Prefixed key
   */
  #getKey(key) {
    return `${this.#options.prefix}${key}`;
  }

  /**
   * @private
   * @param {*} value - Value to process
   * @returns {string} Processed value
   */
  #processValue(value) {
    let processed = JSON.stringify(value);

    if (this.#options.compress && typeof window !== 'undefined') {
      // Simple compression could be implemented here
      // For now, we'll just return the stringified value
    }

    if (this.#options.encrypt) {
      processed = SimpleEncryption.encrypt(processed);
    }

    return processed;
  }

  /**
   * @private
   * @template T
   * @param {string} value - Value to unprocess
   * @returns {T | null} Unprocessed value
   */
  #unprocessValue(value) {
    try {
      let processed = value;

      if (this.#options.encrypt) {
        processed = SimpleEncryption.decrypt(processed);
        if (!processed) return null;
      }

      if (this.#options.compress && typeof window !== 'undefined') {
        // Decompress if needed
      }

      return JSON.parse(processed);
    } catch {
      return null;
    }
  }

  /**
   * Store a value
   * @template T
   * @param {string} key - Key to store under
   * @param {T} value - Value to store
   */
  set(key, value) {
    try {
      const processedValue = this.#processValue(value);
      this.#storage.setItem(this.#getKey(key), processedValue);
    } catch (error) {
      console.error('Storage.set failed:', error);
    }
  }

  /**
   * Retrieve a value
   * @template T
   * @param {string} key - Key to retrieve
   * @param {T} [defaultValue] - Default value if not found
   * @returns {T | null} Retrieved value or null
   */
  get(key, defaultValue) {
    try {
      const value = this.#storage.getItem(this.#getKey(key));
      if (value === null) return defaultValue ?? null;

      const parsed = this.#unprocessValue(value);
      return parsed !== null ? parsed : (defaultValue ?? null);
    } catch (error) {
      console.error('Storage.get failed:', error);
      return defaultValue ?? null;
    }
  }

  /**
   * Remove a value
   * @param {string} key - Key to remove
   */
  remove(key) {
    try {
      this.#storage.removeItem(this.#getKey(key));
    } catch (error) {
      console.error('Storage.remove failed:', error);
    }
  }

  /**
   * Clear all values with the current prefix
   */
  clear() {
    try {
      const keysToRemove = [];

      for (let i = 0; i < this.#storage.length; i++) {
        const key = this.#storage.key(i);
        if (key && key.startsWith(this.#options.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => this.#storage.removeItem(key));
    } catch (error) {
      console.error('Storage.clear failed:', error);
    }
  }

  /**
   * Check if a key exists
   * @param {string} key - Key to check
   * @returns {boolean} Whether key exists
   */
  has(key) {
    return this.#storage.getItem(this.#getKey(key)) !== null;
  }

  /**
   * Get all keys with the current prefix
   * @returns {string[]} Array of keys
   */
  keys() {
    const keys = [];
    const prefixLength = this.#options.prefix.length;

    try {
      for (let i = 0; i < this.#storage.length; i++) {
        const key = this.#storage.key(i);
        if (key && key.startsWith(this.#options.prefix)) {
          keys.push(key.substring(prefixLength));
        }
      }
    } catch (error) {
      console.error('Storage.keys failed:', error);
    }

    return keys;
  }

  /**
   * Get storage size in bytes (approximate)
   * @returns {number} Size in bytes
   */
  size() {
    let size = 0;

    try {
      for (let i = 0; i < this.#storage.length; i++) {
        const key = this.#storage.key(i);
        if (key && key.startsWith(this.#options.prefix)) {
          const value = this.#storage.getItem(key);
          size += (key.length + (value?.length || 0)) * 2; // UTF-16 characters = 2 bytes each
        }
      }
    } catch (error) {
      console.error('Storage.size failed:', error);
    }

    return size;
  }
}

/**
 * Expiring Storage - automatically removes expired items
 */
export class ExpiringStorage extends Storage {
  /**
   * @param {StorageType} [type='localStorage'] - Storage type
   * @param {ExpiringStorageOptions} [options={}] - Storage options
   */
  constructor(type = 'localStorage', options = {}) {
    super(type, options);
  }

  /**
   * Store a value with expiration
   * @template T
   * @param {string} key - Key to store under
   * @param {T} value - Value to store
   * @param {number} [expirationTime] - Time until expiration in ms
   */
  setWithExpiry(key, value, expirationTime) {
    const expiresAt = expirationTime
      ? Date.now() + expirationTime
      : undefined;

    /** @type {StorageItem<T>} */
    const item = {
      value,
      expiry: expiresAt,
    };

    super.set(key, item);
  }

  /**
   * Retrieve a value, checking for expiration
   * @template T
   * @param {string} key - Key to retrieve
   * @param {T} [defaultValue] - Default value if not found
   * @returns {T | null} Retrieved value or null
   */
  getWithExpiry(key, defaultValue) {
    /** @type {StorageItem<T>} */
    const item = super.get(key);

    if (!item) {
      return defaultValue ?? null;
    }

    // Check if item has expired
    if (item.expiry && Date.now() > item.expiry) {
      this.remove(key);
      return defaultValue ?? null;
    }

    return item.value;
  }

  /**
   * Override the base set method to use expiry by default
   * @template T
   * @param {string} key - Key to store under
   * @param {T} value - Value to store
   * @param {number} [expirationTime] - Time until expiration in ms
   */
  set(key, value, expirationTime) {
    this.setWithExpiry(key, value, expirationTime);
  }

  /**
   * Override the base get method to check expiry by default
   * @template T
   * @param {string} key - Key to retrieve
   * @param {T} [defaultValue] - Default value if not found
   * @returns {T | null} Retrieved value or null
   */
  get(key, defaultValue) {
    return this.getWithExpiry(key, defaultValue);
  }

  /**
   * Clean up expired items
   */
  cleanup() {
    const keys = this.keys();

    keys.forEach(key => {
      /** @type {StorageItem<any>} */
      const item = super.get(key);
      if (item?.expiry && Date.now() > item.expiry) {
        this.remove(key);
      }
    });
  }

  /**
   * Get time remaining until expiration (in milliseconds)
   * @param {string} key - Key to check
   * @returns {number | null} Time remaining in ms or null
   */
  getTimeToExpiry(key) {
    /** @type {StorageItem<any>} */
    const item = super.get(key);

    if (!item?.expiry) {
      return null;
    }

    const remaining = item.expiry - Date.now();
    return Math.max(0, remaining);
  }
}

/**
 * Pre-configured storage instances
 */
export const localStorage = new Storage('localStorage', { prefix: 'mathpro_' });
export const sessionStorage = new Storage('sessionStorage', { prefix: 'mathpro_session_' });
export const secureStorage = new Storage('localStorage', { prefix: 'mathpro_secure_', encrypt: true });
export const expiringStorage = new ExpiringStorage('localStorage', { prefix: 'mathpro_temp_' });

/**
 * Utility functions for common storage operations
 */
export const storageUtils = {
  /**
   * Store user preferences
   * @param {Record<string, any>} preferences - User preferences
   */
  setUserPreferences(preferences) {
    localStorage.set('user_preferences', preferences);
  },

  /**
   * Get user preferences
   * @returns {Record<string, any>} User preferences
   */
  getUserPreferences() {
    return localStorage.get('user_preferences', {});
  },

  /**
   * Store theme preference
   * @param {'light' | 'dark'} theme - Theme preference
   */
  setTheme(theme) {
    localStorage.set('theme', theme);
  },

  /**
   * Get theme preference
   * @returns {'light' | 'dark'} Theme preference
   */
  getTheme() {
    return localStorage.get('theme', 'light');
  },

  /**
   * Store language preference
   * @param {string} language - Language code
   */
  setLanguage(language) {
    localStorage.set('language', language);
  },

  /**
   * Get language preference
   * @returns {string} Language code
   */
  getLanguage() {
    return localStorage.get('language', 'en');
  },

  /**
   * Store recent searches
   * @param {string} query - Search query
   * @param {number} [maxItems=10] - Maximum items to store
   */
  addRecentSearch(query, maxItems = 10) {
    const searches = this.getRecentSearches();
    const updatedSearches = [query, ...searches.filter(s => s !== query)].slice(0, maxItems);
    localStorage.set('recent_searches', updatedSearches);
  },

  /**
   * Get recent searches
   * @returns {string[]} Recent searches
   */
  getRecentSearches() {
    return localStorage.get('recent_searches', []);
  },

  /**
   * Clear recent searches
   */
  clearRecentSearches() {
    localStorage.remove('recent_searches');
  },

  /**
   * Store form data temporarily
   * @param {string} formId - Form identifier
   * @param {Record<string, any>} data - Form data
   */
  saveFormData(formId, data) {
    expiringStorage.set(`form_${formId}`, data, 30 * 60 * 1000); // 30 minutes
  },

  /**
   * Restore form data
   * @param {string} formId - Form identifier
   * @returns {Record<string, any> | null} Form data
   */
  restoreFormData(formId) {
    return expiringStorage.get(`form_${formId}`);
  },

  /**
   * Clear form data
   * @param {string} formId - Form identifier
   */
  clearFormData(formId) {
    expiringStorage.remove(`form_${formId}`);
  },

  /**
   * Store cart items
   * @param {any[]} items - Cart items
   */
  setCartItems(items) {
    sessionStorage.set('cart_items', items);
  },

  /**
   * Get cart items
   * @returns {any[]} Cart items
   */
  getCartItems() {
    return sessionStorage.get('cart_items', []);
  },

  /**
   * Add item to cart
   * @param {any} item - Item to add
   */
  addToCart(item) {
    const items = this.getCartItems();
    const existingIndex = items.findIndex(i => i.id === item.id);

    if (existingIndex >= 0) {
      items[existingIndex] = { ...items[existingIndex], ...item };
    } else {
      items.push(item);
    }

    this.setCartItems(items);
  },

  /**
   * Remove item from cart
   * @param {string} itemId - Item ID to remove
   */
  removeFromCart(itemId) {
    const items = this.getCartItems().filter(item => item.id !== itemId);
    this.setCartItems(items);
  },

  /**
   * Clear cart
   */
  clearCart() {
    sessionStorage.remove('cart_items');
  },

  /**
   * Store course progress offline
   * @param {string} courseId - Course ID
   * @param {any} progress - Course progress data
   */
  setCourseProgress(courseId, progress) {
    localStorage.set(`course_progress_${courseId}`, {
      ...progress,
      lastUpdated: Date.now(),
    });
  },

  /**
   * Get course progress
   * @param {string} courseId - Course ID
   * @returns {any | null} Course progress data
   */
  getCourseProgress(courseId) {
    return localStorage.get(`course_progress_${courseId}`);
  },

  /**
   * Store video playback position
   * @param {string} videoId - Video ID
   * @param {number} position - Playback position in seconds
   */
  setVideoPosition(videoId, position) {
    const positions = localStorage.get('video_positions', {});
    positions[videoId] = {
      position,
      timestamp: Date.now(),
    };
    localStorage.set('video_positions', positions);
  },

  /**
   * Get video playback position
   * @param {string} videoId - Video ID
   * @returns {number | null} Playback position in seconds
   */
  getVideoPosition(videoId) {
    const positions = localStorage.get('video_positions', {});
    const data = positions[videoId];

    // Return position if it was stored within the last 30 days
    if (data && Date.now() - data.timestamp < 30 * 24 * 60 * 60 * 1000) {
      return data.position;
    }

    return null;
  },

  /**
   * Store user session data temporarily
   * @param {string} key - Data key
   * @param {any} data - Session data
   */
  setSessionData(key, data) {
    sessionStorage.set(key, data);
  },

  /**
   * Get user session data
   * @param {string} key - Data key
   * @returns {any | null} Session data
   */
  getSessionData(key) {
    return sessionStorage.get(key);
  },

  /**
   * Store sensitive data with encryption
   * @param {string} key - Data key
   * @param {any} data - Secure data
   */
  setSecureData(key, data) {
    secureStorage.set(key, data);
  },

  /**
   * Get sensitive data with decryption
   * @param {string} key - Data key
   * @returns {any | null} Secure data
   */
  getSecureData(key) {
    return secureStorage.get(key);
  },

  /**
   * Clear all application data
   */
  clearAllData() {
    localStorage.clear();
    sessionStorage.clear();
    secureStorage.clear();
    expiringStorage.clear();
  },

  /**
   * Export all data for backup
   * @returns {Record<string, any>} Exported data
   */
  exportData() {
    /** @type {Record<string, any>} */
    const data = {};

    // Export localStorage data
    localStorage.keys().forEach(key => {
      data[`local_${key}`] = localStorage.get(key);
    });

    // Export sessionStorage data
    sessionStorage.keys().forEach(key => {
      data[`session_${key}`] = sessionStorage.get(key);
    });

    return data;
  },

  /**
   * Get storage usage statistics
   * @returns {{ localStorage: { used: number, available: number }, sessionStorage: { used: number, available: number } }} Storage stats
   */
  getStorageStats() {
    const getStorageSize = (storage) => {
      try {
        return storage.size();
      } catch {
        return 0;
      }
    };

    // Rough estimate of available storage (varies by browser)
    const ESTIMATED_LIMIT = 10 * 1024 * 1024; // 10MB

    return {
      localStorage: {
        used: getStorageSize(localStorage),
        available: ESTIMATED_LIMIT,
      },
      sessionStorage: {
        used: getStorageSize(sessionStorage),
        available: ESTIMATED_LIMIT,
      },
    };
  },
};