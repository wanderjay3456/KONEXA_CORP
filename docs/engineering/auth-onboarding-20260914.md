# Authentication and required-profile repair — 2026-09-14

## Scope and root causes

This release repairs email/Google entry, session restoration and student/company profile completion. It does not certify every financial, legal or provider-dependent feature for commercial operation.

- Deferred database work out of Supabase's synchronous auth-event callback. Awaiting another Supabase operation inside that callback can hold its internal lock and hang login/profile loading.
- A valid Google session with `pending_google` now opens a role/consent completion gate instead of being forcibly signed out as an expired session. An expired legacy registration intent can be retried without discarding a valid Google login.
- Duplicate auth events no longer reload the workspace repeatedly. Access tokens close to expiry are refreshed before protected API requests.
- Email registration only asks for name/company name, email, password and existing required consents. Google authentication starts without completing the email form.
- Required profiles use three guided steps with draft saving, multiple-choice/custom options and private document uploads. Korean, English and Vietnamese copy is native, not dependent on asynchronous translation.
- UI and protected business APIs require both the completion flag and the required fields. Legacy accounts with an invalid completion flag return to setup.
- Profile completion, review request and protected student contacts are saved in one database upsert. Review remains **Pending**; completion is not administrator approval.
- AI analysis runs independently after a successful save. A failed AI request does not undo registration or claim that saved profile data failed.
- Removed the database's obsolete GitHub/public-portfolio completion requirement. Non-software roles still require a resume and academic proof.
- Derived talent cards exclude QA accounts, incomplete profiles and profiles explicitly marked private.

## Database migrations

- `20260914170718_align_profile_completion.sql` — applied to `isrzklwhxdirmgdxgcvs` (`코넥사_final`).
- `20260914171055_private_profile_visibility.sql` — applied to the same project.
- `20260914173521_require_uploaded_profile_evidence.sql` — applied; completed profiles require an existing object in the proper private bucket and their own account namespace, not merely a path string.

No real customer source records or authentication accounts were deleted or force-completed. QA writes used two pre-existing, explicitly test-labelled KONEXA-owned inbox aliases.

## Live verification performed

| Scenario | Evidence/result |
| --- | --- |
| Owned QA email login | Supabase confirmation emails received in the owned inbox; both sessions verified |
| Student guided profile | Three steps saved, multiple roles/skills accepted, no GitHub required |
| Missing student documents | Completion blocked with a localized required-fields alert |
| Private uploads | Academic proof, resume and business-document uploads succeeded using visibly marked QA PDFs |
| Student completion | Profile completed, review request Pending, fresh server AI analysis persisted |
| Company completion | Profile completed, verified=false, review request Pending, fresh server AI analysis persisted |
| Session persistence | Both dashboards survived reload; company logo navigation retained login |
| Pending Google recovery | Existing valid QA session showed role/consent completion instead of false session expiry; no legal consent submitted by the test |
| Authorization | Incomplete company business API returned 403; completed student/company operations returned 200; admin directory returned 403 to both |
| Database validation | Transactional authenticated test accepted no public portfolio, rejected missing resume, and denied cross-user profile update; transaction rolled back |
| Mobile/locales | 390×844 pending-registration layout inspected; English and Vietnamese native copy verified |

After production deployment, Google login was also exercised in the user's existing browser with the previously affected account. Google returned to `konexa.co.kr`, the valid pending account reached the role/consent completion screen, and a reload retained the session without the old expiration error. No legal agreements or profile changes were submitted for that real account. The test-created Google session was signed out afterward.

Production QA student and company sessions both loaded their appropriate dashboards and received operations=200/admin-directory=403. The public opportunity endpoint returned 200 and no fabricated jobs. A post-deployment `/status` 404 was fixed in PR #46 with an explicit Vercel rewrite and a regression/scheduled-smoke check.

Additional authenticated database tests proved: missing physical uploads are rejected; real owned uploads for both roles are accepted; foreign-account paths are rejected. All database test transactions were rolled back. The three QA PDFs and ten new QA app records plus the two new QA AI assessments were cleaned up. All twelve original QA app records were restored, both pre-existing QA accounts are Suspended, and no QA talent cards or temporary QA files remain.

## Regression and release gates

TypeScript checking, 45 initial unit tests and the Vite + Express production build passed (Vite 11.14 seconds; a non-blocking main-chunk size warning remains). Subsequent regression tests cover Vercel status routing and safe document-error messages. The production dependency audit reported zero vulnerabilities. The Windows sandbox initially denied esbuild's parent-directory lookup; rerunning the same build with the scoped approval passed. PR #45 and PR #46 both passed GitHub CI before merging. Main deployment `cd189b3` reached READY, and the public status page rendered successfully.

The production team was freshly confirmed to be on Vercel **Hobby** during release verification. This is an actual remaining commercial-hosting gate, not an inferred or completed upgrade. Error/fatal runtime-log filtering on the initial auth release found no matching entries; this is a point-in-time observation, not an uptime guarantee. Existing six-hour GitHub production-smoke monitoring remains in place and now covers `/status` and `/api/public/projects` as well as liveness/readiness.

## Remaining commercial-operation prerequisites

These are not authentication bugs and must not be described as resolved by this release:

1. Public KO/EN review editions now exist at /terms, /privacy and /project-terms. Jay confirmed the individual operator, South Korea base, retention and pilot/refund principles. Actual processor/transfer destinations, Gemini plan/training, backup/deletion execution and consent-screen reconciliation remain production activation gates; the review date is not a formal commencement or new consent version.
2. Check that the hosting plan permits commercial use; the preceding audit identified a Vercel Hobby plan. No paid upgrade is silently authorized by this code change.
3. Payment, escrow and electronic signature remain subject to the separately agreed provider/onboarding gates. Profile registration does not authorize a project to bypass those gates.
4. Supabase leaked-password protection is a paid-plan capability and is not misrepresented as enabled. Authentication, email confirmation and RLS remain enforced without it.

For incident review, use `/api/health/ready`, the public `/status` page and Vercel runtime logs. Do not put access tokens, password-reset links, private documents or production secret values into issue/PR text.

## Free commercial-hosting migration preparation (2026-10-12)

Owner approved Render My Workspace. Retain Supabase Seoul for durable data/storage; never move production data to Render free Postgres (expires in 30 days). Use the existing Dockerfile, Node 22, free Web Service, branch agent/konexa-recovery-20261012, region Singapore near the Seoul database, health check /api/health/live. No paid resources, card or paid upgrade. Verify zero spend limit and absence of a payment method; exhausted quotas suspend service rather than authorize charges. Disable automatic production/domain promotion until authenticated flows and privacy disclosures are verified.

Render free instances sleep after 15 minutes; waking takes about one minute, have ephemeral filesystems and block SMTP ports 25/465/587. Use Resend HTTPS for app notifications; do not migrate SMTP secrets or enable artificial keep-alive traffic. Existing data and user uploads stay in Supabase. Free deployment is a limited pilot/preview, not verified continuous production uptime. Official reference: https://render.com/docs/free .

Required runtime keys: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, APP_URL, EMAIL_FROM, RESEND_API_KEY, RESEND_WEBHOOK_SECRET (existing exact configuration names must be checked). Public client URL/publishable values already have existing defaults; only public values may be provided at build time. Never transfer GEMINI_API_KEY, SMTP passwords or payment credentials for this pilot. Secret copying and live user-data access by the new host require explicit scope approval after the concrete deployment is reviewable.

Consent release: new form receipt version is 2026-10-12-rules-pilot and collection/use is separate from international processing. Backend Google-intent validation rejects stale versions and missing collection consent. Reconcile direct Supabase signup trigger validation before formal public activation; do not change existing members' receipts or apply a new mandatory version against the old deployed client. Current international disclosures distinguish verified Resend notifications from unverified Auth sender configuration and prepared hosting migration.

The isolated Render migration preview sets PILOT_PREVIEW_ONLY=true. Only health/runtime-mode APIs remain available; business reads/writes are blocked, and email/Google signup checks preview mode before contacting Auth. No Supabase secret, Resend key or production data is copied to this preview. Opening a static page is distinct from activating the operational service.
