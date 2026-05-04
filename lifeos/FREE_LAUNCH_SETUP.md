# LifeOS zero-upfront launch setup

This project is now set up for a zero-upfront path. That means you can build, test, deploy, and get early users without running the server on your laptop and without paying cloud bills on day one.

Important truth: "free" has limits. Free tiers can sleep, pause, throttle, or require upgrades when users grow. That is fine for an MVP. The goal is to avoid spending before the product proves demand.

## Recommended free-first architecture

Use this stack first:

- Frontend: Vercel free plan or Render static site free plan
- Backend API: Render free web service
- Database: Supabase free Postgres
- File uploads: Cloudinary free tier, or keep vision board premium/disabled until launch
- Monitoring: UptimeRobot free checks plus Sentry free tier if you want crash reports
- Payments for web/PWA: Stripe Payment Links or Checkout, no setup/monthly fee; Stripe deducts transaction fees only when you earn
- Payments inside Play Store app: Google Play Billing is required for paid digital features

Do not use your laptop as the server. Your laptop is only for development.

## What is not truly free

- Google Play Console has a required one-time developer registration fee. You cannot publish on the official Play Store without it.
- Payment processors take fees from successful payments. This is not an upfront cost, but it reduces each sale.
- If the app grows, free hosting/database limits will eventually be too small.

If you want absolutely zero upfront, launch as a PWA/web app first. Share the installable website link. Move to Play Store after you can pay the developer account fee from demand or early revenue.

## Supabase database setup

Supabase is the best fit for this repo because LifeOS already uses PostgreSQL and Prisma. MongoDB Atlas would require a database rewrite, and Firebase would require replacing most backend data access.

1. Create a free Supabase project.
2. Go to Project Settings -> Database.
3. Copy the pooled connection string for `DATABASE_URL`.
4. Copy the direct connection string for `DIRECT_URL`.
5. In the backend host environment variables, set:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[SUPABASE-POOLER-HOST]:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@[SUPABASE-DIRECT-HOST]:5432/postgres
JWT_SECRET=generate-a-long-random-secret-at-least-64-characters
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.vercel.app
CLIENT_URLS=https://your-frontend-domain.vercel.app,https://your-backend-domain.onrender.com
```

6. Apply the database schema:

```bash
npm run prisma:generate
npm run prisma:migrate --workspace backend
```

For production app traffic, use the pooled URL in `DATABASE_URL`. Prisma migrations use `DIRECT_URL`.

## Free backend deployment on Render

Render free web services are useful for an MVP, but they can sleep and are not ideal for serious production traffic.

Backend settings:

- Root directory: `lifeos`
- Build command: `npm install --ignore-scripts && npm run prisma:generate && npm run build --workspace backend`
- Start command: `npm run start --workspace backend`
- Environment: Node

Set the backend environment variables from the Supabase section.

Health check path:

```text
/api/v1/health
```

## Free frontend deployment

Use Vercel or Render static site.

Frontend settings:

- Root directory: `lifeos/frontend`
- Build command: `npm install --ignore-scripts && npm run build`
- Output directory: `dist`

Set:

```env
VITE_API_URL=https://your-backend-host.onrender.com/api/v1
VITE_SENTRY_DSN=
```

After frontend deployment, update backend `CLIENT_URL` and `CLIENT_URLS` to include the frontend URL.

## Payment setup with zero upfront

### Best zero-upfront MVP path

Start with web/PWA payments using Stripe Payment Links or Stripe Checkout. Stripe standard pricing has no setup or monthly fee, but takes fees from successful payments.

Simple flow:

1. Create a Stripe account.
2. Create a product: `LifeOS Premium`.
3. Create either a one-time payment link or subscription payment link.
4. In the app, keep the Premium buttons visible.
5. When a real user pays, manually mark them premium in Supabase at first:

```sql
update "User"
set "plan" = 'premium',
    "planStatus" = 'active',
    "premiumUntil" = now() + interval '1 year'
where "email" = 'customer@example.com';
```

Manual activation is okay for your first customers. Automate it later with Stripe webhooks when people actually buy.

### Play Store payment rule

If the Android app is distributed on Google Play and sells premium app functionality, Google Play Billing is required. Do not link users from the Android app to Stripe for digital premium features unless you are in an allowed alternative billing program.

Practical path:

- Launch web/PWA first with Stripe.
- Once you can afford the Play Console fee, wrap the app with Capacitor or Trusted Web Activity.
- Add Google Play Billing for Android premium purchases.
- Keep Stripe for users who buy from your website.

## Scaling path from the YouTube notes

Already covered in this codebase:

- Secrets are environment variables.
- Auth is stateless JWT, so multiple API servers can serve the same user.
- Data is scoped by `userId`.
- Important user/date/status indexes exist in Prisma and new reminder indexes were added.
- Build command is green.
- Reminder events are stored server-side, not only in browser local state.

Add later, only after traction:

- Redis caching and queues.
- Automated Stripe/Play Billing webhooks.
- Background worker for push delivery.
- CDN-backed image storage.
- Paid Supabase plan for backups, more database size, and higher traffic.
- Horizontal backend scaling behind a load balancer.

## MVP rule

Keep version 1 simple and useful:

- Let free users plan, journal, track goals, and build habits.
- Make Premium feel valuable, but do not block the core daily habit of using the app.
- Start with one clear paid offer: `LifeOS Premium yearly`.
- Do not add complex infrastructure until users prove the product is worth scaling.

## Google login setup

Google login is free to configure. You only need a Google account.

1. Go to Google Cloud Console.
2. Create a project named `LifeOS`.
3. Go to APIs & Services -> OAuth consent screen.
4. Choose External while testing, add your app name and email, then save.
5. Go to APIs & Services -> Credentials.
6. Create OAuth client ID.
7. Choose Web application.
8. Add authorized JavaScript origins:

```text
http://localhost:4173
http://localhost:5173
https://your-frontend-domain.vercel.app
```

9. Copy the Client ID.
10. Set it in both frontend and backend environments:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

The frontend receives the Google credential, then the backend verifies the ID token using Google's official Node auth library before creating or signing in the user.
