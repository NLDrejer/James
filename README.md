# James

James is a small sandbox repository for building and validating workflows with Nikolaj's assistant, James. It is intentionally lightweight: the repo is a safe place to prototype product ideas, test GitHub/Vercel automation, and document patterns before they become habits.

The current production app is [`survey-app`](./survey-app): a Next.js survey tool with username-only login, an admin area for managing questions, and a Neon/Postgres database behind Drizzle ORM.

## Current project: `survey-app`

`survey-app` is a tiny full-stack application used to exercise the whole delivery loop:

1. A user enters a username on `/`.
2. The app creates that user if needed.
3. Admin usernames are redirected to `/admin`.
4. Everyone else is redirected to `/survey`.
5. Survey answers are saved per user and question.
6. Admins can add, edit, reorder, delete questions, and view/export responses.

### Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| App framework | Next.js 16 App Router | Server Components + Server Actions. This is a newer Next.js version; check installed docs before assuming old behavior. |
| Language | TypeScript | Keep application code typed and explicit. |
| Styling | Tailwind CSS v4 | Prefer simple utility classes over custom CSS until the design needs more structure. |
| Database | Neon / Vercel Postgres | Accessed through `@neondatabase/serverless`. |
| ORM | Drizzle ORM | Schema in TypeScript, migrations committed under `survey-app/drizzle/`. |
| Testing | Vitest + Playwright | Unit tests for server actions/env behavior, e2e smoke test for the happy path. |
| Hosting | Vercel | Project root is `survey-app`; build output is `.next`. |

## Repository layout

```text
.
├── README.md                         # This architecture and contribution guide
└── survey-app/
    ├── README.md                     # App-specific setup and scripts
    ├── AGENTS.md                     # Important Next.js 16 agent guidance
    ├── src/
    │   ├── app/                      # Routes, pages, layouts, server actions
    │   │   ├── actions.ts            # Mutating server actions and redirects
    │   │   ├── page.tsx              # Username login page
    │   │   ├── survey/page.tsx       # User survey flow
    │   │   └── admin/                # Question management and responses
    │   ├── db/
    │   │   ├── index.ts              # Lazy database initialization and test DB switch
    │   │   ├── schema.ts             # Drizzle table definitions
    │   │   └── testing.ts            # In-memory test database shim
    │   └── lib/session.ts            # Signed username cookie and admin-name helpers
    ├── drizzle/                      # Generated SQL migrations; commit these
    ├── tests/
    │   ├── unit/                     # Vitest server-action/env tests
    │   └── e2e/                      # Playwright smoke tests
    ├── drizzle.config.ts
    ├── playwright.config.ts
    └── vitest.config.ts
```

## Architecture

### Request and data flow

```text
Browser form
  ↓
Next.js Server Action (`src/app/actions.ts`)
  ↓
Session helper (`src/lib/session.ts`) + Drizzle DB proxy (`src/db/index.ts`)
  ↓
Neon/Postgres tables from `src/db/schema.ts`
  ↓
Redirect/revalidate back into App Router pages
```

Key flows:

- **Login**: `login(formData)` validates the username, rate-limits by IP and username, upserts the user, signs a cookie, then redirects to `/admin` or `/survey`.
- **Session**: `session.ts` stores only the username in a signed HTTP-only cookie. There is no password auth and no user role table yet.
- **Admin authorization**: admin access is determined by configured usernames (`JAMES_ADMIN_USERNAMES` preferred). This is enough for the sandbox, not a production-grade RBAC model.
- **Database access**: `db` is a lazy proxy. It does not require `JAMES_DATABASE_URL` during module import/build; the connection is resolved when a DB method is used at runtime.
- **Survey state**: questions are global; answers are attached to `(user, question)` through foreign keys.

### Database model

| Table | Purpose | Important fields |
| --- | --- | --- |
| `users` | One row per username | `username` is unique and limited to 64 chars. |
| `questions` | Admin-managed survey prompts | `order` controls display order. |
| `answers` | User answers to questions | References `users.id` and `questions.id`; cascades on delete. |

Schema changes belong in `survey-app/src/db/schema.ts`; generated SQL migrations belong in `survey-app/drizzle/`.

## Coding patterns

### 1. Prefer Server Actions for mutations

Mutations currently live in `survey-app/src/app/actions.ts`. Keep form-handling code close to these actions unless there is a clear reason to split it.

Good pattern:

```ts
export async function addQuestion(formData: FormData) {
  const username = await getSessionUsername();
  if (!username || !isAdminUsername(username)) redirect("/");

  const text = formData.get("text");
  if (typeof text !== "string" || !text.trim()) return;

  await db.insert(questions).values({ text: text.trim(), order: nextOrder });
  revalidatePath("/admin");
  revalidatePath("/survey");
}
```

Guidelines:

- Validate raw `FormData` values before using them.
- Redirect unauthenticated or unauthorized users early.
- Call `revalidatePath` after mutations that affect rendered pages.
- Keep one action responsible for one user intent.

### 2. Keep database initialization lazy

Vercel builds and tests should not fail just because runtime database credentials are unavailable during import.

Do:

- Resolve DB credentials inside a runtime function.
- Keep the `db` proxy pattern in `src/db/index.ts` unless replacing it with an equally build-safe pattern.
- Support `JAMES_TEST_DB=memory` for e2e tests.

Don't:

- Read and validate `JAMES_DATABASE_URL` at module top level.
- Instantiate network database clients during tests that should use the memory DB.
- Bypass Drizzle with raw SQL unless the migration or query genuinely requires it.

### 3. Treat environment variables as part of the interface

Preferred names use the `JAMES_` prefix. Compatibility fallbacks exist because Vercel/Neon integrations often expose generic names.

| Preferred | Compatibility fallback | Purpose |
| --- | --- | --- |
| `JAMES_DATABASE_URL` | `DATABASE_URL` | Runtime Postgres connection. |
| `JAMES_SESSION_SECRET` | `SESSION_SECRET` | HMAC secret for signed cookies. Required in production. |
| `JAMES_ADMIN_USERNAMES` | `ADMIN_USERNAMES` | Comma-separated admin usernames. |
| `JAMES_ADMIN_USERNAME` | `ADMIN_USERNAME` | Single admin username fallback. |

Do not commit `.env*` files. Pull or configure them through Vercel/local secrets.

### 4. Migrations are the database source of truth

For persistent schema changes:

```bash
cd survey-app
npm run db:generate
# Review generated SQL in drizzle/
npm run db:migrate
```

Do:

- Commit schema and migration files together.
- Review generated SQL before applying it.
- Run migrations against the target database after deployment/config changes.

Don't:

- Use `db:push` for production changes. It bypasses migration history.
- Change `schema.ts` without committing the generated migration.
- Assume a green Vercel deploy means the database schema exists; verify migrations separately.

### 5. Tests should run without production credentials

The repo intentionally includes a memory-backed test DB path. Use it for deterministic tests and e2e smoke checks.

Expected validation before PRs:

```bash
cd survey-app
npm run test:unit
npm run lint
npm run build
# When browser dependencies are available:
npm run test:e2e
```

Testing expectations:

- Add or update Vitest tests for server-action logic and env-variable behavior.
- Keep Playwright focused on important user journeys, not every edge case.
- Prefer deterministic fixtures over live production services.

## Do and don't

### Do

- **Do read `survey-app/AGENTS.md` before changing Next.js code.** This app uses Next.js 16; old App Router assumptions may be wrong.
- **Do keep PRs small and reviewable.** One bug, feature, or documentation improvement per branch.
- **Do validate real behavior.** For UI changes, run the app or a Playwright path; for DB changes, run migrations; for Vercel issues, inspect the actual deployment.
- **Do keep secrets out of git.** Use Vercel env vars or local `.env.local` only.
- **Do prefer explicit redirects and revalidation.** Server Actions should make navigation/cache effects obvious.
- **Do document deployment or migration steps in the PR.** Future Nikolaj should not have to rediscover them from logs.

### Don't

- **Don't add real authentication accidentally.** Username-only login is intentional for this sandbox. If that changes, design it explicitly.
- **Don't trust client-side checks for admin access.** Server Actions must enforce admin checks before mutating data.
- **Don't create top-level DB side effects.** Keep runtime-only work out of import time.
- **Don't commit generated build artifacts.** `.next`, `node_modules`, Playwright reports, and `.env*` files stay untracked.
- **Don't skip migrations.** `relation "users" does not exist` means the app deployed but the schema did not.
- **Don't mix Vercel root-directory models.** If Vercel project root is `survey-app`, commands should be `npm ci` and `npm run build`, with output `.next`.

## Local development

```bash
cd survey-app
cp .env.example .env.local
npm install
npm run db:migrate
npm run dev
```

Then open <http://localhost:3000>.

Useful scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local Next.js dev server. |
| `npm run build` | Production build. |
| `npm run lint` | ESLint checks. |
| `npm run test:unit` | Vitest unit tests. |
| `npm run test:e2e` | Playwright e2e smoke test. |
| `npm test` | Unit + e2e tests. |
| `npm run db:generate` | Generate SQL migration from Drizzle schema changes. |
| `npm run db:migrate` | Apply committed migrations. |
| `npm run db:studio` | Browse database with Drizzle Studio. |

## Deployment notes

The live app is deployed on Vercel with project root set to `survey-app`.

Expected Vercel settings:

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Root Directory | `survey-app` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `.next` |

Production deploy checklist:

1. PR merged to `main`.
2. Vercel production deployment is `READY`.
3. Required environment variables are present in Vercel.
4. Database migrations have been applied to the production database.
5. Smoke test login with a normal username and an admin username.

## GitHub workflow

Use normal branch + PR delivery:

```bash
git checkout -b docs/example-change origin/main
# make changes
git add .
git commit -m "docs: describe example change"
git push origin docs/example-change
gh pr create --base main --head docs/example-change
```

PR descriptions should include:

- What changed.
- Why it changed.
- Files worth reviewing.
- Validation performed.
- Deployment or migration notes, if any.

## Troubleshooting

| Symptom | Likely cause | What to check |
| --- | --- | --- |
| `relation "users" does not exist` | DB migrations were not applied. | Run `npm run db:migrate` with the target DB env. |
| `JAMES_SESSION_SECRET or SESSION_SECRET must be set in production` | Missing session secret in Vercel. | Add `JAMES_SESSION_SECRET` to production env and redeploy. |
| Vercel says no `public` output directory exists | Wrong framework/output settings. | Root should be `survey-app`, output should be `.next`. |
| Vercel preview says `Resource provisioning failed` before logs | Vercel platform/provisioning issue, often outside app code. | Inspect deployment through Vercel API/CLI and compare with GitHub CI/local build. |
| Login redirects to the wrong area | Admin username config mismatch. | Check `JAMES_ADMIN_USERNAMES` and username casing. |
| Local build fails due to database env | DB initialization moved back to import time. | Keep DB credential checks lazy in `src/db/index.ts`. |

## Future architecture considerations

This app is deliberately simple. If it grows, consider these upgrades deliberately rather than incrementally bolting them on:

- Real authentication and authorization model.
- Per-survey ownership instead of one global survey.
- Unique constraint on `(user_id, question_id)` for answers.
- Audit/history table for admin edits.
- More structured service layer if Server Actions become too large.
- Seed data and reset tooling for predictable preview environments.

Until then, optimize for clarity, fast iteration, and easy debugging.
