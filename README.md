# KONEXA

KONEXA is a React 19, Vite, Express, Supabase, Gemini, domestic PG/escrow-ready, Modusign-ready, Stripe, and Resend application for project-first hiring workflows.

## Authentication and data security

- Email/password accounts, persistent sessions, email verification, and password recovery use Supabase Auth.
- Account profiles are created by a database trigger, so a partial client request cannot leave authentication and profile data out of sync.
- Row Level Security (RLS) limits records to their owner, the related student/company, or a deliberately assigned administrator.
- Self-registration only accepts student and company roles. A user cannot promote their own role.
- Browser requests use the Supabase publishable key. The server-only secret key must be stored in the deployment secret manager.
- Stripe and Resend webhooks verify provider signatures and use idempotent records.
- Trust operations record signup/introduction/contract consent versions, keep contacts in a protected collection, and release them only after bilateral signature plus a verified PG funds-secured record.
- Message contact-pattern controls store only the pattern type and related record ID, not a copy of the message body.

The database definition is versioned in `supabase/migrations/202607140001_initial_supabase.sql`.

## Local development

Requirements: Node.js 22-24 and npm.

1. Copy `.env.example` to `.env.local`.
2. Add the server-only provider secrets you intend to test.
3. Run `npm ci`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

Email/password authentication and browser data access work with the checked-in Supabase project URL and publishable key. Do not commit `SUPABASE_SECRET_KEY`, Gemini, Stripe, or Resend secrets.

## Required production configuration

The Express backend requires:

- `NODE_ENV=production`
- `APP_URL=https://your-domain`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY` using a live `sk_live_` key
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `EMAIL_FROM` on a verified sending domain
- `EMAIL_REPLY_TO` is recommended
- `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET`, `PORTONE_STORE_ID`
- `PORTONE_PAYMENT_CHANNEL_KEY`, `PORTONE_IDENTITY_CHANNEL_KEY`
- `MODUSIGN_API_KEY` and the three approved document template IDs

## Provider setup

For Stripe, create a live recurring Price, enable the Customer Portal, and register `/api/webhooks/stripe` for checkout, subscription, invoice-paid, and payment-failed events.

For Resend, verify the sending domain (SPF/DKIM), set `EMAIL_FROM`, and register `/api/webhooks/resend`.

For Google sign-in, configure Google as a Supabase Auth provider and add the production redirect URL. The app supports both Google OAuth and email/password sign-in. New Google users must finish the role-specific registration flow and accept the required agreements before receiving application permissions.

Student registration stores an optional preferred weekly project pay in KRW (`preferredWeeklyPayKrw`). The form deliberately shows no suggested amount to avoid anchoring applicants.

For domestic project payments, complete the PortOne and PG merchant review first, confirm escrow support for project/milestone service transactions, and register signed webhooks. KONEXA must not mark a payment as `paid` or `funds_secured` from a browser callback; the server must verify the provider event. Complete Modusign API service approval and approve the four legal document templates before enabling e-signature. The application intentionally shows these providers as pending until those contracts and secrets exist.

The Sites deployment serves the React application. Configure `BACKEND_ORIGIN` only after deploying the Express backend with its server secrets.

## Verification

```sh
npm ci
npm run lint
npm run build
npm run build:sites
npm audit --omit=dev --audit-level=high
```
