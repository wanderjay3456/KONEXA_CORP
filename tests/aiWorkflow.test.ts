import assert from 'node:assert/strict';
import test from 'node:test';
import { aiFixture, company, other, projectId, student } from './helpers/aiFixture';
import { anonymizeCandidate, shortlistCandidates } from '../src/server/matching';
import { drainOutbox } from '../src/server/outboxDrain';

test('API: roadmap and resume persist before generation, recover malformed content, and restore only to owner', async () => {
  const { app, state } = aiFixture(); const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const request = (path: string, actor: string, body?: object) => fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'x-test-actor': actor, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    for (const [route, type] of [['student-roadmap', 'student_career_roadmap'], ['resume-review', 'resume_evidence_review']]) {
      const response = await request(`/api/ai/${route}`, student, { careerGoal: 'Research', locale: 'en' });
      assert.equal(response.status, 200); const body = await response.json(); assert.ok(body.assessmentId);
      const restored = await request(`/api/ai/assessments?type=${type}&entityId=${student}`, student).then(r => r.json());
      assert.equal(restored.data[0].id, body.assessmentId); assert.equal(restored.data[0].model, 'second');
      assert.equal(restored.data[0].result.tokenUsage.totalTokenCount, 100);
      assert.equal((await request(`/api/ai/assessments?type=${type}&entityId=${student}`, other)).status, 404);
    }
    assert.ok(state.pendingObserved); assert.equal(state.calls, 4);
    state.failProvider = true;
    assert.equal((await request('/api/ai/student-roadmap', student, { careerGoal: 'Research' })).status, 502);
    assert.equal(state.tables.konexa_ai_assessments.filter(row => row.status === 'failed').length, 1);
    assert.equal(state.tables.konexa_ai_assessments.filter(row => row.status === 'pending').length, 0);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('API: matching scans more than 20 candidates, gates companies and honors withdrawn candidates on history reload', async () => {
  const { app, state } = aiFixture(); const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const match = (actor: string, id = projectId) => fetch(`${base}/api/ai/matching`, { method: 'POST', headers: { 'x-test-actor': actor, 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: id }) });
  try {
    assert.equal((await match(student)).status, 403);
    const profile = state.tables.app_records.find(row => row.record_id === company)!;
    profile.data.verified = false; assert.equal((await match(company)).status, 403); profile.data.verified = true;
    const response = await match(company); assert.equal(response.status, 200); const body = await response.json();
    assert.equal(body.coverage.scanned, 301); assert.equal(body.matches.length, 20);
    assert.ok(body.matches.some((row: any) => row.id.endsWith('000000000300')));
    assert.ok(state.pendingObserved);
    const withdrawn = body.matches[0].id; state.candidates = state.candidates.filter(row => row.record_id !== withdrawn);
    const restored = await fetch(`${base}/api/ai/assessments?type=talent_project_matching&entityId=${projectId}`, { headers: { 'x-test-actor': company } }).then(r => r.json());
    assert.ok(!restored.data[0].result.matches.some((row: any) => row.id === withdrawn));
    assert.equal((await fetch(`${base}/api/ai/matching?projectId=${projectId}`, { headers: { 'x-test-actor': company } })).status, 405);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('shortlist filters known weekly constraints, flags unknown evidence and never sends contact or protected characteristics', () => {
  const candidate = { record_id: student, data: { skills: ['Research'], name: 'Private', email: 'private@example.invalid', nationality: 'Private', university: 'Private', availableHoursPerWeek: 4, preferredWeeklyPayKrw: 300000 } };
  assert.equal(shortlistCandidates({ hours_per_week: 10, weekly_pay_krw: 200000 }, [candidate]).candidates.length, 0);
  const unknown = shortlistCandidates({ required_language: 'English' }, [{ record_id: student, data: {} }]).candidates[0];
  assert.ok(unknown.missingEvidence.includes('required_language')); assert.equal(unknown.requiresHumanReview, true);
  const minimized = JSON.stringify(anonymizeCandidate(candidate));
  assert.ok(!minimized.includes('Private')); assert.ok(!minimized.includes('@'));
  for (const value of [null, '', undefined]) assert.equal(anonymizeCandidate({ record_id: student, data: { availableHoursPerWeek: value } }).availableHoursPerWeek, null);
});

test('outbox drains multiple pairs but stops before deadline or provider failure', async () => {
  let remaining = 9; const claims: number[] = [];
  const result = await drainOutbox(async limit => { claims.push(limit); const n = Math.min(limit, remaining); remaining -= n; return { claimed: n, sent: n, suppressed: 0, failed: 0 }; }, { limit: 50 });
  assert.equal(result.sent, 9); assert.ok(claims.every(n => n <= 2));
  let time = 0; let calls = 0;
  const timed = await drainOutbox(async () => { calls++; time += 25000; return { claimed: 2, sent: 2, suppressed: 0, failed: 0 }; }, { limit: 50, now: () => time });
  assert.equal(calls, 1); assert.equal(timed.stopReason, 'time_budget');
  const failed = await drainOutbox(async () => ({ claimed: 2, sent: 1, failed: 1, suppressed: 0 }), { limit: 50 });
  assert.equal(failed.claimed, 2); assert.equal(failed.stopReason, 'provider_failure');
});
