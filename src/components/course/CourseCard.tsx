import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiClock, FiBook, FiPlay, FiStar } from 'react-icons/fi'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { H3, P } from '@/components/ui/Typography'
import { HStack, Stack } from '@/components/ui/Layout'
import { formatPrice } from '@/lib/utils'

export interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  category?: string
  price: number
  level?: 'Beginner' | 'Intermediate' | 'Advanced'
  duration?: string
  lessons_count?: number
  rating?: number
  instructor?: {
    name: string
    avatar?: string
  }
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface CourseCardProps {
  /**
   * Course data to display.
   */
  course: Course
  /**
   * Whether the card should show hover effects.
   */
  interactive?: boolean
  /**
   * Custom click handler. If provided, overrides default navigation.
   */
  onClick?: () => void
  /**
   * Whether to show the course price.
   */
  showPrice?: boolean
  /**
   * Whether to show course stats (lessons, duration, rating).
   */
  showStats?: boolean
  /**
   * Additional CSS class names.
   */
  className?: string
}

/**
 * Course card component for displaying course information in a card layout.
 *
 * @example
 * ```tsx
 * <CourseCard
 *   course={course}
 *   interactive
 *   showPrice
 *   showStats
 * />
 * ```
 */
export function CourseCard({
  course,
  interactive = true,
  onClick,
  showPrice = true,
  showStats = true,
  className,
}: CourseCardProps) {
  const cardContent = (
    <Card
      variant="elevated"
      padding="none"
      className={`h-full flex flex-col overflow-hidden transition-all duration-300 ${
        interactive
          ? 'hover:scale-105 hover:shadow-xl hover:shadow-black/20 cursor-pointer'
          : ''
      } ${className}`}
    >
      {/* Course Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={course.thumbnail || '/api/placeholder/400/225'}
          alt={course.title}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            interactive ? 'group-hover:scale-110' : ''
          }`}
          loading="lazy"
        />

        {/* Overlay on hover */}
        {interactive && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FiPlay className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </>
        )}

        {/* Category Badge */}
        {course.category && (
          <div className="absolute top-3 left-3">
            <Badge variant="primary" size="sm">
              {course.category}
            </Badge>
          </div>
        )}

        {/* Level Badge */}
        {course.level && (
          <div className="absolute top-3 right-3">
            <Badge
              variant={
                course.level === 'Beginner'
                  ? 'success'
                  : course.level === 'Intermediate'
                  ? 'warning'
                  : 'destructive'
              }
              size="sm"
            >
              {course.level}
            </Badge>
          </div>
        )}
      </div>

      {/* Course Content */}
      <Stack space={4} className="flex-1 p-6">
        {/* Title and Description */}
        <Stack space={2}>
          <H3 className={interactive ? 'group-hover:text-primary-400 transition-colors' : ''}>
            {course.title}
          </H3>

          <P variant="bodySmall" color="muted" className="line-clamp-2 flex-1">
            {course.description}
          </P>
        </Stack>

        {/* Course Stats */}
        {showStats && (
          <HStack gap={4} className="text-sm text-gray-500">
            {course.lessons_count && (
              <HStack gap={1} align="center">
                <FiBook className="w-4 h-4" />
                <span>{course.lessons_count} Lessons</span>
              </HStack>
            )}

            {course.duration && (
              <HStack gap={1} align="center">
                <FiClock className="w-4 h-4" />
                <span>{course.duration}</span>
              </HStack>
            )}

            {course.rating && (
              <HStack gap={1} align="center">
                <FiStar className="w-4 h-4 text-yellow-500" />
                <span>{course.rating.toFixed(1)}</span>
              </HStack>
            )}
          </HStack>
        )}

        {/* Price and Action */}
        {showPrice && (
          <HStack justify="between" align="center" className="pt-4 border-t border-dark-600">
            <div>
              <P variant="h4" className="font-bold">
                {course.price === 0 ? 'Free' : formatPrice(course.price)}
              </P>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                className="group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-all duration-300"
              >
                View Course
              </Button>
            </motion.div>
          </HStack>
        )}

        {/* Instructor */}
        {course.instructor && (
          <HStack gap={3} align="center" className="pt-2 border-t border-dark-700">
            {course.instructor.avatar ? (
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-xs font-semibold text-white">
                {course.instructor.name.charAt(0).toUpperCase()}
              </div>
            )}
            <P variant="bodySmall" color="muted">
              {course.instructor.name}
            </P>
          </HStack>
        )}
      </Stack>
    </Card>
  )

  // Wrap with Link if no custom onClick handler
  if (!onClick) {
    return (
      <Link href={`/courses/${course.id}`} className="block group">
        {cardContent}
      </Link>
    )
  }

  // Custom click handler
  return (
    <div
      onClick={onClick}
      className={`group ${interactive ? 'cursor-pointer' : ''}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {cardContent}
    </div>
  )
}

/**
 * Course card skeleton for loading states.
 */
export function CourseCardSkeleton({ className }: { className?: string }) {
  return (
    <Card variant="elevated" padding="none" className={`h-full overflow-hidden ${className}`}>
      {/* Thumbnail skeleton */}
      <div className="aspect-video bg-dark-700 animate-pulse" />

      <Stack space={4} className="p-6">
        {/* Title skeleton */}
        <div className="h-6 bg-dark-700 animate-pulse rounded" />

        {/* Description skeleton */}
        <Stack space={2}>
          <div className="h-4 bg-dark-700 animate-pulse rounded w-full" />
          <div className="h-4 bg-dark-700 animate-pulse rounded w-3/4" />
        </Stack>

        {/* Stats skeleton */}
        <HStack gap={4}>
          <div className="h-4 bg-dark-700 animate-pulse rounded w-16" />
          <div className="h-4 bg-dark-700 animate-pulse rounded w-16" />
          <div className="h-4 bg-dark-700 animate-pulse rounded w-16" />
        </HStack>

        {/* Price and button skeleton */}
        <HStack justify="between" align="center" className="pt-4 border-t border-dark-600">
          <div className="h-6 bg-dark-700 animate-pulse rounded w-20" />
          <div className="h-8 bg-dark-700 animate-pulse rounded w-24" />
        </HStack>
      </Stack>
    </Card>
  )
}

export default CourseCard