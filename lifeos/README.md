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
2. Set `JWT_SECRET` to a long random string
3. Keep `ANTHROPIC_API_KEY` empty if you want the free OCR/local fallback
4. Make sure PostgreSQL is running locally and update `DATABASE_URL` if needed

Default local database URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lifeos"
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
