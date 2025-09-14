import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiPlay, FiPause, FiLoader, FiAlertCircle, FiExternalLink } from 'react-icons/fi'
import { getYouTubeEmbedUrl, getVideoType, getVideoThumbnail } from '../../utils/video'

/**
 * Enhanced Video Player Component
 * Handles YouTube iframe embedding with proper error handling and fallbacks
 */
export default function EnhancedVideoPlayer({ 
  videoUrl, 
  title = 'Video',
  hasAccess = false,
  onLoadStart,
  onLoadEnd,
  onError,
  className = ''
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDirectLink, setShowDirectLink] = useState(false)
  const iframeRef = useRef(null)
  const loadTimeoutRef = useRef(null)

  // Check if the URL is a valid YouTube URL
  const isValidYouTube = getVideoType(videoUrl) === 'youtube'
  const embedUrl = isValidYouTube ? getYouTubeEmbedUrl(videoUrl, {
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    rel: 0,
    modestbranding: 1,
    playsinline: 1
  }) : null

  const thumbnailUrl = isValidYouTube ? getYouTubeThumbnail(videoUrl, 'hqdefault') : null

  useEffect(() => {
    setLoading(true)
    setError(null)
    setShowDirectLink(false)

    // Set a timeout to show error message if iframe doesn't load
    loadTimeoutRef.current = setTimeout(() => {
      if (loading) {
        setError('Video is taking too long to load')
        setShowDirectLink(true)
        setLoading(false)
        if (onError) onError('Load timeout')
      }
    }, 15000) // 15 second timeout

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [videoUrl])

  const handleIframeLoad = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }
    setLoading(false)
    setError(null)
    if (onLoadEnd) onLoadEnd()
  }

  const handleIframeError = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }
    setLoading(false)
    setError('Failed to load video content')
    setShowDirectLink(true)
    if (onError) onError('Iframe load error')
  }

  const openDirectLink = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // If not a YouTube URL, show error
  if (!isValidYouTube) {
    return (
      <div className={`aspect-video rounded-lg bg-dark-800 flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Invalid Video URL</h3>
          <p className="text-gray-400 mb-4">
            Please provide a valid YouTube video URL.
          </p>
          {videoUrl && (
            <button
              onClick={openDirectLink}
              className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
            >
              <FiExternalLink className="w-4 h-4" />
              <span>Open Original Link</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative aspect-video rounded-lg bg-dark-800 overflow-hidden ${className}`}>
      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-dark-800"
        >
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <div className="relative text-center">
            <FiLoader className="w-8 h-8 text-primary-400 mx-auto mb-3 animate-spin" />
            <p className="text-white font-medium">Loading video...</p>
            <p className="text-gray-400 text-sm">Please wait a moment</p>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-dark-800"
        >
          <div className="text-center p-6">
            <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Video</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            
            <div className="space-y-3">
              {showDirectLink && (
                <button
                  onClick={openDirectLink}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <FiExternalLink className="w-4 h-4" />
                  <span>Watch on YouTube</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  setError(null)
                  setLoading(true)
                  setShowDirectLink(false)
                  // Force iframe reload
                  if (iframeRef.current) {
                    iframeRef.current.src = embedUrl
                  }
                }}
                className="block mx-auto text-primary-400 hover:text-primary-300 text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Video Iframe */}
      {hasAccess && embedUrl && (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{ 
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}

      {/* Access Denied State */}
      {!hasAccess && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
          <div className="relative text-center p-6">
            <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPlay className="w-10 h-10 text-primary-400 ml-1" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Video Locked
            </h3>
            <p className="text-gray-400">
              Enroll in this course to watch the video
            </p>
          </div>
        </div>
      )}
    </div>
  )
}