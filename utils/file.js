/**
 * File Handling Utilities
 * Provides file upload, validation, and manipulation utilities
 * @typedef {import('./types').UploadOptions} UploadOptions
 * @typedef {import('./types').ValidationResult} ValidationResult
 * 
 * @typedef {ValidationResult & {
 *   file?: File,
 *   fileInfo?: {
 *     name: string,
 *     size: number,
 *     type: string,
 *     extension: string,
 *     lastModified: number
 *   }
 * }} FileValidationResult
 * 
 * @typedef {Object} ImageDimensions
 * @property {number} width
 * @property {number} height
 * 
 * @typedef {Object} ImageProcessingOptions
 * @property {number} [maxWidth]
 * @property {number} [maxHeight]
 * @property {number} [quality]
 * @property {'jpeg' | 'png' | 'webp'} [format]
 * @property {boolean} [maintainAspectRatio]
 */

/**
 * Default file type configurations
 * @type {const}
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
};

/**
 * @type {const}
 */
export const FILE_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  videos: ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv'],
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
  archives: ['zip', 'rar', '7z'],
};

/**
 * Default size limits (in bytes)
 * @type {const}
 */
export const SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB
  video: 100 * 1024 * 1024,    // 100MB
  document: 10 * 1024 * 1024,  // 10MB
  audio: 20 * 1024 * 1024,     // 20MB
  archive: 50 * 1024 * 1024,   // 50MB
  default: 5 * 1024 * 1024,    // 5MB
};

/**
 * Get file extension from filename
 * @param {string} filename
 * @returns {string}
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : '';
};

/**
 * Get filename without extension
 * @param {string} filename
 * @returns {string}
 */
export const getFileNameWithoutExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(0, lastDot) : filename;
};

/**
 * Determine file category based on type or extension
 * @param {File | string} file
 * @returns {keyof typeof FILE_TYPES}
 */
export const getFileCategory = (file) => {
  let mimeType;
  let extension;

  if (typeof file === 'string') {
    extension = getFileExtension(file);
    mimeType = '';
  } else {
    mimeType = file.type;
    extension = getFileExtension(file.name);
  }

  // Check by MIME type first
  for (const [category, types] of Object.entries(FILE_TYPES)) {
    if (mimeType && types.includes(mimeType)) {
      return category;
    }
  }

  // Fallback to extension
  for (const [category, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if (extension && extensions.includes(extension)) {
      return category;
    }
  }

  return 'documents'; // Default fallback
};

/**
 * Validate file against specified options
 * @param {File} file
 * @param {UploadOptions} [options={}]
 * @returns {FileValidationResult}
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = SIZE_LIMITS.default,
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  const errors = [];
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
 * @param {File[] | FileList} files
 * @param {UploadOptions & { maxFiles?: number }} [options={}]
 * @returns {ValidationResult & { validFiles: File[], invalidFiles: Array<{ file: File, errors: string[] }> }}
 */
export const validateFiles = (files, options = {}) => {
  const { maxFiles = 10 } = options;
  const fileArray = Array.from(files);
  const validFiles = [];
  const invalidFiles = [];
  const globalErrors = [];

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
      invalidFiles.push({ file, errors: result.errors });
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
 * @param {File} file
 * @returns {Promise<string>}
 */
export const fileToBase64 = (file) => {
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
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
export const fileToArrayBuffer = (file) => {
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
 * @param {File} file
 * @param {string} [encoding='utf-8']
 * @returns {Promise<string>}
 */
export const fileToText = (file, encoding = 'utf-8') => {
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
 * @param {File} file
 * @returns {Promise<ImageDimensions>}
 */
export const getImageDimensions = (file) => {
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
 * @param {File} file
 * @param {ImageProcessingOptions} [options={}]
 * @returns {Promise<File>}
 */
export const resizeImage = (file, options = {}) => {
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
 * @param {File} file
 * @param {number} [size=150]
 * @param {number} [quality=0.7]
 * @returns {Promise<File>}
 */
export const createThumbnail = (file, size = 150, quality = 0.7) => {
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
 * @param {string} originalName
 * @param {string} [prefix='']
 * @param {string} [suffix='']
 * @returns {string}
 */
export const generateUniqueFilename = (originalName, prefix = '', suffix = '') => {
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
 * @param {string} filename
 * @returns {string}
 */
export const sanitizeFilename = (filename) => {
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
 * @param {Blob | string} data
 * @param {string} filename
 * @param {string} [mimeType]
 */
export const downloadFile = (data, filename, mimeType) => {
  let blob;

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
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
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
  /** @type {Map<string, { file: File, progress: number, status: 'pending' | 'uploading' | 'completed' | 'error', error?: string, result?: any }>} */
  #uploads = new Map();

  /** @type {Map<string, Array<(progress: number, status: string) => void>>} */
  #listeners = new Map();

  /**
   * @param {string} id
   * @param {File} file
   */
  addFile(id, file) {
    this.#uploads.set(id, {
      file,
      progress: 0,
      status: 'pending',
    });
  }

  /**
   * @param {string} id
   * @param {number} progress
   */
  updateProgress(id, progress) {
    const upload = this.#uploads.get(id);
    if (upload) {
      upload.progress = progress;
      upload.status = progress === 100 ? 'completed' : 'uploading';
      this.#notifyListeners(id, progress, upload.status);
    }
  }

  /**
   * @param {string} id
   * @param {string} error
   */
  setError(id, error) {
    const upload = this.#uploads.get(id);
    if (upload) {
      upload.status = 'error';
      upload.error = error;
      this.#notifyListeners(id, upload.progress, upload.status);
    }
  }

  /**
   * @param {string} id
   * @param {any} result
   */
  setCompleted(id, result) {
    const upload = this.#uploads.get(id);
    if (upload) {
      upload.status = 'completed';
      upload.progress = 100;
      upload.result = result;
      this.#notifyListeners(id, 100, upload.status);
    }
  }

  /**
   * @param {string} id
   * @returns {any}
   */
  getUpload(id) {
    return this.#uploads.get(id);
  }

  getAllUploads() {
    return Array.from(this.#uploads.entries()).map(([id, upload]) => ({
      id,
      ...upload,
    }));
  }

  /**
   * @param {string} id
   */
  removeUpload(id) {
    this.#uploads.delete(id);
    this.#listeners.delete(id);
  }

  /**
   * @param {string} id
   * @param {(progress: number, status: string) => void} callback
   */
  onProgress(id, callback) {
    if (!this.#listeners.has(id)) {
      this.#listeners.set(id, []);
    }
    this.#listeners.get(id).push(callback);
  }

  /**
   * @param {string} id
   * @param {number} progress
   * @param {string} status
   * @private
   */
  #notifyListeners(id, progress, status) {
    const callbacks = this.#listeners.get(id);
    if (callbacks) {
      callbacks.forEach(callback => callback(progress, status));
    }
  }

  clear() {
    this.#uploads.clear();
    this.#listeners.clear();
  }
}

/**
 * Default upload configurations for different file types
 * @type {const}
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
};