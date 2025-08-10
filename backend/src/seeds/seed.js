// seeds/01_initial_data.js
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Clear existing data in correct order to avoid FK errors
  await knex('purchases').del();
  await knex('payments').del();
  await knex('lessons').del();
  await knex('courses').del();
  await knex('profiles').del();
  await knex('users').del();

  // Password hash
  const adminPass = await bcrypt.hash('admin123', 10);
  const studentPass = await bcrypt.hash('student123', 10);

  // Insert users
  const adminId = uuidv4();
  const studentId = uuidv4();

  await knex('users').insert([
    {
      id: adminId,
      email: 'admin@mathtutor.lk',
      password: adminPass,
      role: 'admin',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: studentId,
      email: 'student@example.com',
      password: studentPass,
      role: 'student',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  // Insert profiles
  await knex('profiles').insert([
    {
      id: adminId,
      email: 'admin@mathtutor.lk',
      name: 'Admin User',
      role: 'admin',
    },
    {
      id: studentId,
      email: 'student@example.com',
      name: 'Test Student',
      role: 'student',
    },
  ]);

  // Insert courses
  await knex('courses').insert([
    {
      id: 'course-ol-math',
      title: 'O/L Mathematics Complete Course',
      description: 'Comprehensive mathematics course for Grade 11 students preparing for O/L examinations. Master algebra, geometry, trigonometry and statistical analysis with expert guidance.',
      price: 15000,
      category: 'O/L Mathematics',
      thumbnail: 'https://images.pexels.com/photos/3729557/pexels-photo-3729557.jpeg?auto=compress&cs=tinysrgb&w=800',
      intro_video: 'dQw4w9WgXcQ',
      featured: true,
    },
    {
      id: 'course-al-pure',
      title: 'A/L Pure Mathematics',
      description: 'Advanced pure mathematics covering calculus, algebra, complex numbers, and matrices. Perfect preparation for A/L examinations with comprehensive problem-solving techniques.',
      price: 25000,
      category: 'A/L Mathematics',
      thumbnail: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg?auto=compress&cs=tinysrgb&w=800',
      intro_video: 'dQw4w9WgXcQ',
      featured: true,
    },
    {
      id: 'course-al-applied',
      title: 'A/L Applied Mathematics',
      description: 'Applied mathematics focusing on mechanics, statistics, and probability. Essential for engineering and science students with real-world applications.',
      price: 25000,
      category: 'A/L Mathematics',
      thumbnail: 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800',
      intro_video: 'dQw4w9WgXcQ',
      featured: true,
    },
    {
      id: 'course-foundation',
      title: 'Foundation Mathematics',
      description: 'Build strong mathematical foundations for Grades 6-11. Perfect for students who need to strengthen their basics before advancing to higher levels.',
      price: 12000,
      category: 'Foundation',
      thumbnail: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=800',
      intro_video: 'dQw4w9WgXcQ',
      featured: false,
    },
  ]);

  // Insert lessons
  await knex('lessons').insert([
    // O/L Math
    { course_id: 'course-ol-math', title: 'Introduction to Algebra', description: 'Learn the fundamentals of algebraic expressions, variables, and basic operations. Perfect starting point for O/L mathematics.', type: 'video', content: 'dQw4w9WgXcQ', duration: 45, order: 1, is_preview: true },
    { course_id: 'course-ol-math', title: 'Linear Equations', description: 'Master solving linear equations in one and two variables with step-by-step methods and practice problems.', type: 'video', content: 'dQw4w9WgXcQ', duration: 50, order: 2, is_preview: true },
    { course_id: 'course-ol-math', title: 'Quadratic Equations', description: 'Understanding and solving quadratic equations using factoring, completing the square, and quadratic formula.', type: 'video', content: 'dQw4w9WgXcQ', duration: 60, order: 3, is_preview: false },
    { course_id: 'course-ol-math', title: 'Geometry Fundamentals', description: 'Fundamental concepts in plane geometry including angles, triangles, and basic geometric proofs.', type: 'video', content: 'dQw4w9WgXcQ', duration: 55, order: 4, is_preview: false },
    { course_id: 'course-ol-math', title: 'Trigonometry Introduction', description: 'Basic trigonometric ratios (sin, cos, tan) and their applications in solving triangles.', type: 'video', content: 'dQw4w9WgXcQ', duration: 65, order: 5, is_preview: false },

    // A/L Pure
    { course_id: 'course-al-pure', title: 'Limits and Continuity', description: 'Understanding limits of functions and continuous functions. Foundation for calculus concepts.', type: 'video', content: 'dQw4w9WgXcQ', duration: 70, order: 1, is_preview: true },
    { course_id: 'course-al-pure', title: 'Differentiation Basics', description: 'Introduction to derivatives, differentiation rules, and applications in finding rates of change.', type: 'video', content: 'dQw4w9WgXcQ', duration: 75, order: 2, is_preview: true },
    { course_id: 'course-al-pure', title: 'Integration Techniques', description: 'Methods of integration including substitution, integration by parts, and applications.', type: 'video', content: 'dQw4w9WgXcQ', duration: 80, order: 3, is_preview: false },
    { course_id: 'course-al-pure', title: 'Complex Numbers', description: 'Operations with complex numbers, Argand diagrams, and applications in advanced mathematics.', type: 'video', content: 'dQw4w9WgXcQ', duration: 65, order: 4, is_preview: false },

    // A/L Applied
    { course_id: 'course-al-applied', title: 'Mechanics Fundamentals', description: "Basic concepts in mechanics including force, motion, and Newton's laws of motion.", type: 'video', content: 'dQw4w9WgXcQ', duration: 60, order: 1, is_preview: true },
    { course_id: 'course-al-applied', title: 'Statistics Introduction', description: 'Descriptive statistics, data analysis, measures of central tendency and dispersion.', type: 'video', content: 'dQw4w9WgXcQ', duration: 55, order: 2, is_preview: true },
    { course_id: 'course-al-applied', title: 'Probability Theory', description: 'Basic probability concepts, conditional probability, and probability distributions.', type: 'video', content: 'dQw4w9WgXcQ', duration: 65, order: 3, is_preview: false },

    // Foundation
    { course_id: 'course-foundation', title: 'Number Systems', description: 'Understanding different number systems including natural, whole, integers, and rational numbers.', type: 'video', content: 'dQw4w9WgXcQ', duration: 40, order: 1, is_preview: true },
    { course_id: 'course-foundation', title: 'Basic Algebra', description: 'Introduction to algebraic thinking, expressions, and simple equation solving.', type: 'video', content: 'dQw4w9WgXcQ', duration: 45, order: 2, is_preview: true },
    { course_id: 'course-foundation', title: 'Fractions and Decimals', description: 'Working with fractions, decimal numbers, and converting between different forms.', type: 'video', content: 'dQw4w9WgXcQ', duration: 35, order: 3, is_preview: false },
  ]);

  // Insert payments
  await knex('payments').insert([
    {
      user_id: studentId,
      course_id: 'course-ol-math',
      amount: 15000,
      method: 'bank',
      status: 'pending',
      payment_id: null,
      created_at: knex.fn.now(),
    },
    {
      user_id: studentId,
      course_id: 'course-al-pure',
      amount: 25000,
      method: 'payhere',
      status: 'approved',
      payment_id: 'payhere_test_123',
      approved_at: knex.fn.now(),
      created_at: knex.fn.now(),
    },
  ]);

  // Insert purchase record for approved payment
  // Get the payment id for 'course-al-pure'
  const approvedPayment = await knex('payments')
    .where({
      user_id: studentId,
      course_id: 'course-al-pure',
      status: 'approved',
    })
    .first();

  if (approvedPayment) {
    await knex('purchases').insert({
      user_id: studentId,
      course_id: 'course-al-pure',
      payment_id: approvedPayment.id,
      access_granted: true,
      purchase_date: knex.fn.now(),
    });
  }

  console.log('Seeding completed!');
};
