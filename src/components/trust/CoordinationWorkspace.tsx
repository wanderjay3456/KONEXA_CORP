import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLocale } from '../../i18n/LocaleContext';
import type { TrustSnapshot } from '../../lib/trustOperations';
import { coordinationStatuses, meetingCalendar, type CoordinationEvent, type CoordinationItem, type CoordinationKind } from '../../lib/coordination';

const inputClass='mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100';
const buttonClass='rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40';
const secondaryClass='rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 disabled:opacity-40';
const newDraft=()=>({relationshipId:'',contractId:'',title:'',note:'',slots:[''],durationMinutes:30,meetingUrl:'',supersedesId:'',reason:'',deliverables:'',schedule:'',additionalAmountKrw:'',caseType:'replacement'});

export default function CoordinationWorkspace({snapshot}: {snapshot: TrustSnapshot}) {
  const {currentUser,activeRole,projects}=useApp(); const {locale}=useLocale(); const ko=locale==='ko';
  const t=(k:string,e:string)=>ko?k:e;
  const [kind,setKind]=useState<CoordinationKind>('meeting'); const [items,setItems]=useState<CoordinationItem[]>([]);
  const [nextOffset,setNextOffset]=useState<number|null>(null),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false);
  const [failure,setFailure]=useState(''),[notice,setNotice]=useState(''),[draft,setDraft]=useState(newDraft);
  const keys=useRef(new Map<string,string>()),requestVersion=useRef(0),draftVersion=useRef(0);
  const isAdmin=activeRole==='admin';
  const labels:Record<CoordinationKind,string>={meeting:t('면접 일정','Interview scheduling'),change:t('업무 변경 요청','Scope changes'),support:t('대체·보증 요청','Replacement & guarantee')};
  const timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const formatDate=(date:string)=>new Intl.DateTimeFormat(ko?'ko-KR':'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone}).format(new Date(date));
  const relationLabel=(id:string)=>{const rel=snapshot.introductions.find(r=>r.id===id); return projects.find(p=>p.id===rel?.projectId)?.title || `${t('소개 관계','Introduction')} ${id.slice(0,8)}`;};
  const contracts=snapshot.contracts.filter(c=>c.relationshipId===draft.relationshipId && !['completed','cancelled','disputed'].includes(String(c.status)));
  const relationship=snapshot.introductions.find(r=>r.id===draft.relationshipId);
  const load=async(append=false,offset=0)=>{
    const ticket=++requestVersion.current; setLoading(true); setFailure('');
    try { const res=await fetch(`/api/v2/coordination?kind=${kind}&offset=${offset}`,{headers:{'X-KONEXA-Locale':locale}});
      const body=await res.json(); if(!res.ok)throw new Error(body.error?.message || t('기록을 불러오지 못했습니다.','Could not load records.'));
      if(ticket!==requestVersion.current)return;
      setItems(old=>append?[...old,...body.data.filter((x:CoordinationItem)=>!old.some(y=>y.id===x.id))]:body.data);setNextOffset(body.nextOffset);
    }catch(e){if(ticket===requestVersion.current)setFailure((e as Error).message);}finally{if(ticket===requestVersion.current)setLoading(false);}
  };
  useEffect(()=>{setItems([]);setNextOffset(null);void load();return()=>{requestVersion.current++;};},[kind,currentUser?.uid,locale]);
  const command=async(path:string,payload:unknown)=>{
    const fingerprint=path+JSON.stringify(payload);let key=keys.current.get(fingerprint);
    if(!key){key=crypto.randomUUID();keys.current.set(fingerprint,key);}
    const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Idempotency-Key':key,'X-KONEXA-Locale':locale},body:JSON.stringify(payload)});
    const body=await res.json();if(!res.ok)throw new Error(body.error?.message || t('요청을 저장하지 못했습니다.','Could not save your request.'));
    keys.current.delete(fingerprint);return body.data as CoordinationItem;
  };
  const field=(name: keyof ReturnType<typeof newDraft>,value:any)=>{draftVersion.current++;setDraft(old=>({...old,[name]:value}));};
  const create=async(event:React.FormEvent)=>{
    event.preventDefault();if(busy)return;setBusy(true);setFailure('');setNotice('');const revision=draftVersion.current;
    try {const details=kind==='meeting'?{note:draft.note,slots:draft.slots.filter(Boolean).map(x=>new Date(x).toISOString()),durationMinutes:draft.durationMinutes,timeZone,
      meetingUrl:draft.meetingUrl,supersedesId:draft.supersedesId || null}:kind==='change'?{reason:draft.reason,deliverables:draft.deliverables,schedule:draft.schedule,additionalAmountKrw:draft.additionalAmountKrw}:{caseType:draft.caseType,reason:draft.reason};
      await command('/api/v2/coordination',{kind,relationshipId:draft.relationshipId,contractId:kind==='meeting'?null:(draft.contractId || null),title:draft.title,details});
      if(revision===draftVersion.current)setDraft(newDraft());setNotice(t('요청을 저장했습니다. 변경 이력과 알림이 함께 기록됩니다.','Request saved with its history and notifications.'));await load();
    }catch(e){setFailure((e as Error).message);}finally{setBusy(false);}
  };
  const update=async(item:CoordinationItem,body:Record<string,unknown>)=>{
    const saved=await command(`/api/v2/coordination/${item.id}/actions`,{version:item.version,...body});
    setItems(old=>old.map(x=>x.id===saved.id?saved:x));setNotice(t('처리 내용을 저장했습니다.','Your update was saved.'));await load();
  };
  return <section data-no-translate className="space-y-5 text-sm leading-6" aria-label={t('일정·변경·지원 관리','Coordination workspace')}>
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={t('운영 요청 종류','Coordination request types')}>
      {(Object.keys(labels) as CoordinationKind[]).map(value=><button key={value} role="tab" aria-selected={kind===value} className={kind===value?buttonClass:secondaryClass} onClick={()=>{setKind(value);setNotice('');}}>{labels[value]}</button>)}
      <button className={secondaryClass} disabled={loading||busy} onClick={()=>void load()}>{t('새로고침','Refresh')}</button>
    </div>
    <p className="max-w-3xl text-neutral-600">{kind==='meeting'?t('가능한 시간을 제안하면 상대방이 하나를 선택해 확정합니다. 일정 변경은 상대방이 새 시간을 수락할 때까지 기존 일정이 유지됩니다.','Propose available times for the other participant to confirm. When rescheduling, the original booking remains until the new time is accepted.'):kind==='change'?t('추가 업무와 일정·비용을 먼저 합의하세요. 변경안 승인만으로 원계약이나 결제 금액이 바뀌지 않습니다. 필요한 변경 계약·서명·대금 확보를 완료한 후 추가 업무를 시작하세요.','Agree on additional work, timing and charges first. Acknowledging a change does not amend the original contract or payment. Complete the required amendment, signatures and funding before starting additional work.'):t('실제 소개 관계에 대해 대체 인재 또는 보증 검토를 요청할 수 있습니다. 관리자가 사실관계와 적용 조건을 확인하며, 요청 접수 자체가 보증 승인이나 환불은 아닙니다.','Request replacement or guarantee review for a real introduction. Operations reviews the evidence and eligibility; submitting a request does not itself approve a guarantee or refund.')}</p>
    {failure&&<p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">{failure}</p>}
    {notice&&<p role="status" className="rounded-xl bg-teal-50 p-4 text-teal-900">{notice}</p>}
    {!isAdmin&&<details className="rounded-2xl border border-neutral-200 bg-white p-5" open={Boolean(draft.supersedesId)}>
      <summary className="cursor-pointer font-semibold text-neutral-900">{t('새 요청 작성','Create a request')}</summary>
      <form className="mt-5 space-y-4" onSubmit={create}>
        {draft.supersedesId&&<p className="rounded-xl bg-amber-50 p-3 text-amber-900">{t('확정된 일정의 변경을 제안합니다. 상대방이 수락하기 전에는 기존 일정이 취소되지 않습니다.','Propose a new time. The original confirmed meeting stays in place until this proposal is accepted.')}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block font-medium">{t('소개 관계','Introduction')}<select aria-label={t('소개 관계','Introduction')} className={inputClass} required value={draft.relationshipId} disabled={Boolean(draft.supersedesId)||busy} onChange={e=>{field('relationshipId',e.target.value);field('contractId','');}}><option value="">{t('선택해 주세요','Choose an introduction')}</option>{snapshot.introductions.filter(r=>kind==='support'||!['cancelled','completed'].includes(String(r.status))).map(r=><option key={r.id} value={r.id}>{relationLabel(r.id)}</option>)}</select></label>
          {kind!=='meeting'&&<label className="block font-medium">{t(kind==='change'?'계약 (필수)':'관련 계약 (선택)',kind==='change'?'Contract (required)':'Related contract (optional)')}<select className={inputClass} value={draft.contractId} required={kind==='change'} onChange={e=>field('contractId',e.target.value)}><option value="">{t('선택해 주세요','Choose a contract')}</option>{(kind==='support'?snapshot.contracts.filter(c=>c.relationshipId===draft.relationshipId):contracts).map(c=><option key={c.id} value={c.id}>{String(c.title)}</option>)}</select></label>}
        </div>
        {!snapshot.introductions.length&&<p className="text-neutral-600">{t('아직 소개 관계가 없습니다. 공고 지원 및 소개 절차가 진행되면 여기에서 요청할 수 있습니다.','No introductions yet. Requests become available after an application progresses to an introduction.')}</p>}
        <label className="block font-medium">{t('제목','Title')}<input className={inputClass} required minLength={3} maxLength={160} value={draft.title} onChange={e=>field('title',e.target.value)}/></label>
        {kind==='meeting'?<>
          <p className="text-neutral-600">{t('입력·표시 시간대','Input and display time zone')}: <strong>{timeZone}</strong>. {t('5분 이후부터 180일 이내의 시간을 선택하세요.','Choose times at least 5 minutes ahead and within 180 days.')}</p>
          {draft.slots.map((slot,index)=><div key={index} className="flex items-end gap-2"><label className="block min-w-0 flex-1 font-medium">{t('제안 시간','Proposed time')} {index+1}<input className={inputClass} type="datetime-local" required value={slot} onChange={e=>field('slots',draft.slots.map((x,i)=>i===index?e.target.value:x))}/></label>{draft.slots.length>1&&<button className={secondaryClass} type="button" onClick={()=>field('slots',draft.slots.filter((_,i)=>i!==index))}>{t('삭제','Remove')}</button>}</div>)}
          {draft.slots.length<5&&<button className={secondaryClass} type="button" onClick={()=>field('slots',[...draft.slots,''])}>{t('다른 시간 추가','Add another time')}</button>}
          <label className="block font-medium">{t('진행 시간','Duration')}<select className={inputClass} value={draft.durationMinutes} onChange={e=>field('durationMinutes',Number(e.target.value))}>{[15,30,45,60,90,120].map(n=><option key={n} value={n}>{n} {t('분','minutes')}</option>)}</select></label>
          <label className="block font-medium">{t('면접 안내 (선택)','Meeting notes (optional)')}<textarea className={inputClass} maxLength={2000} rows={3} value={draft.note} onChange={e=>field('note',e.target.value)}/></label>
          {relationship?.contactStatus==='unlocked'?<label className="block font-medium">{t('HTTPS 화상회의 링크 (선택)','HTTPS meeting link (optional)')}<input className={inputClass} type="url" pattern="https://.*" maxLength={2000} value={draft.meetingUrl} onChange={e=>field('meetingUrl',e.target.value)}/></label>:<p className="text-neutral-600">{t('연락처 공개 요건이 충족되기 전에는 연락처나 외부 링크 없이 시간을 조율합니다.','Until contact-release requirements are met, coordinate times without contact details or external links.')}</p>}
        </>:<>
          {kind==='support'&&<label className="block font-medium">{t('요청 종류','Request type')}<select className={inputClass} value={draft.caseType} onChange={e=>field('caseType',e.target.value)}><option value="replacement">{t('대체 인재 요청','Replacement request')}</option><option value="guarantee">{t('보증 적용 검토','Guarantee eligibility review')}</option></select></label>}
          <label className="block font-medium">{t('요청 사유와 확인할 사실','Reason and supporting facts')}<textarea className={inputClass} rows={4} required minLength={kind==='support'?20:10} maxLength={kind==='support'?4000:2000} value={draft.reason} onChange={e=>field('reason',e.target.value)}/></label>
          {kind==='change'&&<>
            <label className="block font-medium">{t('변경할 업무와 결과물','Proposed work and deliverables')}<textarea className={inputClass} rows={4} required minLength={10} maxLength={6000} value={draft.deliverables} onChange={e=>field('deliverables',e.target.value)}/></label>
            <label className="block font-medium">{t('변경 일정·마감일','Revised schedule and deadlines')}<textarea className={inputClass} rows={2} required minLength={5} maxLength={2000} value={draft.schedule} onChange={e=>field('schedule',e.target.value)}/></label>
            <label className="block font-medium">{t('추가 비용 (원, 없으면 0 입력)','Additional amount (KRW; enter 0 for no additional charge)')}<input className={inputClass} type="number" min={0} max={1000000000} step={1} required value={draft.additionalAmountKrw} onChange={e=>field('additionalAmountKrw',e.target.value)}/></label>
          </>}
        </>}
        <div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={busy||!draft.relationshipId} type="submit">{busy?t('저장 중…','Saving…'):t('요청 보내기','Send request')}</button>{draft.supersedesId&&<button type="button" className={secondaryClass} onClick={()=>setDraft(newDraft())}>{t('작성 취소','Discard proposal')}</button>}</div>
      </form>
    </details>}
    {loading&&!items.length?<p role="status">{t('기록을 불러오는 중입니다.','Loading records…')}</p>:!failure&&!items.length&&<p className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-600">{t('아직 등록된 요청이 없습니다. 실제로 접수된 요청만 표시합니다.','No requests yet. Only real submitted requests appear here.')}</p>}
    {items.map(item=><div key={item.id}><CoordinationCard item={item} isAdmin={isAdmin} userId={currentUser?.uid||''} t={t} formatDate={formatDate} locale={locale} update={update} snapshot={snapshot} onReschedule={()=>{setDraft({...newDraft(),relationshipId:item.relationship_id,title:item.title,note:String(item.details.note||''),durationMinutes:item.duration_minutes||30,supersedesId:item.id,meetingUrl:String(item.details.meetingUrl||'')});window.scrollTo({top:0,behavior:'smooth'});}}/></div>)}
    {nextOffset!==null&&<button className={secondaryClass} disabled={loading} onClick={()=>void load(true,nextOffset)}>{t('더 보기','Load more')}</button>}
  </section>;
}

function CoordinationCard({item,isAdmin,userId,t,formatDate,locale,update,onReschedule,snapshot}:{item:CoordinationItem;isAdmin:boolean;userId:string;t:(k:string,e:string)=>string;formatDate:(v:string)=>string;locale:string;update:(item:CoordinationItem,body:Record<string,unknown>)=>Promise<void>;onReschedule:()=>void;snapshot:TrustSnapshot}) {
  const [note,setNote]=useState(''),[slot,setSlot]=useState(''),[action,setAction]=useState(''),[acknowledged,setAcknowledged]=useState(false);
  const [busy,setBusy]=useState(false),[failure,setFailure]=useState(''),[history,setHistory]=useState<CoordinationEvent[]|null>(null),[historyOffset,setHistoryOffset]=useState<number|null>(null);
  const [replacement,setReplacement]=useState(''),[dueAt,setDueAt]=useState(''); const own=userId===item.created_by;
  let actions:string[]=[];
  if(item.kind==='meeting'&&!isAdmin)actions=item.status==='proposed'?(own?['cancel']:['confirm','decline']):item.status==='confirmed'?['cancel',...(Date.parse(item.ends_at||'')<=Date.now()?['complete']:[])]:[];
  if(item.kind==='change'&&!isAdmin&&item.status==='proposed')actions=own?['withdraw']:['agree','reject'];
  if(item.kind==='support')actions=isAdmin?(item.status==='closed'?[]:['resolved','rejected'].includes(item.status)?['in_review']:['in_review','matching','proposal_sent','resolved','rejected']):own&&['open','resolved','rejected'].includes(item.status)?['close']:[];
  const selectedAction=actions.includes(action)?action:actions[0]||'';
  const actionLabels:Record<string,[string,string]>={confirm:['선택한 일정 확정','Confirm selected time'],decline:['일정 거절','Decline proposal'],cancel:['일정 취소','Cancel meeting'],complete:['면접 진행 기록','Record meeting completion'],agree:['변경안에 동의','Agree to change proposal'],reject:['변경안 거절','Reject proposal'],withdraw:['변경 요청 철회','Withdraw proposal'],close:['요청 종료','Close request'],in_review:['검토 시작·재개','Start or reopen review'],matching:['대체 인재 탐색','Start replacement search'],proposal_sent:['실제 대체 소개 연결','Link replacement introduction'],resolved:['처리 완료','Resolve case'],rejected:['적용 불가','Reject case']};
  const status=coordinationStatuses[item.status];
  const historyLoad=async(offset=0)=>{setBusy(true);setFailure('');try{const res=await fetch(`/api/v2/coordination/${item.id}/events?offset=${offset}`,{headers:{'X-KONEXA-Locale':locale}});const body=await res.json();if(!res.ok)throw new Error(body.error?.message);setHistory(old=>offset?[...(old||[]),...body.data]:body.data);setHistoryOffset(body.nextOffset);}catch(e){setFailure((e as Error).message);}finally{setBusy(false);}};
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(busy)return;setBusy(true);setFailure('');try{await update(item,{action:selectedAction,note,slot:selectedAction==='confirm'?slot:undefined,acknowledged,replacementRelationshipId:selectedAction==='proposal_sent'?replacement:undefined,dueAt:isAdmin&&dueAt?new Date(dueAt).toISOString():undefined});setNote('');setAcknowledged(false);setHistory(null);}catch(e){setFailure((e as Error).message);}finally{setBusy(false);}};
  const download=()=>{const url=URL.createObjectURL(new Blob([meetingCalendar(item)],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`konexa-meeting-${item.id.slice(0,8)}.ics`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return <article className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="break-words text-base font-semibold text-neutral-900">{item.title}</h3><p className="mt-1 text-xs text-neutral-500">{formatDate(item.created_at)} · {t('버전','Version')} {item.version}</p></div><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">{status?t(...status):item.status}</span></div>
    {item.kind==='meeting'?<div className="space-y-2">
      {item.starts_at?<p className="font-medium">{formatDate(item.starts_at)} – {item.ends_at&&formatDate(item.ends_at)}</p>:<ul className="list-inside list-disc">{item.slots.map(value=><li key={value}>{formatDate(value)}</li>)}</ul>}
      <p className="text-neutral-600">{item.duration_minutes} {t('분','minutes')} · {t('제안자가 입력한 시간대','Proposer’s time zone')}: {String(item.details.timeZone)}</p>
      <p className="whitespace-pre-wrap break-words text-neutral-700">{item.details.note}</p>
      {item.details.meetingUrl&&/^https:\/\//.test(String(item.details.meetingUrl))&&<a href={String(item.details.meetingUrl)} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-800 underline">{t('화상회의 열기','Open meeting link')}</a>}
      {item.status==='confirmed'&&<div className="flex flex-wrap gap-2"><button className={secondaryClass} onClick={download}>{t('내 캘린더에 저장 (.ics)','Save to calendar (.ics)')}</button>{!isAdmin&&Date.parse(item.starts_at||'')>Date.now()&&<button className={secondaryClass} onClick={onReschedule}>{t('일정 변경 제안','Propose new time')}</button>}</div>}
    </div>:item.kind==='change'?<>
      <div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-neutral-50 p-4"><h4 className="mb-2 font-semibold">{t('기존 계약 기록','Original contract')}</h4><p>{t('월 계약 금액','Monthly contract amount')}: {Number(item.details.beforeAmountKrw).toLocaleString()} KRW</p><pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm text-neutral-700">{typeof item.details.beforeScope==='object'?Object.entries(item.details.beforeScope).map(([key,value])=>`${key}: ${typeof value==='object'?JSON.stringify(value):String(value)}`).join('\n'):String(item.details.beforeScope||'')}</pre></div><div className="rounded-xl bg-teal-50 p-4"><h4 className="mb-2 font-semibold">{t('변경 제안','Proposed change')}</h4><p className="whitespace-pre-wrap">{item.details.deliverables}</p><p className="mt-3 whitespace-pre-wrap">{item.details.schedule}</p><p className="mt-3 font-medium">{t('추가 비용','Additional amount')}: {Number(item.details.additionalAmountKrw).toLocaleString()} KRW</p></div></div>
      <p className="whitespace-pre-wrap text-neutral-700">{item.details.reason}</p>
      {item.status==='agreed'&&<p className="rounded-xl bg-amber-50 p-3 text-amber-900">{t('양측이 변경안에 동의했습니다. 원계약과 결제는 변경하지 않았습니다. 추가 업무 착수 전에 변경 계약·서명·대금 확보를 운영팀과 완료해 주세요.','Both parties acknowledged this proposal. The original contract and payment remain unchanged. Complete the amendment, signatures and funding with operations before additional work begins.')}</p>}
    </>:<div className="space-y-2"><p className="font-medium">{item.details.caseType==='guarantee'?t('보증 적용 검토','Guarantee eligibility review'):t('대체 인재 요청','Replacement request')}</p><p className="whitespace-pre-wrap text-neutral-700">{item.details.reason}</p>{item.due_at&&<p className="text-neutral-600">{t('운영팀 후속 확인 목표일','Operations follow-up target')}: {formatDate(item.due_at)} — {t('대체 완료 보장일이 아닙니다.','not a guaranteed replacement date.')}</p>}{item.details.resolution&&<div className="rounded-xl bg-neutral-50 p-4"><h4 className="font-semibold">{t('관리자 검토 내용','Operations review')}</h4><p className="mt-2 whitespace-pre-wrap">{item.details.resolution}</p></div>}</div>}
    {failure&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">{failure}</p>}
    {!!actions.length&&<form className="space-y-3 border-t border-neutral-100 pt-4" onSubmit={submit}>
      <label className="block font-medium">{t('처리할 작업','Next action')}<select className={inputClass} value={selectedAction} onChange={e=>setAction(e.target.value)}>{actions.map(value=><option key={value} value={value}>{t(...actionLabels[value])}</option>)}</select></label>
      {selectedAction==='confirm'&&<label className="block font-medium">{t('수락할 시간','Time to accept')}<select className={inputClass} value={slot} required onChange={e=>setSlot(e.target.value)}><option value="">{t('시간을 선택하세요','Choose a time')}</option>{item.slots.map(value=><option key={value} value={value}>{formatDate(value)}</option>)}</select></label>}
      {selectedAction==='agree'&&<label className="flex items-start gap-3 rounded-xl bg-amber-50 p-4"><input type="checkbox" className="mt-1 h-4 w-4" required checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}/><span>{t('변경 내용을 확인했습니다. 이 동의는 전자서명이나 결제가 아니며, 추가 업무 전 필요한 계약 절차를 따르겠습니다.','I reviewed the change. This is not an electronic signature or payment; the required contract steps must be completed before additional work.')}</span></label>}
      {selectedAction==='proposal_sent'&&<label className="block font-medium">{t('대체 인재의 실제 소개 관계','Actual replacement introduction')}<select className={inputClass} value={replacement} required onChange={e=>setReplacement(e.target.value)}><option value="">{t('소개 관계를 선택하세요','Select an introduction')}</option>{snapshot.introductions.filter(r=>r.companyId===item.company_id&&r.talentId!==item.student_id&&!['cancelled','completed'].includes(String(r.status))).map(r=><option key={r.id} value={r.id}>{t('소개','Introduction')} {r.id.slice(0,8)}</option>)}</select></label>}
      {!['confirm','complete','agree'].includes(selectedAction)&&<label className="block font-medium">{t('사유·처리 근거','Reason and supporting details')}<textarea className={inputClass} rows={3} required minLength={isAdmin?20:5} maxLength={4000} value={note} onChange={e=>setNote(e.target.value)}/></label>}
      {isAdmin&&<label className="block font-medium">{t('다음 확인 목표일 (선택)','Next follow-up target (optional)')}<input className={inputClass} type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></label>}
      <button className={buttonClass} disabled={busy} type="submit">{busy?t('저장 중…','Saving…'):t('처리 내용 저장','Save action')}</button>
    </form>}
    <button className={secondaryClass} disabled={busy} onClick={()=>history?setHistory(null):void historyLoad()}>{history?t('이력 닫기','Hide history'):t('처리 이력 보기','View history')}</button>
    {history&&<ol className="space-y-3 border-l-2 border-neutral-200 pl-4">{history.map(event=><li key={event.id}><p className="font-medium">{event.action==='created'?t('요청 등록','Request created'):actionLabels[event.action]?t(...actionLabels[event.action]):coordinationStatuses[event.action]?t(...coordinationStatuses[event.action]):event.action} · {formatDate(event.created_at)}</p><p className="text-xs text-neutral-500">{t('버전','Version')} {event.version} · {event.actor_id===item.company_id?t('기업','Company'):event.actor_id===item.student_id?t('인재','Talent'):t('관리자','Administrator')}</p>{event.note&&<p className="mt-1 whitespace-pre-wrap text-neutral-700">{event.note}</p>}</li>)}{historyOffset!==null&&<li><button className={secondaryClass} disabled={busy} onClick={()=>void historyLoad(historyOffset)}>{t('이전 이력 더 보기','Load earlier history')}</button></li>}</ol>}
  </article>;
}
