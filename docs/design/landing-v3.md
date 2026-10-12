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