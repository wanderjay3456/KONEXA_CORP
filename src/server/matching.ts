// Rule-based shortlist, not a hiring prediction. Unknown facts require review;
// protected characteristics and university prestige never contribute to ranking.
type RecordData = Record<string, any>;
export const MATCHING_VERSION = 'talent-matching-v3';
export const CANDIDATE_PAGE_SIZE = 250;
const text = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 600) : '';
const strings = (value: unknown, max = 30): string[] => Array.isArray(value) ? value.filter(item => typeof item === 'string').map(item => text(item)).filter(Boolean).slice(0, max) : [];
const numeric = (value: unknown, max: number): number | null => {
  if (value === null || value === undefined || value === '' || !['number', 'string'].includes(typeof value)) return null;
  const n = Number(value); return Number.isFinite(n) && n > 0 && n <= max ? n : null;
};
const tokens = (value: string) => new Set(value.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}+#.]+/gu)?.filter(item => item.length > 1 && !['and','the','with','for','our','you','work','experience'].includes(item)) || []);
const languages = (value: string) => {
  const patterns = { en: /english|영어|tiếng anh/i, ko: /korean|한국어|tiếng hàn/i, vi: /vietnamese|베트남어|tiếng việt/i, ja: /japanese|일본어/i, zh: /chinese|중국어|mandarin/i };
  return Object.entries(patterns).filter(([, pattern]) => pattern.test(value)).map(([key]) => key);
};

export function anonymizeCandidate(row: { record_id: string; data: RecordData }) {
  const d = row.data || {};
  return {
    id: row.record_id, major: text(d.major || d.degree), skills: strings(d.skills), languages: strings(d.languages, 15),
    englishLevel: text(d.englishLevel), koreanLevel: text(d.koreanLevel),
    preferredJob: text(d.preferredJob), careerInterests: strings(d.careerInterests),
    preferredIndustry: text(d.preferredIndustry), availability: text(d.availability),
    workPreference: text(d.workPreference), timezone: text(d.timezone),
    preferredWeeklyPayKrw: numeric(d.preferredWeeklyPayKrw, 100_000_000),
    availableHoursPerWeek: numeric(d.availableHoursPerWeek, 80),
    completedProjects: Math.max(0, Math.floor(Number(d.completedProjects) || 0)),
    // These are prior advisory scores, never used in the rule-based ranking.
    trustScore: Math.max(0, Math.min(100, Number(d.trustScore) || 0)),
    careerReadiness: Math.max(0, Math.min(100, Number(d.aiCareerReadiness) || 0)),
    employabilityScore: Math.max(0, Math.min(100, Number(d.aiEmployabilityScore) || 0)),
  };
}

export function shortlistCandidates(project: RecordData, rows: Array<{ record_id: string; data: RecordData }>, limit = 20) {
  const demand = tokens([project.title, ...(project.tags || []), ...(project.requirements || [])].join(' '));
  const requiredLanguages = languages(text(project.required_language));
  const anyLanguage = /\bor\b|또는|hoặc/i.test(text(project.required_language));
  let excluded = 0;
  const seen = new Set<string>();
  const ranked = rows.flatMap(row => {
    if (seen.has(row.record_id)) return [];
    seen.add(row.record_id);
    const candidate = anonymizeCandidate(row);
    const missingEvidence: string[] = [];
    const conflicts: string[] = [];
    const budget = numeric(project.weekly_pay_krw, 100_000_000);
    const hours = numeric(project.hours_per_week, 80);
    if (budget && candidate.preferredWeeklyPayKrw && candidate.preferredWeeklyPayKrw > budget) conflicts.push('weekly_pay');
    if (hours && candidate.availableHoursPerWeek && candidate.availableHoursPerWeek < hours) conflicts.push('weekly_hours');
    if (!candidate.availableHoursPerWeek) missingEvidence.push('weekly_hours');
    if (!candidate.preferredWeeklyPayKrw) missingEvidence.push('weekly_pay');
    const mode = text(project.work_type).toLowerCase();
    const preference = candidate.workPreference.toLowerCase();
    if ((mode === 'onsite' || mode === 'hybrid') && preference === 'remote') conflicts.push('work_mode');
    if (!candidate.workPreference) missingEvidence.push('work_mode');
    const spoken = new Set(languages(candidate.languages.join(' ')));
    if (candidate.englishLevel && !/^none|^not|없음/i.test(candidate.englishLevel)) spoken.add('en');
    if (candidate.koreanLevel && !/^none|^not|없음/i.test(candidate.koreanLevel)) spoken.add('ko');
    if (requiredLanguages.length) {
      // Absence from a profile is not proof the person cannot speak a language.
      const matches = requiredLanguages.filter(lang => spoken.has(lang));
      if (anyLanguage ? matches.length === 0 : matches.length < requiredLanguages.length) missingEvidence.push('required_language');
      missingEvidence.push('language_proficiency_confirmation');
    }
    if (!candidate.availability) missingEvidence.push('start_date');
    if (!candidate.skills.length) missingEvidence.push('skills');
    if (conflicts.length) { excluded += 1; return []; }
    const evidence = tokens([...candidate.skills, ...candidate.careerInterests, candidate.preferredJob, candidate.preferredIndustry].join(' '));
    const covered = [...demand].filter(word => evidence.has(word));
    const ruleScore = demand.size ? Math.round(100 * covered.length / demand.size) : 0;
    return [{ ...candidate, ruleScore, matchedTerms: covered.slice(0, 20), missingEvidence: [...new Set(missingEvidence)], requiresHumanReview: true }];
  }).sort((a, b) => b.ruleScore - a.ruleScore || a.missingEvidence.length - b.missingEvidence.length || a.id.localeCompare(b.id));
  return { candidates: ranked.slice(0, Math.max(1, Math.min(limit, 30))), scanned: seen.size, eligible: ranked.length, excluded, rankingVersion: MATCHING_VERSION };
}

export async function loadCandidatePages(load: (after: string, limit: number) => Promise<Array<{record_id: string; data: RecordData}>>) {
  const rows: Array<{record_id: string; data: RecordData}> = [];
  let after = '';
  for (let page = 0; page < 40; page += 1) {
    const batch = await load(after, CANDIDATE_PAGE_SIZE);
    if (!Array.isArray(batch) || batch.some(row => row.record_id <= after)) throw new Error('Invalid candidate pagination');
    rows.push(...batch);
    if (batch.length < CANDIDATE_PAGE_SIZE) return rows;
    after = batch.at(-1)!.record_id;
  }
  // Never silently claim to have ranked the whole pool after truncation.
  throw new Error('CANDIDATE_POOL_REQUIRES_INDEXED_SEARCH');
}
