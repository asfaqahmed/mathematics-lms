import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, 
  FiSettings, FiSkipBack, FiSkipForward, FiLoader,
  FiLock, FiDownload, FiBookmark, FiShare2
} from 'react-icons/fi'

export default function CoursePlayer({ 
  lesson, 
  hasAccess, 
  onProgress, 
  onComplete,
  onNext,
  onPrevious,
  nextLesson,
  previousLesson,
  className = ''
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return ''
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0` : url
  }

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime
      const total = videoRef.current.duration
      
      setCurrentTime(current)
      setDuration(total)
      
      // Report progress
      if (onProgress && total > 0) {
        const progress = (current / total) * 100
        onProgress(progress, current, total)
        
        // Mark as complete if watched 90%
        if (progress >= 90 && onComplete) {
          onComplete(lesson.id)
        }
      }
    }
  }

  // Format time
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Handle seek
  const handleSeek = (e) => {
    if (videoRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      videoRef.current.volume = newMuted ? 0 : volume
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle playback rate change
  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate)
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
  }

  // Show/hide controls
  const showControlsTemporarily = () => {
    setShowControls(true)
    clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return
      
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, currentTime - 10)
          }
          break
        case 'ArrowRight':
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, currentTime + 10)
          }
          break
        case 'f':
          toggleFullscreen()
          break
        case 'm':
          toggleMute()
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, currentTime, duration])

  if (!lesson) {
    return (
      <div className={`aspect-video bg-dark-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <FiPlay className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Select a lesson to start learning</p>
        </div>
      </div>
    )
  }

  if (!hasAccess && !lesson.is_preview) {
    return (
      <div className={`aspect-video bg-dark-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <FiLock className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            This lesson is locked
          </h3>
          <p className="mb-4">Purchase the course to unlock this content</p>
          <button className="btn-primary">
            Purchase Course
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Player */}
      {lesson.type === 'video' ? (
        lesson.content?.includes('youtube.com') || lesson.content?.includes('youtu.be') ? (
          // YouTube Video
          <iframe
            src={getYouTubeEmbedUrl(lesson.content)}
            className="w-full aspect-video"
            allowFullScreen
            onLoad={() => setLoading(false)}
          />
        ) : (
          // Regular Video
          <video
            ref={videoRef}
            className="w-full aspect-video"
            onLoadedData={() => setLoading(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setIsPlaying(false)
              if (onComplete) onComplete(lesson.id)
            }}
          >
            <source src={lesson.content} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )
      ) : (
        // Article/Text Content
        <div className="aspect-video bg-white p-8 overflow-y-auto">
          <div 
            className="prose prose-lg max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <FiLoader className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Custom Video Controls (for non-YouTube videos) */}
      {lesson.type === 'video' && !lesson.content?.includes('youtube') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
        >
          {/* Progress Bar */}
          <div 
            className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-primary-400 transition-colors"
              >
                {isPlaying ? <FiPause className="w-6 h-6" /> : <FiPlay className="w-6 h-6" />}
              </button>

              {/* Previous/Next */}
              <div className="flex items-center space-x-2">
                {previousLesson && (
                  <button
                    onClick={onPrevious}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <FiSkipBack className="w-5 h-5" />
                  </button>
                )}
                {nextLesson && (
                  <button
                    onClick={onNext}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <FiSkipForward className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button onClick={toggleMute} className="text-white/70 hover:text-white">
                  {isMuted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16"
                />
              </div>

              {/* Time */}
              <span className="text-white/70 text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Playback Speed */}
              <select
                value={playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="bg-black/50 text-white text-sm rounded px-2 py-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* Action Buttons */}
              <button className="text-white/70 hover:text-white transition-colors">
                <FiBookmark className="w-5 h-5" />
              </button>
              <button className="text-white/70 hover:text-white transition-colors">
                <FiShare2 className="w-5 h-5" />
              </button>
              <button className="text-white/70 hover:text-white transition-colors">
                <FiDownload className="w-5 h-5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white/70 hover:text-white transition-colors"
              >
                <FiMaximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}