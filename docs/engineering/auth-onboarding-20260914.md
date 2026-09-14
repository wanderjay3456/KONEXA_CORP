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

The Google provider redirect was checked separately from QA email login. A third-party account chooser/password/CAPTCHA and a real person's agreement acceptance must not be simulated as proof of a completed real-user OAuth signup.

## Regression and release gates

TypeScript checking passed. All 45 unit tests passed, including new atomic profile/review persistence tests. The Vite + Express production build passed (Vite 11.14 seconds; a non-blocking main-chunk size warning remains). The production dependency audit reported zero vulnerabilities. The Windows sandbox initially denied esbuild's parent-directory lookup; rerunning the same build with the scoped approval passed. GitHub CI is also required before merge.

## Remaining commercial-operation prerequisites

These are not authentication bugs and must not be described as resolved by this release:

1. The repository currently contains policy summaries, not a fully finalized publicly readable set of terms/privacy documents. Operator identity, actual processors/cross-border destinations, retention/deletion periods and contact/rights procedures must be finalized before collecting real student identity documents at scale.
2. Check that the hosting plan permits commercial use; the preceding audit identified a Vercel Hobby plan. No paid upgrade is silently authorized by this code change.
3. Payment, escrow and electronic signature remain subject to the separately agreed provider/onboarding gates. Profile registration does not authorize a project to bypass those gates.
4. Supabase leaked-password protection is a paid-plan capability and is not misrepresented as enabled. Authentication, email confirmation and RLS remain enforced without it.

For incident review, use `/api/health/ready`, the public `/status` page and Vercel runtime logs. Do not put access tokens, password-reset links, private documents or production secret values into issue/PR text.
