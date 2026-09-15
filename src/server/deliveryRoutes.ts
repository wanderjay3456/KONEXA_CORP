import type { Express } from 'express';
import type { AuthenticatedRequest } from './security';
import { getSupabaseAdmin } from './supabaseAdmin';
import { ApiInputError, uuid } from './backendV2Validation';

export function registerDeliveryReadRoutes(app: Express, getDatabase = getSupabaseAdmin) {
  app.get('/api/v2/milestones/:milestoneId/submissions', async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.uid) throw new ApiInputError('Sign in to view delivery records.', 'AUTH_REQUIRED', 401);
      const id = uuid(req.params.milestoneId, 'milestoneId');
      const db = getDatabase();
      const { data: milestone, error } = await db.from('konexa_milestones').select('id,company_id,student_id').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!milestone || (req.user.role !== 'admin' && ![milestone.company_id, milestone.student_id].includes(req.user.uid))) {
        throw new ApiInputError('Delivery record not found.', 'NOT_FOUND', 404);
      }
      const { data, error: failure } = await db.from('konexa_milestone_submissions')
        .select('id,milestone_id,version,notes,storage_paths,created_at,review_feedback,review_decision,reviewed_at')
        .eq('milestone_id', id).order('version', { ascending: false }).limit(100);
      if (failure) throw failure;
      const submissions = await Promise.all((data || []).map(async item => ({
        ...item,
        files: await Promise.all((item.storage_paths || []).map(async (path: string) => {
          // Never sign arbitrary client paths or private identity documents.
          if (!path.startsWith(`${milestone.student_id}/`)) return { name: 'Unavailable file', url: null };
          const signed = await db.storage.from('project-deliverables').createSignedUrl(path, 300, { download: true });
          return { name: path.split('/').at(-1), url: signed.error ? null : signed.data?.signedUrl || null };
        })),
      })));
      res.setHeader('Cache-Control', 'private, no-store');
      res.json({ data: submissions });
    } catch (cause) {
      const known = cause instanceof ApiInputError;
      if (!known) console.error('Delivery records unavailable', { code: (cause as any)?.code || 'DATABASE_ERROR' });
      res.status(known ? cause.statusCode : 503).json({ error: { code: known ? cause.code : 'SERVICE_UNAVAILABLE', message: known ? cause.message : 'Delivery records could not be loaded. Please retry.' } });
    }
  });
}
