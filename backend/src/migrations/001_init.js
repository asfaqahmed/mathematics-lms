exports.up = function(knex) {
  return knex.schema
    .createTable('users', function(t){
      t.string('id').primary();
      t.string('name');
      t.string('email').unique();
      t.string('password');
      t.string('role').defaultTo('student');
      t.timestamps(true,true);
    })
    .createTable('courses', function(t){
      t.string('id').primary();
      t.string('title');
      t.text('description');
      t.integer('price').defaultTo(0);
      t.string('category');
      t.string('thumbnail');
      t.string('intro_video');
      t.timestamps(true,true);
    })
    .createTable('lessons', function(t){
      t.string('id').primary();
      t.string('course_id').references('id').inTable('courses');
      t.string('title');
      t.text('content');
      t.string('video_url');
      t.boolean('locked').defaultTo(true);
      t.integer('position').defaultTo(0);
    })
    .createTable('payments', function(t){
      t.string('id').primary();
      t.string('user_id').references('id').inTable('users');
      t.string('course_id').references('id').inTable('courses');
      t.string('method');
      t.string('status');
      t.string('bank_reference');
      t.timestamp('paid_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('user_courses', function(t){
      t.string('id').primary();
      t.string('user_id').references('id').inTable('users');
      t.string('course_id').references('id').inTable('courses');
      t.timestamp('purchased_at');
      t.string('method');
    })
    .createTable('invoices', function(t){
      t.string('id').primary();
      t.string('user_id').references('id').inTable('users');
      t.string('payment_id').references('id').inTable('payments');
      t.string('path');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('invoices')
    .dropTableIfExists('user_courses')
    .dropTableIfExists('payments')
    .dropTableIfExists('lessons')
    .dropTableIfExists('courses')
    .dropTableIfExists('users');
};
