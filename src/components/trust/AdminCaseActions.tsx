import { useRef, useState } from 'react';
import type { TrustSnapshot } from '../../lib/trustOperations';
import { useLocale } from '../../i18n/LocaleContext';
export default function AdminCaseActions({ snapshot, refresh }: {
    snapshot: TrustSnapshot;
    refresh: () => Promise<void>;
}) {
    const { locale } = useLocale();
    const t = (ko: string, en: string) => locale === 'ko' ? ko : en;
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [resume, setResume] = useState<Record<string, boolean>>({});
    const [busy, setBusy] = useState('');
    const [message, setMessage] = useState('');
    const keys = useRef(new Map<string, string>());
    async function act(id: string, path: string, body: Record<string, unknown>) {
        if (busy)
            return;
        setBusy(id);
        setMessage('');
        try {
            const identity = path + JSON.stringify(body);
            const key = keys.current.get(identity) || `admin-case:${crypto.randomUUID()}`;
            keys.current.set(identity, key);
            const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': key, 'X-KONEXA-Locale': locale }, body: JSON.stringify(body) });
            const v = await r.json();
            if (!r.ok)
                throw new Error(v.error?.message || t('요청을 저장하지 못했습니다. 다시 시도해 주세요.', 'Could not save the request. Please retry.'));
            await refresh();
            keys.current.delete(identity);
            setMessage(t('처리 결과와 알림을 저장했습니다.', 'Decision and notifications saved.'));
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy('');
        }
    }
    const button = 'rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold disabled:opacity-40';
    return <section data-no-translate className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6">
    <h2 className="text-xl font-bold">{t('리뷰·분쟁 처리', 'Review and dispute decisions')}</h2>
    <p className="text-base leading-7 text-neutral-600">{t('실제 제출 기록을 확인한 후 처리하세요. 분쟁 해결 기록은 환불이나 정산을 실행하지 않습니다.', 'Review the submitted evidence before deciding. Resolving a case does not execute a refund or payout.')}</p>
    {message && <p role="status" className="rounded-xl bg-amber-50 p-3">{message}</p>}
    {snapshot.reviews.filter(r => r.moderationStatus === 'pending').map(r => <article key={r.id} className="space-y-3 rounded-xl border p-4"><p className="text-sm">{t('리뷰 검토', 'Review moderation')} · {String(r.reviewerRole)}</p><p className="whitespace-pre-wrap break-words leading-7">{String(r.comment)}</p><div className="flex gap-3"><button className={button} disabled={!!busy} onClick={() => void act(r.id, `/api/v2/admin/reviews/${r.id}/moderate`, { decision: 'approved' })}>{t('내용 검토 승인', 'Approve content')}</button><button className={button} disabled={!!busy} onClick={() => void act(r.id, `/api/v2/admin/reviews/${r.id}/moderate`, { decision: 'rejected' })}>{t('게시 제한', 'Do not publish')}</button></div></article>)}
    {snapshot.disputes.map(d => <article key={d.id} className="space-y-3 rounded-xl border p-4"><p className="text-sm font-semibold">{String(d.category)} · {String(d.status)}</p><p className="whitespace-pre-wrap break-words leading-7">{String(d.summary)}</p>{['resolved', 'closed'].includes(String(d.status)) ? <p className="whitespace-pre-wrap leading-7">{String((d.resolution as any)?.summary || '')}</p> : <><label className="block text-sm">{t('확인한 근거와 처리 결과(20자 이상)', 'Evidence and resolution (at least 20 characters)')}<textarea className="mt-2 w-full rounded-xl border p-3 text-base leading-7" rows={4} maxLength={5000} value={notes[d.id] || ''} onChange={e => setNotes({ ...notes, [d.id]: e.target.value })}/></label><label className="flex gap-3 text-sm leading-6"><input type="checkbox" checked={resume[d.id] || false} onChange={e => setResume({ ...resume, [d.id]: e.target.checked })}/>{t('다른 미해결 분쟁이 없으면 증빙에 맞는 진행 상태로 복구', 'Restore the evidence-backed workflow state if no other dispute remains')}</label><button className={button} disabled={!!busy || (notes[d.id] || '').trim().length < 20} onClick={() => void act(d.id, `/api/v2/admin/disputes/${d.id}/resolve`, { summary: notes[d.id], resume: !!resume[d.id] })}>{t('분쟁 처리 결과 저장', 'Save case resolution')}</button></>}</article>)}
    {!snapshot.disputes.length && !snapshot.reviews.some(r => r.moderationStatus === 'pending') && <p className="text-neutral-600">{t('검토할 리뷰나 분쟁이 없습니다.', 'No reviews or disputes awaiting a decision.')}</p>}
  </section>;
}
