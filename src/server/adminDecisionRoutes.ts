import { getSupabaseAdmin } from './supabaseAdmin';
import { loadCandidatePages, shortlistCandidates, MATCHING_VERSION } from './matching';
import { summarizeMember, summarizeProject } from './decisionSupport';
import type { Express } from 'express';

// Fetch each source explicitly and never let PostgREST's default row cap turn a
// partial population into a misleading "all members" dashboard.
async function pages(query: () => any) {
  const all: any[] = [];
  for (let page = 0; page < 20; page++) {
    const { data, error } = await query().range(page * 500, page * 500 + 499);
    if (error) throw error;
    all.push(...data);
    if (data.length < 500) return all;
  }
  throw new Error('WORKSPACE_REQUIRES_INDEXED_PAGINATION');
}
export function registerAdminDecisionRoutes(app: Express, database = getSupabaseAdmin) {
  app.get('/api/admin/member-evidence/:userId', async (req: any, res) => {
    if (!req.user?.uid) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
    res.setHeader('Cache-Control', 'private, no-store');
    const { userId } = req.params; const role = req.query.role; const kind = req.query.kind;
    if (!/^[0-9a-f-]{36}$/i.test(userId) || !['student', 'company'].includes(role) || !['resume', 'identity', 'video'].includes(kind)) return res.status(400).json({ error: 'Invalid evidence request' });
    if (role === 'company' && kind !== 'identity') return res.status(400).json({ error: 'Unsupported company evidence' });
    try {
      const db = database();
      const { data, error } = await db.from('app_records').select('data').eq('collection_name', `${role}_profiles`).eq('record_id', userId).maybeSingle();
      if (error) throw error;
      const field = kind === 'resume' ? 'resumeUrl' : kind === 'video' ? 'introVideoPath' : role === 'company' ? 'businessRegistrationDocumentPath' : 'identityDocumentPath';
      const bucket = kind === 'resume' ? 'resumes' : kind === 'video' ? 'student-intro-videos' : role === 'company' ? 'business-documents' : 'identity-documents';
      const path = data?.data?.[field];
      if (!path) return res.status(404).json({ error: 'No file is registered' });
      // A stored reference never grants access to someone else's storage object.
      if (typeof path !== 'string' || !path.startsWith(`${userId}/`) || path.includes('\\') || path.includes('%') || path.split('/').includes('..')) return res.status(409).json({ error: 'Invalid or legacy file reference. Request a new upload.' });
      const signed = await db.storage.from(bucket).createSignedUrl(path, 60);
      if (signed.error || !signed.data?.signedUrl) throw signed.error || new Error('Signing failed');
      res.json({ url: signed.data.signedUrl, expiresIn: 60 });
    } catch {
      res.status(503).json({ error: 'Evidence file could not be opened. Verify storage and retry.' });
    }
  });
  app.get('/api/admin/decision-workspace', async (req: any, res) => {
    // Defense in depth; production also applies authenticated admin middleware.
    if (!req.user?.uid) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
    res.setHeader('Cache-Control', 'private, no-store');
    try {
      const db = database();
      const [users, profiles, companies, projects, assessments, passport, reviews] = await Promise.all([
        pages(() => db.from('app_records').select('record_id,data,updated_at').eq('collection_name', 'users').order('record_id')),
        pages(() => db.from('app_records').select('record_id,data,updated_at').eq('collection_name', 'student_profiles').order('record_id')),
        pages(() => db.from('app_records').select('record_id,data,updated_at').eq('collection_name', 'company_profiles').order('record_id')),
        pages(() => db.from('konexa_projects').select('*').order('id')),
        pages(() => db.from('konexa_ai_assessments').select('id,entity_id,assessment_type,status,created_at,model,prompt_version,input_hash,result').in('assessment_type', ['student_profile_analysis', 'company_profile_analysis']).order('created_at', { ascending: false }).order('id')),
        pages(() => db.from('konexa_work_passport_entries').select('id,student_id,relationship_id,milestone_id,evidence_type').order('id')),
        pages(() => db.from('konexa_reviews').select('id,reviewee_id,status,moderation_status').eq('status', 'published').eq('moderation_status', 'approved').order('id')),
      ]);
      const profileMap = new Map<string, any>([...profiles.map(row => [`${row.record_id}:student`, row] as const), ...companies.map(row => [`${row.record_id}:company`, row] as const)]);
      const members = users.filter(row => ['student', 'company'].includes(row.data?.role) && row.data?.isTest !== true).flatMap(user => {
        const profile = profileMap.get(`${user.record_id}:${user.data.role}`) || { data: {}, record_id: user.record_id };
        if (profile.data?.isTest === true) return [];
        return [summarizeMember(user, profile, assessments, projects, passport, reviews)];
      });
      const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : '';
      let matching: any = null;
      if (projectId) {
        if (!/^[0-9a-f-]{36}$/i.test(projectId)) return res.status(400).json({ error: 'Invalid project id' });
        const project = projects.find(row => row.id === projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.status !== 'open') return res.status(409).json({ error: 'Select an open project' });
        const candidates = await loadCandidatePages(async (after, limit) => {
          const { data, error } = await db.rpc('konexa_matching_candidate_page', { p_after: after, p_limit: limit });
          if (error) throw error; return data || [];
        });
        matching = { projectId, ...shortlistCandidates(project, candidates, 30) };
      }
      res.json({ members, projects: projects.map(summarizeProject), matching, generatedAt: new Date().toISOString(), rankingVersion: MATCHING_VERSION,
        source: { profiles: 'app_records', projects: 'konexa_projects', analysis: 'konexa_ai_assessments' } });
    } catch (error) {
      console.error('[KONEXA] Decision workspace unavailable', error instanceof Error ? error.message : 'database error');
      res.status(503).json({ error: 'Live analysis data could not be loaded. Retry without changing member data.' });
    }
  });
}
