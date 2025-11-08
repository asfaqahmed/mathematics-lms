# Development Tools

This directory contains various tools and scripts for development, testing, and maintenance of the Mathematics LMS platform.

## Directory Structure

- `/seeding`: Database seeding scripts
  - `seed-courses.js`: Populates the database with sample courses
  - `seed-lessons.js`: Populates the database with sample lessons for existing courses

- `/testing`: Testing and validation tools
  - `test-bucket-upload.js`: Tests Supabase storage bucket access and upload functionality

## Usage

### Seeding Data

To populate the database with sample data:

1. Seed courses first:
```bash
node tools/seeding/seed-courses.js
```

2. Then seed lessons:
```bash
node tools/seeding/seed-lessons.js
```

### Testing Storage

To test Supabase storage functionality:

```bash
node tools/testing/test-bucket-upload.js
```

## Important Notes

- These tools are for development purposes only and should not be used in production
- Make sure to have the proper environment variables set in `.env.local`
- Some tools require admin/service role access to Supabase
- Always backup data before running seeding scripts