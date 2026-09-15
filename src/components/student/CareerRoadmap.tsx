import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLocale } from '../../i18n/LocaleContext';
import { useToast } from '../ui/Toast';
import { useAssessmentHistory } from '../../lib/useAssessmentHistory';
import AssessmentHistoryStatus from '../ai/AssessmentHistoryStatus';
export default function CareerRoadmap() {
    const { currentUser, studentProfile, updateStudentProfile } = useApp();
    const { locale } = useLocale();
    const { success, error } = useToast();
    const t = (ko: string, en: string) => locale === 'ko' ? ko : en;
    const [vision, setVision] = useState(studentProfile?.careerVision || studentProfile?.preferredJob || '');
    const [hours, setHours] = useState(String(studentProfile?.availableHoursPerWeek || ''));
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [busy, setBusy] = useState(false);
    const inFlight = useRef(false);
    const controller = useRef<AbortController | null>(null);
    const history = useAssessmentHistory('student_career_roadmap', currentUser?.uid || '');
    const [result, setResult] = useState<any>(null);
    useEffect(() => { if (!dirty) {
        setVision(studentProfile?.careerVision || studentProfile?.preferredJob || '');
        setHours(String(studentProfile?.availableHoursPerWeek || ''));
    } }, [studentProfile?.careerVision, studentProfile?.preferredJob, studentProfile?.availableHoursPerWeek, dirty]);
    useEffect(() => { setResult(history.rows[0]?.result || null); }, [history.rows]);
    useEffect(() => () => controller.current?.abort(), []);
    async function save() {
        if (saving)
            return false;
        const n = Number(hours);
        if (!vision.trim() || vision.length > 500 || (hours && (!Number.isFinite(n) || n < 1 || n > 80))) {
            error('Profile', t('목표는 500자 이내, 주당 가능 시간은 1~80시간으로 입력해 주세요.', 'Enter a goal under 500 characters and 1–80 available hours per week.'));
            return false;
        }
        setSaving(true);
        try {
            const saved = await updateStudentProfile({ careerVision: vision.trim(), availableHoursPerWeek: hours ? n : null });
            if (saved)
                setDirty(false);
            return saved;
        }
        finally {
            setSaving(false);
        }
    }
    async function generate() {
        if (inFlight.current || history.loading)
            return;
        inFlight.current = true;
        setBusy(true);
        const request = new AbortController();
        controller.current = request;
        const timer = setTimeout(() => request.abort(), 55000);
        try {
            if (dirty && !await save())
                return;
            const response = await fetch('/api/ai/student-roadmap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal, body: JSON.stringify({ careerGoal: vision, locale }) });
            const body = await response.json();
            if (!response.ok)
                throw new Error(body.error || 'Analysis failed');
            setResult(body);
            history.reload();
            success('AI', t('로드맵을 생성하고 저장했습니다.', 'Roadmap generated and saved.'));
        }
        catch {
            error('AI', t('분석을 완료하지 못했습니다. 입력은 유지됩니다. 시간 초과였다면 저장된 분석을 다시 불러와 주세요.', 'Analysis did not complete. Your draft is preserved. After a timeout, reload saved analysis before retrying.'));
        }
        finally {
            clearTimeout(timer);
            inFlight.current = false;
            setBusy(false);
        }
    }
    return <div data-no-translate className="mx-auto max-w-6xl space-y-6 p-6 pb-20">
    <header><h1 className="text-2xl font-bold tracking-tight">{t('나의 성장 로드맵', 'Your growth roadmap')}</h1><p className="mt-2 text-sm leading-6 text-neutral-600">{t('실제 프로필과 등록된 공고를 바탕으로 다음 단계를 정리합니다. 학습 제안은 취업이나 비자 발급을 보장하지 않습니다.', 'Plan your next steps using your profile and listed projects. Suggestions do not guarantee employment or a visa.')}</p></header>
    <section className="space-y-4 rounded-2xl border bg-white p-6">
      <label className="block text-sm font-semibold" htmlFor="career-vision">{t('진로 목표', 'Career goal')}</label>
      <textarea id="career-vision" value={vision} maxLength={500} disabled={busy || saving} onChange={e => { setVision(e.target.value); setDirty(true); }} rows={3} className="w-full rounded-xl border p-3 text-sm leading-6"/>
      <label className="block text-sm" htmlFor="weekly-availability">{t('주당 업무 가능 시간 (선택)', 'Available hours per week (optional)')}</label>
      <input id="weekly-availability" type="number" min={1} max={80} value={hours} disabled={busy || saving} onChange={e => { setHours(e.target.value); setDirty(true); }} className="w-40 rounded-xl border p-3 text-sm"/>
      <div className="flex flex-wrap gap-3"><button onClick={save} disabled={!dirty || busy || saving} className="rounded-xl border px-4 py-3 text-sm disabled:opacity-40"><Save className="mr-2 inline h-4 w-4"/>{saving ? t('저장 중', 'Saving') : t('목표 저장', 'Save goal')}</button><button onClick={generate} disabled={busy || saving || history.loading} className="rounded-xl bg-neutral-950 px-4 py-3 text-sm text-white disabled:opacity-40"><RefreshCw className={`mr-2 inline h-4 w-4 ${busy ? 'animate-spin' : ''}`}/>{busy ? t('분석 중', 'Analyzing') : t('새 로드맵 만들기', 'Generate roadmap')}</button></div>
    </section>
    <AssessmentHistoryStatus {...history} createdAt={history.rows[0]?.created_at} onReload={history.reload}/>
    {result && <><p className="rounded-2xl bg-teal-50 p-5 text-sm leading-7">{result.summary}</p><div className="grid gap-6 md:grid-cols-[2fr_1fr]"><section className="space-y-4 rounded-2xl border bg-white p-6"><h2 className="font-semibold">{t('실행 단계', 'Action steps')}</h2>{(result.milestones || []).map((item: any, index: number) => <article key={`${index}-${item.title}`} className="rounded-xl border p-4"><h3 className="text-sm font-semibold">{index + 1}. {item.title}</h3><p className="mt-2 text-sm leading-6">{item.nextAction}</p>{item.evidenceNeeded && <p className="mt-2 text-sm leading-6 text-neutral-500">{t('확인할 근거: ', 'Evidence needed: ')}{item.evidenceNeeded}</p>}</article>)}</section><aside className="space-y-6">{[['skillGaps', t('보완할 역량', 'Skills to develop')], ['learningActions', t('학습 제안', 'Learning suggestions')]].map(([key, title]) => <section key={key} className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">{title}</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">{(result[key] || []).map((item: string, i: number) => <li key={`${i}-${item}`}>{item}</li>)}</ul></section>)}</aside></div></>}
  </div>;
}
