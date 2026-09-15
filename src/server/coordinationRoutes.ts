import type { Express, Response } from 'express';
import { getSupabaseAdmin } from './supabaseAdmin';
import type { AuthenticatedRequest } from './security';
import { ApiInputError, uuid, idempotencyKey, plainObject, text, integer } from './backendV2Validation';

const kinds = new Set(['meeting','change','support']);
export function parseCoordinationCreate(input: unknown, now = Date.now()) {
  const value = plainObject(input, 'request'), details = plainObject(value.details, 'details');
  if (!kinds.has(String(value.kind))) throw new ApiInputError('Select a request type.');
  const base = { kind: String(value.kind), relationshipId: uuid(value.relationshipId, 'relationshipId'),
    contractId: value.contractId ? uuid(value.contractId, 'contractId') : null, title: text(value.title, 'title', 3, 160) };
  if (base.kind === 'meeting') {
    if (!Array.isArray(details.slots) || details.slots.length < 1 || details.slots.length > 5) throw new ApiInputError('Choose between 1 and 5 available times.');
    const slots = [...new Set(details.slots.map((slot: unknown) => {
      if (typeof slot !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(slot)) throw new ApiInputError('Include the time zone in every proposed time.');
      const date = Date.parse(slot);
      if (!Number.isFinite(date) || date < now + 300000 || date > now + 180 * 86400000) throw new ApiInputError('Choose a time at least 5 minutes ahead and within 180 days.');
      return new Date(date).toISOString();
    }))];
    const timeZone = text(details.timeZone, 'timeZone', 1, 100);
    try { new Intl.DateTimeFormat('en', { timeZone }).format(); } catch { throw new ApiInputError('Choose a valid time zone.'); }
    let meetingUrl = '';
    if (details.meetingUrl) {
      try { const url = new URL(text(details.meetingUrl, 'meetingUrl', 10, 2000));
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error(); meetingUrl = url.href;
      } catch { throw new ApiInputError('Use an HTTPS meeting link without embedded login details.'); }
    }
    return { ...base, details: { slots, timeZone, durationMinutes: integer(details.durationMinutes, 'duration', 15, 120),
      meetingUrl, note: details.note ? text(details.note, 'note', 1, 2000) : '', supersedesId: details.supersedesId ? uuid(details.supersedesId,'supersedesId') : null } };
  }
  if (base.kind === 'change') {
    if (!base.contractId) throw new ApiInputError('Select a contract.');
    if (details.additionalAmountKrw === '' || details.additionalAmountKrw == null) throw new ApiInputError('Enter the additional amount, including 0 if there is no additional charge.');
    return { ...base, details: { reason: text(details.reason, 'reason', 10, 2000), deliverables: text(details.deliverables, 'deliverables', 10, 6000),
      schedule: text(details.schedule, 'schedule', 5, 2000), additionalAmountKrw: integer(details.additionalAmountKrw, 'additionalAmountKrw', 0, 1000000000) } };
  }
  if (!['replacement','guarantee'].includes(String(details.caseType))) throw new ApiInputError('Select replacement or guarantee review.');
  return { ...base, details: { caseType: String(details.caseType), reason: text(details.reason, 'reason', 20, 4000) } };
}

export function coordinationError(cause: unknown, ko: boolean) {
  const message = String((cause as any)?.message || ''), code = String((cause as any)?.code || '');
  const rules: [RegExp, number, string, string, string][] = [
    [/not_found/,404,'NOT_FOUND','기록을 찾을 수 없습니다.','Record not found.'],
    [/stale_version|stale_contract/,409,'STALE_VERSION','다른 변경이 먼저 저장되었습니다. 새로고침 후 최신 내용을 확인해 주세요.','This record changed. Refresh and review the latest version before trying again.'],
    [/meeting_conflict/,409,'MEETING_CONFLICT','참여자의 다른 확정 일정과 겹칩니다. 다른 시간을 선택해 주세요.','This overlaps a confirmed meeting. Choose another time.'],
    [/contact_locked/,409,'CONTACT_LOCKED','연락처 공개 전에는 외부 링크나 연락처를 공유할 수 없습니다. 플랫폼에서 시간을 먼저 조율해 주세요.','Before contact release, coordinate times in KONEXA without sharing external links or contact details.'],
    [/forbidden|participant_action_required/,403,'FORBIDDEN','이 작업은 해당 참여자만 수행할 수 있습니다.','Only the assigned participant can perform this action.'],
    [/idempotency_key_reused|command_in_progress|duplicate key/,409,'CONFLICT','이미 처리 중이거나 동일한 대기 요청이 있습니다. 최신 기록을 확인해 주세요.','This request is already processing, or a pending request exists. Check the latest records.'],
    [/invalid_|acknowledgement_required|contract_not_ready|relationship_closed/,400,'INVALID_REQUEST','상태 또는 입력값을 확인해 주세요. 일정은 미래여야 하며, 변경안은 상대방의 확인이 필요합니다.','Check the request and its current status. Times must be in the future, and changes require the other participant’s acknowledgement.'],
  ];
  for (const [pattern,status,errorCode,korean,english] of rules) if (pattern.test(message)) return {status,code:errorCode,message:ko?korean:english};
  if (cause instanceof ApiInputError) return {status:cause.statusCode,code:cause.code,message:ko?'입력 내용을 확인해 주세요. 필수 항목과 날짜·글자 수 조건을 확인한 뒤 다시 시도해 주세요.':cause.message};
  return {status:503,code:'SERVICE_UNAVAILABLE',message:ko?'일시적으로 저장소에 연결하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.':'The data service is temporarily unavailable. Your input is preserved; please retry shortly.'};
}

export function registerCoordinationRoutes(app: Express, getDatabase = getSupabaseAdmin, dispatch: () => void = () => {}) {
  const fail = (res: Response, cause: unknown) => { const error = coordinationError(cause, res.req.get('X-KONEXA-Locale') === 'ko');
    if (error.status === 503) console.warn('Coordination dependency unavailable', {code:(cause as any)?.code || 'DATABASE_ERROR'});
    res.status(error.status).json({error}); };
  const actor = (req: AuthenticatedRequest) => {
    if (!req.user?.uid) throw new ApiInputError('Sign in to continue.','AUTH_REQUIRED',401);
    if (!['company','student','admin'].includes(req.user.role || '')) throw new ApiInputError('Account setup is required.','FORBIDDEN',403);
    return req.user;
  };
  app.get('/api/v2/coordination', async (req: AuthenticatedRequest,res) => {
    try {
      const user=actor(req), kind=String(req.query.kind || 'meeting');
      if (!kinds.has(kind)) throw new ApiInputError('Invalid request type.');
      const offset=integer(req.query.offset ?? 0,'offset',0,100000), limit=50;
      let query=getDatabase().from('konexa_coordination_items').select('*').eq('kind',kind);
      if (user.role !== 'admin') query=query.eq(user.role==='company'?'company_id':'student_id',user.uid);
      const result=await query.order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+limit);
      if (result.error) throw result.error;
      res.setHeader('Cache-Control','private, no-store');
      res.json({data:(result.data || []).slice(0,limit),nextOffset:(result.data || []).length>limit?offset+limit:null});
    } catch (e) { fail(res,e); }
  });
  app.get('/api/v2/coordination/:id/events', async (req: AuthenticatedRequest,res) => {
    try {
      const user=actor(req), id=uuid(req.params.id,'id'), db=getDatabase();
      const item=await db.from('konexa_coordination_items').select('company_id,student_id').eq('id',id).maybeSingle();
      if (item.error) throw item.error;
      if (!item.data || (user.role!=='admin' && ![item.data.company_id,item.data.student_id].includes(user.uid))) throw new Error('not_found');
      const offset=integer(req.query.offset ?? 0,'offset',0,100000);
      const result=await db.from('konexa_coordination_events').select('id,actor_id,action,note,created_at,version').eq('item_id',id).order('version',{ascending:false}).range(offset,offset+49);
      if (result.error) throw result.error;
      res.setHeader('Cache-Control','private, no-store'); res.json({data:result.data || [],nextOffset:result.data?.length===50?offset+50:null});
    } catch (e) { fail(res,e); }
  });
  app.post('/api/v2/coordination', async (req: AuthenticatedRequest,res) => {
    try {
      const user=actor(req), payload=parseCoordinationCreate(req.body);
      const result=await getDatabase().rpc('konexa_create_coordination_v4',{p_actor:user.uid,p_key:idempotencyKey(req.get('X-Idempotency-Key')),p_payload:payload});
      if (result.error) throw result.error;
      res.status(201).json({data:result.data}); dispatch();
    } catch (e) { fail(res,e); }
  });
  app.post('/api/v2/coordination/:id/actions', async (req: AuthenticatedRequest,res) => {
    try {
      const user=actor(req), body=plainObject(req.body,'request'), action=text(body.action,'action',3,30);
      const payload: Record<string,unknown>={action,version:integer(body.version,'version',1,2147483647),note:body.note?text(body.note,'note',1,4000):''};
      if (body.slot) { const date=new Date(String(body.slot)); if (!Number.isFinite(date.getTime())) throw new ApiInputError('Invalid meeting time.'); payload.slot=date.toISOString(); }
      if (body.dueAt) { const date=new Date(String(body.dueAt)); if (!Number.isFinite(date.getTime())) throw new ApiInputError('Invalid follow-up date.'); payload.dueAt=date.toISOString(); }
      if (body.replacementRelationshipId) payload.replacementRelationshipId=uuid(body.replacementRelationshipId,'replacementRelationshipId');
      payload.acknowledged=body.acknowledged===true;
      const result=await getDatabase().rpc('konexa_update_coordination_v4',{p_actor:user.uid,p_key:idempotencyKey(req.get('X-Idempotency-Key')),p_id:uuid(req.params.id,'id'),p_payload:payload});
      if (result.error) throw result.error;
      res.json({data:result.data}); dispatch();
    } catch (e) { fail(res,e); }
  });
}
