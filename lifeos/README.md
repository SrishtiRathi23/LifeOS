# LifeOS

LifeOS is a full-stack personal life management web application designed for students. It combines planning, journaling, habit tracking, vision boarding, academic management, and analytics in a Pinterest-inspired interface.

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma ORM
- Auth: JWT
- Storage: Local uploads via Multer
- AI: Optional Anthropic integration with free OCR/local fallback

## What is already built

- Auth: register, login, session restore
- Multi-user data isolation through authenticated `userId` scoped backend routes
- Dashboard
- Daily Planner with notebook image parsing and typed-text parsing
- Weekly View
- Monthly View
- Diary / Journal with optional AI reflection
- Goals
- Vision Board
- Expense Tracker
- College Tracker
- Internship Tracker
- Hackathon Tracker
- Wellness & Habits
- Exercise Log
- Learning Tracker
- Hobbies
- Settings and data export
- Reminder notifications for dated tasks, assignments, exams, internships, hackathons, learning targets, and goals
- Freemium entitlement layer with premium feature gates
- PWA install metadata and service worker for app-style launch surfaces

## Monetization model

Free plan:

- Dashboard
- Daily Planner
- Weekly and Monthly views
- Diary / Journal
- Goals
- Wellness & Habits
- Basic 1-day reminders
- Settings

Premium plan:

- Vision Board
- Expense Tracker
- College Tracker
- Internship Tracker
- Hackathon Tracker
- Exercise Log
- Learning Tracker
- Hobbies
- Advanced reminder windows
- Full data export
- AI reflection and other high-value automation features

The code now exposes user entitlements through `/api/v1/auth/me` and `/api/v1/billing/me`. Connect Play Billing, Stripe, or Razorpay to update `User.plan`, `User.planStatus`, and `User.premiumUntil`.

## Project structure

```text
lifeos/
  frontend/
  backend/
  .env.example
  docker-compose.yml
```

## Environment setup

1. Copy `.env.example` to `.env`
2. Use Supabase free Postgres for `DATABASE_URL` and `DIRECT_URL`; do not run the production database on your laptop
3. Set `JWT_SECRET` to a long random string
4. Keep `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` empty if you want the free OCR/local fallback
5. For local development only, you can run PostgreSQL locally and temporarily use a localhost `DATABASE_URL`
6. In production, use HTTPS for `CLIENT_URL`; add comma-separated allowed origins in `CLIENT_URLS` if you have both web and mobile wrapper domains

For the complete zero-upfront hosting/payment plan, read [FREE_LAUNCH_SETUP.md](./FREE_LAUNCH_SETUP.md).

Default free Supabase-style database URLs:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[SUPABASE-POOLER-HOST]:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[SUPABASE-DIRECT-HOST]:5432/postgres"
```

## Install

```bash
npm install
```

## Database

Generate Prisma client:

```bash
npm run prisma:generate
```

Push schema to PostgreSQL:

```bash
npm run prisma:push --workspace backend
```

If you prefer migrations later:

```bash
npm run prisma:migrate
```

## Production launch checklist

- Run `npm run build` before every release.
- Apply the Prisma migration in `backend/prisma/migrations/20260504123000_production_ready`.
- Set a strong production `JWT_SECRET`; the backend now rejects weak placeholder secrets in production.
- Host PostgreSQL on a managed provider with daily backups.
- Add Sentry DSNs for frontend and backend monitoring.
- Connect a payment provider and update the `User` subscription fields after successful purchase, renewal, cancellation, or refund.
- For Play Store, wrap the production PWA with Trusted Web Activity or Capacitor, generate PNG launcher icons, and complete store privacy/data-safety forms.

## Run locally

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

## Free-first AI behavior

- If `ANTHROPIC_API_KEY` is empty:
  - notebook image parsing uses `tesseract.js` OCR fallback
  - diary reflection uses a local friendly fallback response
- If you add your own Anthropic key later:
  - Claude vision parsing and reflection become active

## Notes

- The app does not seed fake data.
- The app is designed to start empty until you add your own content.
- Local uploads are stored in `backend/uploads`.
- Frontend production builds are working.
