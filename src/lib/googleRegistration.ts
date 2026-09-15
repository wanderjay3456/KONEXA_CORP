export class GoogleRegistrationError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
    this.name = 'GoogleRegistrationError';
  }
}

/** Authenticated fetch attaches the token. Never accept a browser-supplied
 * user ID. Each retry creates a fresh, single-use consent intent. */
export async function submitGoogleRegistration(
  role: 'student' | 'company',
  consents: Record<string, unknown>,
  profile: Record<string, unknown>,
  request: typeof fetch = fetch,
): Promise<'student' | 'company'> {
  async function post(path: string, body: Record<string, unknown>) {
    const response = await request(path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(30_000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new GoogleRegistrationError(
      payload?.error?.code || 'REGISTRATION_UNAVAILABLE',
      payload?.error?.message || 'Google registration could not be completed.', response.status,
    );
    return payload?.data;
  }
  const intent = await post('/api/auth/google-registration-intents', { role, consents, profile });
  if (typeof intent?.registrationId !== 'string' || !intent.registrationId) {
    throw new GoogleRegistrationError('REGISTRATION_UNAVAILABLE', 'Missing registration intent.', 502);
  }
  const completed = await post('/api/auth/google-registration-complete', { registrationId: intent.registrationId });
  if (completed?.role !== role) {
    throw new GoogleRegistrationError('REGISTRATION_UNAVAILABLE', 'The completed account could not be confirmed.', 502);
  }
  return completed.role;
}
