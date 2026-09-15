import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { EMAIL_TEMPLATES, renderEmail } from '../src/server/email';
import { reviewVisibilityFilter, shouldDeliverAccountEmail } from '../src/server/workflowVisibility';

test('every supported notification has a renderable, escaped email', () => {
  for (const template of EMAIL_TEMPLATES) {
    const message = renderEmail(template, { name: '<script>QA</script>', project: '<img src=x>', status: '<b>unsafe</b>' });
    assert.ok(message.subject.length > 5);
    assert.ok(message.html.includes('https://konexa.co.kr'));
    assert.ok(!message.html.includes('<script>QA</script>'));
    assert.ok(!message.html.includes('<img src=x>'));
    assert.ok(!message.html.includes('<b>unsafe</b>'));
  }
});
test('introduction, review and dispute emails cannot be dropped as unsupported', () => {
  for (const template of ['introduction_requested','review_updated','dispute_action']) assert.ok(EMAIL_TEMPLATES.includes(template as any));
  const server = readFileSync(new URL('../src/server/backendV2.ts',import.meta.url),'utf8');
  assert.match(server,/new Set<EmailTemplate>\(EMAIL_TEMPLATES\)/);
});
test('email preference and suspension are respected before delivery', () => {
  assert.equal(shouldDeliverAccountEmail({}, {}),true);
  assert.equal(shouldDeliverAccountEmail({ notificationPreferences: { email: false } }, {}),false);
  assert.equal(shouldDeliverAccountEmail({ notificationPreferences: { email: true } }, {accountStatus:'Suspended'}),false);
  assert.equal(shouldDeliverAccountEmail({ notificationPreferences: { email: true } }, {accountStatus:'Active'}),true);
});
test('reviewees see only published reviews while authors can see their own', () => {
  const id='10000000-0000-4000-8000-000000000001';
  assert.equal(reviewVisibilityFilter(id),`reviewer_id.eq.${id},and(reviewee_id.eq.${id},status.eq.published)`);
  assert.throws(()=>reviewVisibilityFilter('x,status.neq.sealed'));
});
test('visible goals depend on persisted data and calendar is not hardcoded', () => {
  const source=readFileSync(new URL('../src/components/student/CareerDashboard.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(source,/JULY 2026|toggleGoal|setWeeklyGoals/);
  assert.match(source,/completed: Boolean\(studentProfile\?\.resumeUrl\)/);
  assert.match(source,/hasVerifiedEvidence \? trustScore : '—'/);
});

test('critical navigation reaches live screens instead of prototype workspaces', () => {
  const read = (file: string) => readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');
  const student = read('components/dashboard/StudentDashboard.tsx');
  const company = read('components/dashboard/CompanyDashboard.tsx');
  assert.doesNotMatch(student,/import ProjectWorkspace/);
  assert.match(read('App.tsx'),/activeRole === UserRole.STUDENT && activeTab === "workspace"/);
  assert.match(student,/activeTab === "applications"/);
  assert.match(student,/activeTab === "onboarding"/);
  assert.match(company,/activeTab === "identity"/);
  assert.match(company,/StudentProfileReview studentId=\{selectedStudentId\}/);
});

test('failed applications keep the proposal and AI uses current relational projects', () => {
  const market = readFileSync(new URL('../src/components/student/ProjectMarketplace.tsx',import.meta.url),'utf8');
  assert.match(market,/if \(!saved\) return;\s+setSelected\(null\)/);
  const ai = readFileSync(new URL('../src/lib/aiServerBackend.ts',import.meta.url),'utf8');
  const roadmap = ai.slice(ai.indexOf('app.post("/api/ai/student-roadmap"'));
  assert.match(roadmap,/from\("konexa_projects"\)/);
  assert.doesNotMatch(roadmap,/eq\("collection_name", "projects"\)/);
});

test('AI profile results are merged by a server-only database operation', () => {
  const server=readFileSync(new URL('../src/server/profileAnalysisRoutes.ts',import.meta.url),'utf8');
  assert.match(server,/rpc\('konexa_save_profile_analysis'/);
  const migration=readFileSync(new URL('../supabase/migrations/20260914125550_protect_profile_entitlements.sql',import.meta.url),'utf8');
  assert.match(migration,/from public, anon, authenticated/);
  assert.match(migration,/set data = data \|\| patch/);
});

test('server-created notifications use update, not insert/upsert, to mark read', () => {
  const context=readFileSync(new URL('../src/context/AppContext.tsx',import.meta.url),'utf8');
  const mark=context.slice(context.indexOf('const markNotificationRead ='),context.indexOf('const reviewApplication ='));
  assert.match(mark,/await updateDoc/);
  assert.doesNotMatch(mark,/setDoc\(/);
  assert.match(mark,/setNotifications/);
  assert.match(mark,/return false/);
  const store=readFileSync(new URL('../src/lib/supabaseStore.ts',import.meta.url),'utf8');
  const update=store.slice(store.indexOf('export async function updateDoc'),store.indexOf('export function onSnapshot'));
  assert.match(update,/\.update\(/);
  assert.match(update,/\.single\(\)/);
  assert.doesNotMatch(update,/upsert/);
});
