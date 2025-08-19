import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiUpload, FiX, FiPlay, FiCheck, FiLoader } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function VideoUpload({ onUploadSuccess, onUploadError, accept = "video/*", maxSizeMB = 100 }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploadedVideo, setUploadedVideo] = useState(null)
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    // Check file type
    if (!file.type.startsWith('video/')) {
      throw new Error('Please select a valid video file')
    }

    // Check file size (convert MB to bytes)
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`)
    }

    return true
  }

  const uploadVideo = async (file) => {
    try {
      validateFile(file)
      setUploading(true)
      setUploadProgress(0)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `lessons/videos/${fileName}`

      // First ensure storage buckets exist
      try {
        await fetch('/api/storage/setup', { method: 'POST' })
      } catch (setupError) {
        console.warn('Storage setup warning:', setupError)
      }

      // Upload to Supabase storage
      let { data, error } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file)

      if (error) {
        // If bucket doesn't exist, try to create it and upload again
        if (error.statusCode === 404 || error.message.includes('bucket')) {
          console.log('Creating videos bucket...')
          await fetch('/api/storage/setup', { method: 'POST' })
          
          // Retry upload
          const retryResult = await supabase.storage
            .from('course-videos')
            .upload(filePath, file)
            
          if (retryResult.error) throw retryResult.error
          data = retryResult.data
        } else {
          throw error
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-videos')
        .getPublicUrl(filePath)

      const videoData = {
        url: publicUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
        path: filePath
      }

      setUploadedVideo(videoData)
      toast.success('Video uploaded successfully!')
      onUploadSuccess(videoData)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload video')
      onUploadError(error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      uploadVideo(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      uploadVideo(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeVideo = async () => {
    if (uploadedVideo && uploadedVideo.path) {
      try {
        await supabase.storage
          .from('course-videos')
          .remove([uploadedVideo.path])
      } catch (error) {
        console.error('Error deleting video:', error)
      }
    }
    setUploadedVideo(null)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (uploadedVideo) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <FiCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{uploadedVideo.filename}</p>
                <p className="text-sm text-gray-400">
                  {formatFileSize(uploadedVideo.size)} • Video uploaded
                </p>
              </div>
            </div>
            <button
              onClick={removeVideo}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-dark-800 rounded-lg p-3">
            <video
              src={uploadedVideo.url}
              controls
              className="w-full max-h-48 rounded"
            />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${dragOver 
            ? 'border-primary-400 bg-primary-500/10' 
            : 'border-dark-600 hover:border-dark-500'
          }
          ${uploading ? 'pointer-events-none' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mx-auto">
              <FiLoader className="w-6 h-6 text-white animate-spin" />
            </div>
            <div>
              <p className="text-white font-medium">Uploading video...</p>
              <p className="text-sm text-gray-400">{uploadProgress}% complete</p>
            </div>
            <div className="w-full bg-dark-600 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-dark-600 rounded-full flex items-center justify-center mx-auto">
              <FiUpload className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-white font-medium">
                {dragOver ? 'Drop video here' : 'Upload Video'}
              </p>
              <p className="text-sm text-gray-400">
                Drag and drop or click to select video file
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max size: {maxSizeMB}MB • Supports MP4, WebM, MOV, AVI
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}