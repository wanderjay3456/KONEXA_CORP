import { createHash } from 'node:crypto';
import { classifyRoles, suggestedRemoteCategories, workSampleRubrics } from '../lib/talentTaxonomy';

export const PROFILE_ANALYSIS_VERSION = 'profile-analysis-v5-rules';
type Data = Record<string, any>;
export const words = (value: unknown): string[] => Array.isArray(value) ? value.filter(item => typeof item === 'string').map(item => item.trim().slice(0, 300)).filter(Boolean).slice(0, 40) : [];
export const short = (value: unknown, max = 1000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export const positive = (value: unknown, max = 100_000_000): number | null => ['string', 'number'].includes(typeof value) && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= max ? Number(value) : null;
const prose = (value: unknown) => short(value, 2500).replace(/https?:\/\/\S+|[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[contact removed]');
export const evidenceHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Same minimized source for generation and freshness checks. Personal identity,
// school names, nationality, photos, video and private documents are excluded.
export function profileEvidence(role: 'student' | 'company', p: Data) {
  const skills = words(role === 'student' ? p.skills : p.requiredSkills);
  const roles = words(role === 'student' ? p.careerInterests : p.hiringRoles);
  return role === 'student' ? {
    major: short(p.major), degree: short(p.degree), skills, careerInterests: roles,
    roleFamilies: classifyRoles([...roles, short(p.preferredJob)]), preferredJob: short(p.preferredJob),
    languages: words(p.languages), englishLevel: short(p.englishLevel), koreanLevel: short(p.koreanLevel),
    certificates: words(p.certificates), preferredIndustry: short(p.preferredIndustry),
    availability: short(p.availability), workPreference: short(p.workPreference), timezone: short(p.timezone),
    availableHoursPerWeek: positive(p.availableHoursPerWeek, 80), preferredWeeklyPayKrw: positive(p.preferredWeeklyPayKrw),
    bio: prose(p.bio), evidenceNotice: 'All skills and credentials are self-reported unless separately verified. Uploaded file contents have not been reviewed by this analysis.',
  } : {
    industry: short(p.industry), companySize: short(p.companySize), companyIntroduction: prose(p.companyIntroduction || p.description),
    hiringRoles: roles, roleFamilies: classifyRoles(roles), requiredSkills: skills,
    preferredLanguages: words(p.preferredLanguages), remotePolicy: short(p.remotePolicy),
    employmentTypes: words(p.employmentTypes), evidenceNotice: 'Company statements are self-reported. Financial stability, legality and actual job availability cannot be inferred from this profile.',
  };
}

export function summarizeMember(user: Data, profile: Data, assessments: Data[], projects: Data[], passport: Data[] = [], reviews: Data[] = []) {
  const p = profile.data || {}; const role = user.data.role as 'student' | 'company';
  const evidence = profileEvidence(role, p);
  const missing: string[] = [];
  if (p.onboardingCompleted !== true) missing.push('profile');
  if (!(role === 'student' ? words(p.careerInterests).length || short(p.preferredJob) : words(p.hiringRoles).length)) missing.push('roles');
  if (!(role === 'student' ? words(p.skills) : words(p.requiredSkills)).length) missing.push('skills');
  if (role === 'student') {
    if (!positive(p.availableHoursPerWeek, 80)) missing.push('weekly_hours');
    if (!positive(p.preferredWeeklyPayKrw)) missing.push('weekly_pay');
    if (!short(p.availability)) missing.push('start_date');
    if (!short(p.workPreference)) missing.push('work_mode');
    if (!words(p.languages).length && !short(p.englishLevel) && !short(p.koreanLevel)) missing.push('required_language');
    if (!short(p.resumeUrl)) missing.push('resume');
  } else {
    if (!short(p.companyIntroduction || p.description)) missing.push('scope');
    if (!projects.some(row => row.company_id === user.record_id && row.status === 'open')) missing.push('open_project');
  }
  const relevant = assessments.filter(row => row.entity_id === user.record_id && row.assessment_type === `${role}_profile_analysis`);
  const latest = relevant.find(row => row.status === 'completed');
  const attempt = relevant[0];
  const stale = Boolean(latest && (latest.prompt_version !== PROFILE_ANALYSIS_VERSION || latest.input_hash !== evidenceHash(evidence)));
  return {
    id: user.record_id, role, name: short(role === 'student' ? p.name || user.data.displayName : p.companyName || user.data.displayName, 120),
    status: user.data.accountStatus || 'Active', complete: p.onboardingCompleted === true,
    visible: role === 'company' || p.privacySettings?.publicProfile !== false,
    verification: p.verified === true && p.verifiedStatus === 'Verified' ? 'Verified' : p.verifiedStatus || 'Pending',
    roles: classifyRoles(role === 'student' ? [...words(p.careerInterests), short(p.preferredJob)] : words(p.hiringRoles)),
    declaredRoles: role === 'student' ? words(p.careerInterests).length ? words(p.careerInterests) : [short(p.preferredJob)].filter(Boolean) : words(p.hiringRoles),
    skills: role === 'student' ? words(p.skills) : words(p.requiredSkills),
    languages: [...words(p.languages || p.preferredLanguages), p.englishLevel ? `English: ${short(p.englishLevel)}` : '', p.koreanLevel ? `Korean: ${short(p.koreanLevel)}` : ''].filter(Boolean),
    hours: positive(p.availableHoursPerWeek, 80), weeklyPay: positive(p.preferredWeeklyPayKrw),
    mode: short(p.workPreference || p.remotePolicy), availability: short(p.availability), timezone: short(p.timezone),
    introduction: short(p.bio || p.companyIntroduction || p.description, 1400),
    files: { resume: !!short(p.resumeUrl), portfolio: !!short(p.portfolio || p.github), video: !!short(p.introVideoPath), identity: !!short(p.identityDocumentPath || p.businessRegistrationDocumentPath) },
    trackRecord: { completedProjects: new Set(passport.filter(row => row.student_id === user.record_id && row.evidence_type === 'project_completed').map(row => row.relationship_id)).size,
      approvedMilestones: new Set(passport.filter(row => row.student_id === user.record_id && row.evidence_type === 'milestone_approved').map(row => row.milestone_id).filter(Boolean)).size,
      publishedReviews: reviews.filter(row => row.reviewee_id === user.record_id && row.status === 'published' && row.moderation_status === 'approved').length },
    missing, projectCount: projects.filter(row => row.company_id === user.record_id).length,
    openProjects: projects.filter(row => row.company_id === user.record_id && row.status === 'open').length,
    ai: { state: attempt?.status === 'failed' ? 'failed' : attempt?.status === 'pending' ? 'pending' : !latest ? 'not_analyzed' : stale ? 'stale' : 'current',
      assessmentId: latest?.id || null, model: latest?.model || null, analyzedAt: latest?.created_at || null,
      strength: short(latest?.result?.strengthSummary, 2000), gaps: short(latest?.result?.weaknessSummary, 2000),
      verificationQuestions: words(latest?.result?.verificationQuestions).slice(0, 5),
      evidenceRequests: words(latest?.result?.evidenceRequests).slice(0, 4),
      skillGaps: words(latest?.result?.skillGap) },
    updatedAt: profile.updated_at || user.updated_at || null,
  };
}
export function summarizeProject(p: Data) {
  const missing = [!words(p.tags).length && 'skills', !words(p.requirements).length && 'deliverables', !positive(p.hours_per_week, 80) && 'weekly_hours', !positive(p.weekly_pay_krw) && 'weekly_pay', !short(p.required_language) && 'required_language'].filter(Boolean) as string[];
  return { id: p.id, companyId: p.company_id, title: short(p.title), status: p.status, description: short(p.description, 2000),
    skills: words(p.tags), deliverables: words(p.requirements), roles: classifyRoles([short(p.title), ...words(p.tags)]),
    hours: positive(p.hours_per_week, 80), weeklyPay: positive(p.weekly_pay_krw), mode: short(p.work_type), languages: short(p.required_language), missing };
}

export function reviewProfileEvidence(role: 'student' | 'company', profile: Data, locale = 'en') {
  const e = profileEvidence(role, profile);
  const ko = locale === 'ko';
  const skills = words(role === 'student' ? profile.skills : profile.requiredSkills);
  const checks = role === 'student' ? [skills.length > 0, words(profile.careerInterests).length > 0 || !!short(profile.preferredJob), !!short(profile.bio), !!positive(profile.availableHoursPerWeek, 80), !!positive(profile.preferredWeeklyPayKrw), !!short(profile.workPreference), !!short(profile.availability), words(profile.languages).length > 0] : [skills.length > 0, words(profile.hiringRoles).length > 0, !!short(profile.companyIntroduction || profile.description), words(profile.preferredLanguages).length > 0, !!short(profile.remotePolicy)];
  const categories = [...new Set([...e.roleFamilies, ...suggestedRemoteCategories(skills)])];
  const samples = workSampleRubrics(categories, locale);
  const coverage = Math.round(checks.filter(Boolean).length / checks.length * 100);
  return { status: 'completed' as const, processingMode: 'deterministic', evidenceCoverage: coverage,
    categories, workSamples: samples,
    strengthSummary: ko ? `기재한 역량 ${skills.length}개를 확인했습니다. 실력 검증 결과가 아니라 프로필 정보입니다.` : `${skills.length} declared skills are recorded. This describes supplied information, not verified ability.`,
    weaknessSummary: ko ? `검토 항목 ${checks.length}개 중 ${checks.filter(Boolean).length}개가 기재되어 있습니다. 미기재 조건과 작업 결과를 별도로 확인해야 합니다.` : `${checks.filter(Boolean).length} of ${checks.length} review fields are supplied. Missing conditions and work quality require separate verification.`,
    verificationQuestions: ko ? ['이 역량을 사용한 결과물과 본인의 기여 범위를 보여줄 수 있나요?', '업무 언어, 주당 시간과 시작 가능일을 확인해 주세요.', '검수 기준과 필요한 접근 권한을 구체적으로 합의할 수 있나요?'] : ['Can you show a work sample and identify your own contribution?', 'Confirm working language, weekly hours and start availability.', 'Can you specify acceptance criteria and necessary access?'],
    evidenceRequests: [samples[0]?.task || (ko ? '민감정보를 제거한 직무 관련 작업 샘플' : 'A role-relevant work sample with confidential information removed'), ko ? '범위·결과물·검수 기준을 정리한 업무 설명' : 'A brief defining scope, deliverables and acceptance criteria'],
    skillGap: [], recommendedSkills: [], recommendedProjects: [], recommendedCompanies: [], recommendedLearningPath: [],
    careerReadiness: coverage, employabilityScore: coverage, scoreDefinition: 'Supplied-field coverage only; not ability or employment probability', evidence: e };
}
