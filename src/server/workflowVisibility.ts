import { UUID_PATTERN } from './backendV2Validation';

export function reviewVisibilityFilter(userId: string) {
  if (!UUID_PATTERN.test(userId)) throw new Error('Invalid authenticated user identifier');
  // Reviewees must never see a sealed review before mutual moderation/publication.
  return `reviewer_id.eq.${userId},and(reviewee_id.eq.${userId},status.eq.published)`;
}

export function shouldDeliverAccountEmail(profile: Record<string, any>, user: Record<string, any>) {
  return profile.notificationPreferences?.email !== false && user.accountStatus !== 'Suspended';
}
