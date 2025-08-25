/**
 * Universal Video Utilities
 * Handles both YouTube URLs and Supabase storage video URLs
 */

import { isYouTubeUrl, extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnail } from './youtube'

/**
 * Detect if URL is a Supabase storage URL
 */
export const isSupabaseVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  
  // Check if URL contains supabase.co/storage or supabase.in/storage
  return url.includes('supabase.co/storage/') || 
         url.includes('supabase.in/storage/') ||
         url.includes('/storage/v1/object/public/')
}

/**
 * Detect if URL is a direct video file
 */
export const isDirectVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.m4v']
  const urlLower = url.toLowerCase()
  
  return videoExtensions.some(ext => urlLower.includes(ext))
}

/**
 * Get video type from URL
 */
export const getVideoType = (url) => {
  if (!url) return 'unknown'
  
  if (isYouTubeUrl(url)) return 'youtube'
  if (isSupabaseVideoUrl(url)) return 'supabase'
  if (isDirectVideoUrl(url)) return 'direct'
  
  return 'unknown'
}

/**
 * Validate video URL and return appropriate error messages
 */
export const validateVideoUrl = (url) => {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'Video URL is required' }
  }

  const videoType = getVideoType(url)
  
  if (videoType === 'unknown') {
    return { 
      valid: false, 
      error: 'Please provide a valid video URL (YouTube, uploaded video, or direct video file)' 
    }
  }

  return { valid: true, type: videoType }
}

/**
 * Get video thumbnail URL based on video type
 */
export const getVideoThumbnail = (url) => {
  const videoType = getVideoType(url)
  
  switch (videoType) {
    case 'youtube':
      return getYouTubeThumbnail(url, 'hqdefault')
    
    case 'supabase':
    case 'direct':
      // For video files, we'll need to generate thumbnails on the server
      // For now, return null and let the video element handle it
      return null
      
    default:
      return null
  }
}

/**
 * Get video metadata (duration, size, etc.)
 * This is a placeholder for future implementation
 */
export const getVideoMetadata = async (url) => {
  const videoType = getVideoType(url)
  
  if (videoType === 'youtube') {
    // Would require YouTube API key
    return null
  }
  
  if (videoType === 'supabase' || videoType === 'direct') {
    // Could implement server-side video metadata extraction
    return null
  }
  
  return null
}

/**
 * Get optimized video URL for different qualities
 */
export const getOptimizedVideoUrl = (url, quality = 'auto') => {
  const videoType = getVideoType(url)
  
  if (videoType === 'youtube') {
    // YouTube handles quality automatically
    return getYouTubeEmbedUrl(url)
  }
  
  if (videoType === 'supabase' || videoType === 'direct') {
    // For now, return original URL
    // In future, could implement different quality versions
    return url
  }
  
  return url
}

/**
 * Check if video URL is accessible
 */
export const checkVideoAccessibility = async (url) => {
  try {
    const videoType = getVideoType(url)
    
    if (videoType === 'youtube') {
      // YouTube videos are publicly accessible if embeddable
      return { accessible: true, message: 'YouTube video' }
    }
    
    if (videoType === 'supabase' || videoType === 'direct') {
      // Try to make a HEAD request to check if the URL is accessible
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues for external URLs
      })
      
      return { 
        accessible: true, 
        message: 'Video file accessible',
        contentType: response.headers.get('content-type')
      }
    }
    
    return { accessible: false, message: 'Unknown video type' }
    
  } catch (error) {
    return { 
      accessible: false, 
      message: `Error checking accessibility: ${error.message}` 
    }
  }
}

/**
 * Extract filename from Supabase storage URL
 */
export const getSupabaseVideoFilename = (url) => {
  if (!isSupabaseVideoUrl(url)) return null
  
  try {
    // Extract filename from URL path
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    return pathParts[pathParts.length - 1]
  } catch (error) {
    return null
  }
}

/**
 * Get video file extension
 */
export const getVideoExtension = (url) => {
  if (!url) return null
  
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname.toLowerCase()
    const match = path.match(/\.([^.]+)$/)
    return match ? match[1] : null
  } catch (error) {
    // If URL parsing fails, try simple string matching
    const match = url.toLowerCase().match(/\.([^.?#]+)/)
    return match ? match[1] : null
  }
}

/**
 * Check if browser supports video format
 */
export const checkVideoFormatSupport = (url) => {
  const extension = getVideoExtension(url)
  if (!extension) return { supported: false, format: 'unknown' }
  
  const video = document.createElement('video')
  
  const formatMap = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'avi': 'video/avi',
    'mov': 'video/mp4', // MOV is often MP4 compatible
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'm4v': 'video/mp4'
  }
  
  const mimeType = formatMap[extension]
  if (!mimeType) return { supported: false, format: extension }
  
  const support = video.canPlayType(mimeType)
  
  return {
    supported: support === 'probably' || support === 'maybe',
    format: extension,
    mimeType,
    supportLevel: support
  }
}