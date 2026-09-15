# Evidence-based member review and matching

## User workflow

Open the administrator dashboard and select **인재·기업 검토** (the default tab). Review talent and company profiles, filter by declared role/skills/language, and see missing information without inventing scores. Select an actual open project to compare its requirements with eligible talent. Review excluded profiles and the reason for exclusion. AI summaries are advisory; they never approve, reject, or verify a person.

The source chain is: actual profile/project → shared multilingual taxonomy and explicit constraints → admin/enterprise comparison → optional saved AI review → human verification.

## Changes

- Preserve every existing detailed signup occupation and its Korean/English/Vietnamese labels; add shared role families and multilingual capability aliases.
- Rank declared skill coverage and role relevance. Do not use nationality, school prestige or previous AI scores. Do not pad the shortlist with unrelated people.
- Distinguish known weekly-pay/hours/work-mode/language-level conflicts from missing evidence. Interest in a role is not verified ability.
- Collect optional weekly availability in onboarding and profile settings. Existing accounts are not rejected for missing new information.
- Show actual profile completeness, privacy, verification state, submitted-file presence, published approved reviews and platform work evidence.
- Use admin-only, owner-prefix-checked storage links valid for 60 seconds. Private files are not included in list summaries or AI profile inputs.
- Persist pending/completed/failed AI assessments, retain earlier successful reviews after failure, and mark analysis stale when source evidence or prompt version changes.
- Compare the profile again after generation to prevent saving an already-outdated assessment. Profile source data is not overwritten by model output.
- Distinguish failed data loads from genuine empty states. Keep all new interface copy native in Korean, English and Vietnamese.

## Verification

- `npm run lint`: TypeScript.
- `npm test`: 78 tests, including multilingual role preservation, exact skill boundaries, irrelevant-candidate exclusion, known vs unknown conditions, no protected-trait/prior-score influence, admin/owner authorization, private-file ownership, pagination, dependency errors, persisted AI state and required verification questions.
- `npm run build`: production frontend/backend bundles.
- `npm run test:browser`: 9 local browser scenarios, including company/student onboarding, existing AI workflows and the new admin compare/generate/reload workflow, failed-load retry, native locales and a 390px mobile layout.
- Browser tests use actual built CSS and isolated fictional fixtures. They do not create production people or vacancies and do not validate real model quality.
- `npm run qa:decision-live` is an opt-in real Gemini probe with fictional data and local persistence. It needs a securely supplied development key and incurs provider usage. Sensitive production Vercel secrets must not be made exportable for this probe.

## Operational limits

This is decision support, not a validated prediction of hiring success. Real matching quality still needs actual company project specifications, a sufficiently complete candidate pool, and reviewed outcomes. Document presence does not establish authenticity. AI does not inspect private uploaded documents or video in this profile-summary route.

Workspace queries paginate each source and fail explicitly beyond 10,000 records instead of silently truncating. Shortlists show up to 30 people; exclusion details show the first 50. At larger scale, replace whole-workspace reads with indexed server-side search and cursors.

No new database migration, account-approval gate, paid plan, payment/escrow/e-sign activation or secret rotation is included in this change. A healthy endpoint and configured AI key are not evidence that the new real-provider flow has executed successfully.

## Live provider follow-up

A non-personal public-help question returned `reviewed_help_fallback` and a failed generation receipt, despite a healthy configuration report. The old generic log did not establish whether this was an output limit, timeout, provider access problem or another failure. Do not infer a root cause from that receipt alone.

The follow-up records allowlisted failure categories/status codes and duration only, never prompts, keys or provider payloads. The help classifier now uses an explicit JSON schema, validates returned topic IDs, has a larger bounded output budget and can fall back to a second existing model. Model-truncated responses cannot be reported as successful. Reviewed static help remains available during an outage.

Configuration reference: [Gemini 3 developer guide](https://ai.google.dev/gemini-api/docs/gemini-3) and [Flash-Lite structured classification](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite). A real production request and its persisted receipt are still required after deployment to verify recovery.

Subsequent real help and authenticated admin calls established provider HTTP 503/504 failures, including a failed persisted admin attempt. The primary default is therefore updated to the supported [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), with bounded fallback and brief jitter before retrying transient errors. This is a recovery attempt, not a guarantee that a third-party outage is resolved. Admin error messages distinguish a provider outage from profile storage problems and do not ask people to re-enter a saved profile when the provider is unavailable.

Two confirmed, operator-owned legacy E2E identities had no test flag and incomplete evidence behind a completed-profile flag. They were classified as tests and made private/incomplete without deleting records or changing authentication credentials. Ordinary user names are never heuristically treated as test identities. Test accounts are excluded from the decision workspace, member directory and verification queue.

## Production evidence and final review refinement

On 15 September 2026, production commit `c8777660df93c14e0fe1e8bb3a51ccaaa76fbeec` completed a real, non-personal support question in approximately four seconds. Receipt `b34d824e-f0d3-43b5-b186-17503b1ebb26` was completed using `gemini-3.5-flash-lite`; the saved-answer endpoint restored the same reviewed help topics.

The authenticated administrator also generated an actual existing member profile review. Receipt `d22ebc8a-9edf-4cc8-968d-661de41eb409` was completed with the same model and `profile-analysis-v3`. Refreshing the production browser preserved the admin session and restored the saved review. The output identified inconsistent declared career/skill information and missing availability; it did not establish actual professional competency.

Reading that output revealed a usability gap: the admin panel still showed a legacy learning plan instead of concrete interview questions. Version `profile-analysis-v4` therefore requires 3–5 specific review questions and 1–4 work-sample/scope-document requests. The structured response is validated before success; old reviews stay available but are marked stale. The admin panel separates the summary, clarification points, questions and evidence requests. It does not present training recommendations as verification. Local API/browser tests cover generation, persistence and reload for these fields. Post-deployment real-provider verification is a separate gate from those isolated tests.

The live workspace currently has four non-test-flagged member records and zero real projects. This is not a claim of four audited customers. No production vacancy or member was invented to make matching look populated. Real-company matching effectiveness remains unvalidated until genuine project requirements and reviewed outcomes exist.

## Source-grounded missing information

Free-text model weakness summaries can conflate an absent value with an unverified self-report. The administrator screen therefore no longer renders that legacy field as a missing-information verdict. Actual stored-field checks remain visible in Next verification steps, with source profile values above them. Generated questions and evidence requests are suggestions, not verified findings. The legacy analysis remains stored for compatibility; this UI change does not delete source data or prior assessments. Browser regression checks ensure the free-text weakness/learning recommendations are not displayed as administrator verification facts.
