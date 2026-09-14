import assert from 'node:assert/strict';
import test from 'node:test';
import { persistCompletedProfile } from '../src/lib/profilePersistence';

test('profile completion and review request are written in one database statement', async () => {
  const calls: any[] = [];
  const client = { from: (table: string) => ({ upsert: async (rows: unknown[], options: unknown) => {
    calls.push({ table, rows, options });
    return { error: null };
  } }) };
  await persistCompletedProfile(client as any, 'student', {
    uid: 'owned-qa', name: 'Test talent', identityDocumentPath: 'owned-qa/proof.pdf', onboardingCompleted: true,
  }, 'qa@example.invalid', { userId: 'owned-qa', email: 'qa@example.invalid' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].table, 'app_records');
  assert.deepEqual(calls[0].rows.map((row: any) => row.collection_name), ['student_profiles', 'verification_requests', 'protected_contacts']);
  assert.ok(calls[0].rows.every((row: any) => row.owner_id === 'owned-qa' && row.is_public === false));
  assert.equal(calls[0].rows[1].data.status, 'Pending');
  assert.equal(calls[0].rows[1].data.documentUrl, 'owned-qa/proof.pdf');
});

test('company verification is pending and a rejected transaction is not reported as success', async () => {
  const rejection = new Error('RLS rejected QA transaction');
  const client = { from: () => ({ upsert: async (rows: any[]) => {
    assert.equal(rows.length, 2);
    assert.equal(rows[1].record_id, 'owned-qa-business-registration');
    assert.equal(rows[1].data.status, 'Pending');
    return { error: rejection };
  } }) };
  await assert.rejects(persistCompletedProfile(client as any, 'company', {
    uid: 'owned-qa', companyName: 'QA Company', businessRegistrationDocumentPath: 'owned-qa/business.pdf',
  }, 'qa@example.invalid'), rejection);
});
