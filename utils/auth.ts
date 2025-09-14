/**
 * Authentication Utilities
 * Provides helpers for authentication, token management, and user role checks
 */

import type { User } from './types';

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface SessionData {
  user: User;
  token: TokenData;
  expiresAt: number;
}

/**
 * User roles with hierarchy levels
 */
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Role hierarchy - higher numbers have more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.STUDENT]: 1,
  [USER_ROLES.ADMIN]: 10,
};

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null, requiredRole: UserRole): boolean => {
  if (!user?.role) return false;
  return user.role === requiredRole;
};

/**
 * Check if user has role with minimum required level
 */
export const hasMinRole = (user: User | null, minRole: UserRole): boolean => {
  if (!user?.role) return false;

  const userLevel = ROLE_HIERARCHY[user.role];
  const requiredLevel = ROLE_HIERARCHY[minRole];

  return userLevel >= requiredLevel;
};

/**
 * Check if user is admin
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, USER_ROLES.ADMIN);
};

/**
 * Check if user is student
 */
export const isStudent = (user: User | null): boolean => {
  return hasRole(user, USER_ROLES.STUDENT);
};

/**
 * Get user display name
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Guest';
  return user.name || user.email.split('@')[0] || 'User';
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (user: User | null): string => {
  if (!user?.name) return 'U';

  const parts = user.name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Token management utilities
 */
export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_KEY = 'refresh_token';
  private static readonly USER_KEY = 'auth_user';

  /**
   * Store authentication tokens
   */
  static setTokens(tokenData: TokenData): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.TOKEN_KEY, tokenData.access_token);

    if (tokenData.refresh_token) {
      localStorage.setItem(this.REFRESH_KEY, tokenData.refresh_token);
    }
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_KEY);
  }

  /**
   * Remove all tokens
   */
  static clearTokens(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Store user data
   */
  static setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get stored user data
   */
  static getUser(): User | null {
    if (typeof window === 'undefined') return null;

    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get authorization header
   */
  static getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

/**
 * JWT token utilities
 */
export class JWTUtils {
  /**
   * Decode JWT payload without verification (client-side only)
   */
  static decodePayload<T = any>(token: string): T | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Check if JWT token is expired
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodePayload<{ exp?: number }>(token);
    if (!payload?.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return now >= payload.exp;
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    const payload = this.decodePayload<{ exp?: number }>(token);
    if (!payload?.exp) return null;

    return new Date(payload.exp * 1000);
  }

  /**
   * Get time until token expires (in seconds)
   */
  static getTokenTimeToExpiry(token: string): number {
    const payload = this.decodePayload<{ exp?: number }>(token);
    if (!payload?.exp) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }
}

/**
 * Session management utilities
 */
export class SessionManager {
  private static readonly SESSION_KEY = 'user_session';
  private static readonly TIMEOUT_KEY = 'session_timeout';

  /**
   * Create user session
   */
  static createSession(user: User, token: TokenData, expiresIn = 3600): SessionData {
    const expiresAt = Date.now() + (expiresIn * 1000);
    const sessionData: SessionData = {
      user,
      token,
      expiresAt,
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      this.startSessionTimer(expiresIn);
    }

    return sessionData;
  }

  /**
   * Get current session
   */
  static getSession(): SessionData | null {
    if (typeof window === 'undefined') return null;

    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: SessionData = JSON.parse(sessionData);

      // Check if session is expired
      if (Date.now() >= session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  /**
   * Update session data
   */
  static updateSession(updates: Partial<SessionData>): void {
    const currentSession = this.getSession();
    if (!currentSession) return;

    const updatedSession = { ...currentSession, ...updates };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedSession));
  }

  /**
   * Clear session
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return;

    sessionStorage.removeItem(this.SESSION_KEY);
    const timeoutId = localStorage.getItem(this.TIMEOUT_KEY);
    if (timeoutId) {
      clearTimeout(parseInt(timeoutId));
      localStorage.removeItem(this.TIMEOUT_KEY);
    }
  }

  /**
   * Start session timeout timer
   */
  private static startSessionTimer(expiresIn: number): void {
    if (typeof window === 'undefined') return;

    // Clear existing timer
    const existingTimeoutId = localStorage.getItem(this.TIMEOUT_KEY);
    if (existingTimeoutId) {
      clearTimeout(parseInt(existingTimeoutId));
    }

    // Set new timer
    const timeoutId = window.setTimeout(() => {
      this.clearSession();
      // Optionally dispatch session expired event
      window.dispatchEvent(new CustomEvent('sessionExpired'));
    }, expiresIn * 1000);

    localStorage.setItem(this.TIMEOUT_KEY, timeoutId.toString());
  }

  /**
   * Extend session
   */
  static extendSession(additionalTime = 3600): void {
    const session = this.getSession();
    if (!session) return;

    const newExpiresAt = Date.now() + (additionalTime * 1000);
    this.updateSession({ expiresAt: newExpiresAt });
    this.startSessionTimer(additionalTime);
  }
}

/**
 * Permission checking utilities
 */
export const permissions = {
  /**
   * Check if user can view admin panel
   */
  canViewAdmin: (user: User | null): boolean => isAdmin(user),

  /**
   * Check if user can manage courses
   */
  canManageCourses: (user: User | null): boolean => isAdmin(user),

  /**
   * Check if user can manage users
   */
  canManageUsers: (user: User | null): boolean => isAdmin(user),

  /**
   * Check if user can view payments
   */
  canViewPayments: (user: User | null): boolean => isAdmin(user),

  /**
   * Check if user can access course content
   */
  canAccessCourse: (user: User | null, courseId: string, purchasedCourses: string[] = []): boolean => {
    if (!user) return false;
    if (isAdmin(user)) return true;
    return purchasedCourses.includes(courseId);
  },

  /**
   * Check if user can upload files
   */
  canUploadFiles: (user: User | null): boolean => !!user,

  /**
   * Check if user owns resource (based on user_id field)
   */
  ownsResource: (user: User | null, resource: { user_id?: string }): boolean => {
    return !!user && !!resource.user_id && user.id === resource.user_id;
  },
} as const;