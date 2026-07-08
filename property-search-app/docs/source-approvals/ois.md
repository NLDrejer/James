# OIS source approval

- **Source ID:** `ois`
- **Source name:** OIS.dk
- **Status:** `pending_approval`

## Current decision

Keep live OIS integration disabled until the official access path or documented scraping permission, terms, allowed workflow, retention, and display restrictions are recorded.

## Intended use

Use OIS only inside an authenticated workflow with audit logs, rate limits, provenance, and a source kill switch. Bulk copying, unauthenticated lookup, or source-derived dossiers remain blocked unless explicitly approved.

## Production gate checklist

- [ ] Official access path/API/export/scraping permission documented
- [ ] Terms/agreement reference recorded
- [ ] Person/name search conditions documented
- [ ] Rate limits documented and enforced
- [ ] Retention/deletion rules recorded
- [ ] Auth, audit logs, rate limiting, and source kill switch enabled
- [ ] `PROPERTY_SEARCH_ENABLE_LIVE_SOURCES=true` and `PROPERTY_SEARCH_ENABLE_OIS=true` set only after approval
