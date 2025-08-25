/**
 * YouTube URL Processing Utilities
 * Standardized functions for handling YouTube video URLs and embedding
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 */
export const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null

  // Remove any whitespace
  url = url.trim()

  // Common YouTube URL patterns
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtube\.com\/v\/([^&\n?#]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      // Remove any additional parameters from the video ID
      return match[1].split('&')[0].split('?')[0]
    }
  }

  return null
}

/**
 * Validate if a string contains a valid YouTube URL
 */
export const isYouTubeUrl = (url) => {
  return extractYouTubeId(url) !== null
}

/**
 * Generate YouTube embed URL with optimal parameters
 * @param {string} url - Original YouTube URL
 * @param {Object} options - Embedding options
 */
export const getYouTubeEmbedUrl = (url, options = {}) => {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null

  const {
    autoplay = 0,
    rel = 0,
    enablejsapi = 1,
    origin = typeof window !== 'undefined' ? window.location.origin : '',
    modestbranding = 1,
    playsinline = 1,
    iv_load_policy = 3, // Hide annotations
    cc_load_policy = 0, // Hide captions by default
    start = null,
    end = null
  } = options

  const params = new URLSearchParams({
    autoplay: autoplay.toString(),
    rel: rel.toString(),
    enablejsapi: enablejsapi.toString(),
    modestbranding: modestbranding.toString(),
    playsinline: playsinline.toString(),
    iv_load_policy: iv_load_policy.toString(),
    cc_load_policy: cc_load_policy.toString()
  })

  if (origin) params.set('origin', origin)
  if (start !== null) params.set('start', start.toString())
  if (end !== null) params.set('end', end.toString())

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

/**
 * Generate YouTube thumbnail URL
 * @param {string} url - Original YouTube URL
 * @param {string} quality - Thumbnail quality (default, mqdefault, hqdefault, sddefault, maxresdefault)
 */
export const getYouTubeThumbnail = (url, quality = 'hqdefault') => {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null

  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Get YouTube video info (title, description, etc.) - requires API key
 * This is a placeholder for future implementation
 */
export const getYouTubeVideoInfo = async (url, apiKey) => {
  const videoId = extractYouTubeId(url)
  if (!videoId || !apiKey) return null

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`
    )
    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0]
      return {
        id: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high.url,
        duration: video.contentDetails.duration,
        publishedAt: video.snippet.publishedAt,
        viewCount: video.statistics.viewCount,
        channelTitle: video.snippet.channelTitle
      }
    }
  } catch (error) {
    console.error('Error fetching YouTube video info:', error)
  }

  return null
}

/**
 * Convert YouTube duration format (PT4M13S) to seconds
 */
export const parseYouTubeDuration = (duration) => {
  if (!duration) return 0
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1]) || 0
  const minutes = parseInt(match[2]) || 0
  const seconds = parseInt(match[3]) || 0

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Validate YouTube URL and provide user-friendly error messages
 */
export const validateYouTubeUrl = (url) => {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'URL is required' }
  }

  if (!isYouTubeUrl(url)) {
    return { 
      valid: false, 
      error: 'Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=VIDEO_ID)' 
    }
  }

  return { valid: true }
}