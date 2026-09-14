const EMPTY = /^(?:null|undefined|none|n\/?a|not available|unknown|-)$/i;
function evidenceText(value: unknown, limit: number) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  return EMPTY.test(text) ? '' : text.slice(0, limit);
}
export function normalizePdfEvidence(parsed: any) {
  const strings = (key: string) => Array.isArray(parsed?.[key])
    ? parsed[key].map((item: unknown) => evidenceText(item, 500)).filter(Boolean).slice(0, 30) as string[] : [];
  const extractedSkills = strings('extractedSkills');
  const experienceSummary = evidenceText(parsed?.experienceSummary, 4000);
  const education = evidenceText(parsed?.education, 2000);
  const portfolioLinks = strings('portfolioLinks').filter(url => { try { return new URL(url).protocol === 'https:'; } catch { return false; } });
  if (!extractedSkills.length && !experienceSummary && !education && !portfolioLinks.length) throw new Error('NO_RESUME_EVIDENCE');
  const recommendation = evidenceText(parsed?.recommendation, 4000);
  if (!recommendation || !Array.isArray(parsed?.extractedSkills)) throw new Error('INVALID_PDF_ANALYSIS');
  return { extractedSkills, experienceSummary, education, portfolioLinks, recommendation };
}
