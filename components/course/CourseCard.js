import Link from 'next/link'
import { FiClock, FiBook, FiPlay, FiStar } from 'react-icons/fi'
import { motion } from 'framer-motion'

export default function CourseCard({ course }) {
  const formatPrice = (price) => {
    return `LKR ${(price).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }
  
  return (
    <Link legacyBehavior href={`/courses/${course.id}`}>
      <a className="block group">
        <div className="card card-hover h-full flex flex-col">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
            <img
              src={course.thumbnail || '/api/placeholder/400/225'}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FiPlay className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
            
            {/* Category Badge */}
            {course.category && (
              <div className="absolute top-3 left-3">
                <span className="badge badge-primary">
                  {course.category}
                </span>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
              {course.title}
            </h3>
            
            <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
              {course.description}
            </p>
            
            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <FiBook className="w-4 h-4" />
                <span>12 Lessons</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiClock className="w-4 h-4" />
                <span>6 Hours</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiStar className="w-4 h-4 text-yellow-500" />
                <span>4.8</span>
              </div>
            </div>
            
            {/* Price and Action */}
            <div className="flex items-center justify-between pt-4 border-t border-dark-700">
              <div>
                <span className="text-2xl font-bold text-white">
                  {formatPrice(course.price)}
                </span>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg font-medium group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                  View Course
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </a>
    </Link>
  )
}