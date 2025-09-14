/**
 * Common TypeScript types used across the application
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  created_at?: string;
  avatar_url?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_url?: string;
  featured: boolean;
  category: string;
  created_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  video_url?: string;
  order: number;
  type: 'video' | 'post';
  content?: string;
  duration?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'failed';
  method: 'payhere' | 'stripe' | 'bank';
  created_at: string;
  approved_at?: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  course_id: string;
  payment_id: string;
  access_granted: boolean;
  purchase_date: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[] | Record<string, string>;
}

export interface VideoMetadata {
  type: 'youtube' | 'supabase' | 'direct' | 'unknown';
  id?: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
  accessible: boolean;
}

export interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface CourseProgress {
  courseId: string;
  completedLessons: string[];
  totalLessons: number;
  progressPercentage: number;
  lastAccessedAt: string;
}

export interface StorageItem<T = any> {
  value: T;
  expiry?: number;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}