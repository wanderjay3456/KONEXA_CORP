# KONEXA

KONEXA is a React 19, Vite, Express, Firebase, and Gemini application for project-first hiring workflows.

## Local development

Requirements: Node.js 20-24 and npm.

1. Copy `.env.example` to `.env.local`.
2. Set `GEMINI_API_KEY` for AI-backed features.
3. Run `npm ci`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

The health endpoint is available at `GET /api/health`.

## Production verification

```sh
npm ci
npm run lint
npm run build
NODE_ENV=production npm start
```

The production server serves the compiled SPA and API from the same origin. It reads the host-provided `PORT` environment variable and defaults to port 3000.

## Container deployment

The included multi-stage `Dockerfile` builds and runs the production application as a non-root user. Configure secrets in the hosting provider rather than committing a `.env` file:

- `NODE_ENV=production`
- `GEMINI_API_KEY` for AI endpoints
- `APP_URL` with the deployed HTTPS origin
- `PORT` only when the provider does not inject it automatically
- `STRIPE_SECRET_KEY` only after replacing the mock checkout flow

```sh
docker build -t konexa .
docker run --rm -p 3000:3000 -e GEMINI_API_KEY=your_key konexa
```

The container is compatible with Google Cloud Run, Render, and Railway. GitHub Actions runs the type check and production build for pushes to `main` and pull requests.

## Deployment caveats

- Billing checkout and email delivery are currently mock flows.
- Review Firebase authorized domains and Firestore rules for the production domain.
- Express AI and admin API routes do not yet verify Firebase ID tokens. Use a controlled demo/staging deployment until server-side authorization is added.
- Restrict the Firebase API key to the intended web origins in Google Cloud Console.
