# Survey App

A tiny full-stack Next.js app to test our combined workflow. No real auth —
just a username. One reserved username acts as admin.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/) + [Neon](https://neon.tech/) serverless Postgres driver
- Deployed on [Vercel](https://vercel.com/)

## How it works

1. `/` — enter a username. No password. If the username doesn't exist yet, it's created.
2. Non-admin usernames land on `/survey` — answer a list of questions (one text field each), answers are saved per user.
3. Admin username(s) (default `admin`, configurable via `ADMIN_USERNAMES` or `ADMIN_USERNAME` env var) land on `/admin` instead — add/edit/reorder/remove survey questions.

## Local development

1. Copy the env file and fill in your database URL:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Push the schema to your database (no migration files needed for local iteration):

   ```bash
   npm run db:push
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Database

Schema lives in `src/db/schema.ts`:

- `users` — id, username (unique), created_at
- `questions` — id, text, order, created_at
- `answers` — id, user_id, question_id, answer_text, created_at

Useful scripts:

- `npm run db:push` — push schema changes straight to the DB (good for early dev)
- `npm run db:generate` — generate SQL migration files from schema changes
- `npm run db:migrate` — apply generated migrations
- `npm run db:studio` — open Drizzle Studio to browse data

## Environment variables

See `.env.example`:

- `DATABASE_URL` — Postgres connection string (Neon / Vercel Postgres)
- `ADMIN_USERNAMES` — comma-separated list of usernames routed to `/admin` instead of `/survey` (e.g. `admin,nikolaj`). Takes precedence over `ADMIN_USERNAME` if both are set.
- `ADMIN_USERNAME` — single admin username, kept for backwards compatibility (default `admin`)
- `SESSION_SECRET` — secret used to sign the session cookie

## Deploying

This project is meant to be deployed on Vercel with a connected Postgres
(Neon) database via the Vercel dashboard/marketplace integration. Pull the
resulting env vars locally with:

```bash
vercel env pull .env.local
```
