/**
 * Course Utilities
 * Provides course-specific utilities and progress calculations
 */

import type { Course, Lesson, User, CourseProgress } from './types';

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  timeSpent?: number; // in seconds
  watchTime?: number; // in seconds for video lessons
  score?: number; // for quizzes/assignments
}

export interface DetailedCourseProgress extends CourseProgress {
  lessons: LessonProgress[];
  totalWatchTime: number;
  averageScore?: number;
  estimatedTimeToComplete?: number;
  streak: number; // consecutive days with activity
  lastActivityDate?: string;
}

export interface CourseStats {
  totalStudents: number;
  completionRate: number;
  averageProgress: number;
  averageRating?: number;
  totalRevenue?: number;
  enrollmentsByMonth: { month: string; count: number }[];
  popularLessons: { lessonId: string; views: number }[];
}

export interface LearningPath {
  id: string;
  name: string;
  courses: Course[];
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
}

/**
 * Calculate course progress percentage
 */
export const calculateCourseProgress = (
  completedLessons: string[],
  totalLessons: number
): number => {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons.length / totalLessons) * 100);
};

/**
 * Calculate detailed course progress
 */
export const calculateDetailedProgress = (
  courseId: string,
  lessons: Lesson[],
  lessonProgress: LessonProgress[]
): DetailedCourseProgress => {
  const completedLessons = lessonProgress
    .filter(progress => progress.completed)
    .map(progress => progress.lessonId);

  const totalLessons = lessons.length;
  const progressPercentage = calculateCourseProgress(completedLessons, totalLessons);
  const totalWatchTime = lessonProgress.reduce((sum, progress) => sum + (progress.watchTime || 0), 0);

  // Calculate average score for scored lessons
  const scoredLessons = lessonProgress.filter(progress => progress.score !== undefined);
  const averageScore = scoredLessons.length > 0
    ? scoredLessons.reduce((sum, progress) => sum + (progress.score || 0), 0) / scoredLessons.length
    : undefined;

  // Estimate time to complete remaining lessons
  const remainingLessons = lessons.filter(lesson => !completedLessons.includes(lesson.id));
  const estimatedTimeToComplete = remainingLessons.reduce(
    (sum, lesson) => sum + (lesson.duration || 0), 0
  );

  // Calculate learning streak
  const activityDates = lessonProgress
    .filter(progress => progress.completedAt)
    .map(progress => new Date(progress.completedAt!).toDateString())
    .sort();

  const streak = calculateLearningStreak(activityDates);
  const lastActivityDate = activityDates.length > 0 ? activityDates[activityDates.length - 1] : undefined;

  return {
    courseId,
    completedLessons,
    totalLessons,
    progressPercentage,
    lastAccessedAt: new Date().toISOString(),
    lessons: lessonProgress,
    totalWatchTime,
    averageScore,
    estimatedTimeToComplete,
    streak,
    lastActivityDate,
  };
};

/**
 * Calculate learning streak (consecutive days with activity)
 */
export const calculateLearningStreak = (activityDates: string[]): number => {
  if (activityDates.length === 0) return 0;

  const uniqueDates = [...new Set(activityDates)].sort().reverse();
  const today = new Date().toDateString();
  let streak = 0;

  // Check if there's activity today or yesterday
  const latestActivity = new Date(uniqueDates[0]);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - latestActivity.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 1) return 0; // No recent activity

  for (let i = 0; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const expectedDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));

    if (currentDate.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Get next lesson to study
 */
export const getNextLesson = (
  lessons: Lesson[],
  completedLessons: string[]
): Lesson | null => {
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  return sortedLessons.find(lesson => !completedLessons.includes(lesson.id)) || null;
};

/**
 * Get lesson recommendations based on progress
 */
export const getLessonRecommendations = (
  allLessons: Lesson[],
  userProgress: CourseProgress[],
  limit = 5
): Lesson[] => {
  const completedLessonIds = userProgress.flatMap(progress => progress.completedLessons);

  // Get incomplete lessons
  const incompleteLessons = allLessons.filter(
    lesson => !completedLessonIds.includes(lesson.id)
  );

  // Sort by course progress (prioritize courses with higher progress)
  const lessonsWithPriority = incompleteLessons.map(lesson => {
    const courseProgress = userProgress.find(p => p.courseId === lesson.course_id);
    const priority = courseProgress ? courseProgress.progressPercentage : 0;
    return { lesson, priority };
  });

  lessonsWithPriority.sort((a, b) => b.priority - a.priority);

  return lessonsWithPriority
    .slice(0, limit)
    .map(item => item.lesson);
};

/**
 * Calculate course difficulty based on content
 */
export const calculateCourseDifficulty = (
  course: Course,
  lessons: Lesson[]
): 'beginner' | 'intermediate' | 'advanced' => {
  const factors = {
    totalDuration: lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
    lessonCount: lessons.length,
    averageLessonLength: lessons.length > 0
      ? lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) / lessons.length
      : 0,
  };

  // Simple heuristic based on content volume and complexity
  if (factors.totalDuration < 180 && factors.lessonCount < 10) {
    return 'beginner';
  } else if (factors.totalDuration < 600 && factors.lessonCount < 30) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
};

/**
 * Generate course certificate data
 */
export const generateCertificateData = (
  user: User,
  course: Course,
  progress: DetailedCourseProgress
): {
  studentName: string;
  courseName: string;
  completionDate: string;
  duration: string;
  certificateId: string;
  isValid: boolean;
} => {
  const isValid = progress.progressPercentage === 100;

  return {
    studentName: user.name,
    courseName: course.title,
    completionDate: new Date().toLocaleDateString(),
    duration: formatDuration(progress.totalWatchTime / 60),
    certificateId: generateCertificateId(user.id, course.id),
    isValid,
  };
};

/**
 * Generate unique certificate ID
 */
export const generateCertificateId = (userId: string, courseId: string): string => {
  const timestamp = Date.now().toString(36);
  const userHash = userId.slice(-4);
  const courseHash = courseId.slice(-4);
  return `CERT-${userHash}${courseHash}-${timestamp}`.toUpperCase();
};

/**
 * Format duration in minutes to readable format
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours < 24) {
    return `${hours}h ${remainingMinutes}m`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
};

/**
 * Calculate estimated completion time based on user's learning pace
 */
export const estimateCompletionTime = (
  lessons: Lesson[],
  userProgress: LessonProgress[],
  userLearningPace = 1.0 // 1.0 = average pace
): number => {
  const completedLessons = userProgress.filter(p => p.completed);

  if (completedLessons.length === 0) {
    // Use default estimation
    return lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) / userLearningPace;
  }

  // Calculate user's actual pace
  const totalPlannedTime = completedLessons.reduce((sum, progress) => {
    const lesson = lessons.find(l => l.id === progress.lessonId);
    return sum + (lesson?.duration || 0);
  }, 0);

  const totalActualTime = completedLessons.reduce((sum, progress) =>
    sum + (progress.timeSpent || 0), 0
  ) / 60; // Convert to minutes

  const actualPace = totalActualTime / totalPlannedTime || userLearningPace;

  // Estimate remaining time
  const remainingLessons = lessons.filter(lesson =>
    !userProgress.find(p => p.lessonId === lesson.id && p.completed)
  );

  return remainingLessons.reduce((sum, lesson) =>
    sum + (lesson.duration || 0), 0
  ) * actualPace;
};

/**
 * Get course statistics for instructors/admins
 */
export const calculateCourseStats = (
  course: Course,
  enrollments: any[],
  progressData: CourseProgress[]
): CourseStats => {
  const totalStudents = enrollments.length;
  const completedStudents = progressData.filter(p => p.progressPercentage === 100).length;
  const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;

  const averageProgress = totalStudents > 0
    ? progressData.reduce((sum, p) => sum + p.progressPercentage, 0) / totalStudents
    : 0;

  // Group enrollments by month
  const enrollmentsByMonth = enrollments.reduce((acc, enrollment) => {
    const month = new Date(enrollment.purchase_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });

    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const enrollmentData = Object.entries(enrollmentsByMonth).map(([month, count]) => ({
    month,
    count,
  }));

  return {
    totalStudents,
    completionRate,
    averageProgress,
    enrollmentsByMonth: enrollmentData,
    popularLessons: [], // Would need lesson view data
  };
};

/**
 * Create learning path from multiple courses
 */
export const createLearningPath = (
  name: string,
  courses: Course[],
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): LearningPath => {
  const totalDuration = courses.reduce((sum, course) => {
    // Estimate duration if not provided
    return sum + (course.lessons?.reduce((lessonSum, lesson) =>
      lessonSum + (lesson.duration || 0), 0) || 0);
  }, 0);

  return {
    id: `path-${Date.now()}`,
    name,
    courses,
    totalDuration,
    difficulty,
    prerequisites: [],
  };
};

/**
 * Check if user meets course prerequisites
 */
export const checkPrerequisites = (
  course: Course,
  userProgress: CourseProgress[],
  prerequisites: string[] = []
): { met: boolean; missing: string[] } => {
  const completedCourses = userProgress
    .filter(p => p.progressPercentage === 100)
    .map(p => p.courseId);

  const missing = prerequisites.filter(prereq => !completedCourses.includes(prereq));

  return {
    met: missing.length === 0,
    missing,
  };
};

/**
 * Generate personalized study plan
 */
export const generateStudyPlan = (
  availableCourses: Course[],
  userProgress: CourseProgress[],
  targetHoursPerWeek = 5,
  targetCompletionWeeks = 12
): {
  weeklySchedule: {
    week: number;
    courses: { courseId: string; hoursAllocated: number }[];
  }[];
  totalEstimatedHours: number;
} => {
  const totalTargetHours = targetHoursPerWeek * targetCompletionWeeks;

  // Filter courses that aren't completed
  const incompleteCourses = availableCourses.filter(course => {
    const progress = userProgress.find(p => p.courseId === course.id);
    return !progress || progress.progressPercentage < 100;
  });

  // Estimate total hours needed
  const totalEstimatedHours = incompleteCourses.reduce((sum, course) => {
    const progress = userProgress.find(p => p.courseId === course.id);
    const courseDuration = course.lessons?.reduce((lessonSum, lesson) =>
      lessonSum + (lesson.duration || 0), 0) || 0;

    const remainingProgress = progress ? (100 - progress.progressPercentage) / 100 : 1;
    return sum + (courseDuration / 60) * remainingProgress; // Convert to hours
  }, 0);

  // Distribute courses across weeks
  const weeklySchedule = [];
  let remainingHours = totalEstimatedHours;

  for (let week = 1; week <= targetCompletionWeeks && remainingHours > 0; week++) {
    const weeklyBudget = Math.min(targetHoursPerWeek, remainingHours);
    const weekCourses = [];
    let weeklyAllocated = 0;

    for (const course of incompleteCourses) {
      if (weeklyAllocated >= weeklyBudget) break;

      const progress = userProgress.find(p => p.courseId === course.id);
      const courseDuration = course.lessons?.reduce((lessonSum, lesson) =>
        lessonSum + (lesson.duration || 0), 0) || 0;

      const remainingCourseHours = (courseDuration / 60) *
        (progress ? (100 - progress.progressPercentage) / 100 : 1);

      const hoursToAllocate = Math.min(
        remainingCourseHours,
        weeklyBudget - weeklyAllocated,
        2 // Max 2 hours per course per week
      );

      if (hoursToAllocate > 0) {
        weekCourses.push({
          courseId: course.id,
          hoursAllocated: hoursToAllocate,
        });
        weeklyAllocated += hoursToAllocate;
      }
    }

    weeklySchedule.push({
      week,
      courses: weekCourses,
    });

    remainingHours -= weeklyAllocated;
  }

  return {
    weeklySchedule,
    totalEstimatedHours,
  };
};

/**
 * Course content search and filtering
 */
export const searchCourses = (
  courses: Course[],
  query: string,
  filters: {
    category?: string;
    priceRange?: { min: number; max: number };
    difficulty?: string;
    featured?: boolean;
  } = {}
): Course[] => {
  let filtered = courses;

  // Text search
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    filtered = filtered.filter(course =>
      course.title.toLowerCase().includes(searchTerm) ||
      course.description.toLowerCase().includes(searchTerm) ||
      course.category.toLowerCase().includes(searchTerm)
    );
  }

  // Category filter
  if (filters.category) {
    filtered = filtered.filter(course => course.category === filters.category);
  }

  // Price range filter
  if (filters.priceRange) {
    filtered = filtered.filter(course =>
      course.price >= filters.priceRange!.min &&
      course.price <= filters.priceRange!.max
    );
  }

  // Featured filter
  if (filters.featured !== undefined) {
    filtered = filtered.filter(course => course.featured === filters.featured);
  }

  return filtered;
};

/**
 * Sort courses by various criteria
 */
export const sortCourses = (
  courses: Course[],
  sortBy: 'title' | 'price' | 'created_at' | 'popularity' | 'rating',
  order: 'asc' | 'desc' = 'asc'
): Course[] => {
  return [...courses].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      default:
        comparison = 0;
    }

    return order === 'desc' ? -comparison : comparison;
  });
};