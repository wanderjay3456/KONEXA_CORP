import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyRoles, ROLE_GROUPS, optionLabel, skillIsDeclared } from '../src/lib/talentTaxonomy';
import { shortlistCandidates } from '../src/server/matching';
import { evidenceHash, profileEvidence, PROFILE_ANALYSIS_VERSION, summarizeMember } from '../src/server/decisionSupport';
import { aiFixture, admin, company, student, projectId } from './helpers/aiFixture';
import { isProductionMember } from '../src/lib/adminBackend';

test('multilingual taxonomy preserves all existing skilled-work options and exact technical skills', () => {
  for (const group of ROLE_GROUPS) for (const option of group.roles) {
    for (const locale of ['ko', 'en', 'vi'] as const) assert.ok(classifyRoles([optionLabel(option, locale)]).includes(`role:${option.value}`), `${locale}: ${option.value}`);
  }
  for (const [need, skill] of [['데이터 분석', 'Data Analysis'], ['회계', 'Accounting'], ['번역', 'Translation'], ['고객 지원', 'Customer Service'], ['시장조사', 'Market Research'], ['엑셀', 'Excel'], ['phân tích dữ liệu', 'Data Analysis']]) assert.equal(skillIsDeclared(need, [skill]), true);
  assert.equal(skillIsDeclared('Java', ['JavaScript']), false);
  assert.equal(skillIsDeclared('C++', ['C#']), false);
});

test('matching ranks multilingual evidence, keeps missing conditions visible, and omits unrelated filler', () => {
  const project = { title: '시장조사 담당', tags: ['시장조사', '엑셀'], requirements: ['주간 시장조사 보고서'], weekly_pay_krw: 200000, hours_per_week: 10, required_language: 'English', work_type: 'Remote' };
  const candidates = [
    { record_id: 'relevant', data: { careerInterests: ['Market Research'], skills: ['Market Research', 'Excel'], englishLevel: 'Beginner' } },
    { record_id: 'conflict', data: { careerInterests: ['Market Research'], skills: ['Market Research'], availableHoursPerWeek: 5, preferredWeeklyPayKrw: 300000 } },
    { record_id: 'unrelated', data: { careerInterests: ['Graphic Design'], skills: ['Drawing'] } },
  ];
  const result = shortlistCandidates(project, candidates);
  assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0].id, 'relevant');
  assert.equal(result.candidates[0].matchedSkills.length, 2);
  assert.ok(result.candidates[0].missingEvidence.includes('weekly_hours'));
  assert.ok(result.candidates[0].missingEvidence.includes('language_proficiency_confirmation'));
  assert.equal(result.excluded, 1); assert.equal(result.insufficientEvidence, 1);
  assert.deepEqual(result.exclusions.find(item => item.id === 'conflict')?.reasons, ['weekly_pay', 'weekly_hours']);
  assert.equal(result.candidates[0].criteria.find(item => item.key === 'required_language')?.status, 'unknown');
  const languageMismatch = shortlistCandidates({ ...project, required_language: 'English B2' }, [candidates[0]]);
  assert.equal(languageMismatch.candidates.length, 0); assert.ok(languageMismatch.exclusions[0].reasons.includes('required_language'));
  assert.equal(shortlistCandidates({ required_language: 'French' }, [{ record_id: 'new', data: {} }]).candidates[0].missingEvidence.includes('required_language'), true);
  const protectedVariant = { ...candidates[0], data: { ...candidates[0].data, age: 60, nationality: 'Other', university: 'Prestigious', trustScore: 100, aiEmployabilityScore: 100 } };
  assert.equal(shortlistCandidates(project, [protectedVariant]).candidates[0].ruleScore, result.candidates[0].ruleScore);
});

test('profile analysis source is minimized; changed evidence invalidates old analysis but identity updates do not', () => {
  assert.equal(isProductionMember({ isTest: true }), false);
  assert.equal(isProductionMember({}, { isTest: 'true' }), false);
  assert.equal(isProductionMember({ displayName: 'A real user whose name contains test' }), true);
  const data = { skills: ['Research'], careerInterests: ['Market Research'], availableHoursPerWeek: 12, name: 'Private name', email: 'private@example.invalid', university: 'Private University', nationality: 'Private Country', identityDocumentPath: 'private-document', introVideoPath: 'private-video' };
  const source = profileEvidence('student', data);
  assert.ok(!JSON.stringify(source).includes('Private')); assert.ok(!JSON.stringify(source).includes('private-'));
  const user = { record_id: student, data: { role: 'student' } };
  const row = { entity_id: student, assessment_type: 'student_profile_analysis', status: 'completed', prompt_version: PROFILE_ANALYSIS_VERSION, input_hash: evidenceHash(source), result: { strengthSummary: 'Evidence summary' } };
  assert.equal(summarizeMember(user, { data }, [row], []).ai.state, 'current');
  assert.equal(summarizeMember(user, { data: { ...data, name: 'New name' } }, [row], []).ai.state, 'current');
  assert.equal(summarizeMember(user, { data: { ...data, availableHoursPerWeek: 5 } }, [row], []).ai.state, 'stale');
  assert.equal(summarizeMember(user, { data }, [{ ...row, status: 'failed' }, row], []).ai.state, 'failed');
  assert.equal(summarizeMember(user, { data: { ...data, completedProjects: 99 } }, [], []).trackRecord.completedProjects, 0);
});

test('admin workflow is protected, live-source backed, paginated, reloadable and reports dependency failure', async () => {
  const { app, state } = aiFixture(); const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const get = (actor?: string, query = '') => fetch(base + '/api/admin/decision-workspace' + query, { headers: actor ? { 'x-test-actor': actor } : {} });
  const post = (actor: string, body: object) => fetch(base + '/api/gemini/analyze-profile', { method: 'POST', headers: { 'x-test-actor': actor, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await get()).status, 401); assert.equal((await get(student)).status, 403); assert.equal((await get(company)).status, 403);
    assert.equal((await post(student, { role: 'student', profileOwnerId: company })).status, 403);
    assert.equal((await post(admin, { role: 'student', profileOwnerId: 'bad' })).status, 400);
    const initial = await get(admin).then(r => r.json()); assert.equal(initial.members.length, 3); assert.equal(initial.projects.length, 1);
    const research = state.candidates.at(-1)!;
    const file = `/api/admin/member-evidence/${research.record_id}?role=student&kind=resume`;
    assert.equal((await fetch(base + file, { headers: { 'x-test-actor': student } })).status, 403);
    const signed = await fetch(base + file, { headers: { 'x-test-actor': admin } }); assert.equal(signed.status, 200); assert.equal(signed.headers.get('cache-control'), 'private, no-store');
    assert.equal((await signed.json()).expiresIn, 60);
    const researchProfile = state.tables.app_records.find(row => row.collection_name === 'student_profiles' && row.record_id === research.record_id)!;
    researchProfile.data.resumeUrl = `${student}/other-person.pdf`;
    assert.equal((await fetch(base + file, { headers: { 'x-test-actor': admin } })).status, 409);
    const response = await post(admin, { role: 'student', profileOwnerId: student, locale: 'ko' }); assert.equal(response.status, 200);
    assert.ok(state.pendingObserved); const body = await response.json(); assert.ok(body.assessmentId);
    const updated = await get(admin).then(r => r.json()); assert.equal(updated.members.find((m: any) => m.id === student).ai.state, 'current');
    state.tables.app_records.find(row => row.record_id === student && row.collection_name === 'student_profiles')!.data.skills.push('New skill');
    const changed = await get(admin).then(r => r.json()); assert.equal(changed.members.find((m: any) => m.id === student).ai.state, 'stale');
    const match = await get(admin, `?projectId=${projectId}`).then(r => r.json()); assert.equal(match.matching.scanned, 301); assert.equal(match.matching.candidates.length, 1);
    state.failProvider = true; const outage = await post(admin, { role: 'student', profileOwnerId: student }); assert.equal(outage.status, 502); assert.equal((await outage.json()).code, 'AI_GENERATION_FAILED');
    const failed = await get(admin).then(r => r.json()); assert.equal(failed.members.find((m: any) => m.id === student).ai.state, 'failed');
    assert.ok(failed.members.find((m: any) => m.id === student).ai.strength);
    assert.equal(state.tables.konexa_ai_assessments.filter(row => row.status === 'pending').length, 0);
    state.failProvider = false; state.profileChangedDuringAnalysis = true;
    assert.equal((await post(admin, { role: 'student', profileOwnerId: student })).status, 409);
    assert.equal(state.tables.konexa_ai_assessments.filter(row => row.status === 'pending').length, 0);
    for (let index = 0; index < 510; index++) state.tables.app_records.push({ collection_name: 'users', record_id: `extra-${index}`, data: { role: 'student' } });
    const paged = await get(admin).then(r => r.json()); assert.equal(paged.members.length, 513);
    state.failReads = 'konexa_projects'; assert.equal((await get(admin)).status, 503);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
