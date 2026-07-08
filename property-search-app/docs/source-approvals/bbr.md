# BBR source approval

- **Source ID:** `bbr`
- **Source name:** BBR building register
- **Status:** `pending_approval`

## Current decision

Keep live BBR integration disabled until official access, allowed use, retention, and display limits are recorded.

## Intended first use

Use BBR only for building/property facts that support address/property context. Do not infer ownership or personal relationships from BBR facts alone.

## Production gate checklist

- [ ] Official API/export path documented
- [ ] Terms/agreement reference recorded
- [ ] Rate limits and refresh cadence documented
- [ ] Retention/deletion policy recorded
- [ ] Auth, audit logs, rate limiting, and source kill switch enabled
- [ ] `PROPERTY_SEARCH_ENABLE_LIVE_SOURCES=true` and `PROPERTY_SEARCH_ENABLE_BBR=true` set only after approval
