# Tinglysningen source approval

- **Source ID:** `tinglysningen`
- **Source name:** Tinglysningen
- **Status:** `pending_approval`

## Current decision

Keep live Tinglysningen integration disabled until official access or documented scraping permission, terms, payment/auth constraints, allowed workflow, retention, and display restrictions are recorded.

## Intended use

Use Tinglysningen only for approved ownership/rights context inside an authenticated and audited workflow. Prefer references/source links over copying unnecessary personal or rights data.

## Production gate checklist

- [ ] Official access path/API/export/scraping permission documented
- [ ] Terms/agreement/payment constraints recorded
- [ ] Person/name search conditions documented
- [ ] Minimal fields to store/display documented
- [ ] Retention/deletion rules recorded
- [ ] Auth, audit logs, rate limiting, and source kill switch enabled
- [ ] `PROPERTY_SEARCH_ENABLE_LIVE_SOURCES=true` and `PROPERTY_SEARCH_ENABLE_TINGLYSNINGEN=true` set only after approval
