# Self-service signup verification — 2026-09-15

## Incident and bounded fix

Production `POST /api/auth/google-registration-complete` returned 500 with SQLSTATE
42501 (`permission denied for table users`). The invoker wrapper queried
`auth.users`, but the API's actual `service_role` cannot SELECT that table.
Changing JWT claims while running SQL as postgres does not test this permission.

Reproduced the same error with a synthetic Google identity inside a rolled-back
transaction and `SET LOCAL ROLE service_role` before changing the function.
Migration `20260915140124_self_service_google_registration.sql` instead checks the
owned, server-created application account. `requireAuth` still verifies the real
access token, and the existing definer function still verifies the Google identity,
single-use intent, chosen role and required consent. The wrapper remains invoker,
service-only; auth table grants and existing member data were not changed.

Student/company accounts require no administrative approval. Their signup receipt
and initial profiles are stored immediately. Unfinished profiles can be explicitly
saved with **Save draft**. Full profiles still require the appropriate evidence,
while document review remains Pending and separate from account completion.
Publishing jobs and accessing protected talent details retain their verification
and relationship checks. This release does not auto-verify any person or company.

## Evidence

- `npm run lint`: passed.
- `npm test`: 72 passed (client request/error handling, account access, existing APIs).
- `npm run test:browser`: 6 passed; student and company consent → partial draft →
  reload → three-step completion → reload, plus a 500/retry preserving consent and
  the existing roadmap/matching checks. Browser tests use actual UI components and
  the production registration request helper, but isolated local auth/storage/API
  doubles. They are not a real external Google OAuth test.
- `scripts/qa/signup-rollback.sql`: 29 passed on `isrzklwhxdirmgdxgcvs` using the
  real service_role and authenticated roles. Includes signup, consent receipt,
  owned profile/contact writes, atomic completed profile + Pending review writes,
  retries preserving data, role conflicts, single-use intents and suspension.
- `scripts/qa/workflow-rollback.sql`: existing 38 checks passed on the same project.
- Both SQL scripts roll back all generated users, identities, intent rows, profile
  data and test storage metadata. No email is sent or real Google identity claimed.
- `npm run build`: passed; pre-existing >500 kB main-bundle advisory remains.
- `npm audit --omit=dev --audit-level=high`: zero reported vulnerabilities.
- Supabase security advisor: no new findings. Existing authenticated GraphQL schema
  visibility advisories (RLS remains enabled) and disabled leaked-password protection
  remain; no paid plan changes were made.

## Repeatable release gates for signup/auth changes

1. Run lint, unit/API tests, browser tests and production build.
2. Apply reviewed migrations with the migration tool; align the local migration
   filename to the applied version, without repairing unrelated history.
3. Run both rollback SQL suites. Never substitute postgres + a JWT claim for the
   actual role used by the caller. Verify table/function ACLs explicitly.
4. Check production deployment READY and commit, protected endpoint 401 without a
   token, public page reachability, and recent production error logs.
5. A genuine Google authorization round trip requires the user's own interactive
   Google sign-in. Do not claim that the fixture or synthetic identity proves it,
   request passwords, or click real consent on behalf of a new test identity.

Security advisor references:
[GraphQL schema visibility](https://supabase.com/docs/guides/database/database-linter?lint=0027_pg_graphql_authenticated_table_exposed)
and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
