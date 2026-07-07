# CVR source approval

- **Source ID:** `cvr`
- **Source name:** CVR company register
- **Status:** `pending_approval`

## Current decision

Keep live CVR enrichment disabled until company-only workflow, terms, retention, and privacy constraints are documented.

## Intended first use

Use CVR for company identity/business enrichment only. Do not infer private residence, private ownership, or personal ownership without explicit approval.

## Production gate checklist

- [ ] CVR access method and terms documented
- [ ] Company-only allowed workflow recorded
- [ ] Private-address limitations reviewed
- [ ] Retention/deletion rules recorded
- [ ] Auth, audit logs, rate limiting, and source kill switch enabled
- [ ] `PROPERTY_SEARCH_ENABLE_LIVE_SOURCES=true` and `PROPERTY_SEARCH_ENABLE_CVR=true` set only after approval
