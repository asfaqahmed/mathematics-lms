/**
 * Storage Utilities
 * Provides unified interface for localStorage, sessionStorage, and memory storage
 * with type safety, expiration, and encryption support
 */

import type { StorageItem } from './types';

export type StorageType = 'localStorage' | 'sessionStorage' | 'memory';

export interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  prefix?: string;
}

export interface ExpiringStorageOptions extends StorageOptions {
  expirationTime?: number; // in milliseconds
}

/**
 * Simple encryption/decryption utilities
 */
class SimpleEncryption {
  private static key = 'mathpro-lms-key-2025';

  static encrypt(data: string): string {
    // Simple XOR encryption for demo purposes
    // In production, use proper encryption libraries
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
      );
    }
    return btoa(result);
  }

  static decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData);
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
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
 */
class MemoryStorage {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  get length(): number {
    return this.storage.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.storage.keys());
    return keys[index] || null;
  }
}

/**
 * Storage abstraction class
 */
export class Storage {
  private storage: globalThis.Storage | MemoryStorage;
  private options: StorageOptions;

  constructor(type: StorageType = 'localStorage', options: StorageOptions = {}) {
    this.options = {
      encrypt: false,
      compress: false,
      prefix: 'app_',
      ...options,
    };

    if (typeof window === 'undefined') {
      this.storage = new MemoryStorage();
    } else {
      switch (type) {
        case 'sessionStorage':
          this.storage = window.sessionStorage || new MemoryStorage();
          break;
        case 'memory':
          this.storage = new MemoryStorage();
          break;
        default:
          this.storage = window.localStorage || new MemoryStorage();
      }
    }
  }

  private getKey(key: string): string {
    return `${this.options.prefix}${key}`;
  }

  private processValue(value: any): string {
    let processed = JSON.stringify(value);

    if (this.options.compress && typeof window !== 'undefined') {
      // Simple compression could be implemented here
      // For now, we'll just return the stringified value
    }

    if (this.options.encrypt) {
      processed = SimpleEncryption.encrypt(processed);
    }

    return processed;
  }

  private unprocessValue<T>(value: string): T | null {
    try {
      let processed = value;

      if (this.options.encrypt) {
        processed = SimpleEncryption.decrypt(processed);
        if (!processed) return null;
      }

      if (this.options.compress && typeof window !== 'undefined') {
        // Decompress if needed
      }

      return JSON.parse(processed);
    } catch {
      return null;
    }
  }

  /**
   * Store a value
   */
  set<T>(key: string, value: T): void {
    try {
      const processedValue = this.processValue(value);
      this.storage.setItem(this.getKey(key), processedValue);
    } catch (error) {
      console.error('Storage.set failed:', error);
    }
  }

  /**
   * Retrieve a value
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const value = this.storage.getItem(this.getKey(key));
      if (value === null) return defaultValue || null;

      const parsed = this.unprocessValue<T>(value);
      return parsed !== null ? parsed : (defaultValue || null);
    } catch (error) {
      console.error('Storage.get failed:', error);
      return defaultValue || null;
    }
  }

  /**
   * Remove a value
   */
  remove(key: string): void {
    try {
      this.storage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Storage.remove failed:', error);
    }
  }

  /**
   * Clear all values with the current prefix
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.options.prefix!)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      console.error('Storage.clear failed:', error);
    }
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.storage.getItem(this.getKey(key)) !== null;
  }

  /**
   * Get all keys with the current prefix
   */
  keys(): string[] {
    const keys: string[] = [];
    const prefixLength = this.options.prefix!.length;

    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.options.prefix!)) {
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
   */
  size(): number {
    let size = 0;

    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.options.prefix!)) {
          const value = this.storage.getItem(key);
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
  constructor(type: StorageType = 'localStorage', options: ExpiringStorageOptions = {}) {
    super(type, options);
  }

  /**
   * Store a value with expiration
   */
  setWithExpiry<T>(key: string, value: T, expirationTime?: number): void {
    const expiresAt = expirationTime
      ? Date.now() + expirationTime
      : undefined;

    const item: StorageItem<T> = {
      value,
      expiry: expiresAt,
    };

    super.set(key, item);
  }

  /**
   * Retrieve a value, checking for expiration
   */
  getWithExpiry<T>(key: string, defaultValue?: T): T | null {
    const item = super.get<StorageItem<T>>(key);

    if (!item) {
      return defaultValue || null;
    }

    // Check if item has expired
    if (item.expiry && Date.now() > item.expiry) {
      this.remove(key);
      return defaultValue || null;
    }

    return item.value;
  }

  /**
   * Override the base set method to use expiry by default
   */
  set<T>(key: string, value: T, expirationTime?: number): void {
    this.setWithExpiry(key, value, expirationTime);
  }

  /**
   * Override the base get method to check expiry by default
   */
  get<T>(key: string, defaultValue?: T): T | null {
    return this.getWithExpiry(key, defaultValue);
  }

  /**
   * Clean up expired items
   */
  cleanup(): void {
    const keys = this.keys();

    keys.forEach(key => {
      const item = super.get<StorageItem<any>>(key);
      if (item?.expiry && Date.now() > item.expiry) {
        this.remove(key);
      }
    });
  }

  /**
   * Get time remaining until expiration (in milliseconds)
   */
  getTimeToExpiry(key: string): number | null {
    const item = super.get<StorageItem<any>>(key);

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
   */
  setUserPreferences(preferences: Record<string, any>): void {
    localStorage.set('user_preferences', preferences);
  },

  /**
   * Get user preferences
   */
  getUserPreferences(): Record<string, any> {
    return localStorage.get('user_preferences', {});
  },

  /**
   * Store theme preference
   */
  setTheme(theme: 'light' | 'dark'): void {
    localStorage.set('theme', theme);
  },

  /**
   * Get theme preference
   */
  getTheme(): 'light' | 'dark' {
    return localStorage.get('theme', 'light');
  },

  /**
   * Store language preference
   */
  setLanguage(language: string): void {
    localStorage.set('language', language);
  },

  /**
   * Get language preference
   */
  getLanguage(): string {
    return localStorage.get('language', 'en');
  },

  /**
   * Store recent searches
   */
  addRecentSearch(query: string, maxItems = 10): void {
    const searches = this.getRecentSearches();
    const updatedSearches = [query, ...searches.filter(s => s !== query)].slice(0, maxItems);
    localStorage.set('recent_searches', updatedSearches);
  },

  /**
   * Get recent searches
   */
  getRecentSearches(): string[] {
    return localStorage.get('recent_searches', []);
  },

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    localStorage.remove('recent_searches');
  },

  /**
   * Store form data temporarily
   */
  saveFormData(formId: string, data: Record<string, any>): void {
    expiringStorage.set(`form_${formId}`, data, 30 * 60 * 1000); // 30 minutes
  },

  /**
   * Restore form data
   */
  restoreFormData(formId: string): Record<string, any> | null {
    return expiringStorage.get(`form_${formId}`);
  },

  /**
   * Clear form data
   */
  clearFormData(formId: string): void {
    expiringStorage.remove(`form_${formId}`);
  },

  /**
   * Store cart items
   */
  setCartItems(items: any[]): void {
    sessionStorage.set('cart_items', items);
  },

  /**
   * Get cart items
   */
  getCartItems(): any[] {
    return sessionStorage.get('cart_items', []);
  },

  /**
   * Add item to cart
   */
  addToCart(item: any): void {
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
   */
  removeFromCart(itemId: string): void {
    const items = this.getCartItems().filter(item => item.id !== itemId);
    this.setCartItems(items);
  },

  /**
   * Clear cart
   */
  clearCart(): void {
    sessionStorage.remove('cart_items');
  },

  /**
   * Store course progress offline
   */
  setCourseProgress(courseId: string, progress: any): void {
    localStorage.set(`course_progress_${courseId}`, {
      ...progress,
      lastUpdated: Date.now(),
    });
  },

  /**
   * Get course progress
   */
  getCourseProgress(courseId: string): any | null {
    return localStorage.get(`course_progress_${courseId}`);
  },

  /**
   * Store video playback position
   */
  setVideoPosition(videoId: string, position: number): void {
    const positions = localStorage.get('video_positions', {});
    positions[videoId] = {
      position,
      timestamp: Date.now(),
    };
    localStorage.set('video_positions', positions);
  },

  /**
   * Get video playback position
   */
  getVideoPosition(videoId: string): number | null {
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
   */
  setSessionData(key: string, data: any): void {
    sessionStorage.set(key, data);
  },

  /**
   * Get user session data
   */
  getSessionData(key: string): any | null {
    return sessionStorage.get(key);
  },

  /**
   * Store sensitive data with encryption
   */
  setSecureData(key: string, data: any): void {
    secureStorage.set(key, data);
  },

  /**
   * Get sensitive data with decryption
   */
  getSecureData(key: string): any | null {
    return secureStorage.get(key);
  },

  /**
   * Clear all application data
   */
  clearAllData(): void {
    localStorage.clear();
    sessionStorage.clear();
    secureStorage.clear();
    expiringStorage.clear();
  },

  /**
   * Export all data for backup
   */
  exportData(): Record<string, any> {
    const data: Record<string, any> = {};

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
   */
  getStorageStats(): {
    localStorage: { used: number; available: number };
    sessionStorage: { used: number; available: number };
  } {
    const getStorageSize = (storage: Storage): number => {
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