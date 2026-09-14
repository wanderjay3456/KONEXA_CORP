export function requireAssessmentText(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`AI assessment is missing ${field}`);
  return value.trim();
}
export function requireAssessmentScore(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) throw new Error(`AI assessment has invalid ${field}`);
  return Math.round(value);
}
