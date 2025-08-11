Math LMS Phase 1 - Downloadable package

Contents:
- supabase/schema.sql        : Database schema to run on Supabase
- backend/                  : Express backend (invoice generation, PayHere notify, bank receipt upload, admin approve)
- frontend/                 : Minimal Next.js frontend (course listing, course detail + purchase buttons)

Quick start (local):
1. Create a Supabase project and run supabase/schema.sql in SQL editor.
2. Configure backend/.env with your credentials.
3. Install backend dependencies:
   cd backend
   npm install
   npm run dev
4. Install frontend dependencies:
   cd frontend
   npm install
   npm run dev
5. Open http://localhost:3000

Notes:
- This package is a Phase 1 MVP. Secure authentication, full admin UI, and PayHere signature verification are not fully implemented.
- Replace environment variables with your production credentials before deploying.
