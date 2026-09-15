# KONEXA verification

## Local release gate

Run `npm run lint`, `npm test`, `npm run build`, and `npm audit --omit=dev --audit-level=high`.
Run `npx playwright install chromium` once and `npm run test:browser` for the
component → API → fixture store → reload checks. The CI runs these automatically.
Browser/API fixtures live under `tests/`, are never imported by production,
do not connect to Supabase/Gemini, and are not evidence of live OAuth or model quality.
The GitHub `verify` check repeats these checks before merge. Never bypass the protected branch.

## Database integration suite

Run all of `workflow-rollback.sql` as **one SQL request**, using an operator connection.
It creates isolated fixtures inside a transaction and ends with `ROLLBACK`.
Never run only selected lines, remove the rollback, or call real payment/signature providers.
The suite checks permissions, idempotency, required profile gates, milestones, sealed reviews,
dispute isolation, notification deduplication, email opt-out and retry ownership.
Synthetic signed/paid states are fixtures, not evidence that a payment or signature integration is live.
Storage rows in the SQL suite are rollback-only metadata fixtures, not real uploaded documents.
The suite also checks private candidate lookup, suspended/withdrawn candidates,
owner career-goal updates, AI attempt states, and service-only health aggregation.

## Opt-in live authentication/API checks

`live-auth.mjs` creates at most one student and one company test account per process.
Use only after explicit permission and only with an inbox owned by the operator.

Required environment variables:

- `KONEXA_QA_LIVE=approved-owned-test-accounts`
- `QA_SUPABASE_URL`: the confirmed project URL
- `QA_SUPABASE_PUBLISHABLE_KEY`: public client key, never the service-role secret
- `QA_INBOX`: owned base mailbox (no plus suffix)

Run `node scripts/qa/live-auth.mjs` and write one JSON command per line:

```json
{"action":"signup","role":"student"}
{"action":"login","role":"student"}
{"action":"profiles","role":"student"}
{"action":"api","role":"student","path":"/api/v2/operations","testId":"operations"}
{"action":"logout","role":"student"}
```

Confirm the account through the actual received authentication email before login.
The process holds random test passwords and tokens in memory; do not print, save or commit them.
Send `stop` to sign out all test sessions and exit.
Test identities must remain private and excluded from public talent lists; suspend them after QA.
Do not delete real customer records or publish test jobs to production.

## Manual release checks

- Both roles: email receipt, confirmation, login, reload, logo/dashboard, language switch, logout.
- Student: required-profile entry point, saved fields, applications, AI coach/roadmap/resume,
  video owner access, contracts/milestones/reviews using real records only.
- Company: business verification entry point, project form, applicant detail navigation,
  verified-company restriction, matching, contracts and billing configuration messages.
- Notifications: in-app receipt, read state, email opt-out, durable worker delivery and inbox receipt.
- Public: root and www redirect, real public projects, mobile layout, console and runtime errors.
- External gates are separate: merchant onboarding, actual provider sandbox/live transactions,
  e-signature evidence, password recovery/Google consent UI, commercial hosting plan and legal review.

Passing automated checks does not guarantee zero future errors or legal/commercial readiness.
