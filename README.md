# Full Stack Math LMS — Starter Kit
**Description:** Starter implementation of a Math LMS for a Sri Lankan tutor.
Features included:
- Node.js + Express backend (API + PayHere simulation + bank transfer workflow)
- Next.js frontend (no TypeScript) with Tailwind CSS
- Authentication (JWT), Admin & Student roles
- Course management, lessons, YouTube/self-hosted video field
- PayHere simulated integration, bank transfer workflow with WhatsApp link
- PDF invoice generation (pdfkit) and email sending (nodemailer - configure SMTP)
- Uses SQLite for quick demo; switch to PostgreSQL by updating knex config

## Quick start (development)
### Prereqs
- Node.js 18+
- npm
- (optional) PostgreSQL if you want to use Postgres

### Backend
```
cd backend
npm install
cp .env.example .env
# edit .env (SMTP, JWT_SECRET, DB settings)
npm run migrate   # (creates demo SQLite DB)
npm run seed      # seeds demo admin and sample course
npm run dev
```
Backend runs at http://localhost:4000 by default.

### Frontend
```
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
Frontend runs at http://localhost:3000

## Notes
- This is a starter scaffold — extend, secure and harden for production.
- Replace PayHere simulation with real PayHere integration and secure webhooks.
- Replace SQLite with PostgreSQL by editing `backend/knexfile.js`.

