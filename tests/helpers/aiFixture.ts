import express from 'express';
import { registerAiWorkforceRoutes } from '../../src/lib/aiServerBackend';
import { generateWithModelFallback } from '../../src/server/providerResponse';
import { registerAdminDecisionRoutes } from '../../src/server/adminDecisionRoutes';
import { registerProfileAnalysisRoutes } from '../../src/server/profileAnalysisRoutes';

export const student = '10000000-0000-4000-8000-000000000001';
export const company = '10000000-0000-4000-8000-000000000002';
export const other = '10000000-0000-4000-8000-000000000003';
export const admin = '10000000-0000-4000-8000-000000000004';
export const projectId = '20000000-0000-4000-8000-000000000001';
type Row = Record<string, any>;
export function aiFixture(options: { generate?: (request: Row) => Promise<any> } = {}) {
  const state = {
    failProvider: false, malformedFirst: true, pendingObserved: false, calls: 0,
    failReads: '',
    profileChangedDuringAnalysis: false,
    tables: {
      app_records: [
        { collection_name: 'student_profiles', record_id: student, data: { preferredJob: 'Market research', skills: ['Research'], bio: 'Research evidence', careerVision: 'Research career' } },
        { collection_name: 'company_profiles', record_id: company, data: { verified: true, verifiedStatus: 'Verified' } },
      ],
      konexa_projects: [{ id: projectId, company_id: company, title: 'Market research', description: 'Research interviews', tags: ['Research'], requirements: ['Research'], status: 'open', work_type: 'Remote', weekly_pay_krw: 200000, hours_per_week: 10, required_language: 'English' }],
      konexa_ai_assessments: [],
    } as Record<string, Row[]>,
    candidates: Array.from({ length: 301 }, (_, index) => ({ record_id: `30000000-0000-4000-8000-${String(index).padStart(12, '0')}`, data: { skills: index === 300 ? ['Research', 'Market', 'Interviews'] : ['Drawing'], preferredJob: index === 300 ? 'Market research' : 'Design', languages: ['English'], availableHoursPerWeek: 12, preferredWeeklyPayKrw: 100000, workPreference: 'Remote', availability: 'Immediately' } })),
  };
  const research = state.candidates.at(-1)!;
  state.tables.app_records.push(
    { collection_name: 'users', record_id: student, data: { role: 'student', displayName: 'Student account' } },
    { collection_name: 'users', record_id: company, data: { role: 'company', displayName: 'Research company' } },
    { collection_name: 'users', record_id: research.record_id, data: { role: 'student', displayName: 'Research candidate' } },
    { collection_name: 'student_profiles', record_id: research.record_id, data: { ...research.data, name: 'Research candidate', onboardingCompleted: true, resumeUrl: `${research.record_id}/resume.pdf` } },
  );
  class Query {
    predicates: Array<(row: Row) => boolean> = []; action = 'read'; value: Row = {}; columns = '*'; orderKey = ''; asc = true; max = Infinity; start = 0;
    constructor(private table: string) {}
    select(columns = '*') { this.columns = columns; return this; }
    eq(key: string, value: unknown) { this.predicates.push(row => row[key] === value); return this; }
    order(key: string, options?: { ascending: boolean }) { if (!this.orderKey) { this.orderKey = key; this.asc = options?.ascending !== false; } return this; }
    in(key: string, values: unknown[]) { this.predicates.push(row => values.includes(row[key])); return this; }
    range(start: number, end: number) { this.start = start; this.max = end + 1; return this; }
    limit(value: number) { this.max = value; return this; }
    insert(value: Row) { this.action = 'insert'; this.value = value; return this; }
    upsert(value: Row) { this.action = 'upsert'; this.value = value; return this; }
    update(value: Row) { this.action = 'update'; this.value = value; return this; }
    execute(single = false): any {
      if (state.failReads === this.table && this.action === 'read') return { data: null, error: new Error('Simulated database failure') };
      const table = state.tables[this.table] ||= [];
      let rows = table.filter(row => this.predicates.every(predicate => predicate(row)));
      if (this.action === 'insert' || this.action === 'upsert') {
        const existing = this.action === 'upsert' ? table.find(row => row.id === this.value.id) : null;
        if (existing) Object.assign(existing, this.value);
        else table.push({ created_at: new Date().toISOString(), ...this.value });
        rows = [existing || table.at(-1)!];
      } else if (this.action === 'update') rows.forEach(row => Object.assign(row, this.value));
      if (this.orderKey) rows = [...rows].sort((a,b) => (this.asc ? 1 : -1) * String(a[this.orderKey]).localeCompare(String(b[this.orderKey])));
      rows = rows.slice(this.start, this.max).map(row => this.columns === '*' ? structuredClone(row) : Object.fromEntries(this.columns.split(',').map(key => [key, structuredClone(row[key])])));
      return { data: single ? rows[0] || null : rows, error: null, count: rows.length };
    }
    maybeSingle() { return Promise.resolve(this.execute(true)); }
    single() { return Promise.resolve(this.execute(true)); }
    then(resolve: any, reject: any) { return Promise.resolve(this.execute()).then(resolve, reject); }
  }
  const database = { storage: { from: (bucket: string) => ({ createSignedUrl: async (path: string, expires: number) => ({ data: { signedUrl: `https://storage.example.invalid/${bucket}/${path}?expires=${expires}` }, error: null }) }) }, from: (table: string) => new Query(table), rpc: async (name: string, args: Row) => {
    if (name === 'konexa_save_profile_analysis') {
      const row = state.tables.app_records.find(row => row.collection_name === args.p_collection && row.record_id === args.p_user_id);
      if (!row) return { error: new Error('No profile') };
      Object.assign(row.data, args.p_analysis); return { data: null, error: null };
    }
    if (name !== 'konexa_matching_candidate_page') throw new Error(`Unexpected RPC ${name}`);
    return { data: state.candidates.filter(row => row.record_id > args.p_after).slice(0, args.p_limit), error: null };
  }};
  const generate = async (request: Row) => generateWithModelFallback(['first', 'second'], async model => {
    state.calls += 1;
    state.pendingObserved ||= state.tables.konexa_ai_assessments.some(row => row.status === 'pending');
    if (state.failProvider) throw new Error('Simulated provider outage');
    if (state.malformedFirst && model === 'first') return { text: '{}' };
    const input = JSON.parse(request.contents);
    if (input.profileEvidence && state.profileChangedDuringAnalysis) state.tables.app_records.find(row => row.collection_name === 'student_profiles' && row.record_id === student)!.data.skills.push('Changed during analysis');
    let value: unknown;
    if (input.profileEvidence) value = { strengthSummary: 'Declared research skills support an initial project discussion.', weaknessSummary: 'Verify the work sample and weekly availability.', skillGap: ['Research evidence'], recommendedSkills: ['Interviews'], recommendedProjects: ['Research brief'], recommendedCompanies: ['Research teams'], recommendedLearningPath: ['Ask for one research work sample.'], careerReadiness: 50, employabilityScore: 50 };
    else if (input.candidates) value = input.candidates.map((candidate: Row) => ({ id: candidate.id, suitabilityScore: 70, confidence: 60, explanation: 'Research evidence needs human confirmation.', strengths: ['Research'], weaknesses: ['Confirm proficiency'], matchingFactors: ['Research'], skillGaps: [], interviewQuestions: ['Describe a research project.'] }));
    else if (input.resumeEvidence) value = { score: 55, summary: 'Evidence review saved', strengths: ['Research'], issues: ['Add evidence'], recommendedEdits: ['Describe a project'] };
    else value = { summary: 'Saved research roadmap', milestones: [{ title: 'Build evidence', nextAction: 'Write a research brief', evidenceNeeded: 'A work sample' }], skillGaps: ['Interview design'], learningActions: ['Practice interviews'], relevantProjectIds: [projectId] };
    return { text: JSON.stringify(value), usageMetadata: { totalTokenCount: 100 } };
  }, true, request.validateResponse);
  const app = express(); app.use(express.json());
  // TEST SERVER ONLY. Production authentication is never bypassed or changed.
  app.use((req: any, res, next) => {
    const id = req.header('x-test-actor');
    if (![student, company, other, admin].includes(id)) return res.status(401).json({ error: 'Test authentication required' });
    req.user = { uid: id, role: id === admin ? 'admin' : id === company ? 'company' : 'student' }; next();
  });
  const provider = options.generate || generate;
  registerAiWorkforceRoutes(app, provider, () => database as any);
  registerAdminDecisionRoutes(app, () => database as any);
  registerProfileAnalysisRoutes(app, provider as any, () => database as any);
  return { app, state };
}
