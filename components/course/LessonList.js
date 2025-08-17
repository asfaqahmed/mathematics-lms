import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlay, FiLock, FiCheck, FiClock, FiBook, FiVideo,
  FiChevronDown, FiChevronUp, FiDownload, FiEye
} from 'react-icons/fi'

export default function LessonList({
  lessons = [],
  activeLesson,
  hasAccess = false,
  progress = {},
  onLessonClick,
  onPurchase,
  className = ''
}) {
  const [expandedSections, setExpandedSections] = useState({})

  // Group lessons by section if they have section property
  const groupedLessons = lessons.reduce((acc, lesson, index) => {
    const section = lesson.section || 'Course Content'
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push({ ...lesson, index })
    return acc
  }, {})

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  const formatDuration = (minutes) => {
    if (!minutes) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const isLessonCompleted = (lessonId) => {
    return progress[lessonId]?.completed || false
  }

  const getLessonProgress = (lessonId) => {
    return progress[lessonId]?.progress || 0
  }

  const canAccessLesson = (lesson) => {
    return hasAccess || lesson.is_preview
  }

  const getTotalSectionDuration = (sectionLessons) => {
    return sectionLessons.reduce((total, lesson) => {
      return total + (lesson.duration || 0)
    }, 0)
  }

  const getCompletedLessonsCount = (sectionLessons) => {
    return sectionLessons.filter(lesson => isLessonCompleted(lesson.id)).length
  }

  if (lessons.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-400 ${className}`}>
        <FiBook className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No lessons available yet</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {Object.entries(groupedLessons).map(([sectionName, sectionLessons]) => {
        const isExpanded = expandedSections[sectionName] !== false // Default to expanded
        const completedCount = getCompletedLessonsCount(sectionLessons)
        const totalDuration = getTotalSectionDuration(sectionLessons)

        return (
          <div key={sectionName} className="border border-dark-600 rounded-lg overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(sectionName)}
              className="w-full p-4 bg-dark-700/50 hover:bg-dark-700 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <FiChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                  <h3 className="text-lg font-semibold text-white">{sectionName}</h3>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>{sectionLessons.length} lessons</span>
                  {totalDuration > 0 && (
                    <span>{formatDuration(totalDuration)}</span>
                  )}
                  {hasAccess && (
                    <span>{completedCount}/{sectionLessons.length} completed</span>
                  )}
                </div>
              </div>
              
              {hasAccess && (
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-dark-600 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${sectionLessons.length > 0 ? (completedCount / sectionLessons.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {Math.round((completedCount / sectionLessons.length) * 100)}%
                  </span>
                </div>
              )}
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="divide-y divide-dark-600">
                    {sectionLessons.map((lesson, index) => {
                      const isActive = activeLesson?.id === lesson.id
                      const isCompleted = isLessonCompleted(lesson.id)
                      const lessonProgress = getLessonProgress(lesson.id)
                      const canAccess = canAccessLesson(lesson)

                      return (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <button
                            onClick={() => {
                              if (canAccess) {
                                onLessonClick(lesson)
                              } else if (onPurchase) {
                                onPurchase()
                              }
                            }}
                            className={`w-full p-4 text-left hover:bg-dark-700/30 transition-all ${
                              isActive ? 'bg-primary-500/10 border-l-4 border-primary-500' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              {/* Lesson Number & Status */}
                              <div className="flex-shrink-0 relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isCompleted 
                                    ? 'bg-green-500 text-white' 
                                    : canAccess 
                                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                    : 'bg-dark-600 text-gray-500'
                                }`}>
                                  {isCompleted ? (
                                    <FiCheck className="w-4 h-4" />
                                  ) : canAccess ? (
                                    lesson.index + 1
                                  ) : (
                                    <FiLock className="w-4 h-4" />
                                  )}
                                </div>
                                
                                {/* Progress Ring */}
                                {canAccess && lessonProgress > 0 && lessonProgress < 100 && (
                                  <svg className="absolute inset-0 w-8 h-8 transform -rotate-90">
                                    <circle
                                      cx="16"
                                      cy="16"
                                      r="14"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeDasharray={`${lessonProgress * 0.88} 88`}
                                      className="text-primary-500"
                                    />
                                  </svg>
                                )}
                              </div>

                              {/* Lesson Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className={`font-medium mb-1 ${
                                      isActive ? 'text-primary-400' : 'text-white'
                                    }`}>
                                      {lesson.title}
                                    </h4>
                                    
                                    {lesson.description && (
                                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                                        {lesson.description}
                                      </p>
                                    )}
                                    
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <div className="flex items-center space-x-1">
                                        {lesson.type === 'video' ? (
                                          <FiVideo className="w-3 h-3" />
                                        ) : (
                                          <FiBook className="w-3 h-3" />
                                        )}
                                        <span>{lesson.type === 'video' ? 'Video' : 'Article'}</span>
                                      </div>
                                      
                                      {lesson.duration && (
                                        <div className="flex items-center space-x-1">
                                          <FiClock className="w-3 h-3" />
                                          <span>{formatDuration(lesson.duration)}</span>
                                        </div>
                                      )}
                                      
                                      {lesson.is_preview && (
                                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                          Free Preview
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Icons */}
                                  <div className="flex items-center space-x-2 ml-4">
                                    {canAccess ? (
                                      <>
                                        {lesson.type === 'video' && (
                                          <FiPlay className="w-4 h-4 text-primary-400" />
                                        )}
                                        {lesson.downloadable && (
                                          <FiDownload className="w-4 h-4 text-gray-400 hover:text-white" />
                                        )}
                                      </>
                                    ) : (
                                      <div className="flex items-center space-x-1 text-gray-500">
                                        <FiLock className="w-4 h-4" />
                                        <span className="text-xs">Locked</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                {canAccess && lessonProgress > 0 && (
                                  <div className="mt-2">
                                    <div className="w-full bg-dark-600 rounded-full h-1">
                                      <div 
                                        className="bg-primary-500 h-1 rounded-full transition-all"
                                        style={{ width: `${lessonProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {/* Course Statistics */}
      {hasAccess && (
        <div className="mt-6 p-4 bg-dark-700/30 rounded-lg">
          <h4 className="text-white font-medium mb-3">Course Progress</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-400">
                {Object.values(progress).filter(p => p.completed).length}
              </div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {lessons.length}
              </div>
              <div className="text-xs text-gray-400">Total Lessons</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {formatDuration(lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0))}
              </div>
              <div className="text-xs text-gray-400">Total Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {Math.round((Object.values(progress).filter(p => p.completed).length / lessons.length) * 100)}%
              </div>
              <div className="text-xs text-gray-400">Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}