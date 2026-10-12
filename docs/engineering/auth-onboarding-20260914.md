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

The isolated Render migration preview sets PILOT_PREVIEW_ONLY=true. Only health/runtime-mode APIs remain available; business reads/writes are blocked, and email/Google signup checks preview mode before contacting Auth. Approved runtime keys are connected separately from public activation; the preview continues to block member-facing operations. Opening a static page is distinct from activating the operational service.

Verified Render preview: service srv-db6jiorrjlhs73f307c0, https://konexa-rules-pilot.onrender.com, plan free, Singapore, autoDeploy off. Initial deployment dep-db6jiprrjlhs73f30c1g reached live on 2026-10-12 at 19:49 UTC with commit f24a1828df1d63d7be0d93954681fad7f3a61eb8. Public runtime-mode confirmed previewOnly=true/externalAiEnabled=false, health/live=200 and public project reads=503. The production domain remains unchanged. No new keys or production data were transferred.

Render supplier disclosure for the preview: execution region Singapore; AWS, GCP, Cloudflare and ClickHouse corporate entities listed as United States (https://render.com/security). Corporate country does not establish all physical processing destinations. Official log retention is Hobby 7 / Pro 14 / Scale 30 days; the actual workspace plan and billing payment-method status still need verification before claiming the exact retention or guaranteed zero overage. DPA deletion is on written request and applicable contractual/legal exceptions, not an invented numeric deadline (https://render.com/dpa). Do not activate production processing until those details and Auth sender configuration are verified.

Auth sender evidence: read-only metadata inspection of actual 2026-09-14 authentication emails found Resend authentication signatures and AWS SES delivery headers. Message bodies, login links and tokens were not read or exposed. This establishes the historic delivery processor; current configuration-change verification remains required at activation.

## Deployed receipt guards and coordinated cutover

The additive migration rules_pilot_signup_receipt_guards is applied to the existing Supabase project. Three guards validate new-version receipts before Auth user creation, Google intent storage and signup-consent storage. Required choices must be JSON booleans, talent adult attestation and participation version are enforced, and optional marketing false is accepted. The existing eight consent records are preserved. Pure database validation checks rejected missing/non-boolean choices and stale versions without creating users or changing receipts.

Legacy-client cutover is deliberately off: no system_settings/signup_policy_cutover record is created. Before retiring the old deployed client, confirm the final disclosure and new build, then set that private record's data.required to true in a coordinated release. This enforces the current receipt for all subsequent signup paths; it never rewrites existing consent. Until cutover, legacy receipts continue to follow the existing deployed client's behavior. Trigger helpers live in private schema and PUBLIC/anon/authenticated execution is revoked. The migration is reproduced here to keep schema evidence in the existing file rather than adding or modifying an already-applied migration file.

```sql
create or replace function private.pilot_signup_cutover_required()
returns boolean language sql stable security definer set search_path=public,private
as $$ select coalesce((select data->'required'='true'::jsonb from public.app_records where collection_name='system_settings' and record_id='signup_policy_cutover'),false); $$;
revoke all on function private.pilot_signup_cutover_required() from public,anon,authenticated;
create or replace function private.validate_rules_pilot_receipt(requested_role text, receipt jsonb)
returns void language plpgsql set search_path=public,private
as $$
declare required_key text;
begin
 if requested_role not in ('student','company') or requested_role is null or jsonb_typeof(receipt) is distinct from 'object'
 or receipt->>'documentVersion' is distinct from '2026-10-12-rules-pilot'
 or receipt->>'consentScope' is distinct from 'signup-no-paid-obligation' then
 raise exception using errcode='22023',message='Current signup receipt required';
 end if;
 foreach required_key in array array['terms','dataCollection','nonCircumvention','messageAnalysis','crossBorderPrivacy'] loop
 if receipt->required_key is distinct from 'true'::jsonb then raise exception using errcode='22023',message='Required signup consent missing'; end if;
 end loop;
 if requested_role='student' and (receipt->'adultParticipation' is distinct from 'true'::jsonb or receipt->>'participationPolicyVersion' is distinct from '2026-10-12') then
 raise exception using errcode='22023',message='Adult participation attestation required'; end if;
 if receipt ? 'marketing' and jsonb_typeof(receipt->'marketing') is distinct from 'boolean' then
 raise exception using errcode='22023',message='Marketing choice must be boolean'; end if;
end; $$;
revoke all on function private.validate_rules_pilot_receipt(text,jsonb) from public,anon,authenticated;
create or replace function private.guard_rules_pilot_auth()
returns trigger language plpgsql security definer set search_path=public,private
as $$
declare receipt jsonb:=new.raw_user_meta_data->'consent_bundle';
begin
 if (new.raw_app_meta_data->>'provider'='google' or coalesce(new.raw_app_meta_data->'providers','[]'::jsonb)?'google') and new.raw_user_meta_data->>'role' is null then return new; end if;
 if receipt->>'documentVersion'='2026-10-12-rules-pilot' or private.pilot_signup_cutover_required() then
 perform private.validate_rules_pilot_receipt(new.raw_user_meta_data->>'role',receipt); end if;
 return new;
end; $$;
create trigger konexa_rules_pilot_auth_receipt before insert on auth.users for each row execute function private.guard_rules_pilot_auth();
create or replace function private.guard_rules_pilot_intent()
returns trigger language plpgsql security definer set search_path=public,private
as $$ begin
 if new.consent_payload->>'documentVersion'='2026-10-12-rules-pilot' or private.pilot_signup_cutover_required() then
 perform private.validate_rules_pilot_receipt(new.requested_role,new.consent_payload); end if;
 return new;
end; $$;
create trigger konexa_rules_pilot_intent_receipt before insert or update on private.oauth_registration_intents for each row execute function private.guard_rules_pilot_intent();
create or replace function private.guard_rules_pilot_consent()
returns trigger language plpgsql security definer set search_path=public,private
as $$ begin
 if new.collection_name='consents' and new.data->>'stage'='signup' and
 (new.data->>'documentVersion'='2026-10-12-rules-pilot' or private.pilot_signup_cutover_required()) then
 perform private.validate_rules_pilot_receipt(new.data->>'role',new.data); end if;
 return new;
end; $$;
create trigger konexa_rules_pilot_consent_receipt before insert or update on public.app_records for each row execute function private.guard_rules_pilot_consent();
revoke all on function private.guard_rules_pilot_auth() from public,anon,authenticated;
revoke all on function private.guard_rules_pilot_intent() from public,anon,authenticated;
revoke all on function private.guard_rules_pilot_consent() from public,anon,authenticated;
```

## Final account-state checks and credential handoff

Read-only current dashboard checks confirmed Supabase Auth custom SMTP enabled at smtp.resend.com:587. Render My Workspace is Hobby, the service is Free, no payment card is registered, current and projected charges are USD 0. The actual Hobby log retention is therefore seven days. No card, paid plan or additional resource was added.

The user approved Supabase/Resend runtime-key connection and authentication verification in the free scope. Vercel sensitive environment variables return metadata without recoverable values. A project-matched historical local Supabase key was tested with a zero-row request and returned 401; it was not transferred. The current Supabase key was transferred directly through the official dashboard into the approved Render environment. The user identified konexa.corp@gmail.com as the Resend owner and explicitly approved a new auth.konexa.co.kr sending-only key, KONEXA Render Pilot 2026-10-12. That key was generated and saved to Render after checking the destination provider format; existing keys remain. Public Supabase URL/publishable configuration is set on Render; operational APIs remain blocked by PILOT_PREVIEW_ONLY=true. SUPABASE_SECRET_KEY, RESEND_API_KEY and EMAIL_FROM are saved on the approved Render service. Supabase allows https://konexa-rules-pilot.onrender.com/** as an additive authentication redirect; the existing production Site URL is unchanged. The deployed readiness probe confirms database schema access. A Resend webhook targets the approved Render /api/webhooks/resend endpoint for sent, delivered, failed, bounced and complained events only; its signing secret is saved on Render. Do not confuse configured secrets with actual email delivery or completed login verification. Never paste values into chat, source, issue or PR. RESEND_WEBHOOK_SECRET must be configured before claiming notification-event reconciliation. Keep preview mode on until authenticated-flow checks, final transfer disclosure and coordinated signup cutover are complete.

### Delivery event order verified on the migration server

Synthetic provider test reached Resend and both signed sent/delivered events returned HTTP 200 from Render. The test exposed out-of-order state regression in the previous client-side merge. The additive database trigger below preserves terminal delivery progress and supplier event timestamps under row-level concurrent upserts, without changing customer records. Rollback-only SQL assertions cover reversed events, older final events, newer complaints and metadata preservation. Application retries without a supplier event timestamp remain possible.

Applied migration: preserve_email_delivery_progress.

```sql
create or replace function private.preserve_email_delivery_progress()
returns trigger language plpgsql set search_path = '' as $$
declare
  old_status text := old.data->>'status';
  next_status text := new.data->>'status';
  old_time timestamptz;
  next_time timestamptz;
  keep_progress boolean := false;
begin
  if old.collection_name <> 'email_deliveries' then return new; end if;
  new.data := old.data || new.data;
  if old.data ? 'lastEventAt' then
    keep_progress := old_status in ('delivered','bounced','complained','suppressed','failed')
      and coalesce(next_status,old_status) in ('sending','sent','scheduled','queued','delivery_delayed');
    begin
      old_time := (old.data->>'lastEventAt')::timestamptz;
      next_time := (new.data->>'lastEventAt')::timestamptz;
      keep_progress := keep_progress or (old_time is not null and next_time is not null and next_time < old_time);
      if next_time = old_time then
        keep_progress := keep_progress or
          coalesce(array_position(array['sending','scheduled','sent','delivery_delayed','delivered','failed','bounced','suppressed','complained'],old_status),0)
          > coalesce(array_position(array['sending','scheduled','sent','delivery_delayed','delivered','failed','bounced','suppressed','complained'],coalesce(next_status,old_status)),0);
      end if;
    exception when invalid_datetime_format or datetime_field_overflow then null;
    end;
  end if;
  if keep_progress then
    new.data := new.data || jsonb_build_object('status',old_status,'lastEventAt',old.data->'lastEventAt');
  end if;
  return new;
end $$;
revoke all on function private.preserve_email_delivery_progress() from public, anon, authenticated;
create trigger preserve_email_delivery_progress before update on public.app_records
for each row when (old.collection_name = 'email_deliveries')
execute function private.preserve_email_delivery_progress();
```

### International-processing and consent follow-up

Resend dashboard confirms auth.konexa.co.kr sends from Tokyo, Japan (ap-northeast-1), while the official security page confirms US storage. Signup notices now separate server processing, email sending/storage, supplier security screening and KONEXA external generative AI analysis, with readable native paragraphs in KO/EN. The legal Resend entity is Plus Five Five, Inc. Render's entity is Render Services, Inc. Public supplier contacts are included. Detailed global support/CDN/log processing countries remain unconfirmed; do not activate registration based on this review notice.

The operator approved three individual enquiries from konexa.corp@gmail.com about physical processing countries, data categories, retention, backup deletion and limiting configurations. No user records or credentials were attached. Sent Gmail threads: Supabase privacy@supabase.io 1a131e9b1979c507; Render privacy@render.com 1a131e9ca5513f25; Resend support@resend.com 1a131e9e54ebf777. Sending an enquiry is not receipt of a supplier answer.

Live negative-auth verification used the real consent_bundle metadata with terms=false and the current review version. Supabase rejected the insert (HTTP 500, unexpected_failure); no synthetic account remained. An initial request used the wrong consents property and entered the intentionally compatible legacy path. That unconfirmed QA account and its two test-owned records were removed after identity/session checks; no customer account was modified. This confirms current-version rejection, not universal legacy rejection or a completed positive signup/login. Global cutover remains disabled until coordinated release. 29 existing signup/landing browser tests passed after the paragraph changes.

Sources: https://resend.com/security ; https://resend.com/legal/privacy-policy ; https://render.com/privacy ; https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq ; https://law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1033215841 .

Resend replied in thread 1a131e9e54ebf777: public security/legal pages and account documents are the written materials available outside Enterprise; individual line-by-line assessments require an Enterprise agreement. No upgrade, sales introduction or paid commitment was requested. This reply does not enumerate the missing detailed processing countries. Supabase/Render substantive answers were not present at this check.

### Account documents reviewed 2026-10-13

The authenticated KONEXA Resend Documents page exposes a signed DPA, a penetration-test attestation, SOC 2 report and W-9. Its description says the supplier-signed DPA is executed on signup; no new signature or agreement was submitted in this review. The signed DPA (updated 2025-12-31) identifies primary processing in the United States (6.1) and customer-data deletion within 90 days after account termination (Exhibit A), distinct from ordinary email/log retention. It links the subprocessor list but does not supply a complete physical-country inventory for every security/support access. SOC 2 is a security audit, not a processing-country guarantee. The Enterprise-only email reply therefore does not resolve all public-activation gates. No paid upgrade was made.

Evidence: https://resend.com/settings/documents ; https://resend.com/static/documents/resend-dpa-signed.pdf . Keep PILOT_PREVIEW_ONLY=true until disclosure basis and coordinated positive email/Google signup-login checks are complete. The existing authenticated email-delivery and negative-consent results remain separate from positive onboarding verification.
