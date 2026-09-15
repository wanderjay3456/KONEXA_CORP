export function requireAssessmentText(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`AI assessment is missing ${field}`);
  return value.trim();
}
export function requireAssessmentScore(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) throw new Error(`AI assessment has invalid ${field}`);
  return Math.round(value);
}

export function validateRoadmap(value: any) {
  requireAssessmentText(value?.summary, 'summary');
  if (!Array.isArray(value?.milestones) || !value.milestones.length) throw new Error('AI roadmap has no milestones');
  for (const item of value.milestones) {
    requireAssessmentText(item?.title, 'milestone title');
    requireAssessmentText(item?.nextAction, 'next action');
  }
}

export function validateResumeReview(value: any) {
  requireAssessmentText(value?.summary, 'summary');
  requireAssessmentScore(value?.score, 'score');
  for (const field of ['strengths', 'issues', 'recommendedEdits']) {
    if (!Array.isArray(value[field]) || value[field].some((item: unknown) => typeof item !== 'string')) throw new Error(`Invalid ${field}`);
  }
}

export function validateMatchResponse(value: any, candidateIds: Set<string>) {
  if (!Array.isArray(value) || value.length !== candidateIds.size) throw new Error('Incomplete matching response');
  const seen = new Set<string>();
  for (const item of value) {
    if (!candidateIds.has(item?.id) || seen.has(item.id)) throw new Error('Unknown or duplicate matching candidate');
    seen.add(item.id);
    requireAssessmentText(item.explanation, 'explanation');
    requireAssessmentScore(item.suitabilityScore, 'suitabilityScore');
    requireAssessmentScore(item.confidence, 'confidence');
  }
}
