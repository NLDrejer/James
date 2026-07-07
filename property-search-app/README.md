# Property Search App

Danish-only property search MVP scaffold for the James repo. The app reuses the
existing `survey-app` stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4,
Drizzle ORM, Neon/Postgres, Vitest, and Playwright.

## Current scope

This is a safe scaffold, not a live person/property search engine yet. The MVP
must use only:

- mock fixtures, or
- explicitly lawful imports with documented provenance and retention rules.

Live OIS.dk, Tinglysningen, BBR/DAR/CVR, or other public-register integrations
stay disabled until the production gate in `docs/data-source-assessment.md` is
complete and approved.

## Local development

1. Copy the env file and fill in local values if you need database-backed work.
   The property app uses `PROPERTY_SEARCH_*` names so its settings do not collide
   with the survey app's `JAMES_*` variables in the same repo:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Validation

```bash
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

## Fixture import/export

The MVP ships with a fake/anonymized Danish property fixture JSON at
`src/lib/data-sources/fixtures/mock-property-fixtures.json`.

Useful commands:

```bash
npm run fixtures:export
npm run fixtures:import -- ./path/to/reviewed-fixtures.json
```

Imports are validated before they are written. Any ownership record missing
source metadata is rejected. See `docs/property-fixture-tooling.md` for the
lawful-replacement workflow.

## Environment variables

See `.env.example` for the canonical local + Vercel shape.

- `PROPERTY_SEARCH_DATABASE_URL` — preferred Postgres connection string for this app.
- `DATABASE_URL` — compatibility fallback for Neon/Vercel integrations.
- `PROPERTY_SEARCH_SESSION_SECRET` — preferred session signing secret. Required in production.
- `SESSION_SECRET` — compatibility fallback.
- `PROPERTY_SEARCH_ADMIN_USERNAMES` — comma-separated admin usernames for future audit/admin screens.
- `PROPERTY_SEARCH_ADMIN_USERNAME` — single admin username fallback.
- `PROPERTY_SEARCH_REQUIRE_AUTH` — when unset, auth defaults to `false` in local development and `true` in production. Set it explicitly to `true` on Vercel.
- `PROPERTY_SEARCH_ENABLE_LIVE_SOURCES` — defaults to disabled; keep it `false` in production until the data-source assessment production gate is satisfied and approved.

## Deploying on Vercel

`property-search-app` is deployed as its own Vercel project so it does not replace
or break the existing survey app deployment.

Current production surfaces:

- Survey app: https://james-sooty.vercel.app
- Property search app: https://james-property-search.vercel.app

Vercel project settings for the property-search project:

- **Project:** `james-property-search`
- **Root Directory:** `property-search-app`
- **Install Command:** `npm ci`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Ignored Build Step:** `git diff --quiet HEAD^ HEAD -- property-search-app .github/workflows/ci.yml`

Do **not** add `cd property-search-app` to the install/build commands when the
root directory is already set to `property-search-app`, or Vercel will look for
the app in the wrong place. Do not point the existing `james` survey project at
`property-search-app`; keep that project rooted at `survey-app` with ignored
build step `git diff --quiet HEAD^ HEAD -- survey-app .github/workflows/ci.yml`.

### Deployment smoke check

After a production deploy, run:

```bash
npm run smoke:deployment -- https://james-property-search.vercel.app
```

The smoke check verifies the landing page, `/search`, and that the production
search API requires authentication before sensitive person-to-property lookup.

### Rollback

If the property deployment breaks, use Vercel to promote the previous READY
deployment for the `james-property-search` project. If the survey app is affected,
restore the original `james` project settings to `survey-app` root directory,
`npm ci`, `npm run build`, and `.next`, then redeploy `main`.

### Vercel environment variables

Set these in Vercel for Preview/Production as appropriate:

- `PROPERTY_SEARCH_DATABASE_URL` — preferred app-specific database URL.
- `PROPERTY_SEARCH_SESSION_SECRET` — required in production for signed sessions.
- `PROPERTY_SEARCH_ADMIN_USERNAMES` or `PROPERTY_SEARCH_ADMIN_USERNAME` — optional admin allowlist.
- `PROPERTY_SEARCH_REQUIRE_AUTH=true` — keep real person/property lookup behind auth in production.
- `PROPERTY_SEARCH_ENABLE_LIVE_SOURCES=false` — safe default; do not turn this on until `docs/data-source-assessment.md` is fully approved for the source you plan to enable.

If your Vercel Postgres or Neon integration only provides generic names such as
`DATABASE_URL` or `SESSION_SECRET`, the app still supports them as compatibility
fallbacks. Prefer the `PROPERTY_SEARCH_*` names for this app so deployment
settings stay separate from the survey app.

## Database/Drizzle

The scaffold includes Drizzle config and a minimal `data_source_assessments` table
for recording source/provenance decisions. Future schema work for properties,
person links, search audits, and result provenance belongs in the next epic
tickets.

Useful scripts:

- `npm run db:generate` — generate SQL migrations from schema changes.
- `npm run db:migrate` — apply committed migrations.
- `npm run db:studio` — inspect the database.
- `npm run db:push` — push schema changes directly for throwaway experiments only.

## Retention and deletion

Default MVP retention policy before live sources are enabled:

- Search audit metadata: keep for 90 days, then purge. Audit entries store query hashes, requester/session metadata hashes, status, counts, and timestamps — never raw search text.
- Lawful imports: keep for up to 365 days unless a source-specific agreement requires a shorter window.
- Mock fixtures: disposable demo data. They can be deleted or regenerated at any time and must stay separate from future lawful imports.

Operational commands:

```bash
npm run retention:audit:dry-run
npm run retention:audit:purge
npm run retention:imports:delete -- --source <source-id> --batch <batch-id>
```

For imported data deletion, remove dependent ownership links first, then property rows, then person rows. Retain the source/provenance metadata needed to explain what was deleted, why it was lawful to import, and which retention rule applied. Replace mock fixtures only with sources documented in `docs/data-source-assessment.md`, with live integrations disabled until the production gate is approved.

## Safety rules

- Do not scrape OIS.dk, Tinglysningen, or people-search websites.
- Do not ship unauthenticated public production access to person-to-property lookup.
- Do not store CPR numbers, raw search text, or unnecessary personal identifiers.
- Every future result must include source/provenance, confidence, and retrieval time.
- Searches must be rate-limited and audited before real data is used.
