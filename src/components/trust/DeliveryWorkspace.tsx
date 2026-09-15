import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { useLocale } from '../../i18n/LocaleContext';
import { uploadPrivateFile } from '../../lib/privateStorage';
import type { TrustSnapshot } from '../../lib/trustOperations';
const copy = {
    en: { title: 'Deliverables and project completion', intro: 'Agree the weekly results, submit evidence and keep each review on record. Completion never means a payout has been made.', contract: 'Project agreement', select: 'Choose an agreement', empty: 'No project agreement yet. Approve an application and prepare the agreement first.', stage: 'Status', create: 'Add milestone', name: 'Milestone title', result: 'Expected deliverable', due: 'Due date', amount: 'Milestone amount (KRW)', saved: 'Saved. The other party has been notified.', failed: 'Could not save. Your input is kept; review the message and retry.', loading: 'Loading records…', refresh: 'Refresh records', noMilestones: 'No milestones have been agreed yet.', notes: 'Result or submission notes', file: 'Attach deliverable (optional, up to 50 MB)', submit: 'Submit for review', history: 'Submission history', feedback: 'Review feedback (at least 10 characters)', approve: 'Approve deliverable', revise: 'Request revision', finish: 'Confirm project completion', confirm: 'I have checked every deliverable and confirm this project is complete.', waiting: 'Your confirmation is saved. Waiting for the other party.', complete: 'Both parties confirmed completion. Work Passport evidence is recorded.', gate: 'Work starts after verified funding. Completion requires approved deliverables and no unresolved dispute.', signedGate: 'Milestones can be scheduled after the agreement is signed.', blank: 'Add a file or describe the result in at least 10 characters.', unavailable: 'File unavailable; refresh or contact support.', pending: 'Saving…', noHistory: 'No submitted evidence yet.', consent: 'This records project completion only; it is not an electronic contract signature.', passport: 'Verified project history', approved: 'Approved', rejected: 'Revision requested', submitted: 'Awaiting review', scheduled: 'Scheduled', active: 'Active', funded: 'Funded', issued: 'Agreement issued', completed: 'Completed', cancelled: 'Cancelled' },
    ko: { title: '결과물 제출·검수·프로젝트 종료', intro: '주차별 결과물을 정하고 제출과 검수 기록을 남깁니다. 프로젝트 완료와 인재에게 지급 완료는 다른 상태입니다.', contract: '프로젝트 계약', select: '계약 선택', empty: '아직 프로젝트 계약이 없습니다. 지원자 승인 후 계약 내용을 먼저 준비해 주세요.', stage: '진행 상태', create: '마일스톤 추가', name: '마일스톤 제목', result: '합의할 결과물', due: '제출 기한', amount: '마일스톤 금액(KRW)', saved: '저장했습니다. 상대방에게 알림이 전달됩니다.', failed: '저장하지 못했습니다. 입력 내용은 유지되니 안내를 확인하고 다시 시도해 주세요.', loading: '기록을 불러오는 중…', refresh: '기록 새로고침', noMilestones: '아직 등록한 마일스톤이 없습니다.', notes: '결과물 또는 제출 설명', file: '결과물 첨부(선택, 최대 50MB)', submit: '검수 요청', history: '제출 이력', feedback: '검수 의견(10자 이상)', approve: '결과물 승인', revise: '수정 요청', finish: '프로젝트 완료 확인', confirm: '모든 결과물을 확인했으며 프로젝트 완료에 동의합니다.', waiting: '내 완료 확인이 저장되었습니다. 상대방의 확인을 기다립니다.', complete: '양측이 완료를 확인했습니다. Work Passport에 수행 기록이 남았습니다.', gate: '대금 확보가 확인된 후 업무를 시작합니다. 모든 결과물 검수와 미해결 분쟁 처리가 끝나야 완료할 수 있습니다.', signedGate: '계약 서명이 완료되면 마일스톤을 등록할 수 있습니다.', blank: '파일을 첨부하거나 결과물을 10자 이상 설명해 주세요.', unavailable: '파일을 열 수 없습니다. 새로고침하거나 운영팀에 문의해 주세요.', pending: '저장 중…', noHistory: '아직 제출된 결과물이 없습니다.', consent: '프로젝트 완료 사실을 기록하는 절차이며 전자계약 서명은 아닙니다.', passport: '검증된 프로젝트 수행 기록', approved: '검수 승인', rejected: '수정 요청', submitted: '검수 대기', scheduled: '예정', active: '진행 중', funded: '대금 확보', issued: '계약 발행', completed: '완료', cancelled: '취소' }
};
const field = 'mt-2 w-full rounded-xl border border-neutral-300 bg-white p-3 text-base leading-6 focus:ring-2 focus:ring-teal-700';
const button = 'rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40';
type Submission = {
    id: string;
    version: number;
    notes: string;
    created_at: string;
    review_feedback?: string;
    review_decision?: string;
    files: Array<{
        name: string;
        url: string | null;
    }>;
};
export default function DeliveryWorkspace({ snapshot, refresh }: {
    snapshot: TrustSnapshot;
    refresh: () => Promise<void>;
}) {
    const { currentUser } = useApp();
    const { locale } = useLocale();
    const t = copy[locale];
    const [selected, setSelected] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [draft, setDraft] = useState({ title: '', deliverable: '', dueAt: '', amountKrw: '' });
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [files, setFiles] = useState<Record<string, File | null>>({});
    const uploaded = useRef<Record<string, string>>({});
    const keys = useRef(new Map<string, string>());
    const [feedback, setFeedback] = useState<Record<string, string>>({});
    const [history, setHistory] = useState<Record<string, Submission[]>>({});
    const [historyBusy, setHistoryBusy] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const contract = snapshot.contracts.find(c => c.id === selected) || snapshot.contracts[0];
    const milestones = snapshot.milestones.filter(m => m.contractId === contract?.id);
    const company = contract?.companyId === currentUser?.uid;
    const student = contract?.talentId === currentUser?.uid;
    const done = contract?.status === 'completed';
    const mine = company ? contract?.company_completed_at : student ? contract?.student_completed_at : false;
    const completedMilestones = milestones.length > 0 && milestones.every(m => ['approved', 'paid', 'payout_ready', 'cancelled'].includes(String(m.status))) && milestones.some(m => m.status !== 'cancelled');
    const remainingBudget = Math.max(0, Number(contract?.monthlyAmountKrw || 0) - milestones.filter(m => m.status !== 'cancelled').reduce((sum, m) => sum + Number(m.amountKrw || 0), 0));
    const canSchedule = company && !mine && !contract?.student_completed_at && remainingBudget >= 1000 && ['signed', 'funded', 'active'].includes(String(contract?.status));
    const funded = snapshot.payments.some(p => p.contractId === contract?.id && ['funds_secured', 'paid'].includes(String(p.status)) && Number(p.amountKrw) >= Number(contract?.monthlyAmountKrw));
    const canFinish = (company || student) && !mine && !done && completedMilestones && funded;
    const status = (value: unknown) => t[String(value) as keyof typeof t] || String(value || '—');
    useEffect(() => { setConfirmed(false); setMessage(''); }, [contract?.id]);
    async function command(path: string, body: Record<string, unknown>) {
        const identity = path + JSON.stringify(body);
        const key = keys.current.get(identity) || `delivery:${crypto.randomUUID()}`;
        keys.current.set(identity, key);
        const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': key, 'X-KONEXA-Locale': locale }, body: JSON.stringify(body) });
        const value = await response.json().catch(() => ({}));
        if (!response.ok)
            throw new Error(value.error?.message || t.failed);
        keys.current.delete(identity);
        return value.data;
    }
    async function run(action: () => Promise<void>) {
        if (busy)
            return;
        setBusy(true);
        setMessage('');
        try {
            await action();
            await refresh();
            setMessage(t.saved);
        }
        catch (cause) {
            setMessage(`${t.failed} ${cause instanceof Error ? cause.message : ''}`);
        }
        finally {
            setBusy(false);
        }
    }
    async function loadHistory(id: string) {
        setHistoryBusy(id);
        try {
            const response = await fetch(`/api/v2/milestones/${id}/submissions`, { cache: 'no-store' });
            const value = await response.json();
            if (!response.ok)
                throw new Error(value.error?.message || t.failed);
            setHistory(h => ({ ...h, [id]: value.data }));
        }
        catch (cause) {
            setMessage(cause instanceof Error ? cause.message : t.failed);
        }
        finally {
            setHistoryBusy('');
        }
    }
    async function submit(id: string) {
        await run(async () => {
            if (!uploaded.current[id] && files[id])
                uploaded.current[id] = await uploadPrivateFile('project-deliverables', currentUser!.uid, files[id]!);
            const paths = uploaded.current[id] ? [uploaded.current[id]] : [];
            if ((notes[id] || '').trim().length < 10 && !paths.length)
                throw new Error(t.blank);
            await command(`/api/v2/milestones/${id}/submissions`, { notes: notes[id] || '', storagePaths: paths });
            delete uploaded.current[id];
            setFiles(f => ({ ...f, [id]: null }));
            setNotes(n => ({ ...n, [id]: '' }));
            await loadHistory(id);
        });
    }
    return <section data-no-translate className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7 lg:col-span-2">
    <header><h2 className="text-xl font-bold leading-8">{t.title}</h2><p className="mt-2 max-w-3xl text-base leading-7 text-neutral-600">{t.intro}</p></header>
    {message && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm leading-6">{message}</p>}
    {!contract ? <p className="text-base leading-7">{t.empty}</p> : <>
      <label className="block text-sm font-semibold">{t.contract}<select className={field} value={contract.id} onChange={e => setSelected(e.target.value)}>{snapshot.contracts.map(c => <option key={c.id} value={c.id}>{String(c.title)}</option>)}</select></label>
      <p className="text-sm">{t.stage}: {status(contract.status)}</p><p className="rounded-xl bg-neutral-50 p-4 text-sm leading-6">{t.gate}</p>
      {canSchedule ? <form onSubmit={(e: FormEvent) => { e.preventDefault(); void run(async () => { await command('/api/v2/milestones', { ...draft, contractId: contract.id, amountKrw: Number(draft.amountKrw), dueAt: new Date(`${draft.dueAt}T23:59:00`).toISOString() }); setDraft({ title: '', deliverable: '', dueAt: '', amountKrw: '' }); }); }} className="grid gap-4 rounded-2xl border border-neutral-200 p-4 sm:grid-cols-2">
        <label className="text-sm font-semibold sm:col-span-2">{t.name}<input className={field} required minLength={3} maxLength={200} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label>
        <label className="text-sm font-semibold sm:col-span-2">{t.result}<textarea className={field} required minLength={10} maxLength={10000} rows={3} value={draft.deliverable} onChange={e => setDraft({ ...draft, deliverable: e.target.value })}/></label>
        <label className="text-sm font-semibold">{t.due}<input type="date" className={field} required value={draft.dueAt} onChange={e => setDraft({ ...draft, dueAt: e.target.value })}/></label>
        <label className="text-sm font-semibold">{t.amount}<input type="number" className={field} required min={1000} max={remainingBudget} value={draft.amountKrw} onChange={e => setDraft({ ...draft, amountKrw: e.target.value })}/></label>
        <button className={button} disabled={busy}>{busy ? t.pending : t.create}</button>
      </form> : company && !done && !['signed', 'funded', 'active'].includes(String(contract.status)) ? <p className="text-sm text-neutral-600">{t.signedGate}</p> : null}
      {!milestones.length && <p>{t.noMilestones}</p>}
      {milestones.map(m => <article key={m.id} className="space-y-4 rounded-2xl border border-neutral-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-lg font-bold">{String(m.title)}</h3><span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-900">{status(m.status)}</span></div>
        <p className="whitespace-pre-wrap break-words text-base leading-7">{String(m.deliverable)}</p>
        <p className="text-sm text-neutral-600">{t.due}: {new Date(String(m.dueAt)).toLocaleDateString(locale)} · {new Intl.NumberFormat(locale).format(Number(m.amountKrw))} KRW</p>
        <button type="button" className="text-sm font-semibold underline" onClick={() => void loadHistory(m.id)} disabled={Boolean(historyBusy)}>{historyBusy === m.id ? t.loading : t.history}</button>
        {history[m.id]?.length === 0 && <p>{t.noHistory}</p>}
        {history[m.id]?.map(s => <div key={s.id} className="space-y-2 rounded-xl bg-neutral-50 p-4"><p className="text-sm font-semibold">v{s.version} · {new Date(s.created_at).toLocaleString(locale)}</p><p className="whitespace-pre-wrap break-words leading-7">{s.notes}</p>{s.files.map((f, i) => f.url ? <a key={i} className="block break-all text-sm underline" href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a> : <p key={i} className="text-sm">{t.unavailable}</p>)}{s.review_feedback && <p className="whitespace-pre-wrap border-l-2 border-teal-600 pl-3 leading-7">{status(s.review_decision)}: {s.review_feedback}</p>}</div>)}
        {student && funded && ['scheduled', 'in_progress', 'rejected'].includes(String(m.status)) && <div className="space-y-4">
          <label className="block text-sm font-semibold">{t.notes}<textarea className={field} rows={4} maxLength={10000} value={notes[m.id] || ''} onChange={e => setNotes({ ...notes, [m.id]: e.target.value })}/></label>
          <label className="block text-sm font-semibold">{t.file}<input className={field} type="file" accept=".pdf,.zip,.txt,.jpg,.jpeg,.png,.json" disabled={busy} onChange={e => { setFiles({ ...files, [m.id]: e.target.files?.[0] || null }); delete uploaded.current[m.id]; }}/></label>
          <button type="button" className={button} disabled={busy} onClick={() => void submit(m.id)}>{busy ? t.pending : t.submit}</button>
        </div>}
        {company && m.status === 'submitted' && <div className="space-y-4"><label className="block text-sm font-semibold">{t.feedback}<textarea className={field} rows={3} maxLength={5000} value={feedback[m.id] || ''} onChange={e => setFeedback({ ...feedback, [m.id]: e.target.value })}/></label><div className="flex flex-wrap gap-3">{(['approved', 'rejected'] as const).map(decision => <button key={decision} type="button" className={button} disabled={busy || (feedback[m.id] || '').trim().length < 10} onClick={() => void run(async () => { await command(`/api/v2/milestones/${m.id}/review`, { decision, feedback: feedback[m.id] }); await loadHistory(m.id); })}>{decision === 'approved' ? t.approve : t.revise}</button>)}</div></div>}
      </article>)}
      {done ? <p className="rounded-xl bg-teal-50 p-4 leading-7">{t.complete}</p> : mine ? <p className="rounded-xl bg-teal-50 p-4 leading-7">{t.waiting}</p> : canFinish && <div className="space-y-4"><label className="flex gap-3 text-base leading-7"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>{t.confirm}</label><p className="text-sm text-neutral-500">{t.consent}</p><button type="button" className={button} disabled={busy || !confirmed} onClick={() => void run(async () => { await command(`/api/v2/contracts/${contract.id}/completion`, {}); setConfirmed(false); })}>{t.finish}</button></div>}
    </>}
    {snapshot.workPassport.length > 0 && <div><h3 className="text-lg font-bold">{t.passport}</h3>{snapshot.workPassport.map(p => <p key={p.id} className="mt-2 rounded-xl bg-teal-50 p-4">{String((p.evidence as any)?.title || p.evidence_type)}</p>)}</div>}
  </section>;
}
