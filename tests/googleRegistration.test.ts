import assert from 'node:assert/strict';
import test from 'node:test';
import { GoogleRegistrationError, submitGoogleRegistration } from '../src/lib/googleRegistration';

for (const role of ['student', 'company'] as const) {
  test(`${role} signup persists actual consent intent before completion; no caller ID or approval`, async () => {
    const calls: Array<{ path: unknown; body: any }> = [];
    const request = (async (path, options) => {
      calls.push({ path, body: JSON.parse(String(options?.body)) });
      assert.ok(options?.signal);
      return Response.json({ data: calls.length === 1 ? { registrationId: 'test-intent' } : { role } });
    }) as typeof fetch;
    assert.equal(await submitGoogleRegistration(role, { terms: true, marketing: false }, { onboardingCompleted: false }, request), role);
    assert.deepEqual(calls, [
      { path: '/api/auth/google-registration-intents', body: { role, consents: { terms: true, marketing: false }, profile: { onboardingCompleted: false } } },
      { path: '/api/auth/google-registration-complete', body: { registrationId: 'test-intent' } },
    ]);
  });
}
test('failed completion is not reported as success and remains retryable', async () => {
  let calls = 0;
  const request = (async () => ++calls === 1 ? Response.json({ data: { registrationId: 'test-intent' } }) : Response.json({ error: { code: 'BACKEND_ERROR', message: 'Google registration could not be completed.' } }, { status: 500 })) as typeof fetch;
  await assert.rejects(submitGoogleRegistration('student', {}, {}, request), (error: unknown) => error instanceof GoogleRegistrationError && error.status === 500 && error.code === 'BACKEND_ERROR');
});
test('invalid intent response never reaches the completion API', async () => {
  let calls = 0;
  await assert.rejects(submitGoogleRegistration('company', {}, {}, (async () => { calls++; return Response.json({ data: {} }); }) as typeof fetch), GoogleRegistrationError);
  assert.equal(calls, 1);
});
test('wrong-role completion is not treated as success', async () => {
  let calls = 0;
  await assert.rejects(submitGoogleRegistration('student', {}, {}, (async () => Response.json({ data: ++calls === 1 ? { registrationId: 'intent' } : { role: 'admin' } })) as typeof fetch), GoogleRegistrationError);
});
test('non-JSON server failure keeps an actionable status rather than exposing HTML', async () => {
  await assert.rejects(submitGoogleRegistration('student', {}, {}, (async () => new Response('<html>upstream unavailable</html>', { status: 503 })) as typeof fetch), (error: unknown) => error instanceof GoogleRegistrationError && error.status === 503 && !error.message.includes('<html>'));
});
