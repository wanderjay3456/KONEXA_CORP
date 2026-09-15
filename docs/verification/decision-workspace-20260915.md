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
- `npm test`: 76 tests, including multilingual role preservation, exact skill boundaries, irrelevant-candidate exclusion, known vs unknown conditions, no protected-trait/prior-score influence, admin/owner authorization, private-file ownership, pagination, dependency errors and persisted AI state.
- `npm run build`: production frontend/backend bundles.
- `npm run test:browser`: 9 local browser scenarios, including company/student onboarding, existing AI workflows and the new admin compare/generate/reload workflow, failed-load retry, native locales and a 390px mobile layout.
- Browser tests use actual built CSS and isolated fictional fixtures. They do not create production people or vacancies and do not validate real model quality.
- `npm run qa:decision-live` is an opt-in real Gemini probe with fictional data and local persistence. It needs a securely supplied development key and incurs provider usage. Sensitive production Vercel secrets must not be made exportable for this probe.

## Operational limits

This is decision support, not a validated prediction of hiring success. Real matching quality still needs actual company project specifications, a sufficiently complete candidate pool, and reviewed outcomes. Document presence does not establish authenticity. AI does not inspect private uploaded documents or video in this profile-summary route.

Workspace queries paginate each source and fail explicitly beyond 10,000 records instead of silently truncating. Shortlists show up to 30 people; exclusion details show the first 50. At larger scale, replace whole-workspace reads with indexed server-side search and cursors.

No new database migration, account-approval gate, paid plan, payment/escrow/e-sign activation or secret rotation is included in this change. A healthy endpoint and configured AI key are not evidence that the new real-provider flow has executed successfully.
