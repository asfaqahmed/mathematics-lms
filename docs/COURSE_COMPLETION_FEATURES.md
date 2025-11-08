# Course Completion & Certificate Features

This document outlines the new course completion tracking, certificate generation, and assignment upload features implemented in the Mathematics LMS.

## 🎯 Features Overview

### 1. **Course Progress Tracking**
- Real-time lesson completion tracking
- Automatic progress saving every 5 seconds
- Visual progress indicators throughout the UI
- Course completion percentage calculation

### 2. **Beautiful Certificate Generation**
- Professional PDF certificates with custom design
- Automatic generation upon course completion
- Unique certificate IDs for verification
- Downloadable certificates with course and student details

### 3. **Assignment Upload System**
- File upload for lesson assignments
- Support for multiple file types (PDF, DOC, DOCX, TXT, JPG, PNG, PPT, PPTX)
- Assignment tracking and status management
- File size limits and validation

### 4. **Enhanced Course Player**
- Integrated with progress tracking
- Automatic lesson completion detection (90% watch threshold)
- Real-time progress updates
- Seamless user experience

## 🗄️ Database Schema

### New Tables Required

Run the database setup endpoint to get the SQL commands: `POST /api/setup/database-tables`

#### 1. `lesson_progress`
```sql
- id (UUID, Primary Key)
- lesson_id (UUID, Foreign Key → lessons.id)
- user_id (UUID, Foreign Key → profiles.id)
- progress_percentage (INTEGER, 0-100)
- watch_time (INTEGER, seconds)
- completed (BOOLEAN)
- last_watched_at (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 2. `course_completions`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → profiles.id)
- course_id (UUID, Foreign Key → courses.id)
- completed_at (TIMESTAMPTZ)
- completion_percentage (INTEGER)
- certificate_issued (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

#### 3. `assignments`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → profiles.id)
- course_id (UUID, Foreign Key → courses.id)
- lesson_id (UUID, Foreign Key → lessons.id)
- title (TEXT)
- description (TEXT)
- file_url (TEXT)
- file_path (TEXT)
- original_filename (TEXT)
- file_type (TEXT)
- file_size (INTEGER)
- status (TEXT: 'submitted', 'reviewed', 'graded')
- grade (INTEGER, 0-100)
- feedback (TEXT)
- submitted_at, reviewed_at (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 4. `certificates`
```sql
- id (TEXT, Primary Key)
- user_id (UUID, Foreign Key → profiles.id)
- course_id (UUID, Foreign Key → courses.id)
- student_name (TEXT)
- course_name (TEXT)
- issued_at (TIMESTAMPTZ)
- certificate_data (TEXT, Base64 PDF)
- created_at (TIMESTAMPTZ)
```

#### 5. Updated `payments` Table
```sql
-- Add new column
- email_sent (BOOLEAN, DEFAULT FALSE)
```

## 📁 File Structure

### New API Endpoints
```
pages/api/
├── lessons/
│   └── progress.js          # Lesson progress tracking
├── assignments/
│   └── upload.js           # Assignment file upload
├── certificates/
│   └── generate.js         # Certificate PDF generation
└── setup/
    └── database-tables.js  # Database setup helper
```

### New Components
```
components/course/
├── CourseProgress.js       # Course completion overview
├── AssignmentUpload.js     # Assignment upload interface
└── hooks/
    └── useLessonProgress.js # Progress tracking hook
```

### Enhanced Pages
```
pages/courses/
├── enhanced-[id].js        # Enhanced course detail page
└── [id].js                # Original (updated with progress)
```

## 🚀 How to Use

### 1. Database Setup
1. Run the database setup endpoint:
   ```bash
   POST /api/setup/database-tables
   ```
2. Execute the provided SQL commands in your Supabase dashboard
3. Ensure all tables have proper RLS policies enabled

### 2. Storage Setup
1. Create storage buckets:
   - `assignments` - for assignment file uploads
   - `course-videos` - for lesson video uploads (if not exists)

### 3. Environment Variables
Ensure these are set in your `.env.local`:
```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (existing, for completion notifications)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourdomain.com
```

## 🎨 Certificate Design

The certificate features:
- **Professional gradient background** (dark blue theme)
- **Gold accents** for premium feel
- **Student name prominently displayed**
- **Course title and category**
- **Completion date**
- **Unique certificate ID** for verification
- **Decorative elements** (stars, borders)
- **Branding** (MathPro Academy)

## 📊 Progress Tracking

### How It Works
1. **Video Progress**: Tracks watch time and completion percentage
2. **Auto-Completion**: Lessons marked complete at 90% watch time
3. **Real-Time Updates**: Progress saved every 5 seconds
4. **Course Completion**: Triggered when all lessons are complete
5. **Certificate Generation**: Available immediately after course completion

### Progress Indicators
- **Lesson List**: Checkmarks and progress bars
- **Course Overview**: Overall completion percentage
- **Dashboard**: Progress cards and statistics
- **Navigation**: Visual completion status

## 📝 Assignment System

### Supported File Types
- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, PNG
- **Presentations**: PPT, PPTX

### File Validation
- **Size Limit**: 10MB maximum
- **Type Checking**: Strict MIME type validation
- **Security**: Files stored in secure Supabase storage

### Assignment Workflow
1. **Upload**: Student uploads assignment file
2. **Storage**: File saved to Supabase storage
3. **Database**: Assignment record created
4. **Status Tracking**: 'submitted' → 'reviewed' → 'graded'
5. **Feedback**: Instructors can add grades and feedback

## 🔧 Integration Guide

### Adding to Existing Course Page

1. **Import Components**:
```jsx
import { useLessonProgress } from '../../hooks/useLessonProgress'
import CourseProgress from '../../components/course/CourseProgress'
import AssignmentUpload from '../../components/course/AssignmentUpload'
```

2. **Setup Progress Hook**:
```jsx
const {
  handleVideoProgress,
  fetchLessonProgress,
  isLessonCompleted,
  getCompletionStats
} = useLessonProgress(user, courseId)
```

3. **Add Progress Tracking**:
```jsx
// In video player
onProgress={(progress, currentTime) => 
  handleVideoProgress(lesson.id, progress, currentTime)
}
```

4. **Display Components**:
```jsx
<CourseProgress user={user} course={course} lessons={lessons} />
<AssignmentUpload 
  user={user}
  courseId={courseId}
  lessonId={lessonId}
  lessonTitle={lessonTitle}
/>
```

## 🔒 Security Features

### Row Level Security (RLS)
- **lesson_progress**: Users can only access their own progress
- **course_completions**: Users can view their own completions
- **assignments**: Users can only see their own assignments
- **certificates**: Users can only access their own certificates

### File Upload Security
- **Type Validation**: Strict file type checking
- **Size Limits**: 10MB maximum file size
- **Storage Security**: Files stored in secure Supabase buckets
- **Access Control**: Only course owners can access assignments

### API Security
- **Authentication**: All APIs require valid user authentication
- **Authorization**: Course access verification before operations
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error messages without data exposure

## 📈 Performance Optimizations

### Progress Tracking
- **Debounced Updates**: Progress saved every 5 seconds to reduce API calls
- **Local State**: Immediate UI updates with background sync
- **Batch Operations**: Multiple lesson progress queries optimized

### Certificate Generation
- **On-Demand**: Certificates generated only when requested
- **Caching**: Certificate data stored in database for faster re-downloads
- **Efficient PDF**: Optimized PDF generation with minimal memory usage

### File Uploads
- **Base64 Encoding**: Efficient file transfer
- **Progress Indicators**: Real-time upload progress
- **Error Recovery**: Retry mechanisms for failed uploads

## 🧪 Testing

### Manual Testing Checklist
- [ ] Enroll in a course
- [ ] Start watching lessons and verify progress tracking
- [ ] Complete all lessons and verify course completion
- [ ] Download certificate and verify content
- [ ] Upload assignments for different lessons
- [ ] Verify assignment status tracking
- [ ] Test file type validation and size limits
- [ ] Test progress persistence across sessions

### API Testing
Use tools like Postman to test:
- `POST /api/lessons/progress` - Progress tracking
- `POST /api/assignments/upload` - File upload
- `POST /api/certificates/generate` - Certificate generation

## 🚨 Troubleshooting

### Common Issues

1. **Progress Not Saving**
   - Check user authentication
   - Verify course access (purchase record)
   - Check network connectivity

2. **Certificate Generation Failed**
   - Ensure course is 100% complete
   - Check PDF generation dependencies
   - Verify course completion record exists

3. **Assignment Upload Errors**
   - Check file size (max 10MB)
   - Verify file type is supported
   - Ensure storage bucket exists and is accessible

4. **Database Errors**
   - Run database setup endpoint
   - Check table creation and RLS policies
   - Verify foreign key relationships

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## 🔄 Future Enhancements

### Planned Features
- **Instructor Dashboard**: View student progress and assignments
- **Grading System**: Online assignment grading interface
- **Progress Analytics**: Detailed learning analytics
- **Certificate Templates**: Multiple certificate designs
- **Assignment Templates**: Pre-defined assignment types
- **Bulk Operations**: Batch certificate generation
- **Integration APIs**: External LMS integrations

### Performance Improvements
- **Video Progress API**: Direct YouTube/video player integration
- **Real-time Updates**: WebSocket-based progress updates
- **Offline Support**: Progressive Web App with offline capability
- **CDN Integration**: Faster certificate and assignment delivery

This implementation provides a comprehensive course completion system with professional certificates and assignment management, ready for production use in educational platforms.