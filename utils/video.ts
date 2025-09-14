/**
 * Enhanced Video Utilities
 * Provides comprehensive video handling for YouTube, Supabase storage, and direct video files
 */

import type { VideoMetadata } from './types';

export interface VideoValidationResult {
  valid: boolean;
  type: VideoType;
  error?: string;
  metadata?: Partial<VideoMetadata>;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: string; // ISO 8601 duration format (PT4M13S)
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  channelTitle: string;
  tags: string[];
}

export interface VideoPlayerOptions {
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  poster?: string;
  playbackRates?: number[];
  volume?: number;
  startTime?: number;
  endTime?: number;
}

export interface YouTubeEmbedOptions extends VideoPlayerOptions {
  rel?: 0 | 1; // Show related videos
  modestbranding?: 0 | 1; // Hide YouTube logo
  enablejsapi?: 0 | 1; // Enable JavaScript API
  origin?: string; // Your domain
  iv_load_policy?: 1 | 3; // Hide annotations
  cc_load_policy?: 0 | 1; // Show captions
  showinfo?: 0 | 1; // Show video info
  fs?: 0 | 1; // Allow fullscreen
}

export type VideoType = 'youtube' | 'supabase' | 'direct' | 'vimeo' | 'unknown';

/**
 * Extract YouTube video ID from various URL formats
 */
export const extractYouTubeId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;

  // Remove any whitespace
  url = url.trim();

  // YouTube URL patterns
  const patterns = [
    // Standard watch URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    // Short URLs
    /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
    // Embed URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    // Mobile URLs
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    // Playlist URLs with video
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    // YouTube studio URLs
    /(?:https?:\/\/)?studio\.youtube\.com\/video\/([^&\n?#\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Clean up the video ID
      return match[1].split('&')[0].split('?')[0].split('#')[0];
    }
  }

  return null;
};

/**
 * Extract Vimeo video ID from URL
 */
export const extractVimeoId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
    /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Determine video type from URL
 */
export const getVideoType = (url: string): VideoType => {
  if (!url || typeof url !== 'string') return 'unknown';

  // Check for YouTube
  if (extractYouTubeId(url)) return 'youtube';

  // Check for Vimeo
  if (extractVimeoId(url)) return 'vimeo';

  // Check for Supabase storage
  if (isSupabaseVideoUrl(url)) return 'supabase';

  // Check for direct video files
  if (isDirectVideoUrl(url)) return 'direct';

  return 'unknown';
};

/**
 * Check if URL is a Supabase storage video URL
 */
export const isSupabaseVideoUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;

  return (
    url.includes('supabase.co/storage/') ||
    url.includes('supabase.in/storage/') ||
    url.includes('/storage/v1/object/public/')
  );
};

/**
 * Check if URL is a direct video file
 */
export const isDirectVideoUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;

  const videoExtensions = [
    '.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.m4v',
    '.mkv', '.3gp', '.f4v', '.swf', '.mp3', '.wav', '.m4a'
  ];

  const urlLower = url.toLowerCase();
  return videoExtensions.some(ext => urlLower.includes(ext));
};

/**
 * Validate video URL and return detailed information
 */
export const validateVideoUrl = (url: string): VideoValidationResult => {
  if (!url || url.trim() === '') {
    return {
      valid: false,
      type: 'unknown',
      error: 'Video URL is required',
    };
  }

  const videoType = getVideoType(url);

  if (videoType === 'unknown') {
    return {
      valid: false,
      type: 'unknown',
      error: 'Please provide a valid video URL (YouTube, Vimeo, uploaded video, or direct video file)',
    };
  }

  // Additional validation based on type
  let metadata: Partial<VideoMetadata> = { type: videoType };

  if (videoType === 'youtube') {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return {
        valid: false,
        type: 'youtube',
        error: 'Invalid YouTube URL format',
      };
    }
    metadata.id = videoId;
  } else if (videoType === 'vimeo') {
    const videoId = extractVimeoId(url);
    if (!videoId) {
      return {
        valid: false,
        type: 'vimeo',
        error: 'Invalid Vimeo URL format',
      };
    }
    metadata.id = videoId;
  }

  return {
    valid: true,
    type: videoType,
    metadata,
  };
};

/**
 * Generate YouTube embed URL with comprehensive options
 */
export const getYouTubeEmbedUrl = (
  url: string,
  options: YouTubeEmbedOptions = {}
): string | null => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  const {
    autoplay = 0,
    rel = 0,
    modestbranding = 1,
    enablejsapi = 1,
    origin = typeof window !== 'undefined' ? window.location.origin : '',
    iv_load_policy = 3,
    cc_load_policy = 0,
    showinfo = 0,
    fs = 1,
    controls = 1,
    startTime,
    endTime,
  } = options;

  const params = new URLSearchParams({
    autoplay: autoplay.toString(),
    rel: rel.toString(),
    modestbranding: modestbranding.toString(),
    enablejsapi: enablejsapi.toString(),
    iv_load_policy: iv_load_policy.toString(),
    cc_load_policy: cc_load_policy.toString(),
    showinfo: showinfo.toString(),
    fs: fs.toString(),
    controls: controls.toString(),
  });

  if (origin) params.set('origin', origin);
  if (startTime !== undefined) params.set('start', Math.floor(startTime).toString());
  if (endTime !== undefined) params.set('end', Math.floor(endTime).toString());

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

/**
 * Generate Vimeo embed URL
 */
export const getVimeoEmbedUrl = (
  url: string,
  options: VideoPlayerOptions = {}
): string | null => {
  const videoId = extractVimeoId(url);
  if (!videoId) return null;

  const {
    autoplay = false,
    controls = true,
    muted = false,
    loop = false,
  } = options;

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    controls: controls ? '1' : '0',
    muted: muted ? '1' : '0',
    loop: loop ? '1' : '0',
    byline: '0',
    portrait: '0',
    title: '0',
  });

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
};

/**
 * Get video thumbnail URL
 */
export const getVideoThumbnail = (
  url: string,
  quality: 'low' | 'medium' | 'high' | 'max' = 'high'
): string | null => {
  const videoType = getVideoType(url);

  switch (videoType) {
    case 'youtube':
      return getYouTubeThumbnail(url, quality);

    case 'vimeo':
      return getVimeoThumbnail(url);

    case 'supabase':
    case 'direct':
      // For uploaded videos, thumbnails would need to be generated on the server
      return null;

    default:
      return null;
  }
};

/**
 * Get YouTube thumbnail URL
 */
export const getYouTubeThumbnail = (
  url: string,
  quality: 'low' | 'medium' | 'high' | 'max' = 'high'
): string | null => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  const qualityMap = {
    low: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    max: 'maxresdefault',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

/**
 * Get Vimeo thumbnail (requires API call)
 */
export const getVimeoThumbnail = async (url: string): Promise<string | null> => {
  const videoId = extractVimeoId(url);
  if (!videoId) return null;

  try {
    const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
    const data = await response.json();

    if (data && data[0] && data[0].thumbnail_large) {
      return data[0].thumbnail_large;
    }
  } catch (error) {
    console.error('Failed to fetch Vimeo thumbnail:', error);
  }

  return null;
};

/**
 * Get video metadata (requires API keys for YouTube/Vimeo)
 */
export const getVideoMetadata = async (
  url: string,
  apiKey?: string
): Promise<VideoMetadata | null> => {
  const videoType = getVideoType(url);

  switch (videoType) {
    case 'youtube':
      return getYouTubeVideoInfo(url, apiKey);

    case 'vimeo':
      return getVimeoVideoInfo(url);

    case 'supabase':
    case 'direct':
      return getDirectVideoMetadata(url);

    default:
      return null;
  }
};

/**
 * Get YouTube video information using YouTube Data API
 */
export const getYouTubeVideoInfo = async (
  url: string,
  apiKey?: string
): Promise<VideoMetadata | null> => {
  const videoId = extractYouTubeId(url);
  if (!videoId || !apiKey) return null;

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return {
        type: 'youtube',
        id: videoId,
        title: video.snippet.title,
        duration: parseYouTubeDuration(video.contentDetails.duration),
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        accessible: true,
      };
    }
  } catch (error) {
    console.error('Error fetching YouTube video info:', error);
  }

  return null;
};

/**
 * Get Vimeo video information
 */
export const getVimeoVideoInfo = async (url: string): Promise<VideoMetadata | null> => {
  const videoId = extractVimeoId(url);
  if (!videoId) return null;

  try {
    const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);

    if (!response.ok) {
      throw new Error(`Vimeo API error: ${response.status}`);
    }

    const data = await response.json();

    if (data && data[0]) {
      const video = data[0];
      return {
        type: 'vimeo',
        id: videoId,
        title: video.title,
        duration: video.duration,
        thumbnail: video.thumbnail_large,
        accessible: true,
      };
    }
  } catch (error) {
    console.error('Error fetching Vimeo video info:', error);
  }

  return null;
};

/**
 * Get metadata for direct video files (limited without server-side processing)
 */
export const getDirectVideoMetadata = async (url: string): Promise<VideoMetadata | null> => {
  try {
    // Try to make a HEAD request to check if the video is accessible
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });

    return {
      type: isSupabaseVideoUrl(url) ? 'supabase' : 'direct',
      id: getVideoFilename(url),
      accessible: true,
    };
  } catch (error) {
    return {
      type: isSupabaseVideoUrl(url) ? 'supabase' : 'direct',
      id: getVideoFilename(url),
      accessible: false,
    };
  }
};

/**
 * Convert YouTube duration format (PT4M13S) to seconds
 */
export const parseYouTubeDuration = (duration: string): number => {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Format duration in seconds to human readable format
 */
export const formatVideoDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

/**
 * Get video filename from URL
 */
export const getVideoFilename = (url: string): string => {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1] || 'video';
  } catch {
    // Fallback for malformed URLs
    const parts = url.split('/');
    return parts[parts.length - 1] || 'video';
  }
};

/**
 * Get video file extension
 */
export const getVideoExtension = (url: string): string | null => {
  const filename = getVideoFilename(url);
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : null;
};

/**
 * Check browser support for video format
 */
export const checkVideoFormatSupport = (url: string): {
  supported: boolean;
  format: string;
  mimeType?: string;
  supportLevel?: string;
} => {
  const extension = getVideoExtension(url);
  if (!extension) return { supported: false, format: 'unknown' };

  if (typeof document === 'undefined') {
    // Server-side, assume basic support
    return { supported: true, format: extension };
  }

  const video = document.createElement('video');

  const formatMap: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    avi: 'video/avi',
    mov: 'video/mp4', // MOV is often MP4 compatible
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    m4v: 'video/mp4',
    mkv: 'video/x-matroska',
  };

  const mimeType = formatMap[extension];
  if (!mimeType) return { supported: false, format: extension };

  const support = video.canPlayType(mimeType);

  return {
    supported: support === 'probably' || support === 'maybe',
    format: extension,
    mimeType,
    supportLevel: support,
  };
};

/**
 * Generate video embed code
 */
export const generateVideoEmbedCode = (
  url: string,
  options: VideoPlayerOptions & { width?: number; height?: number } = {}
): string | null => {
  const { width = 560, height = 315 } = options;
  const videoType = getVideoType(url);

  switch (videoType) {
    case 'youtube': {
      const embedUrl = getYouTubeEmbedUrl(url, options);
      if (!embedUrl) return null;

      return `<iframe width="${width}" height="${height}" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
    }

    case 'vimeo': {
      const embedUrl = getVimeoEmbedUrl(url, options);
      if (!embedUrl) return null;

      return `<iframe width="${width}" height="${height}" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
    }

    case 'supabase':
    case 'direct': {
      const { autoplay = false, controls = true, muted = false, loop = false, poster } = options;

      const attributes = [
        `width="${width}"`,
        `height="${height}"`,
        controls ? 'controls' : '',
        autoplay ? 'autoplay' : '',
        muted ? 'muted' : '',
        loop ? 'loop' : '',
        poster ? `poster="${poster}"` : '',
      ].filter(Boolean).join(' ');

      return `<video ${attributes}><source src="${url}" type="video/mp4">Your browser does not support the video tag.</video>`;
    }

    default:
      return null;
  }
};

/**
 * Create video player configuration based on video type
 */
export const createVideoPlayerConfig = (
  url: string,
  options: VideoPlayerOptions = {}
): any => {
  const videoType = getVideoType(url);

  const baseConfig = {
    url,
    type: videoType,
    controls: options.controls ?? true,
    volume: options.volume ?? 0.8,
    playbackRates: options.playbackRates ?? [0.5, 0.75, 1, 1.25, 1.5, 2],
    ...options,
  };

  switch (videoType) {
    case 'youtube':
      return {
        ...baseConfig,
        embedUrl: getYouTubeEmbedUrl(url, options),
        thumbnail: getYouTubeThumbnail(url),
      };

    case 'vimeo':
      return {
        ...baseConfig,
        embedUrl: getVimeoEmbedUrl(url, options),
      };

    case 'supabase':
    case 'direct':
      return {
        ...baseConfig,
        directUrl: url,
        filename: getVideoFilename(url),
        extension: getVideoExtension(url),
        formatSupport: checkVideoFormatSupport(url),
      };

    default:
      return baseConfig;
  }
};

/**
 * Video quality detection and optimization
 */
export const getOptimizedVideoUrl = (
  url: string,
  preferredQuality: 'auto' | '4K' | '1080p' | '720p' | '480p' | '360p' = 'auto'
): string => {
  const videoType = getVideoType(url);

  // For YouTube and Vimeo, quality is handled by their players
  if (videoType === 'youtube' || videoType === 'vimeo') {
    return url;
  }

  // For direct videos, you might have different quality versions
  // This is just an example - implement based on your video storage structure
  if (videoType === 'supabase' || videoType === 'direct') {
    if (preferredQuality !== 'auto') {
      // Example: replace filename with quality-specific version
      const extension = getVideoExtension(url);
      const baseUrl = url.replace(new RegExp(`\\.${extension}$`), '');
      return `${baseUrl}_${preferredQuality}.${extension}`;
    }
  }

  return url;
};

/**
 * Video analytics tracking helpers
 */
export const trackVideoEvent = (
  videoId: string,
  event: 'play' | 'pause' | 'ended' | 'progress' | 'quality_change',
  data?: Record<string, any>
): void => {
  // Implement your analytics tracking here
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'video_' + event, {
      video_id: videoId,
      ...data,
    });
  }

  // You can also send to your own analytics service
  console.log('Video event:', { videoId, event, data });
};