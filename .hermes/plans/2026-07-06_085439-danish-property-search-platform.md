# Danish Property Search Platform Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a second project to `NLDrejer/James` using the existing Next.js + Tailwind + Drizzle + Neon stack: a Danish-only property search platform that can search by name and surface lawful property-related information with clear provenance and privacy guardrails.

**Architecture:** Build a new sibling app/template from the existing `survey-app` stack rather than introducing a new stack. Start with a safe MVP using mock/imported fixtures and an adapter boundary for future official OIS.dk/Tinglysningen/public-register integrations. Treat name-to-property search as a sensitive feature: require lawful-use framing, data provenance, audit logs, rate limiting, and no unverified scraping.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Drizzle ORM, Neon/Postgres, Vitest, Playwright.

---

## Current repo context

- Repo: `NLDrejer/James`
- Default branch: `main`
- Existing app: `survey-app/`
- Existing stack source files:
  - `survey-app/package.json`
  - `survey-app/src/db/schema.ts`
  - `survey-app/src/db/index.ts`
  - `survey-app/src/app/*`
  - `survey-app/tests/unit/*`
  - `survey-app/tests/e2e/*`
- Current app uses:
  - Next.js 16.2.9
  - React 19.2.4
  - Drizzle + Neon
  - Vitest + Playwright
  - Tailwind 4
- Open issue already exists: #12 local Postgres onboarding.

## Product guardrails

1. **Danish-only scope** — only Danish properties, addresses, cadastral identifiers, and Danish public-register concepts.
2. **Lawful-source first** — MVP must use mock fixtures or explicit lawful imports. Do not implement scraping of OIS.dk, Tinglysningen, or people-search sites until terms/API/legal basis are verified.
3. **Privacy by design** — every person-search result must show source/provenance, retrieval time, confidence, and “why this appears”.
4. **Access control** — do not make sensitive person-to-property lookup anonymous/public in production.
5. **Auditability** — log who searched, what they searched for, when, result count, and purpose where applicable.
6. **Minimization** — store only what is needed for the product; prefer references/source URLs over copying excessive personal data.
7. **No dark UX** — include lawful-use warnings and avoid doxxing-style presentation.

## Proposed file/project layout

Create a new sibling project using the existing stack versions:

```text
property-search-app/
  AGENTS.md
  package.json
  next.config.ts
  tsconfig.json
  vitest.config.ts
  playwright.config.ts
  drizzle.config.ts
  src/
    app/
      page.tsx
      search/page.tsx
      properties/[propertyId]/page.tsx
      api/search/route.ts
      layout.tsx
    components/
      LawfulUseNotice.tsx
      SearchForm.tsx
      SearchResults.tsx
      PropertyCard.tsx
      SourceBadge.tsx
    db/
      index.ts
      schema.ts
      testing.ts
    lib/
      data-sources/
        types.ts
        mock-provider.ts
        provider-registry.ts
      search/
        normalize-danish-name.ts
        normalize-danish-address.ts
        search-service.ts
      privacy/
        audit.ts
        rate-limit.ts
  tests/
    unit/
    e2e/
  README.md
```

Alternative if we decide to keep a single Next app later: mount under `survey-app/src/app/property-search/*`. For now, a sibling `property-search-app` is cleaner because the user asked for “another project in that repo” while reusing the same stack.

---

## Step-by-step implementation plan

### Task 1: Create compliance/data-source discovery ticket before code

**Objective:** Decide what is legally allowed before connecting live data.

**Files:**
- Create/update: GitHub issue only initially
- Later docs: `property-search-app/docs/data-source-assessment.md`

**Steps:**
1. Document candidate sources: OIS.dk, Tinglysningen, BBR/DAR/CVR/public datasets, user-provided imports.
2. For each source, verify official API/export availability, terms, authentication, retention limits, and whether person-name search is permitted.
3. Define MVP-safe data mode: mock fixtures + manually imported lawful datasets only.
4. Define production gate: no live integration until legal basis and source terms are documented.

**Verification:**
- A reviewed data-source assessment exists.
- Every future integration ticket links to it.

### Task 2: Scaffold `property-search-app` with the existing stack

**Objective:** Create the new project using the same versions and conventions as `survey-app`.

**Files:**
- Create: `property-search-app/package.json`
- Create: `property-search-app/README.md`
- Create: `property-search-app/AGENTS.md`
- Create: `property-search-app/next.config.ts`
- Create: `property-search-app/tsconfig.json`
- Create: `property-search-app/vitest.config.ts`
- Create: `property-search-app/playwright.config.ts`
- Create: `property-search-app/src/app/layout.tsx`
- Create: `property-search-app/src/app/page.tsx`

**Steps:**
1. Copy dependency versions/scripts from `survey-app/package.json`.
2. Rename package to `property-search-app`.
3. Add `PROPERTY_SEARCH_DATABASE_URL` with `DATABASE_URL` fallback pattern matching James conventions.
4. Add a minimal landing page that links to `/search`.
5. Add README with local dev, env vars, and legal-mode notes.

**Validation:**
```bash
cd property-search-app
npm install
npm run lint
npm run build
```

### Task 3: Add Drizzle schema for property/person/search/audit MVP

**Objective:** Model search data without over-collecting personal information.

**Files:**
- Create: `property-search-app/src/db/schema.ts`
- Create: `property-search-app/src/db/index.ts`
- Create: `property-search-app/src/db/testing.ts`
- Create: `property-search-app/drizzle.config.ts`
- Test: `property-search-app/tests/unit/schema.test.ts`

**Tables:**
- `data_sources` — source name, type, terms URL, retrieval metadata
- `persons` — normalized name only for MVP/mock data, optional birth year range if lawful later
- `properties` — address, municipality, postal code, cadastral id, property id
- `ownership_links` — person/property relationship, source id, confidence, valid-from/to
- `search_audit_logs` — query, normalized query, requester/session, purpose, result count, timestamp

**Validation:**
```bash
npm run test:unit -- schema
npm run db:generate
```

### Task 4: Build data-source adapter boundary and mock provider

**Objective:** Avoid hard-coding OIS/Tinglysning access into UI/business logic.

**Files:**
- Create: `property-search-app/src/lib/data-sources/types.ts`
- Create: `property-search-app/src/lib/data-sources/mock-provider.ts`
- Create: `property-search-app/src/lib/data-sources/provider-registry.ts`
- Create: `property-search-app/tests/unit/mock-provider.test.ts`

**Steps:**
1. Define provider interfaces for `searchByName`, `getProperty`, and `getSourceMetadata`.
2. Implement mock Danish fixtures with clear fake data labels.
3. Ensure provider returns provenance and confidence for every link.
4. Add tests proving no result lacks a source.

**Validation:**
```bash
npm run test:unit -- mock-provider
```

### Task 5: Implement normalization and search service

**Objective:** Support Danish name/address normalization and Danish-only filters.

**Files:**
- Create: `property-search-app/src/lib/search/normalize-danish-name.ts`
- Create: `property-search-app/src/lib/search/normalize-danish-address.ts`
- Create: `property-search-app/src/lib/search/search-service.ts`
- Test: `property-search-app/tests/unit/search-service.test.ts`

**Acceptance criteria:**
- Handles æ/ø/å consistently.
- Rejects empty, too-short, or suspicious high-volume queries.
- Returns Danish-only results.
- Always includes provenance and confidence.

### Task 6: Add search API route/server boundary

**Objective:** Provide a typed route for the UI with validation, rate limiting, and audit logging.

**Files:**
- Create: `property-search-app/src/app/api/search/route.ts`
- Create: `property-search-app/src/lib/privacy/audit.ts`
- Create: `property-search-app/src/lib/privacy/rate-limit.ts`
- Test: `property-search-app/tests/unit/search-route.test.ts`

**Acceptance criteria:**
- `GET /api/search?q=<name>` returns structured results.
- Invalid queries return 400.
- Rate-limited requests return 429.
- Audit log is written for successful and blocked searches.

### Task 7: Build UX shell and lawful-use warning

**Objective:** Make the sensitive nature of the tool explicit before use.

**Files:**
- Create: `property-search-app/src/components/LawfulUseNotice.tsx`
- Create: `property-search-app/src/components/SearchForm.tsx`
- Create: `property-search-app/src/app/search/page.tsx`
- Test: `property-search-app/tests/e2e/search.spec.ts`

**Acceptance criteria:**
- Search page shows Danish-only scope.
- User must acknowledge lawful-use notice before first search if production mode.
- Copy explains source/provenance and privacy limits.

### Task 8: Build result cards and property details

**Objective:** Show results as property-centric information, not doxxing-style person dossiers.

**Files:**
- Create: `property-search-app/src/components/SearchResults.tsx`
- Create: `property-search-app/src/components/PropertyCard.tsx`
- Create: `property-search-app/src/components/SourceBadge.tsx`
- Create: `property-search-app/src/app/properties/[propertyId]/page.tsx`
- Test: `property-search-app/tests/e2e/property-details.spec.ts`

**Acceptance criteria:**
- Each result has address/municipality/cadastral id where available.
- Each person-property link shows source, confidence, and retrieval date.
- Property detail pages distinguish official data, inferred links, and unknown fields.

### Task 9: Add audit/admin review page

**Objective:** Let an admin inspect usage for abuse and debugging.

**Files:**
- Create: `property-search-app/src/app/admin/audit/page.tsx`
- Create/modify auth/session utilities based on `survey-app/src/lib/session.ts`
- Test: `property-search-app/tests/e2e/admin-audit.spec.ts`

**Acceptance criteria:**
- Admin-only page lists recent searches.
- Non-admin users cannot access audit logs.
- Audit view does not expose unnecessary personal data.

### Task 10: Add fixture import/export tooling

**Objective:** Support safe local/demo data without live integrations.

**Files:**
- Create: `property-search-app/scripts/import-fixtures.ts`
- Create: `property-search-app/fixtures/mock-properties.json`
- Create: `property-search-app/tests/unit/fixtures.test.ts`

**Acceptance criteria:**
- Fixtures are clearly fake/anonymized.
- Import validates schema and source metadata.
- No fixture includes real CPR numbers or sensitive personal identifiers.

### Task 11: Add full validation pipeline

**Objective:** Ensure the app is shippable before any PR is opened.

**Files:**
- Modify: `property-search-app/package.json`
- Create/modify: test files under `property-search-app/tests/`

**Commands:**
```bash
cd property-search-app
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

**Acceptance criteria:**
- Unit tests cover normalization, providers, audit, and API validation.
- E2E tests cover search, no-result, property details, and admin access.
- Build passes without requiring live database during build.

### Task 12: Deployment/env documentation

**Objective:** Document how to deploy without mixing env vars with `survey-app`.

**Files:**
- Modify: `README.md`
- Create: `property-search-app/README.md`
- Create: `property-search-app/.env.example`

**Acceptance criteria:**
- Env vars are prefixed, e.g. `PROPERTY_SEARCH_DATABASE_URL`.
- Vercel build/install/output settings are documented for subdirectory deployment.
- Production data-source feature flags default to disabled.

---

## Risks / open questions

1. **Legal basis:** The biggest blocker is whether name-to-property lookup is legally permitted for the intended use. Do not build live integrations before this is answered.
2. **Data availability:** OIS.dk/Tinglysningen access methods and terms must be verified against official documentation/current APIs.
3. **Identity ambiguity:** Names are not unique. MVP must show confidence and ambiguity, not imply certainty.
4. **Abuse risk:** A public person-to-property search can enable harassment/doxxing. Gate with auth, audit, rate limits, and usage policy.
5. **Stack reuse choice:** Sibling app is recommended, but implementation can choose a route subtree if we later want one deployed Next app.

## GitHub tickets created from this plan

Created one epic plus implementation issues:

1. #31 — Epic: Danish property search platform MVP — https://github.com/NLDrejer/James/issues/31
2. #32 — Compliance/data-source assessment for OIS.dk, Tinglysningen, and public registers — https://github.com/NLDrejer/James/issues/32
3. #33 — Scaffold `property-search-app` with the existing Next/Tailwind/Drizzle stack — https://github.com/NLDrejer/James/issues/33
4. #34 — Design property/person/source/audit database schema — https://github.com/NLDrejer/James/issues/34
5. #35 — Build data-source adapter boundary and mock provider — https://github.com/NLDrejer/James/issues/35
6. #36 — Implement Danish name/address normalization and search service — https://github.com/NLDrejer/James/issues/36
7. #37 — Create search API with validation, rate limiting, and audit logging — https://github.com/NLDrejer/James/issues/37
8. #38 — Build search UX with lawful-use notice — https://github.com/NLDrejer/James/issues/38
9. #39 — Build property result cards and property detail pages — https://github.com/NLDrejer/James/issues/39
10. #40 — Add admin audit page for search usage review — https://github.com/NLDrejer/James/issues/40
11. #41 — Add safe fixture import/export tooling — https://github.com/NLDrejer/James/issues/41
12. #42 — Add validation pipeline: unit, e2e, lint, build — https://github.com/NLDrejer/James/issues/42
13. #43 — Document deployment and environment configuration for property-search-app — https://github.com/NLDrejer/James/issues/43

## Definition of done for MVP

- User can run a local `property-search-app` using the same stack as `survey-app`.
- User can search a Danish name against fake/lawfully imported data.
- Results show Danish properties with source/provenance/confidence.
- Searches are rate-limited and audited.
- No live OIS.dk/Tinglysningen scraping exists.
- Tests and build pass.
- GitHub PR is created for implementation work when coding starts.
