import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { coordinationError, parseCoordinationCreate, registerCoordinationRoutes } from '../src/server/coordinationRoutes';
import { meetingCalendar } from '../src/lib/coordination';
import { staticUiCopy } from '../src/i18n/staticUiCopy';
import { readFileSync } from 'node:fs';
const company='10000000-0000-4000-8000-000000000002',student='10000000-0000-4000-8000-000000000001',relationship='30000000-0000-4000-8000-000000000001';
const proposal={kind:'meeting',relationshipId:relationship,title:'Research interview',details:{slots:['2027-01-02T10:00:00+09:00'],durationMinutes:30,timeZone:'Asia/Seoul',meetingUrl:'',note:'Discuss the project scope'}};
const now=Date.parse('2027-01-01T00:00:00Z');
test('coordination input keeps time zones explicit and rejects invalid or past slots',()=>{
  assert.deepEqual(parseCoordinationCreate(proposal,now).details.slots,['2027-01-02T01:00:00.000Z']);
  for(const change of [{slots:[]},{slots:['2027-01-02T10:00']},{slots:['2026-12-30T00:00:00Z']},{durationMinutes:0},{timeZone:'Invalid/Zone'},{meetingUrl:'javascript:alert(1)'},{meetingUrl:'https://user:password@example.invalid'}])assert.throws(()=>parseCoordinationCreate({...proposal,details:{...proposal.details,...change}},now));
});
test('scope changes require an explicit amount and real contract; support requires evidence',()=>{
  const change={kind:'change',relationshipId:relationship,contractId:relationship,title:'Scope change',details:{reason:'Additional market research required',deliverables:'A second market summary',schedule:'Next week Friday',additionalAmountKrw:0}};
  assert.equal(parseCoordinationCreate(change).details.additionalAmountKrw,0);
  assert.throws(()=>parseCoordinationCreate({...change,contractId:null}));
  assert.throws(()=>parseCoordinationCreate({...change,details:{...change.details,additionalAmountKrw:''}}));
  assert.throws(()=>parseCoordinationCreate({kind:'support',relationshipId:relationship,title:'Support review',details:{caseType:'refund',reason:'too short'}}));
});
test('calendar export is escaped, folded, UTC and limited to confirmed meetings',()=>{
  const item:any={id:relationship,kind:'meeting',status:'confirmed',title:'연구 인터뷰 '.repeat(20)+'\nATTENDEE:evil@example.invalid',starts_at:'2027-01-02T01:00:00Z',ends_at:'2027-01-02T01:30:00Z'};
  const ics=meetingCalendar(item,new Date('2027-01-01T00:00:00Z'));
  assert.match(ics,/DTSTART:20270102T010000Z/);assert.ok(!ics.includes('\r\nATTENDEE:'));assert.ok(ics.split('\r\n').every(line=>new TextEncoder().encode(line).length<=75));
  assert.throws(()=>meetingCalendar({...item,status:'proposed'}));
});
test('coordination errors are actionable and never echo database or credential details',()=>{
  assert.equal(coordinationError(new Error('meeting_conflict'),false).status,409);
  assert.match(coordinationError(new Error('stale_version'),true).message,/새로고침/);
  assert.ok(!coordinationError(new Error('password=secret DATABASE_URL'),false).message.includes('secret'));
});
test('coordination routes use the authenticated actor, enforce private reads and preserve idempotency',async()=>{
  const calls:any[]=[];const filters:any[]=[];
  const db:any={rpc:async(name:string,params:any)=>{calls.push({name,params});return {data:{id:relationship}};},from:(table:string)=>{
    const q:any={select:()=>q,eq:(key:string,value:string)=>{filters.push([key,value]);return q;},order:()=>q,range:async()=>({data:[]}),maybeSingle:async()=>({data:{company_id:company,student_id:student}})};return q;
  }};
  const app=express();app.use(express.json());app.use((req:any,_res,next)=>{if(req.get('x-actor'))req.user={uid:req.get('x-actor'),role:'company'};next();});registerCoordinationRoutes(app,()=>db);
  const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const base=`http://127.0.0.1:${(server.address() as any).port}`;
  try {
    assert.equal((await fetch(base+'/api/v2/coordination')).status,401);
    const read=await fetch(base+'/api/v2/coordination?kind=meeting',{headers:{'x-actor':company}});assert.equal(read.headers.get('cache-control'),'private, no-store');assert.ok(filters.some(([key,value])=>key==='company_id'&&value===company));
    assert.equal((await fetch(base+`/api/v2/coordination/${relationship}/events`,{headers:{'x-actor':'outsider'}})).status,404);
    const slot=new Date(Date.now()+3600000).toISOString();
    const response=await fetch(base+'/api/v2/coordination',{method:'POST',headers:{'x-actor':company,'content-type':'application/json','x-idempotency-key':'qa-command-123456789'},body:JSON.stringify({...proposal,actorId:student,details:{...proposal.details,slots:[slot]}})});
    assert.equal(response.status,201);assert.equal(calls[0].params.p_actor,company);assert.equal(calls[0].params.p_key,'qa-command-123456789');assert.equal(calls[0].params.p_payload.actorId,undefined);
  }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
test('legacy UI localization is deterministic, private text is untouched and Vietnamese preferences migrate',()=>{
  assert.equal(staticUiCopy('일정·변경·지원','en'),'Scheduling, changes & support');
  assert.equal(staticUiCopy('Submission history','ko'),'제출 이력');
  assert.equal(staticUiCopy('Our private user-authored research details','ko'),'Our private user-authored research details');
  const missingLabels:string[]=[];
  for(const file of ['layout/Navbar','layout/Sidebar','dashboard/AdminDashboard']) {
    const source=readFileSync(new URL(`../src/components/${file}.tsx`,import.meta.url),'utf8');
    for(const [,label] of source.matchAll(/(?:\blabel:\s*|aria-label=)"([^"]+)"/g)) {
      if(/[가-힣]/.test(label)&&/[가-힣]/.test(staticUiCopy(label,'en')))missingLabels.push(`${file}: ${label}`);
    }
  }
  assert.deepEqual(missingLabels,[],'Every company, talent and admin navigation label needs English copy');
  const adapter=readFileSync(new URL('../src/i18n/AutoTranslator.tsx',import.meta.url),'utf8');
  assert.ok(!adapter.includes('fetch('));assert.match(adapter,/data-no-translate/);
  const context=readFileSync(new URL('../src/i18n/LocaleContext.tsx',import.meta.url),'utf8');
  assert.match(context,/String\(saved\) === "vi"\) return "en"/);assert.ok(!context.includes('Locale = "ko" | "en" | "vi"'));
});
