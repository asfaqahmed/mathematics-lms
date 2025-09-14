import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  FiPlay, FiPause, FiLoader, FiAlertCircle, FiExternalLink,
  FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiSkipBack,
  FiSkipForward, FiSettings
} from 'react-icons/fi'
import { getVideoType, validateVideoUrl, getVideoThumbnail, checkVideoFormatSupport, getYouTubeEmbedUrl } from '../../utils/video'

/**
 * Universal Video Player Component
 * Handles both YouTube videos and Supabase storage videos
 */
export default function UniversalVideoPlayer({ 
  videoUrl, 
  title = 'Video',
  hasAccess = false,
  onProgress,
  onComplete,
  onLoadStart,
  onLoadEnd,
  onError,
  className = ''
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videoType, setVideoType] = useState('unknown')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const videoRef = useRef(null)
  const iframeRef = useRef(null)
  const containerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const progressTimeoutRef = useRef(null)

  useEffect(() => {
    if (!videoUrl) {
      setError('No video URL provided')
      setLoading(false)
      return
    }

    const validation = validateVideoUrl(videoUrl)
    if (!validation.valid) {
      setError(validation.error)
      setLoading(false)
      return
    }

    setVideoType(validation.type)
    setLoading(true)
    setError(null)

    // Check format support for direct video files
    if (validation.type === 'direct' || validation.type === 'supabase') {
      const formatSupport = checkVideoFormatSupport(videoUrl)
      if (!formatSupport.supported) {
        setError(`Video format .${formatSupport.format} is not supported by your browser`)
        setLoading(false)
        return
      }
    }

    if (onLoadStart) onLoadStart()
  }, [videoUrl, onLoadStart])

  // Handle video progress tracking for direct videos
  const handleTimeUpdate = () => {
    if (videoRef.current && hasAccess) {
      const current = videoRef.current.currentTime
      const total = videoRef.current.duration

      setCurrentTime(current)
      setDuration(total)

      // Report progress to parent component
      if (onProgress && total > 0) {
        const progress = (current / total) * 100
        
        // Throttle progress updates to every 2 seconds
        if (progressTimeoutRef.current) {
          clearTimeout(progressTimeoutRef.current)
        }
        
        progressTimeoutRef.current = setTimeout(() => {
          onProgress(progress, current, total)
          
          // Mark as complete if watched 90%
          if (progress >= 90 && onComplete) {
            onComplete()
          }
        }, 2000)
      }
    }
  }

  const handleVideoLoad = () => {
    setLoading(false)
    setError(null)
    if (onLoadEnd) onLoadEnd()
  }

  const handleVideoError = (e) => {
    setLoading(false)
    setError('Failed to load video. The video file may be corrupted or inaccessible.')
    if (onError) onError('Video load error')
  }

  const handleIframeLoad = () => {
    setLoading(false)
    setError(null)
    if (onLoadEnd) onLoadEnd()
  }

  const handleIframeError = () => {
    setLoading(false)
    setError('Failed to load video content')
    if (onError) onError('Iframe load error')
  }

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      videoRef.current.volume = newMuted ? 0 : volume
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }

  const handleSeek = (e) => {
    if (videoRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const skipTime = (seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  const openDirectLink = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current)
    }
  }, [])

  const renderYouTubeVideo = () => {
    const embedUrl = getYouTubeEmbedUrl(videoUrl, {
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      rel: 0,
      modestbranding: 1,
      playsinline: 1
    })

    return (
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
    )
  }

  const renderDirectVideo = () => {
    return (
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onMouseMove={showControlsTemporarily}
          onClick={showControlsTemporarily}
          style={{ 
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />

        {/* Video Controls */}
        {hasAccess && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showControls ? 1 : 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4"
          >
            {/* Progress Bar */}
            <div 
              className="w-full bg-gray-600 rounded-full h-1 mb-4 cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="bg-primary-400 h-1 rounded-full transition-all duration-200"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button onClick={() => skipTime(-10)} className="text-white hover:text-primary-400">
                  <FiSkipBack className="w-5 h-5" />
                </button>
                
                <button onClick={togglePlay} className="text-white hover:text-primary-400">
                  {isPlaying ? <FiPause className="w-6 h-6" /> : <FiPlay className="w-6 h-6" />}
                </button>
                
                <button onClick={() => skipTime(10)} className="text-white hover:text-primary-400">
                  <FiSkipForward className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-2">
                  <button onClick={toggleMute} className="text-white hover:text-primary-400">
                    {isMuted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <button onClick={toggleFullscreen} className="text-white hover:text-primary-400">
                {isFullscreen ? <FiMinimize className="w-5 h-5" /> : <FiMaximize className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`relative aspect-video rounded-lg bg-dark-800 overflow-hidden ${className}`}
    >
      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-dark-800"
        >
          <div className="text-center">
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
              <button
                onClick={openDirectLink}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <FiExternalLink className="w-4 h-4" />
                <span>Open Video Directly</span>
              </button>
              
              <button
                onClick={() => {
                  setError(null)
                  setLoading(true)
                  // Force reload
                  if (videoRef.current) {
                    videoRef.current.load()
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

      {/* Video Content */}
      {hasAccess && !error && (
        <>
          {videoType === 'youtube' && renderYouTubeVideo()}
          {(videoType === 'supabase' || videoType === 'direct') && renderDirectVideo()}
        </>
      )}

      {/* Access Denied State */}
      {!hasAccess && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
          <div className="text-center p-6">
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