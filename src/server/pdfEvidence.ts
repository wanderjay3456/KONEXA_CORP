import { PDFParse } from 'pdf-parse';
import { classifyRoles, extractDeclaredSkills, suggestedRemoteCategories, workSampleRubrics } from '../lib/talentTaxonomy';
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

export function classifyResumeText(text: string, locale = 'en') {
  if (text.trim().length < 40) throw new Error('NO_RESUME_EVIDENCE');
  const evidence = extractDeclaredSkills(text);
  const declaredRoles = classifyRoles(text.split('\n').filter(line => !/(?:no experience|learning|경험\s*없|학습\s*중)/i.test(line)));
  const skills = evidence.map(item => item.skill);
  const links = [...new Set(text.match(/https:\/\/[^\s<>]+/g) || [])].slice(0, 15);
  return { extractedSkills: skills, experienceSummary: '', education: '', portfolioLinks: links,
    recommendation: locale === 'ko' ? '텍스트에서 확인한 자기 기재 역량입니다. 직무 분류와 역량을 직접 확인한 뒤 프로필에 반영하세요. 경력 연수나 실력은 추정하지 않았습니다.' : 'These are self-reported skills found in document text. Confirm the categories and skills before updating your profile. Years of experience and proficiency have not been inferred.',
    categories: declaredRoles, suggestedCategories: suggestedRemoteCategories(skills), workSamples: workSampleRubrics([...new Set([...declaredRoles, ...suggestedRemoteCategories(skills)])], locale), skillEvidence: evidence, processingMode: 'deterministic', verificationState: 'self_reported',
    extractionCoverage: { recognisedSkills: skills.length, charactersRead: text.length, requiresHumanReview: true }, model: 'resume-text-v1' };
}
export async function extractPdfEvidence(bytes: Uint8Array, locale = 'en') {
  const parser = new PDFParse({ data: bytes });
  try {
    const info = await parser.getInfo();
    if (info.total > 40) throw new Error('PDF_PAGE_LIMIT');
    const result = await parser.getText();
    return classifyResumeText(result.text.slice(0, 60000), locale);
  } finally { await parser.destroy(); }
}
