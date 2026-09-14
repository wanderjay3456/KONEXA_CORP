export type AccountAccessDecision = 'allowed' | 'suspended' | 'incomplete' | 'invalid_role';

export function accountAccessDecision(profile: Record<string, unknown>): AccountAccessDecision {
  if (profile.accountStatus === 'Suspended') return 'suspended';
  if (profile.onboardingStatus === 'pending_google') return 'incomplete';
  if (!['student', 'company', 'admin'].includes(String(profile.role))) return 'invalid_role';
  return 'allowed';
}
