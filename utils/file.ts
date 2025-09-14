/**
 * File Handling Utilities
 * Provides file upload, validation, and manipulation utilities
 */

import type { UploadOptions, ValidationResult } from './types';

export interface FileValidationResult extends ValidationResult {
  file?: File;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    extension: string;
    lastModified: number;
  };
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

/**
 * Default file type configurations
 */
export const FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
} as const;

export const FILE_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  videos: ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv'],
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
  archives: ['zip', 'rar', '7z'],
} as const;

/**
 * Default size limits (in bytes)
 */
export const SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB
  video: 100 * 1024 * 1024,    // 100MB
  document: 10 * 1024 * 1024,  // 10MB
  audio: 20 * 1024 * 1024,     // 20MB
  archive: 50 * 1024 * 1024,   // 50MB
  default: 5 * 1024 * 1024,    // 5MB
} as const;

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : '';
};

/**
 * Get filename without extension
 */
export const getFileNameWithoutExtension = (filename: string): string => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(0, lastDot) : filename;
};

/**
 * Determine file category based on type or extension
 */
export const getFileCategory = (file: File | string): keyof typeof FILE_TYPES => {
  let mimeType: string;
  let extension: string;

  if (typeof file === 'string') {
    extension = getFileExtension(file);
    mimeType = '';
  } else {
    mimeType = file.type;
    extension = getFileExtension(file.name);
  }

  // Check by MIME type first
  for (const [category, types] of Object.entries(FILE_TYPES)) {
    if (mimeType && types.includes(mimeType as any)) {
      return category as keyof typeof FILE_TYPES;
    }
  }

  // Fallback to extension
  for (const [category, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if (extension && extensions.includes(extension as any)) {
      return category as keyof typeof FILE_TYPES;
    }
  }

  return 'documents'; // Default fallback
};

/**
 * Validate file against specified options
 */
export const validateFile = (file: File, options: UploadOptions = {}): FileValidationResult => {
  const {
    maxSize = SIZE_LIMITS.default,
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  const errors: string[] = [];
  const extension = getFileExtension(file.name);
  const category = getFileCategory(file);

  // Size validation
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  // Type validation
  if (allowedTypes.length > 0) {
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type '${file.type}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  // Extension validation
  if (allowedExtensions.length > 0) {
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File extension '.${extension}' is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
    }
  }

  // Additional validation for specific file types
  if (category === 'images') {
    if (!file.type.startsWith('image/')) {
      errors.push('Invalid image file');
    }
  } else if (category === 'videos') {
    if (!file.type.startsWith('video/')) {
      errors.push('Invalid video file');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    file,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension,
      lastModified: file.lastModified,
    },
  };
};

/**
 * Validate multiple files
 */
export const validateFiles = (
  files: File[] | FileList,
  options: UploadOptions & { maxFiles?: number } = {}
): ValidationResult & { validFiles: File[]; invalidFiles: { file: File; errors: string[] }[] } => {
  const { maxFiles = 10 } = options;
  const fileArray = Array.from(files);
  const validFiles: File[] = [];
  const invalidFiles: { file: File; errors: string[] }[] = [];
  const globalErrors: string[] = [];

  // Check file count
  if (fileArray.length > maxFiles) {
    globalErrors.push(`Maximum ${maxFiles} files allowed. You selected ${fileArray.length} files.`);
  }

  // Validate each file
  for (const file of fileArray) {
    const result = validateFile(file, options);
    if (result.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({ file, errors: result.errors as string[] });
    }
  }

  return {
    isValid: globalErrors.length === 0 && invalidFiles.length === 0,
    errors: globalErrors,
    validFiles,
    invalidFiles,
  };
};

/**
 * Convert file to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/**
 * Convert file to array buffer
 */
export const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to array buffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Read file as text
 */
export const fileToText = (file: File, encoding = 'utf-8'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, encoding);
  });
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Resize image file
 */
export const resizeImage = (
  file: File,
  options: ImageProcessingOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    maintainAspectRatio = true,
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions
      if (maintainAspectRatio) {
        const aspectRatio = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
      } else {
        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Create image thumbnail
 */
export const createThumbnail = (
  file: File,
  size = 150,
  quality = 0.7
): Promise<File> => {
  return resizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality,
    format: 'jpeg',
    maintainAspectRatio: true,
  });
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (
  originalName: string,
  prefix = '',
  suffix = ''
): string => {
  const extension = getFileExtension(originalName);
  const nameWithoutExt = getFileNameWithoutExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  const parts = [
    prefix,
    nameWithoutExt,
    suffix,
    timestamp,
    random,
  ].filter(Boolean);

  return `${parts.join('_')}.${extension}`;
};

/**
 * Clean filename for safe storage
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename || typeof filename !== 'string') return 'file';

  return filename
    .replace(/[^\w\s.-]/g, '') // Remove special characters except dots, hyphens, and spaces
    .replace(/\s+/g, '_')      // Replace spaces with underscores
    .replace(/_{2,}/g, '_')    // Replace multiple underscores with single
    .replace(/^[._-]+/, '')    // Remove leading dots, underscores, hyphens
    .replace(/[._-]+$/, '')    // Remove trailing dots, underscores, hyphens
    .substring(0, 100)         // Limit length
    || 'file';
};

/**
 * Create download link for file
 */
export const downloadFile = (
  data: Blob | string,
  filename: string,
  mimeType?: string
): void => {
  let blob: Blob;

  if (typeof data === 'string') {
    blob = new Blob([data], { type: mimeType || 'text/plain' });
  } else {
    blob = data;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Convert bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * File upload progress tracking
 */
export class FileUploadTracker {
  private uploads = new Map<string, {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
    result?: any;
  }>();

  private listeners = new Map<string, ((progress: number, status: string) => void)[]>();

  addFile(id: string, file: File): void {
    this.uploads.set(id, {
      file,
      progress: 0,
      status: 'pending',
    });
  }

  updateProgress(id: string, progress: number): void {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.progress = progress;
      upload.status = progress === 100 ? 'completed' : 'uploading';
      this.notifyListeners(id, progress, upload.status);
    }
  }

  setError(id: string, error: string): void {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.status = 'error';
      upload.error = error;
      this.notifyListeners(id, upload.progress, upload.status);
    }
  }

  setCompleted(id: string, result: any): void {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.status = 'completed';
      upload.progress = 100;
      upload.result = result;
      this.notifyListeners(id, 100, upload.status);
    }
  }

  getUpload(id: string) {
    return this.uploads.get(id);
  }

  getAllUploads() {
    return Array.from(this.uploads.entries()).map(([id, upload]) => ({
      id,
      ...upload,
    }));
  }

  removeUpload(id: string): void {
    this.uploads.delete(id);
    this.listeners.delete(id);
  }

  onProgress(id: string, callback: (progress: number, status: string) => void): void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, []);
    }
    this.listeners.get(id)!.push(callback);
  }

  private notifyListeners(id: string, progress: number, status: string): void {
    const callbacks = this.listeners.get(id);
    if (callbacks) {
      callbacks.forEach(callback => callback(progress, status));
    }
  }

  clear(): void {
    this.uploads.clear();
    this.listeners.clear();
  }
}

/**
 * Default upload configurations for different file types
 */
export const uploadConfigs = {
  profileImage: {
    maxSize: SIZE_LIMITS.image,
    allowedTypes: FILE_TYPES.images,
    allowedExtensions: FILE_EXTENSIONS.images,
  },
  courseImage: {
    maxSize: SIZE_LIMITS.image,
    allowedTypes: FILE_TYPES.images,
    allowedExtensions: FILE_EXTENSIONS.images,
  },
  courseVideo: {
    maxSize: SIZE_LIMITS.video,
    allowedTypes: FILE_TYPES.videos,
    allowedExtensions: FILE_EXTENSIONS.videos,
  },
  assignment: {
    maxSize: SIZE_LIMITS.document,
    allowedTypes: [...FILE_TYPES.documents, ...FILE_TYPES.images],
    allowedExtensions: [...FILE_EXTENSIONS.documents, ...FILE_EXTENSIONS.images],
  },
  general: {
    maxSize: SIZE_LIMITS.default,
    allowedTypes: [],
    allowedExtensions: [],
  },
} as const;