# Korean / English operations release

## Available workflows

- Company and talent navigation: **Scheduling, changes & support**. The admin workspace has the same section. Coordination notifications open this section.
- Interviews: propose up to five future times; the other participant confirms one. Conflict checks protect both participants. A replacement proposal does not cancel the existing booking until accepted. Confirmed meetings can be downloaded as UTC `.ics` calendar records.
- Scope changes: preserve the original contract snapshot, proposed deliverables, schedule, reason and explicit additional amount. Only the other participant may agree. This is a business acknowledgement, not an electronic signature or payment. Original contracts and funding are never silently rewritten.
- Replacement / guarantee cases: participants submit evidence, administrators record review and resolution notes, and replacement proposals must reference a real introduction for the same company and a different talent member. Follow-up dates are operating targets, not automatic guarantee approval.
- History: immutable per-version events plus central audit records. Saved state survives reload. Requests use idempotency keys; stale-version and overlap errors are actionable.
- Notifications: in-app records and the existing durable email outbox. Immediate dispatch is best effort; the existing scheduled worker retries. Daily reminders are deduplicated. Calendar download is recommended for exact meeting-time reminders; email is not a real-time alarm guarantee.

## Language behavior

Only Korean and English are supported interface languages. A stored Vietnamese interface preference migrates to English. Vietnamese language skills and original member documents are not deleted.

Native components use reviewed locale copy. Legacy UI uses a bundled dictionary, never background AI translation. An older client's localization endpoint also serves the same static copy. Member-authored content and private fields are not translated. No translating overlay or provider retry is needed for interface text.

Rebuild the source dictionary after editing bilingual copy:

`node scripts/build-ui-dictionary.mjs`

Audit uncovered Korean JSX copy:

`npx tsx scripts/audit-ui-copy.ts src/components`

## Verification and security

Run `npm run lint`, `npm test`, `npm run build`, and `npm run test:browser`. Browser fixtures are local-only and never enter production data.

Run `scripts/qa/signup-rollback.sql`, `scripts/qa/workflow-rollback.sql`, and `scripts/qa/coordination-rollback.sql` as complete transactions. The coordination suite and core workflow command block use the actual `service_role`, not only a JWT claim. All synthetic users, projects, money-state fixtures and notifications roll back; no email provider is called.

Server-role access to private command helpers is explicitly granted. No new browser write grants exist. RLS limits direct reads to participants/admins; API reads independently verify role and ownership. Unknown errors are not exposed as raw database messages.

## Deliberately not automated

No fabricated provider signatures, money transfers, refunds, hiring decisions, visa approvals or guarantee eligibility. External payment / escrow / signature contracts and substantive legal or hiring decisions remain outside this software release.
