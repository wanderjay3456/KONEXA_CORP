// Explicit, opt-in real provider check. It incurs three ordinary Gemini calls.
// Auth and database are LOCAL FIXTURES: no production accounts are created,
// no real member data is sent to the provider, and no production rows are saved.
// Run with a securely supplied development GEMINI_API_KEY: npm run qa:decision-live.
// Sensitive production secrets are intentionally not exportable from Vercel;
// do not weaken their protection merely to run this local probe.
import assert from 'node:assert/strict';
import { aiFixture, admin, company, student, projectId } from '../../tests/helpers/aiFixture';
import { generateGeminiContent } from '../../src/server/gemini';

for (const key of Object.keys(process.env)) if (/SUPABASE|RESEND|SMTP|STRIPE|PORTONE|PADDLE|MODUSIGN/.test(key)) delete process.env[key];
if (!process.env.GEMINI_API_KEY) throw new Error('Gemini configuration is unavailable to the probe');
const { app, state } = aiFixture({ generate: generateGeminiContent });
Object.assign(state.tables.app_records.find(row => row.collection_name === 'company_profiles')!.data, {
  companyIntroduction: 'Fictional QA company seeking market research and a weekly competitor brief. No real vacancy is represented.',
  hiringRoles: ['Market Research'], requiredSkills: ['Research', 'Excel'], remotePolicy: 'Remote', preferredLanguages: ['English'],
});
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${(server.address() as any).port}`;
const request = async (route: string, actor: string, body: object) => {
  const response = await fetch(base + route, { method: 'POST', headers: { 'x-test-actor': actor, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) });
  const payload = await response.json();
  assert.equal(response.status, 200, `${route} status ${response.status}: ${payload.code || 'response incomplete'}`);
  assert.ok(payload.assessmentId, 'Result must be persisted to the local test store before success');
  return { route, status: response.status, model: payload.model, persisted: true, candidates: payload.matches?.length };
};
try {
  for (const [role, id, locale] of [['student', student, 'en'], ['company', company, 'ko']]) {
    console.log(JSON.stringify(await request('/api/gemini/analyze-profile', admin, { role, profileOwnerId: id, locale })));
  }
  console.log(JSON.stringify(await request('/api/ai/matching', company, { projectId, locale: 'ko' })));
  assert.equal(state.tables.konexa_ai_assessments.filter(row => row.status === 'pending').length, 0);
  console.log('PASS: real provider; fictional evidence; local persistence only. Production authentication and real-user matching quality are separate checks.');
} finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
