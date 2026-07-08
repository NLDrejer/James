# Source approval template

Copy this file for each official data source before enabling live data or importing source-derived records.

## Source

- **Source ID:** `TODO`
- **Source name:** TODO
- **Owner/contact:** TODO
- **Status:** `pending_approval` / `approved` / `blocked`

## Official access

- **Access method:** TODO — API, export, manual import, or documented scraping permission.
- **Terms/agreement URL or reference:** TODO
- **Authentication/credentials:** TODO — describe storage mechanism only; do not commit secrets.
- **Rate limits/costs:** TODO
- **Source terms version/date:** TODO

## Approved workflow

- **Allowed use:** TODO
- **Blocked use:** TODO
- **Legal basis/agreement:** TODO
- **Approval reference:** TODO
- **Approved by:** TODO
- **Approved at:** TODO
- **Person/name → property lookup allowed:** yes/no + conditions
- **Public display allowed:** yes/no + conditions

## Required controls

Before enabling the source, confirm all controls are implemented and enabled:

- [ ] Authentication/authorization
- [ ] Search audit logging without raw query text
- [ ] Rate limiting / abuse controls
- [ ] Source-level kill switch
- [ ] Retention/deletion policy
- [ ] Provenance shown in result UI
- [ ] Secrets stored outside git

## Retention and deletion

- **Retention period:** TODO
- **Deletion/takedown process:** TODO
- **Refresh cadence:** TODO
- **Fields stored:** TODO
- **Fields explicitly not stored:** TODO

## Production gate decision

- **Decision:** pending / approved / blocked
- **Conditions:** TODO
- **Next review date:** TODO
