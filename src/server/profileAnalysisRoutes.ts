import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import { getSupabaseAdmin } from './supabaseAdmin';
import { evidenceHash, profileEvidence, PROFILE_ANALYSIS_VERSION, reviewProfileEvidence, short, words } from './decisionSupport';
import { requireAssessmentScore, requireAssessmentText } from './assessmentValidation';
import { providerFailure } from './providerResponse';
const reviewItems = (value: unknown, field: string, min: number, max: number): string[] => {
    if (!Array.isArray(value) || value.length < min || value.length > max || value.some(item => typeof item !== 'string' || !item.trim() || item.trim().length > 300))
        throw new Error(`AI assessment has invalid ${field}`);
    const items = value.map(item => item.trim());
    if (new Set(items).size !== items.length)
        throw new Error(`AI assessment has duplicate ${field}`);
    return items;
};
export function normalizeAiProfileAnalysis(value: any) {
    return {
        status: 'completed' as const,
        strengthSummary: requireAssessmentText(value?.strengthSummary, 'strengthSummary').slice(0, 2500),
        weaknessSummary: requireAssessmentText(value?.weaknessSummary, 'weaknessSummary').slice(0, 2500),
        verificationQuestions: reviewItems(value?.verificationQuestions, 'verificationQuestions', 3, 5),
        evidenceRequests: reviewItems(value?.evidenceRequests, 'evidenceRequests', 1, 4),
        skillGap: words(value?.skillGap), recommendedSkills: words(value?.recommendedSkills),
        recommendedProjects: words(value?.recommendedProjects), recommendedCompanies: words(value?.recommendedCompanies),
        recommendedLearningPath: words(value?.recommendedLearningPath),
        careerReadiness: requireAssessmentScore(value?.careerReadiness, 'careerReadiness'),
        employabilityScore: requireAssessmentScore(value?.employabilityScore, 'employabilityScore'),
    };
}
export function registerProfileAnalysisRoutes(app: Express, _legacyGenerate?: unknown, database = getSupabaseAdmin) {
    app.post('/api/gemini/analyze-profile', async (req: any, res) => {
        if (!req.user?.uid)
            return res.status(401).json({ error: 'Authentication required' });
        const role = req.body?.role;
        if (role !== 'student' && role !== 'company')
            return res.status(400).json({ error: 'Choose student or company' });
        if (req.user.role !== role && req.user.role !== 'admin')
            return res.status(403).json({ error: 'Profile access denied' });
        if (req.body?.profileOwnerId && req.user.role !== 'admin' && req.body.profileOwnerId !== req.user.uid)
            return res.status(403).json({ error: 'Profile access denied' });
        const owner = req.user.role === 'admin' && req.body?.profileOwnerId ? req.body.profileOwnerId : req.user.uid;
        if (typeof owner !== 'string' || !/^[0-9a-f-]{36}$/i.test(owner))
            return res.status(400).json({ error: 'Invalid profile id' });
        let id: string | undefined;
        let stage: 'load' | 'generate' | 'save' = 'load';
        let db: ReturnType<typeof getSupabaseAdmin>;
        try {
            db = database();
            const collection = `${role}_profiles`;
            const readProfile = () => db.from('app_records').select('data').eq('collection_name', collection).eq('record_id', owner).maybeSingle();
            const { data: row, error } = await readProfile();
            if (error)
                throw error;
            if (!row)
                return res.status(404).json({ error: 'Save a profile before requesting analysis' });
            const evidence = profileEvidence(role, row.data);
            if (!words(role === 'student' ? row.data.skills : row.data.requiredSkills).length && !short(role === 'student' ? row.data.bio : row.data.companyIntroduction))
                return res.status(422).json({ code: 'INSUFFICIENT_EVIDENCE', error: 'Add skills and a short description before requesting analysis' });
            const hash = evidenceHash(evidence);
            id = randomUUID();
            const base = { id, requested_by: req.user.uid, subject_user_id: owner, entity_type: `${role}_profile`, entity_id: owner, assessment_type: `${role}_profile_analysis`, prompt_version: PROFILE_ANALYSIS_VERSION, input_hash: hash };
            const pending = await db.from('konexa_ai_assessments').insert({ ...base, model: 'pending', status: 'pending', result: {} });
            if (pending.error)
                throw pending.error;
            stage = 'generate';
            const model = PROFILE_ANALYSIS_VERSION;
            const analysis = reviewProfileEvidence(role, row.data, req.body?.locale);
            stage = 'save';
            const latest = await readProfile();
            if (latest.error)
                throw latest.error;
            if (!latest.data || evidenceHash(profileEvidence(role, latest.data.data)) !== hash) {
                const failed = await db.from('konexa_ai_assessments').update({ status: 'failed', result: { code: 'PROFILE_CHANGED' } }).eq('id', id);
                if (failed.error)
                    throw failed.error;
                return res.status(409).json({ code: 'PROFILE_CHANGED', error: 'Profile changed during analysis. Run analysis again.' });
            }
            const saved = await db.rpc('konexa_save_profile_analysis', { p_user_id: owner, p_collection: collection, p_analysis: { aiAnalysisStatus: 'completed', aiAnalysis: analysis, aiCareerReadiness: analysis.careerReadiness, aiEmployabilityScore: analysis.employabilityScore, aiAnalyzedAt: Date.now(), aiAssessmentId: id } });
            if (saved.error)
                throw saved.error;
            const finished = await db.from('konexa_ai_assessments').upsert({ ...base, model, status: 'completed', result: analysis, confidence: null }, { onConflict: 'id' });
            if (finished.error)
                throw finished.error;
            res.setHeader('Cache-Control', 'private, no-store');
            res.json({ ...analysis, model, assessmentId: id, advisoryOnly: true });
        }
        catch (error) {
            const diagnostic = stage === 'generate' ? providerFailure(error) : { code: 'AI_STORAGE_ERROR', httpStatus: null };
            if (id && db!) {
                const failed = await db.from('konexa_ai_assessments').update({ status: 'failed', result: { code: diagnostic.code } }).eq('id', id).eq('status', 'pending');
                if (failed.error)
                    console.error('[KONEXA] Could not mark profile analysis failed', id);
            }
            console.error('[KONEXA] Profile analysis failed', id || 'before generation', diagnostic.code);
            res.status(502).json({ code: diagnostic.code, error: 'Analysis could not be completed. Your profile remains saved. Retry the analysis.' });
        }
    });
}
