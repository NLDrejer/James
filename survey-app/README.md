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
3. The admin username (default `admin`, configurable via `ADMIN_USERNAME` env var) lands on `/admin` instead — add/remove survey questions.

## Local development

1. Copy the env file and fill in your database URL:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Apply the database schema (runs the committed migrations in `drizzle/`):

   ```bash
   npm run db:migrate
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

Migrations are committed to the `drizzle/` folder and are the source of truth
for the database schema. When you change `src/db/schema.ts`:

1. `npm run db:generate` — generate a new SQL migration file from the schema diff
2. Review the generated SQL in `drizzle/`
3. Commit the migration file(s) alongside your schema change
4. `npm run db:migrate` — apply migrations to your target database (local, preview, or prod)

Useful scripts:

- `npm run db:generate` — generate SQL migration files from schema changes
- `npm run db:migrate` — apply committed migrations to the database
- `npm run db:studio` — open Drizzle Studio to browse data
- `npm run db:push` — push schema changes straight to the DB, bypassing migrations. Only for quick throwaway experiments; prefer generate+migrate for anything you intend to keep.

## Environment variables

See `.env.example`:

- `DATABASE_URL` — Postgres connection string (Neon / Vercel Postgres)
- `ADMIN_USERNAME` — username that gets routed to `/admin` (default `admin`)
- `SESSION_SECRET` — secret used to sign the session cookie

## Deploying

This project is meant to be deployed on Vercel with a connected Postgres
(Neon) database via the Vercel dashboard/marketplace integration. Pull the
resulting env vars locally with:

```bash
vercel env pull .env.local
```
