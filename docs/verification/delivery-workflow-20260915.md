# Evidence-backed delivery workflow

## What this release connects

The existing company opportunity/application/relationship flow now leads to an actual delivery workspace rather than a prototype. Company and talent use the same persisted agreement and milestone records. The administrator can inspect those records, moderate pending reviews and record a reasoned dispute resolution.

- Company: review the actual project scope, exclusions, hours, revision limit, review period, materials deadline and amount; create an agreement draft; schedule milestones after the required signing stage.
- Talent: submit a result note or a private file for an assigned, funded milestone; retain input after a failure; view earlier versions and feedback; resubmit requested changes.
- Company: read submitted evidence and approve or request revision with written feedback.
- Both parties: explicitly confirm completion only after evidenced deliverables are approved and unresolved disputes are cleared. The second confirmation records Work Passport evidence once.
- Reviews: completed verified transactions only; content remains private until bilateral submission and administrator moderation meet publication rules.
- Administrator: review pending content and resolve a case with evidence and a written explanation. Optional workflow restoration derives its state from persisted payment, signature and submission evidence; it does not invent those events.
- Notifications: durable events for submission, version-specific review, completion and dispute decisions. Due/overdue delivery and overdue-review reminders are deduplicated per recipient, milestone and UTC day.

## Security and failure handling

- Service-only mutation RPCs enforce actor roles, participant ownership, state transitions and idempotency. Browser UI gates are not the authorization boundary.
- A submission must contain meaningful notes or an existing object owned by the assigned talent in the private `project-deliverables` bucket. A path pointing at identity documents or another account is rejected.
- Submission histories are participant/admin-only and `private, no-store`; downloads use 300-second signed URLs scoped to the deliverables bucket.
- Milestone allocation cannot exceed the agreement amount and cannot change after a completion confirmation begins.
- Neither completion, review approval nor dispute resolution executes a payout, refund or electronic signature.
- The deadline scan is called by the existing non-recipient notification worker. Immediate event processing and recipient-visit retries remain available. The existing daily scheduled recovery is not represented as minute-level monitoring.
- New delivery and case controls use native Korean, English and Vietnamese copy. Older operations sections continue to use the existing translation layer; this is not a claim that all legacy copy is native.

## Verification method

- `npm run lint`: TypeScript.
- `npm test`: 82 tests covering validation, delivery read-route authorization/private-file scoping, localized recovery guidance, notification semantics, plus existing authentication, AI, profile, matching and recovery regressions.
- `npm run build`: production client and server.
- `npm run test:browser`: 13 passing scenarios covering the isolated company/talent submission-revision-approval-completion-reload flow, administrator moderation/resolution, native locales, narrow-screen layout, and prior signup/AI/admin flows. Fixtures are local-only and never imported by production.
- `scripts/qa/workflow-rollback.sql`: 55 assertions against the SQL functions in one rolled-back transaction. These include unrelated-account rejection, unfunded/empty/forged-file submission rejection, budget ceilings, final-review gates, version-specific notifications, bilateral completion, exact-once evidence, reminder deduplication and administrator resolution without moving money.

Synthetic fixture payment and signature records exist only inside isolated tests or the rolled-back transaction. They are not real payments, signatures, members, projects, customer references or proof of business outcomes. Passing a fixture browser test does not replace a production-provider transaction test.

## Remaining external and operational boundaries

Real payment/escrow/e-signature activation is intentionally not bypassed. Consequently a newly issued production agreement cannot be treated as funded/signed just to unlock delivery. Commercial hosting authorization, final legal/service policy review and real company/candidate pilot outcomes remain separate launch gates. Visa approval, recruitment outcomes, replacement guarantees, genuine identity checks and dispute judgments are not delegated to AI.

The shared matching/administrator analysis remains evidence-based decision support. The release does not establish a statistical hiring-success rate or turn absent candidate evidence into verified competency. Large-scale indexed search, fully automated sales campaigns, interview scheduling, formal change-order automation and provider-backed talent payouts remain separate capabilities, not completed merely by this delivery release.

## Localization follow-up

Live-browser verification exposed a pre-existing localization deadline mismatch: the browser aborted after 15 seconds while each server-side model could run for 25 seconds. The follow-up shares explicit budgets (8 seconds per provider, at most two providers, 25 seconds client-side), reduces client batches to 20 strings, and uses the already verified default model family. It preserves source text already written in the selected language, cancels obsolete requests, adds a retry delay and rejects malformed or number-changing translations before caching. This does not eliminate third-party outage risk or replace the remaining legacy translation layer with native dictionaries.

After this follow-up, TypeScript, the production build, all 84 automated tests and all 14 isolated browser scenarios passed. The added browser case proves native and private copy is not sent for automatic rewriting. The 55-assertion SQL suite and the database migrations are unchanged.
