/**
 * Authentication Utilities
 * Provides helpers for authentication, token management, and user role checks
 * @typedef {import('./types').User} User
 */

/**
 * @typedef {Object} TokenData
 * @property {string} access_token
 * @property {string} [refresh_token]
 * @property {number} [expires_in]
 * @property {string} [token_type]
 */

/**
 * @typedef {Object} SessionData
 * @property {User} user
 * @property {TokenData} token
 * @property {number} expiresAt
 */

/**
 * User roles with hierarchy levels
 * @type {const}
 */
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

/** @type {Record<string, number>} */
const ROLE_HIERARCHY = {
  [USER_ROLES.STUDENT]: 1,
  [USER_ROLES.ADMIN]: 10,
};

/**
 * Check if user has a specific role
 * @param {User | null} user
 * @param {string} requiredRole
 * @returns {boolean}
 */
export const hasRole = (user, requiredRole) => {
  if (!user?.role) return false;
  return user.role === requiredRole;
};

/**
 * Check if user has role with minimum required level
 * @param {User | null} user
 * @param {string} minRole
 * @returns {boolean}
 */
export const hasMinRole = (user, minRole) => {
  if (!user?.role) return false;

  const userLevel = ROLE_HIERARCHY[user.role];
  const requiredLevel = ROLE_HIERARCHY[minRole];

  return userLevel >= requiredLevel;
};

/**
 * Check if user is admin
 * @param {User | null} user
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return hasRole(user, USER_ROLES.ADMIN);
};

/**
 * Check if user is student
 * @param {User | null} user
 * @returns {boolean}
 */
export const isStudent = (user) => {
  return hasRole(user, USER_ROLES.STUDENT);
};

/**
 * Get user display name
 * @param {User | null} user
 * @returns {string}
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'Guest';
  return user.name || user.email.split('@')[0] || 'User';
};

/**
 * Get user initials for avatar
 * @param {User | null} user
 * @returns {string}
 */
export const getUserInitials = (user) => {
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
  static TOKEN_KEY = 'auth_token';
  static REFRESH_KEY = 'refresh_token';
  static USER_KEY = 'auth_user';

  /**
   * Store authentication tokens
   * @param {TokenData} tokenData
   */
  static setTokens(tokenData) {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.TOKEN_KEY, tokenData.access_token);

    if (tokenData.refresh_token) {
      localStorage.setItem(this.REFRESH_KEY, tokenData.refresh_token);
    }
  }

  /**
   * Get access token
   * @returns {string | null}
   */
  static getAccessToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get refresh token
   * @returns {string | null}
   */
  static getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_KEY);
  }

  /**
   * Remove all tokens
   */
  static clearTokens() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Store user data
   * @param {User} user
   */
  static setUser(user) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get stored user data
   * @returns {User | null}
   */
  static getUser() {
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
   * @returns {boolean}
   */
  static isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Get authorization header
   * @returns {Record<string, string>}
   */
  static getAuthHeader() {
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
   * @template T
   * @param {string} token
   * @returns {T | null}
   */
  static decodePayload(token) {
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
   * @param {string} token
   * @returns {boolean}
   */
  static isTokenExpired(token) {
    const payload = this.decodePayload(token);
    if (!payload?.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return now >= payload.exp;
  }

  /**
   * Get token expiration time
   * @param {string} token
   * @returns {Date | null}
   */
  static getTokenExpiration(token) {
    const payload = this.decodePayload(token);
    if (!payload?.exp) return null;

    return new Date(payload.exp * 1000);
  }

  /**
   * Get time until token expires (in seconds)
   * @param {string} token
   * @returns {number}
   */
  static getTokenTimeToExpiry(token) {
    const payload = this.decodePayload(token);
    if (!payload?.exp) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }
}

/**
 * Session management utilities
 */
export class SessionManager {
  static SESSION_KEY = 'user_session';
  static TIMEOUT_KEY = 'session_timeout';

  /**
   * Create user session
   * @param {User} user
   * @param {TokenData} token
   * @param {number} [expiresIn=3600]
   * @returns {SessionData}
   */
  static createSession(user, token, expiresIn = 3600) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    const sessionData = {
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
   * @returns {SessionData | null}
   */
  static getSession() {
    if (typeof window === 'undefined') return null;

    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

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
   * @param {Partial<SessionData>} updates
   */
  static updateSession(updates) {
    const currentSession = this.getSession();
    if (!currentSession) return;

    const updatedSession = { ...currentSession, ...updates };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedSession));
  }

  /**
   * Clear session
   */
  static clearSession() {
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
   * @param {number} expiresIn
   * @private
   */
  static startSessionTimer(expiresIn) {
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
   * @param {number} [additionalTime=3600]
   */
  static extendSession(additionalTime = 3600) {
    const session = this.getSession();
    if (!session) return;

    const newExpiresAt = Date.now() + (additionalTime * 1000);
    this.updateSession({ expiresAt: newExpiresAt });
    this.startSessionTimer(additionalTime);
  }
}

/**
 * Permission checking utilities
 * @type {const}
 */
export const permissions = {
  /**
   * Check if user can view admin panel
   * @param {User | null} user
   * @returns {boolean}
   */
  canViewAdmin: (user) => isAdmin(user),

  /**
   * Check if user can manage courses
   * @param {User | null} user
   * @returns {boolean}
   */
  canManageCourses: (user) => isAdmin(user),

  /**
   * Check if user can manage users
   * @param {User | null} user
   * @returns {boolean}
   */
  canManageUsers: (user) => isAdmin(user),

  /**
   * Check if user can view payments
   * @param {User | null} user
   * @returns {boolean}
   */
  canViewPayments: (user) => isAdmin(user),

  /**
   * Check if user can access course content
   * @param {User | null} user
   * @param {string} courseId
   * @param {string[]} [purchasedCourses=[]]
   * @returns {boolean}
   */
  canAccessCourse: (user, courseId, purchasedCourses = []) => {
    if (!user) return false;
    if (isAdmin(user)) return true;
    return purchasedCourses.includes(courseId);
  },

  /**
   * Check if user can upload files
   * @param {User | null} user
   * @returns {boolean}
   */
  canUploadFiles: (user) => !!user,

  /**
   * Check if user owns resource (based on user_id field)
   * @param {User | null} user
   * @param {{ user_id?: string }} resource
   * @returns {boolean}
   */
  ownsResource: (user, resource) => {
    return !!user && !!resource.user_id && user.id === resource.user_id;
  },
};