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

1. Copy the env file and fill in local values if you need database-backed work:

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

## Environment variables

- `PROPERTY_SEARCH_DATABASE_URL` — preferred Postgres connection string for this app.
- `DATABASE_URL` — compatibility fallback for Neon/Vercel integrations.
- `PROPERTY_SEARCH_SESSION_SECRET` — preferred session signing secret. Required in production.
- `SESSION_SECRET` — compatibility fallback.
- `PROPERTY_SEARCH_ADMIN_USERNAMES` — comma-separated admin usernames for future audit/admin screens.
- `PROPERTY_SEARCH_ADMIN_USERNAME` — single admin username fallback.
- `PROPERTY_SEARCH_ENABLE_LIVE_SOURCES` — defaults to disabled; do not enable until the data-source assessment production gate is satisfied.

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
