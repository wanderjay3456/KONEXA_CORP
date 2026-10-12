// Rule-based shortlist, not a hiring prediction. Unknown facts require review;
// protected characteristics and university prestige never contribute to ranking.
import { classifyRoles, skillIsDeclared } from '../lib/talentTaxonomy';
type RecordData = Record<string, any>;
export const MATCHING_VERSION = 'talent-matching-v5-rules';
export const MATCHING_RUBRIC = { skillCoverage: 70, roleAlignment: 10, declaredConditions: 20 } as const;
export type Criterion = {
    key: string;
    required: string;
    declared: string;
    status: 'declared' | 'unknown' | 'conflict';
};
export const CANDIDATE_PAGE_SIZE = 250;
const text = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 600) : '';
const strings = (value: unknown, max = 30): string[] => Array.isArray(value) ? value.filter(item => typeof item === 'string').map(item => text(item)).filter(Boolean).slice(0, max) : [];
const numeric = (value: unknown, max: number): number | null => {
    if (value === null || value === undefined || value === '' || !['number', 'string'].includes(typeof value))
        return null;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 && n <= max ? n : null;
};
const tokens = (value: string) => new Set(value.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}+#.]+/gu)?.filter(item => item.length > 1 && !['and', 'the', 'with', 'for', 'our', 'you', 'work', 'experience'].includes(item)) || []);
const languages = (value: string) => {
    const patterns = { en: /english|영어|tiếng anh/i, ko: /korean|한국어|tiếng hàn/i, ja: /japanese|일본어|tiếng nhật/i, zh: /chinese|중국어|mandarin|tiếng trung/i, fr: /french|프랑스어|tiếng pháp/i, de: /german|독일어|tiếng đức/i, es: /spanish|스페인어|tiếng tây ban nha/i, th: /thai|태국어|tiếng thái/i, id: /indonesian|인도네시아어|tiếng indonesia/i };
    return Object.entries(patterns).filter(([, pattern]) => pattern.test(value)).map(([key]) => key);
};
function languageLevel(value: string): number | null {
    if (/fluent|native|c2|원어민|유창|thành thạo/i.test(value))
        return 5;
    if (/advanced|c1|고급|nâng cao/i.test(value))
        return 4;
    if (/upper.intermediate|b2|중상급/i.test(value))
        return 3;
    if (/intermediate|b1|중급|trung cấp/i.test(value))
        return 2;
    if (/beginner|a1|a2|초급|sơ cấp/i.test(value))
        return 1;
    if (/^none$|^없음$|không biết/i.test(value.trim()))
        return 0;
    return null;
}
export function anonymizeCandidate(row: {
    record_id: string;
    data: RecordData;
}) {
    const d = row.data || {};
    return {
        id: row.record_id, major: text(d.major || d.degree), skills: strings(d.skills), languages: strings(d.languages, 15),
        englishLevel: text(d.englishLevel), koreanLevel: text(d.koreanLevel),
        preferredJob: text(d.preferredJob), careerInterests: strings(d.careerInterests),
        preferredIndustry: text(d.preferredIndustry), availability: text(d.availability),
        workPreference: text(d.workPreference), timezone: text(d.timezone),
        preferredWeeklyPayKrw: numeric(d.preferredWeeklyPayKrw, 100000000),
        availableHoursPerWeek: numeric(d.availableHoursPerWeek, 80),
        completedProjects: Math.max(0, Math.floor(Number(d.completedProjects) || 0)),
        // These are prior advisory scores, never used in the rule-based ranking.
        trustScore: Math.max(0, Math.min(100, Number(d.trustScore) || 0)),
        careerReadiness: Math.max(0, Math.min(100, Number(d.aiCareerReadiness) || 0)),
        employabilityScore: Math.max(0, Math.min(100, Number(d.aiEmployabilityScore) || 0)),
    };
}
export function matchingEvidence(project: RecordData, rows: Array<{
    record_id: string;
    data: RecordData;
}>) {
    return { project: { id: project.id, title: project.title, description: project.description, tags: project.tags, requirements: project.requirements, weekly_pay_krw: project.weekly_pay_krw, hours_per_week: project.hours_per_week, work_type: project.work_type, required_language: project.required_language },
        candidates: rows.map(row => { const { trustScore, completedProjects, careerReadiness, employabilityScore, ...evidence } = anonymizeCandidate(row); return evidence; }).sort((a, b) => a.id.localeCompare(b.id)) };
}
export function shortlistCandidates(project: RecordData, rows: Array<{
    record_id: string;
    data: RecordData;
}>, limit = 20) {
    const requiredSkills = strings(project.tags);
    const projectRoles = classifyRoles([text(project.title), text(project.description), ...requiredSkills]);
    const demand = tokens([project.title, ...(project.tags || []), ...(project.requirements || [])].join(' '));
    const requiredLanguages = languages(text(project.required_language));
    const anyLanguage = /\bor\b|또는|hoặc/i.test(text(project.required_language));
    let excluded = 0;
    let insufficientEvidence = 0;
    const exclusions: Array<{
        id: string;
        reasons: string[];
    }> = [];
    const seen = new Set<string>();
    const ranked = rows.flatMap(row => {
        if (seen.has(row.record_id))
            return [];
        seen.add(row.record_id);
        const candidate = anonymizeCandidate(row);
        const missingEvidence: string[] = [];
        const conflicts: string[] = [];
        const criteria: Criterion[] = [];
        const budget = numeric(project.weekly_pay_krw, 100000000);
        const hours = numeric(project.hours_per_week, 80);
        if (budget && candidate.preferredWeeklyPayKrw && candidate.preferredWeeklyPayKrw > budget)
            conflicts.push('weekly_pay');
        if (hours && candidate.availableHoursPerWeek && candidate.availableHoursPerWeek < hours)
            conflicts.push('weekly_hours');
        if (!candidate.availableHoursPerWeek)
            missingEvidence.push('weekly_hours');
        if (!candidate.preferredWeeklyPayKrw)
            missingEvidence.push('weekly_pay');
        if (budget)
            criteria.push({ key: 'weekly_pay', required: String(budget), declared: candidate.preferredWeeklyPayKrw ? String(candidate.preferredWeeklyPayKrw) : '', status: !candidate.preferredWeeklyPayKrw ? 'unknown' : candidate.preferredWeeklyPayKrw > budget ? 'conflict' : 'declared' });
        if (hours)
            criteria.push({ key: 'weekly_hours', required: String(hours), declared: candidate.availableHoursPerWeek ? String(candidate.availableHoursPerWeek) : '', status: !candidate.availableHoursPerWeek ? 'unknown' : candidate.availableHoursPerWeek < hours ? 'conflict' : 'declared' });
        const mode = text(project.work_type).toLowerCase();
        const preference = candidate.workPreference.toLowerCase();
        if ((mode === 'onsite' || mode === 'hybrid') && preference === 'remote')
            conflicts.push('work_mode');
        if (mode === 'remote' && preference === 'onsite') conflicts.push('work_mode');
        if (!candidate.workPreference)
            missingEvidence.push('work_mode');
        if (mode)
            criteria.push({ key: 'work_mode', required: mode, declared: preference, status: !preference ? 'unknown' : conflicts.includes('work_mode') ? 'conflict' : 'declared' });
        const spoken = new Set(languages(candidate.languages.join(' ')));
        if (candidate.englishLevel && !/^none|^not|없음/i.test(candidate.englishLevel))
            spoken.add('en');
        if (candidate.koreanLevel && !/^none|^not|없음/i.test(candidate.koreanLevel))
            spoken.add('ko');
        if (requiredLanguages.length) {
            // Absence from a profile is not proof the person cannot speak a language.
            const matches = requiredLanguages.filter(lang => spoken.has(lang));
            if (anyLanguage ? matches.length === 0 : matches.length < requiredLanguages.length)
                missingEvidence.push('required_language');
            missingEvidence.push('language_proficiency_confirmation');
            const minimum = requiredLanguages.length === 1 ? languageLevel(text(project.required_language)) : null;
            const declaredLevel = requiredLanguages[0] === 'en' ? languageLevel(candidate.englishLevel) : requiredLanguages[0] === 'ko' ? languageLevel(candidate.koreanLevel) : null;
            const languageConflict = minimum !== null && declaredLevel !== null && declaredLevel < minimum;
            if (languageConflict)
                conflicts.push('required_language');
            criteria.push({ key: 'required_language', required: text(project.required_language), declared: [...candidate.languages, candidate.englishLevel ? `English: ${candidate.englishLevel}` : '', candidate.koreanLevel ? `Korean: ${candidate.koreanLevel}` : ''].filter(Boolean).join(', '), status: languageConflict ? 'conflict' : (anyLanguage ? matches.length > 0 : matches.length === requiredLanguages.length) && (minimum === null || declaredLevel !== null) ? 'declared' : 'unknown' });
        }
        if (!candidate.availability)
            missingEvidence.push('start_date');
        if (!candidate.skills.length)
            missingEvidence.push('skills');
        if (conflicts.length) {
            excluded += 1;
            exclusions.push({ id: candidate.id, reasons: conflicts });
            return [];
        }
        const evidence = tokens([...candidate.skills, ...candidate.careerInterests, candidate.preferredJob, candidate.preferredIndustry].join(' '));
        const covered = [...demand].filter(word => evidence.has(word));
        const roleFamilies = classifyRoles([...candidate.careerInterests, candidate.preferredJob]);
        const matchedRoles = roleFamilies.filter(role => projectRoles.includes(role));
        const matchedSkills = requiredSkills.filter(skill => skillIsDeclared(skill, candidate.skills));
        const missingSkills = requiredSkills.filter(skill => !matchedSkills.includes(skill));
        for (const skill of requiredSkills)
            criteria.push({ key: 'skill', required: skill, declared: matchedSkills.includes(skill) ? candidate.skills.filter(item => skillIsDeclared(skill, [item])).join(', ') : '', status: matchedSkills.includes(skill) ? 'declared' : 'unknown' });
        if (missingSkills.length)
            missingEvidence.push('required_skills');
        if (!projectRoles.length && !requiredSkills.length)
            missingEvidence.push('project_requirements');
        // Interest in a role is not proof of ability. Missing skills are a review
        // question, not an invented disqualification. Do not fill an AI shortlist
        // with unrelated profiles just to hit a fixed candidate count.
        const relevant = matchedSkills.length > 0 || matchedRoles.length > 0;
        if (demand.size && !relevant) {
            insufficientEvidence++;
            exclusions.push({ id: candidate.id, reasons: ['no_relevant_evidence'] });
            return [];
        }
        const skillCoverage = requiredSkills.length ? Math.round(100 * matchedSkills.length / requiredSkills.length) : null;
        const conditions = criteria.filter(item => item.key !== 'skill');
        const conditionCoverage = conditions.length ? conditions.filter(item => item.status === 'declared').length / conditions.length : 0;
        const contributions = { skillCoverage: (skillCoverage ?? 0) / 100 * MATCHING_RUBRIC.skillCoverage, roleAlignment: matchedRoles.length ? MATCHING_RUBRIC.roleAlignment : 0, declaredConditions: Math.round(conditionCoverage * MATCHING_RUBRIC.declaredConditions * 100) / 100 };
        const ruleScore = Math.round(Object.values(contributions).reduce((sum,value)=>sum+value,0));
        const evidenceCoverage = criteria.length ? Math.round(100 * criteria.filter(item=>item.status==='declared').length / criteria.length) : 0;
        return [{ ...candidate, ruleScore, skillCoverage, evidenceCoverage, scoreBreakdown: contributions, scoreDefinition: 'Declared requirement coverage, not verified performance or hiring probability', verificationState: 'self_reported', roleFamilies, matchedRoles, matchedSkills, missingSkills, criteria, matchedTerms: covered.slice(0, 20), missingEvidence: [...new Set(missingEvidence)], requiresHumanReview: true }];
    }).sort((a, b) => b.ruleScore - a.ruleScore || a.missingEvidence.length - b.missingEvidence.length || a.id.localeCompare(b.id));
    return { candidates: ranked.slice(0, Math.max(1, Math.min(limit, 30))), scanned: seen.size, eligible: ranked.length, excluded, insufficientEvidence, exclusions, projectRoles, rankingVersion: MATCHING_VERSION };
}

/** Explanations are assembled from the same scored facts, never invented by a model. */
export function explainRuleMatch(candidate: ReturnType<typeof shortlistCandidates>['candidates'][number], locale = 'en') {
    const ko = locale === 'ko';
    const missing = candidate.missingEvidence;
    const skillGaps = candidate.missingSkills.map(skill=>({skill,severity:'High' as const,advice:ko ? `${skill}을 사용한 결과물이나 실무 과제를 확인하세요.` : `Request a work sample or task demonstrating ${skill}.`}));
    return { ...candidate, suitabilityScore:candidate.ruleScore, confidence:candidate.evidenceCoverage,
        matchingFactors:candidate.criteria.filter(item=>item.status==='declared').map(item=>`${item.required}: ${item.declared}`),
        explanation:ko ? `입력된 요구 기술 ${candidate.matchedSkills.length}개가 일치합니다. ${missing.length}개 확인 항목이 남아 있으며, 이 점수는 입력 정보의 일치도이지 역량 인증이나 채용 확률이 아닙니다.` : `${candidate.matchedSkills.length} declared required skills match. ${missing.length} evidence checks remain; the score measures declared alignment, not verified ability or hiring probability.`,
        strengths:candidate.matchedSkills.map(skill=>ko?`입력된 기술: ${skill}`:`Declared skill: ${skill}`),
        weaknesses:missing.map(key=>ko?`추가 확인: ${key}`:`Further evidence required: ${key}`),skillGaps,
        interviewQuestions:[...candidate.missingSkills.map(skill=>ko?`${skill}을 사용한 작업에서 본인의 역할과 결과물을 설명해 주세요.`:`Describe your contribution and deliverable in work using ${skill}.`),...candidate.criteria.filter(item=>item.status==='unknown').map(item=>ko?`${item.required} 조건을 충족하는 근거를 확인할 수 있나요?`:`What evidence confirms that you meet ${item.required}?`)].slice(0,8),
    };
}

/** Ground truth must be supplied by human reviewers. No labels means no claimed accuracy. */
export function evaluateMatchingBenchmark(cases: Array<{project:RecordData; candidates:Array<{record_id:string;data:RecordData}>; relevance:Record<string,number>}>, k=5) {
    if(!Number.isInteger(k)||k<1||k>30||cases.length>200) throw new Error('Invalid benchmark size');
    if(!cases.length) return {status:'needs_labeled_cases',queries:0,precisionAtK:null,recallAtK:null,ndcgAtK:null};
    if(!Number.isInteger(k)||k<1||k>30||cases.length>200) throw new Error('Invalid benchmark size');
    const results=cases.map(item=>{
        if(Object.values(item.relevance).some(grade=>!Number.isInteger(grade)||grade<0||grade>3)) throw new Error('Relevance grades must be 0-3');
        const unique=[...new Set(item.candidates.map(row=>row.record_id))];
        if(unique.length!==item.candidates.length || Object.keys(item.relevance).some(id=>!unique.includes(id))) throw new Error('Candidate IDs and relevance labels must correspond uniquely');
        if(unique.some(id=>item.relevance[id]===undefined)) throw new Error('Every candidate needs an explicit human relevance label');
        const ranked=shortlistCandidates(item.project,item.candidates,k).candidates;
        const relevant=unique.filter(id=>item.relevance[id]>0).length;
        const hits=ranked.filter(row=>item.relevance[row.id]>0).length;
        const gain=(grade:number,index:number)=>(2**grade-1)/Math.log2(index+2);
        const ideal=unique.map(id=>item.relevance[id]).sort((a,b)=>b-a).slice(0,k).reduce((sum,grade,index)=>sum+gain(grade,index),0);
        return {precision:hits/k,recall:relevant?hits/relevant:null,ndcg:ideal?ranked.reduce((sum,row,index)=>sum+gain(item.relevance[row.id],index),0)/ideal:null};
    });
    const mean=(key:'precision'|'recall'|'ndcg')=>{const values=results.map(row=>row[key]).filter((value):value is number=>value!==null);return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;};
    return {status:'evaluated',queries:cases.length,k,precisionAtK:mean('precision'),recallAtK:mean('recall'),ndcgAtK:mean('ndcg'),notice:'Benchmark labels are external ground truth; these metrics are not hiring success rates.'};
}
export async function loadCandidatePages(load: (after: string, limit: number) => Promise<Array<{
    record_id: string;
    data: RecordData;
}>>) {
    const rows: Array<{
        record_id: string;
        data: RecordData;
    }> = [];
    let after = '';
    for (let page = 0; page < 40; page += 1) {
        const batch = await load(after, CANDIDATE_PAGE_SIZE);
        if (!Array.isArray(batch) || batch.some(row => row.record_id <= after))
            throw new Error('Invalid candidate pagination');
        rows.push(...batch);
        if (batch.length < CANDIDATE_PAGE_SIZE)
            return rows;
        after = batch.at(-1)!.record_id;
    }
    // Never silently claim to have ranked the whole pool after truncation.
    throw new Error('CANDIDATE_POOL_REQUIRES_INDEXED_SEARCH');
}
