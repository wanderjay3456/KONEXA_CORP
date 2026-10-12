# KONEXA landing and policy review edition

Current implementation: PR #67, 2026-10-12. This replaces the historical green/globe/ticker specification.

The landing is an editorial B2B introduction to managed project pilots: charcoal #20211f, ivory #f7f7f2 and cobalt #244bd7, system fonts, compact navigation, a scoped-work specimen, a dark process section, asymmetric responsibilities and a large closing wordmark. The Shared Span mark consists of two connected arches: separate participants joined through a common piece of work, rather than a letter monogram. Its geometry is inline SVG in the existing component. There are no added image assets, font requests or external tracking providers.

References reviewed: Instrument (typographic scale and visual ownership), Worksome (service sequence and company/talent paths), Linear (hierarchy). This is an original composition, not a copy or official implementation of those brands' design systems. https://www.instrument.com/ ; https://www.worksome.com/ ; https://linear.app/

Korean uses keep-all wrapping, balanced headings, readable measure, generous line height and separated sections. Language, registration links/history, login/recovery, enquiry email drafts and accessible reduced-motion behavior remain covered by browser checks.

## Public policies in the existing files

- Data: src/config/compliancePolicy.ts; presentation: exported PolicyPage in LandingHero.tsx.
- Direct routes: /terms, /privacy, /project-terms, including locale selection and reload. App routes and Vercel rewrites handle them before authentication.
- All three are explicitly public review editions, not retrospectively accepted contracts. Consent document versions remain unchanged pending formal commencement and reconciliation of consent screens.
- Operator confirmed by Jay: Yoo Jaeyeong, individual/pre-startup, South Korea operating/contracting base. Managed scope, global case-by-case enquiries, talent 18+.
- Commercial principles confirmed: per-project written quote with currency/taxes/fees; start only after contract and payment feasibility; full pre-start refund; after start, accepted work and pre-approved non-recoverable actual expenses only; unperformed portion refunded; statutory rights prevail.
- Retention confirmed: enquiry closure +90 days; account until closure, ordinary data removal within 30 days; security records up to 90 days; statutory transaction records separately retained only when applicable. These are operational commitments; automated deletion is not claimed to exist.
- Old fixed hiring rates and 90-day guarantees are removed from displayed policy/conversion pages. The unused automatic fee quotation UI, writer and historic rate constants are removed. Existing historical records are preserved.

## Concrete activation gates

Read-only checks confirmed a healthy Supabase project in ap-northeast-2 and Vercel email/Gemini variable names (no values decrypted or exposed). Before production activation, verify the linked project's public URL, actual SMTP/email processor, overseas access/processing countries and provider retention, Gemini billing/training terms and opt-out, backups and deletion process. Then finish the legally required transfer details/separate consent, publish commencement dates, and update consent versions deliberately. Do not treat the review edition as a complete international-transfer notice or silently transfer existing consent to it.

Paid contracts additionally require lawful business/service eligibility, party notification details, tax treatment, an actual payment route and hosting-plan commercial eligibility. This PR does not activate payment, electronic signatures, escrow or a business registration.

Primary policy references: PIPC 2026-04-24 updated privacy guidance (https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS074&nttId=12021), the current Personal Information Protection Act and applicable E-Commerce Consumer Protection Act/Enforcement Decree. Mandatory consumer/privacy protections are not waived by project terms.

## Verification

Use npm run lint, npm test, npm run build and npx playwright test. Landing checks cover both languages at 360/390/768/1440px, targets >=44px, no overflow, real signup/login/recovery links and no fabricated proof. Policy checks cover direct routes, navigation/reload, agreed refund/retention wording, review status and increased text spacing. Runtime financial/consent/backend deployment is not asserted by local fixture tests.
## October 12 rules pilot and modern classic refinement

The existing public/og.png is replaced with one generated editorial collaboration image, also used in the hero. It is labelled as a staged brand image; no office/customer provenance is claimed. Warm ivory, charcoal and slate navy replace cobalt. English display uses a restrained serif; Korean remains legible sans. Motion respects reduced-motion preferences. No new image or documentation files are introduced.

External Gemini transmission is disabled unless the operator explicitly approves a later release. Resume PDFs are parsed locally (pdf-parse 2.4.5), bounded to 7.5 MB, 40 pages and 60,000 text characters. Scanned/image-only documents require a readable text PDF; proficiency and years are not inferred. Extracted skills have excerpts and require explicit member confirmation before being added to the profile.

The existing role taxonomy and remote task rubrics cover software/QA, data, design, finance/accounting, marketing, sales, research, translation, support, operations and media. Each work-sample rubric defines measurable ratios and leaves values null until the sample is actually evaluated. Rules ranking is skill coverage 70, role alignment 10, declared work conditions 20. Unknowns remain visible; known hours/budget/mode/language conflicts are excluded. Protected traits and institution prestige do not affect scores.

Admin quality measurement accepts de-identified, human-labelled cases and reports Precision@k, Recall@k and graded NDCG@k. Empty ground truth means unmeasured accuracy. Separate calibration and held-out evaluation sets; do not call fixture correctness proof of AI-equivalent performance. Scores measure declared alignment, not verified competence or hiring probability.

Registration now separates terms, data collection/use, introduction conditions, international processing and optional marketing. New receipts use 2026-10-12-rules-pilot; old receipts are preserved. Resend successful notification records and US processing (30-day email/log, 7-day backup), Supabase Seoul/US Marketplace/Singapore support/European logs are disclosed. Host migration, exact subprocessor countries and Supabase Auth sender configuration still gate formal international-transfer activation. No paid-service, payment or escrow activation is claimed.
