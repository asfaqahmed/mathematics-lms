import { supabase } from '../../lib/supabase-admin'

export default async function handler(req, res) {
  try {
    // Test lessons query
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .limit(5)

    if (error) {
      return res.status(400).json({ 
        error: 'Lessons query failed', 
        details: error,
        message: error.message 
      })
    }

    // Test courses query
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .limit(3)

    if (coursesError) {
      return res.status(400).json({ 
        error: 'Courses query failed', 
        details: coursesError 
      })
    }

    // Test payments table structure
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1)

    // Test enrollments table
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*')
      .limit(1)

    res.status(200).json({
      lessons: {
        count: lessons?.length || 0,
        data: lessons,
        error: null
      },
      courses: {
        count: courses?.length || 0,
        data: courses,
        error: null
      },
      payments: {
        count: payments?.length || 0,
        error: paymentsError?.message || null
      },
      enrollments: {
        count: enrollments?.length || 0,
        error: enrollmentsError?.message || null
      }
    })

  } catch (error) {
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    })
  }
}