import { supabase } from '../../../lib/supabase-admin'

/**
 * API endpoint to create the new database tables needed for course completion
 * and assignment features.
 * 
 * This should be run once to set up the required tables.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const results = []

    // 1. Create lesson_progress table
    try {
      const { error: progressTableError } = await supabase
        .from('lesson_progress')
        .select('id')
        .limit(1)
    } catch (error) {
      // Table doesn't exist, create it
      console.log('Creating lesson_progress table...')
      results.push('lesson_progress table needs to be created in Supabase dashboard')
    }

    // 2. Create course_completions table
    try {
      const { error: completionsTableError } = await supabase
        .from('course_completions')
        .select('id')
        .limit(1)
    } catch (error) {
      console.log('Creating course_completions table...')
      results.push('course_completions table needs to be created in Supabase dashboard')
    }

    // 3. Create assignments table
    try {
      const { error: assignmentsTableError } = await supabase
        .from('assignments')
        .select('id')
        .limit(1)
    } catch (error) {
      console.log('Creating assignments table...')
      results.push('assignments table needs to be created in Supabase dashboard')
    }

    // 4. Create certificates table
    try {
      const { error: certificatesTableError } = await supabase
        .from('certificates')
        .select('id')
        .limit(1)
    } catch (error) {
      console.log('Creating certificates table...')
      results.push('certificates table needs to be created in Supabase dashboard')
    }

    // 5. Add email_sent column to payments table if it doesn't exist
    try {
      const { data: paymentsStructure } = await supabase
        .from('payments')
        .select('email_sent')
        .limit(1)
    } catch (error) {
      console.log('Need to add email_sent column to payments table')
      results.push('email_sent column needs to be added to payments table')
    }

    res.status(200).json({
      success: true,
      message: 'Database setup check completed',
      results,
      sqlCommands: {
        lesson_progress: `
          CREATE TABLE IF NOT EXISTS lesson_progress (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
            watch_time INTEGER DEFAULT 0,
            completed BOOLEAN DEFAULT FALSE,
            last_watched_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(lesson_id, user_id)
          );

          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
          CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
          CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed);

          -- Enable RLS
          ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

          -- Create RLS policies
          CREATE POLICY "Users can view their own progress" ON lesson_progress
            FOR SELECT USING (auth.uid() = user_id);

          CREATE POLICY "Users can update their own progress" ON lesson_progress
            FOR ALL USING (auth.uid() = user_id);
        `,
        course_completions: `
          CREATE TABLE IF NOT EXISTS course_completions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            completed_at TIMESTAMPTZ DEFAULT NOW(),
            completion_percentage INTEGER DEFAULT 100 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
            certificate_issued BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, course_id)
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_course_completions_user_id ON course_completions(user_id);
          CREATE INDEX IF NOT EXISTS idx_course_completions_course_id ON course_completions(course_id);

          -- Enable RLS
          ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;

          -- Create RLS policies
          CREATE POLICY "Users can view their own completions" ON course_completions
            FOR SELECT USING (auth.uid() = user_id);

          CREATE POLICY "System can manage completions" ON course_completions
            FOR ALL USING (true);
        `,
        assignments: `
          CREATE TABLE IF NOT EXISTS assignments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            file_url TEXT NOT NULL,
            file_path TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_type TEXT,
            file_size INTEGER,
            status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'graded')),
            grade INTEGER CHECK (grade >= 0 AND grade <= 100),
            feedback TEXT,
            submitted_at TIMESTAMPTZ DEFAULT NOW(),
            reviewed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
          CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
          CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON assignments(lesson_id);
          CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

          -- Enable RLS
          ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

          -- Create RLS policies
          CREATE POLICY "Users can view their own assignments" ON assignments
            FOR SELECT USING (auth.uid() = user_id);

          CREATE POLICY "Users can create their own assignments" ON assignments
            FOR INSERT WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can update their own assignments" ON assignments
            FOR UPDATE USING (auth.uid() = user_id);
        `,
        certificates: `
          CREATE TABLE IF NOT EXISTS certificates (
            id TEXT PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            student_name TEXT NOT NULL,
            course_name TEXT NOT NULL,
            issued_at TIMESTAMPTZ DEFAULT NOW(),
            certificate_data TEXT, -- Base64 encoded PDF data
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
          CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);

          -- Enable RLS
          ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

          -- Create RLS policies
          CREATE POLICY "Users can view their own certificates" ON certificates
            FOR SELECT USING (auth.uid() = user_id);

          CREATE POLICY "System can manage certificates" ON certificates
            FOR ALL USING (true);
        `,
        payments_update: `
          -- Add email_sent column to payments table
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

          -- Create index
          CREATE INDEX IF NOT EXISTS idx_payments_email_sent ON payments(email_sent);
        `
      }
    })

  } catch (error) {
    console.error('Database setup error:', error)
    res.status(500).json({ 
      error: 'Database setup failed',
      details: error.message 
    })
  }
}