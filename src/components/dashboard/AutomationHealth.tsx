import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../../i18n/LocaleContext';
export default function AutomationHealth() {
    const { locale } = useLocale();
    const t = (ko: string, en: string) => locale === 'ko' ? ko : en;
    const [data, setData] = useState<Record<string, any> | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const controller = useRef<AbortController | null>(null);
    async function refresh() {
        controller.current?.abort();
        const request = new AbortController();
        controller.current = request;
        const timer = setTimeout(() => request.abort(), 15000);
        setBusy(true);
        setError(false);
        try {
            const response = await fetch('/api/v2/admin/automation-health', { signal: request.signal });
            if (!response.ok)
                throw new Error('UNAVAILABLE');
            const body = await response.json();
            if (!request.signal.aborted)
                setData(body.data);
        }
        catch {
            if (controller.current === request)
                setError(true);
        }
        finally {
            clearTimeout(timer);
            if (controller.current === request)
                setBusy(false);
        }
    }
    useEffect(() => { void refresh(); return () => { controller.current?.abort(); controller.current = null; }; }, []);
    const fields = [
        ['openProjects', t('모집 중인 공고', 'Open projects')],
        ['pendingVerifications', t('사람의 검토가 필요한 인증', 'Verification reviews pending')],
        ['queuedNotifications', t('알림 처리 대기', 'Queued notifications')],
        ['delayedNotifications', t('15분 이상 지연 알림', 'Notifications delayed over 15 min')],
        ['deadLetters', t('재시도 한도 초과 알림', 'Exhausted notification retries')],
        ['aiCompleted24h', t('24시간 내 AI 분석 완료', 'AI assessments completed in 24h')],
        ['aiFailed24h', t('24시간 내 AI 분석 실패', 'AI assessments failed in 24h')],
        ['aiStale', t('완료 확인이 필요한 AI 작업', 'AI jobs needing recovery review')],
    ];
    return <section data-no-translate className="space-y-5 rounded-2xl border bg-white p-6">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold">{t('자동 운영 점검', 'Automation health')}</h2><button disabled={busy} onClick={refresh} className="rounded-lg border px-3 py-2 text-sm">{t('새로고침', 'Refresh')}</button></div>
    {error && <p role="alert" className="text-sm text-rose-700">{t('운영 현황을 불러오지 못했습니다. 이전 수치는 최신 상태가 아닐 수 있습니다.', 'Could not refresh health. Previous figures may be stale.')}</p>}
    {busy && <p role="status" className="text-sm">{t('확인 중입니다.', 'Checking.')}</p>}
    {data && <><p className="text-sm text-neutral-500">{new Date(data.checkedAt).toLocaleString(locale)}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{fields.map(([key, label]) => <div key={key} className={`rounded-xl border p-4 ${['delayedNotifications', 'deadLetters', 'aiStale'].includes(key) && data[key] > 0 ? 'border-amber-400 bg-amber-50' : 'border-neutral-200'}`}><p className="text-sm leading-6">{label}</p><b className="mt-2 block text-2xl">{data[key] ?? '—'}</b></div>)}</div></>}
    <p className="text-sm leading-7 text-neutral-600">{t('현재 자동화는 분석 기록·재시도·알림 처리를 지원합니다. 인증 승인, 최종 인재 선정, 계약·환불·분쟁 결정은 운영자가 검토합니다. 정기 알림 복구는 현재 하루 1회이므로 상업용 호스팅 전환 후 더 짧은 주기로 운영해야 합니다.', 'Automation supports saved assessments, retries and notifications. Operators review verification, final selection, contracts, refunds and disputes. Scheduled notification recovery currently runs daily; use a shorter schedule after moving to commercial hosting.')}</p>
  </section>;
}
