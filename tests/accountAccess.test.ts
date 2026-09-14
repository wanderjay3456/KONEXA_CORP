import assert from 'node:assert/strict';
import test from 'node:test';
import { accountAccessDecision } from '../src/server/accountAccess';

test('only established account roles can access APIs', () => {
  for (const role of ['student', 'company', 'admin']) assert.equal(accountAccessDecision({ role }), 'allowed');
  for (const role of ['ai', 'owner', '', undefined]) assert.equal(accountAccessDecision({ role }), 'invalid_role');
});
test('suspension is enforced even for admin and pending accounts', () => {
  for (const role of ['student', 'company', 'admin']) assert.equal(accountAccessDecision({ role, accountStatus: 'Suspended' }), 'suspended');
  assert.equal(accountAccessDecision({ role: 'student', accountStatus: 'Suspended', onboardingStatus: 'pending_google' }), 'suspended');
});
test('unfinished Google onboarding has no business API access', () => {
  assert.equal(accountAccessDecision({ role: 'student', onboardingStatus: 'pending_google' }), 'incomplete');
  assert.equal(accountAccessDecision({ role: 'student', onboardingStatus: 'complete' }), 'allowed');
});
