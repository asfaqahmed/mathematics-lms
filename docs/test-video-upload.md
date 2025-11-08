# Video Upload Functionality Test Guide

## Features Implemented

1. **VideoUpload Component** (`/components/ui/VideoUpload.js`)
   - Drag & drop video upload
   - File validation (type, size)
   - Progress tracking
   - Automatic Supabase storage integration
   - Error handling with bucket creation

2. **Enhanced LessonForm** (`/components/admin/LessonForm.js`)
   - Video source selection (YouTube URL vs Upload)
   - Integrated video upload component
   - Form validation for both sources

3. **Updated Course Editor** (`/pages/admin/courses/[id]/edit.js`)
   - Video source options in quick lesson creation
   - Full video upload available in detailed editor

4. **Backend APIs**
   - `/api/storage/setup` - Creates Supabase storage buckets
   - `/api/lessons/upload-video` - Alternative upload endpoint

## How to Test

### Step 1: Access Admin Panel
1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3001`
3. Login as an admin user
4. Go to Admin > Courses

### Step 2: Test Video Upload in New Course
1. Click "Add New Course"
2. Fill in course details
3. Add a lesson and select "Video" type
4. Choose "Upload Video" as the source
5. Drag and drop a video file or click to select
6. Wait for upload to complete

### Step 3: Test Video Upload in Existing Course
1. Go to Admin > Courses
2. Click edit on an existing course
3. In the lessons section, add a new lesson
4. For video lessons, you can choose between YouTube URL and Upload
5. Test both options

### Step 4: Verify Storage
1. Check your Supabase project dashboard
2. Go to Storage section
3. Verify the "videos" bucket exists
4. Check uploaded videos are accessible via public URLs

## File Formats Supported
- MP4, WebM, MOV, AVI
- Maximum size: 500MB (configurable)
- Automatic bucket creation if not exists

## Technical Details

- Videos are stored in Supabase storage under `lessons/videos/`
- Unique filenames are generated to prevent conflicts
- Public URLs are automatically generated
- Progress tracking during upload
- Error handling with automatic retry for bucket creation
- The lesson content field stores the public URL of uploaded videos

## Security Notes
- Admin authentication required for uploads
- File type and size validation
- Unique filename generation prevents overwriting
- Public bucket with configurable size limits