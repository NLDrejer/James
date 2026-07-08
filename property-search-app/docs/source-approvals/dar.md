# DAR / Dataforsyningen source approval

- **Source ID:** `dar`
- **Source name:** DAR / Dataforsyningen address data
- **Status:** `pending_approval`

## Current decision

Keep live DAR integration disabled until the official access path, terms, credentials, retention, and approved workflow are recorded.

## Intended first use

Use DAR as the first low-risk lawful data source for address normalization and address/property context. DAR records must not be presented as proof of ownership.

## Production gate checklist

- [ ] Official Dataforsyningen/Datafordeler access method documented
- [ ] Terms/agreement reference recorded
- [ ] API credentials configured outside git
- [ ] Rate limits documented
- [ ] Retention/deletion rules recorded
- [ ] Auth, audit logs, rate limiting, and source kill switch enabled
- [ ] `PROPERTY_SEARCH_ENABLE_LIVE_SOURCES=true` and `PROPERTY_SEARCH_ENABLE_DAR=true` set only after approval
