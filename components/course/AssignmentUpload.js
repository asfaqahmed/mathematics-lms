import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiUpload, FiFile, FiX, FiCheck, FiLoader } from 'react-icons/fi'
import toast from 'react-hot-toast'

/**
 * Assignment Upload Component
 * Allows students to upload assignment files for lessons
 */
export default function AssignmentUpload({ 
  user, 
  courseId, 
  lessonId, 
  lessonTitle,
  onUploadSuccess,
  className = '' 
}) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const acceptedTypes = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'text/plain': 'TXT',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX'
  }

  const maxSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file) => {
    if (!file) throw new Error('No file selected')

    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB')
    }

    if (!Object.keys(acceptedTypes).includes(file.type)) {
      throw new Error('File type not supported. Please use PDF, DOC, DOCX, TXT, JPG, PNG, PPT, or PPTX files.')
    }

    return true
  }

  const handleFileSelect = (file) => {
    try {
      validateFile(file)
      setSelectedFile(file)
      if (!assignmentTitle) {
        // Auto-fill title from filename
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setAssignmentTitle(nameWithoutExt)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadAssignment = async () => {
    if (!selectedFile || !assignmentTitle.trim()) {
      toast.error('Please select a file and enter an assignment title')
      return
    }

    if (!user) {
      toast.error('You must be logged in to upload assignments')
      return
    }

    setUploading(true)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1]

          const response = await fetch('/api/assignments/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              course_id: courseId,
              lesson_id: lessonId,
              assignment_title: assignmentTitle.trim(),
              description: description.trim(),
              file_data: base64Data,
              filename: selectedFile.name,
              file_type: selectedFile.type
            })
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Failed to upload assignment')
          }

          toast.success('Assignment uploaded successfully!')
          
          // Reset form
          setSelectedFile(null)
          setAssignmentTitle('')
          setDescription('')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }

          if (onUploadSuccess) {
            onUploadSuccess(result.assignment)
          }

        } catch (error) {
          console.error('Upload error:', error)
          toast.error(error.message || 'Failed to upload assignment')
        } finally {
          setUploading(false)
        }
      }

      reader.onerror = () => {
        toast.error('Failed to read file')
        setUploading(false)
      }

      reader.readAsDataURL(selectedFile)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload assignment')
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-dark-800 rounded-2xl p-6 ${className}`}
    >
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <FiUpload className="mr-3 text-primary-400" />
        Submit Assignment - {lessonTitle}
      </h3>

      <div className="space-y-4">
        {/* Assignment Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Assignment Title *
          </label>
          <input
            type="text"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-white placeholder-gray-400 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 focus:outline-none"
            placeholder="Enter assignment title"
            disabled={uploading}
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-white placeholder-gray-400 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 focus:outline-none resize-none"
            placeholder="Brief description of your assignment"
            disabled={uploading}
          />
        </div>

        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Assignment File *
          </label>
          
          {!selectedFile ? (
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
                ${dragOver 
                  ? 'border-primary-400 bg-primary-500/10' 
                  : 'border-dark-600 hover:border-dark-500'
                }
                ${uploading ? 'pointer-events-none opacity-50' : ''}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={Object.keys(acceptedTypes).join(',')}
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
              />
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-dark-600 rounded-full flex items-center justify-center mx-auto">
                  <FiUpload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {dragOver ? 'Drop file here' : 'Upload Assignment File'}
                  </p>
                  <p className="text-sm text-gray-400">
                    Drag and drop or click to select
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Max size: 10MB • Supports: PDF, DOC, DOCX, TXT, JPG, PNG, PPT, PPTX
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <FiFile className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {formatFileSize(selectedFile.size)} • {acceptedTypes[selectedFile.type] || 'Unknown'}
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={removeFile}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={uploadAssignment}
          disabled={uploading || !selectedFile || !assignmentTitle.trim()}
          className="w-full py-3 px-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <FiUpload className="w-5 h-5" />
              <span>Submit Assignment</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}