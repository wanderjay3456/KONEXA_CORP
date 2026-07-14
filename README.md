# KONEXA

KONEXA is a React 19, Vite, Express, Firebase, Gemini, Stripe, and Resend application for project-first hiring workflows.

## Security model

- Browser API requests carry a short-lived Firebase ID token.
- The server verifies token validity and revocation with Firebase Admin.
- Anonymous sessions cannot use paid AI, billing, email, intelligence, or admin APIs.
- Admin routes require an `admin` role from the Firebase user document or custom claims.
- Stripe and Resend webhooks require their original raw body and a valid provider signature.
- Subscription entitlements are written only from signed Stripe webhooks.
- Transactional email recipients and templates are server-controlled; clients cannot supply arbitrary HTML or recipients.
- API requests have security headers, body limits, and rate limits.

## Local development

Requirements: Node.js 22-24 and npm.

1. Copy `.env.example` to `.env.local`.
2. Configure development keys and Google Application Default Credentials.
3. Run `npm ci`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

The public health endpoint is `GET /api/health`. It reports whether each provider is configured without exposing secret values.

## Required production configuration

Production startup fails if a required setting is missing:

- `NODE_ENV=production`
- `APP_URL=https://your-domain`
- `FIREBASE_PROJECT_ID`
- `FIRESTORE_DATABASE_ID`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY` using a live `sk_live_` key
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `EMAIL_FROM` on a verified sending domain
- `EMAIL_REPLY_TO` is recommended

Store secrets in the deployment provider's secret manager. Never commit `.env` files or service-account JSON keys.

## Stripe production setup

1. Create a live recurring monthly Product and Price in Stripe.
2. Put its `price_...` ID in `STRIPE_PRICE_PRO_MONTHLY`.
3. Configure the Stripe Customer Portal to allow payment-method updates, invoice history, and subscription cancellation.
4. Add `https://your-domain/api/webhooks/stripe` as a live webhook destination.
5. Subscribe it to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Store the destination signing secret as `STRIPE_WEBHOOK_SECRET`.

Checkout and portal URLs are created server-side. Webhooks are idempotently recorded in Firestore and synchronize subscription status and Firebase custom claims.

## Resend production setup

1. Add the sending domain in Resend.
2. Publish and verify its SPF and DKIM DNS records.
3. Set `EMAIL_FROM` to an address on that verified domain.
4. Add `https://your-domain/api/webhooks/resend` as a webhook.
5. Subscribe to delivery, bounce, complaint, suppression, and failure events.
6. Store the webhook signing secret as `RESEND_WEBHOOK_SECRET`.

Email sends use deterministic idempotency keys. Signed delivery events are stored in Firestore so bounces and complaints are auditable.

## Firebase and Cloud Run

The server uses Firebase Admin with Application Default Credentials. For Cloud Run, use a dedicated runtime service account with only the permissions required to verify Firebase users, access Firestore, and read the configured secrets. Do not export a long-lived service-account key.

The frontend can also be published through OpenAI Sites. The Sites worker serves the React application and forwards same-origin `/api/*` requests to the secure Cloud Run backend configured as `BACKEND_ORIGIN`.

Before launch:

1. Add the final HTTPS hostname to Firebase Authentication authorized domains.
2. deploy `firestore.rules` to the configured Firestore database.
3. restrict the Firebase browser API key to the production host and required Google APIs.
4. assign administrator roles deliberately; never allow clients to choose the `admin` role.

## Build and container verification

```sh
npm ci
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
docker build -t konexa .
```

The multi-stage Docker image runs the compiled application as a non-root user. GitHub Actions repeats type checking, production build, and high-severity dependency auditing for pushes and pull requests.
