import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../i18n/LocaleContext';
import { roleLabel } from '../../lib/talentTaxonomy';
import MatchCriteria, { criterionLabel } from '../ai/MatchCriteria';
import type { summarizeMember, summarizeProject } from '../../server/decisionSupport';
import type { shortlistCandidates } from '../../server/matching';
type Member = ReturnType<typeof summarizeMember>;
type Project = ReturnType<typeof summarizeProject>;
type Workspace = {
    members: Member[];
    projects: Project[];
    generatedAt: string;
    matching: (ReturnType<typeof shortlistCandidates> & {
        projectId: string;
    }) | null;
};
const box = 'rounded-2xl border border-neutral-200 bg-white p-5';
const control = 'min-w-0 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm';
export default function AdminDecisionWorkspace() {
    const { locale } = useLocale();
    const t = (ko: string, en: string) => locale === 'ko' ? ko : en;
    const [data, setData] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);
    const [failure, setFailure] = useState('');
    const [projectId, setProjectId] = useState('');
    const [role, setRole] = useState('all');
    const [query, setQuery] = useState('');
    const [reviewOnly, setReviewOnly] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const [revision, setRevision] = useState(0);
    const [analyzing, setAnalyzing] = useState('');
    const [analysisMessage, setAnalysisMessage] = useState('');
    const [evidence, setEvidence] = useState<{
        id: string;
        kind: string;
        url: string;
        expires: number;
    } | null>(null);
    const [evidenceMessage, setEvidenceMessage] = useState('');
    const generation = useRef(0);
    useEffect(() => {
        const seq = ++generation.current;
        const request = new AbortController();
        const timer = setTimeout(() => request.abort(), 20000);
        setLoading(true);
        setFailure('');
        setData(null);
        void fetch(`/api/admin/decision-workspace${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`, { signal: request.signal })
            .then(async (response) => { if (!response.ok)
            throw new Error('LIVE_DATA_UNAVAILABLE'); return response.json(); })
            .then(body => { if (generation.current === seq)
            setData(body); })
            .catch(() => { if (generation.current === seq)
            setFailure('load'); })
            .finally(() => { clearTimeout(timer); if (generation.current === seq)
            setLoading(false); });
        return () => { generation.current++; request.abort(); };
    }, [projectId, revision]);
    const filtered = useMemo(() => {
        const q = query.trim().toLocaleLowerCase();
        const members = (data?.members || []).filter(member => (role === 'all' || member.role === role)
            && (!reviewOnly || member.missing.length || member.ai.state !== 'current')
            && `${member.name} ${member.declaredRoles.join(' ')} ${member.roles.map(id => roleLabel(id, locale)).join(' ')} ${member.skills.join(' ')} ${member.languages.join(' ')}`.toLocaleLowerCase().includes(q));
        if (!data?.matching)
            return members;
        const order = new Map<string, number>(data.matching.candidates.map((candidate, index) => [candidate.id, index]));
        return members.filter(member => order.has(member.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    }, [data, role, reviewOnly, query, locale]);
    const member = data?.members.find(item => item.id === selectedId) || filtered[0];
    const candidate = data?.matching?.candidates.find(item => item.id === member?.id);
    const excluded = data?.matching?.exclusions.find(item => item.id === member?.id);
    const project = data?.projects.find(item => item.id === projectId);
    const needs = data?.members.filter(item => item.missing.length || item.ai.state !== 'current').length;
    const aiState = (state: string) => ({ current: t('최신 분석', 'Current analysis'), stale: t('입력 변경 · 재분석 필요', 'Changed · refresh analysis'), not_analyzed: t('AI 미분석', 'Not analyzed'), failed: t('최근 분석 실패 · 재시도 가능', 'Last attempt failed · retry'), pending: t('분석 진행·저장 확인 중', 'Analysis pending') }[state] || state);
    async function analyze(target: Member) {
        if (analyzing)
            return;
        setAnalyzing(target.id);
        setAnalysisMessage('');
        try {
            const response = await fetch('/api/gemini/analyze-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: target.role, profileOwnerId: target.id, locale }), signal: AbortSignal.timeout(55000) });
            if (!response.ok) {
                const body = await response.json().catch(() => null);
                throw new Error(body?.code || 'ANALYSIS_INCOMPLETE');
            }
            setAnalysisMessage(t('분석을 저장했습니다.', 'Analysis saved.'));
        }
        catch (error) {
            const code = error instanceof Error ? error.message : '';
            setAnalysisMessage(['AI_PROVIDER_UNAVAILABLE', 'AI_TIMEOUT', 'AI_RATE_LIMITED'].includes(code)
                ? t('AI 제공업체가 일시적으로 응답하지 않습니다. 프로필은 저장되어 있으며 수정할 필요가 없습니다. 잠시 후 분석만 다시 실행해 주세요.', 'The AI provider is temporarily unavailable. The saved profile does not need editing. Retry analysis later.')
                : code === 'AI_STORAGE_ERROR' ? t('분석 기록 저장을 확인하지 못했습니다. 프로필을 다시 작성하지 말고 운영 저장소 상태를 확인해 주세요.', 'Analysis storage could not be confirmed. Do not re-enter the profile; check the operations storage status.')
                    : t('분석을 완료하지 못했습니다. 기존 프로필은 그대로 보존됩니다. 정보를 확인한 뒤 재시도해 주세요.', 'Analysis did not complete. The profile is unchanged. Check the evidence and retry.'));
        }
        finally {
            setAnalyzing('');
            setRevision(value => value + 1);
        }
    }
    async function openEvidence(target: Member, kind: string) {
        setEvidence(null);
        setEvidenceMessage('');
        try {
            const response = await fetch(`/api/admin/member-evidence/${encodeURIComponent(target.id)}?role=${target.role}&kind=${kind}`, { signal: AbortSignal.timeout(15000) });
            if (!response.ok)
                throw new Error('EVIDENCE_UNAVAILABLE');
            const body = await response.json();
            const url = new URL(body.url);
            if (url.protocol !== 'https:')
                throw new Error('UNSAFE_URL');
            setEvidence({ id: target.id, kind, url: url.href, expires: Date.now() + 60000 });
        }
        catch {
            setEvidenceMessage(t('파일을 열지 못했습니다. 다시 시도하거나 재업로드를 요청해 주세요.', 'The file could not be opened. Retry or request a new upload.'));
        }
    }
    return <div data-no-translate className="space-y-5 break-keep text-neutral-900">
    <header className={`${box} flex flex-wrap items-start justify-between gap-4`}>
      <div><h2 className="text-xl font-bold">{t('인재·기업 검토실', 'Talent & company review')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">{t('실제 입력 → 조건 비교 → 확인 질문 순서로 검토합니다. 관심 직무와 검증된 역량은 다르며, AI가 승인·거절을 결정하지 않습니다.', 'Review actual inputs, compare conditions, then verify evidence. Role interests are not proven skills. AI does not approve or reject people.')}</p></div>
      <button className={control} disabled={loading} onClick={() => setRevision(value => value + 1)}>{t('새로고침', 'Refresh')}</button>
    </header>
    {loading && <p role="status" className={box}>{t('실제 데이터를 불러오는 중입니다.', 'Loading live records.')}</p>}
    {failure && <div role="alert" className={`${box} text-rose-800`}>{t('데이터를 불러오지 못했습니다. 회원이 없다는 뜻이 아닙니다. 새로고침해 주세요.', 'Data could not be loaded. This does not mean there are no members. Please retry.')}</div>}
    {analysisMessage && <p role="status" className={`${box} text-sm leading-6`}>{analysisMessage}</p>}
    {data && <>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600"><span>{t('실제 회원', 'Members')}: {data.members.length}</span><span>{t('확인할 회원', 'Needs review')}: {needs}</span><span>{t('모집 공고', 'Open projects')}: {data.projects.filter(item => item.status === 'open').length}</span><span>{new Date(data.generatedAt).toLocaleString(locale)}</span></div>
      <section className={`${box} space-y-3`}>
        <div className="grid gap-3 md:grid-cols-[1fr_170px_1fr]">
          <input aria-label={t('회원 검색', 'Search members')} className={control} value={query} onChange={event => { setQuery(event.target.value); setSelectedId(''); }} placeholder={t('이름·직무·역량·언어 검색', 'Name, role, skill or language')}/>
          <select aria-label={t('회원 유형', 'Member type')} className={control} value={role} onChange={event => { setRole(event.target.value); setSelectedId(''); }}><option value="all">{t('전체 회원', 'All members')}</option><option value="student">{t('인재', 'Talent')}</option><option value="company">{t('기업', 'Companies')}</option></select>
          <select aria-label={t('매칭할 공고', 'Project to compare')} className={control} value={projectId} onChange={event => { setProjectId(event.target.value); setRole('all'); setSelectedId(''); }}><option value="">{t('공고 선택 없이 회원 검토', 'Review members without a project')}</option>{data.projects.filter(item => item.status === 'open').map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reviewOnly} onChange={event => { setReviewOnly(event.target.checked); setSelectedId(''); }}/>{t('정보 보완·재분석이 필요한 회원만', 'Only missing evidence or analysis needing attention')}</label>
        {!data.projects.length && <p className="text-sm leading-6 text-amber-900">{t('등록된 실제 공고가 없습니다. 회원 분석은 가능하지만, 기업별 매칭에는 업무 범위와 결과물이 적힌 공고가 필요합니다.', 'No real projects are registered. Profiles can be reviewed; matching needs a project with scope and deliverables.')}</p>}
      </section>
      {project && <section className={`${box} space-y-3`}><h3 className="font-bold">{project.title}</h3><p className="text-sm leading-6">{project.description}</p><div className="flex flex-wrap gap-2 text-sm"><span>{project.mode}</span><span>{project.hours ?? '—'} h / {t('주', 'week')}</span><span>₩{project.weeklyPay?.toLocaleString() ?? '—'} / {t('주', 'week')}</span><span>{project.languages || '—'}</span></div><p className="text-sm leading-6">{t('필수 결과물', 'Deliverables')}: {project.deliverables.join(' · ') || '—'}</p>{project.missing.length > 0 && <p className="text-sm text-amber-900">{t('공고 보완', 'Clarify project')}: {project.missing.map(key => criterionLabel(key, locale)).join(' · ')}</p>}</section>}
      {data.matching && <section className={`${box} text-sm leading-6`}><p>{t('공개·완성 조건을 충족한 인재', 'Visible, complete profiles')}: {data.matching.scanned} · {t('조건 충돌', 'Conflicts')}: {data.matching.excluded} · {t('관련 근거 부족', 'Insufficient relevance evidence')}: {data.matching.insufficientEvidence} · {t('검토 후보', 'Review candidates')}: {data.matching.eligible}</p><p className="mt-1 text-xs text-neutral-600">{t('등록 역량과 관심 직무 기준의 우선 검토 순서이며 최대 30명을 표시합니다. 자동 채용 결정이 아닙니다.', 'Prioritized by declared skills and role interest; up to 30 shown. This is not an automated hiring decision.')}</p>{data.matching.exclusions.length > 0 && <details className="mt-3"><summary className="cursor-pointer font-semibold">{t('후보에서 빠진 이유 보기', 'Why profiles were not shortlisted')}</summary><div className="mt-2 space-y-2">{data.matching.exclusions.slice(0, 50).map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className="block w-full rounded-lg bg-neutral-50 p-2 text-left">{data.members.find(member => member.id === item.id)?.name || item.id.slice(-6)}: {item.reasons.map(key => criterionLabel(key, locale)).join(' · ')}</button>)}</div></details>}</section>}
      <div className="grid items-start gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
        <section className={`${box} max-h-[700px] space-y-2 overflow-y-auto`} aria-label={t('검토 목록', 'Review list')}>
          {filtered.length === 0 && <p className="text-sm leading-6 text-neutral-600">{t('이 조건에 해당하는 회원이 없습니다. 필터 또는 공고 조건을 확인해 주세요.', 'No members match these filters. Check the filters or project requirements.')}</p>}
          {filtered.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-3 text-left ${item.id === member?.id ? 'border-teal-800 bg-teal-50' : 'border-neutral-200 hover:bg-neutral-50'}`}><b className="block text-sm">{item.name || t('이름 미입력', 'Unnamed')}</b><span className="mt-1 block text-xs leading-5 text-neutral-600">{item.role === 'company' ? t('기업', 'Company') : t('인재', 'Talent')} · {item.roles.map(id => roleLabel(id, locale)).join(' · ') || item.declaredRoles.join(' · ') || t('직무 미입력', 'Role missing')}</span><span className="mt-2 block text-xs">{item.missing.length ? `${t('확인할 정보', 'Missing details')} ${item.missing.length}` : t('주요 정보 입력됨', 'Core details provided')} · {aiState(item.ai.state)}</span></button>)}
        </section>
        {member && <article className={`${box} min-w-0 space-y-5`}>
          <header><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-xl font-bold">{member.name || '—'}</h3><button disabled={!!analyzing} onClick={() => void analyze(member)} className="rounded-xl bg-teal-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{analyzing === member.id ? t('AI 분석 중', 'Analyzing') : t('AI 요약·확인 질문 생성', 'Generate AI review')}</button></div><p className="mt-2 text-xs leading-5 text-neutral-600">{t('가입', 'Registration')}: {member.complete ? t('프로필 작성 완료', 'Profile complete') : t('작성 중', 'Draft')} · {t('계정', 'Account')}: {member.status} · {t('신원·기업 검증', 'Identity/business verification')}: {member.verification}</p>{!member.visible && <p className="mt-2 text-sm text-amber-900">{t('비공개 프로필: 기업 매칭 후보에 노출하지 않습니다.', 'Private profile: excluded from company discovery.')}</p>}</header>
          <section className="space-y-2 text-sm leading-6"><p><b>{t('희망·필요 직무', 'Target roles')}: </b>{member.declaredRoles.join(' · ') || '—'}</p><p><b>{t('입력한 역량', 'Declared skills')}: </b>{member.skills.join(' · ') || '—'}</p><p><b>{t('언어', 'Languages')}: </b>{member.languages.join(' · ') || '—'}</p>{member.role === 'student' && <p><b>{t('협업 조건', 'Work conditions')}: </b>{member.hours ?? '—'} h / {t('주', 'week')} · ₩{member.weeklyPay?.toLocaleString() ?? '—'} / {t('주', 'week')} · {member.mode || '—'} · {member.availability || '—'} · {member.timezone || '—'}</p>}<p className="whitespace-pre-line">{member.introduction || t('소개 미입력', 'No introduction provided')}</p></section>
          <section className="rounded-xl bg-neutral-50 p-4"><h4 className="text-sm font-bold">{t('다음 확인 사항', 'Next verification steps')}</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">{member.missing.map(key => <li key={key}>{criterionLabel(key, locale)} — {t('입력·보완 요청', 'Request details')}</li>)}<li>{t('입력한 역량을 실제 작업물·직무 과제·면접으로 확인', 'Verify declared skills with work samples, a relevant task or interview')}</li>{member.role === 'company' && <li>{t('주차별 결과물·검수 기준·요청 책임자 확인', 'Confirm weekly deliverables, acceptance criteria and project owner')}</li>}</ul></section>
          <section><h4 className="text-sm font-bold">{t('등록 자료', 'Submitted evidence')}</h4><p className="mt-2 text-sm leading-6">{Object.entries(member.files).filter(([, present]) => present).map(([key]) => ({ resume: t('이력서', 'Resume'), portfolio: t('포트폴리오 링크', 'Portfolio link'), video: t('소개 영상', 'Intro video'), identity: t('신원·사업 증빙', 'Identity/business document') }[key])).join(' · ') || t('등록 자료 없음', 'No submitted evidence')}</p><p className="mt-1 text-xs leading-5 text-neutral-600">{t('등록 여부만 표시합니다. 파일 진위나 실제 역량 검증을 완료했다는 뜻은 아닙니다. 민감한 문서·연락처는 이 요약에 포함하지 않습니다.', 'Presence only, not authenticity or skill verification. Sensitive documents and contact details are not included in this summary.')}</p></section>
          <div className="flex flex-wrap items-center gap-2" data-no-translate>{(['resume', 'identity', 'video'] as const).filter(kind => member.files[kind]).map(kind => <button className={control} key={kind} onClick={() => void openEvidence(member, kind)}>{kind === 'resume' ? t('이력서 검토', 'Review resume') : kind === 'identity' ? t('증빙 서류 검토', 'Review verification document') : t('소개 영상 검토', 'Review intro video')}</button>)}{evidence?.id === member.id && evidence.expires > Date.now() && <a className="rounded-xl bg-teal-50 px-3 py-2.5 text-sm font-semibold text-teal-900 underline" target="_blank" rel="noopener noreferrer" href={evidence.url}>{t('보안 링크 열기 (60초 유효)', 'Open secure link (valid for 60s)')}</a>}{evidenceMessage && <p role="alert" className="w-full text-sm text-rose-800">{evidenceMessage}</p>}</div>
          <section className="rounded-xl border border-neutral-200 p-4 text-sm leading-6"><h4 className="font-bold">{t('플랫폼에서 확인된 수행 기록', 'Verified platform activity')}</h4><p className="mt-2">{member.role === 'student' ? <>{t('완료 프로젝트', 'Completed projects')}: {member.trackRecord.completedProjects} · {t('승인 결과물 단계', 'Approved milestones')}: {member.trackRecord.approvedMilestones}</> : <>{t('등록 공고', 'Registered projects')}: {member.projectCount} · {t('모집 중', 'Open projects')}: {member.openProjects}</>} · {t('검증·공개 리뷰', 'Verified published reviews')}: {member.trackRecord.publishedReviews}</p><p className="mt-1 text-xs text-neutral-600">{t('0건은 플랫폼 기록이 없다는 뜻이며, 경력이나 능력이 없다는 뜻이 아닙니다.', 'Zero means no platform records, not no experience or ability.')}</p></section>
          {candidate && <MatchCriteria criteria={candidate.criteria}/>}
          {excluded && <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{t('현재 공고 후보에서 제외된 이유', 'Not shortlisted for this project')}: {excluded.reasons.map(key => criterionLabel(key, locale)).join(' · ')}. {t('능력 부족 확정이나 계정 거절을 뜻하지 않습니다.', 'This is not an ability verdict or account rejection.')}</p>}
          <section className="space-y-4 border-t border-neutral-200 pt-5">
            <h4 className="text-sm font-bold">{t('AI 참고 요약', 'AI advisory summary')} · {aiState(member.ai.state)}</h4>
            <p className="text-xs leading-6 text-neutral-600">{t('AI가 본인 입력 내용을 요약하고 확인 질문을 제안합니다. 위 ‘다음 확인 사항’의 미입력 항목은 실제 저장값으로 판단하며, AI 문장으로 추가하거나 변경하지 않습니다. 요약은 실제 역량 검증 결과가 아닙니다.', 'AI summarizes self-reported information and suggests review questions. Missing fields in Next verification steps come only from stored values, never AI wording. This summary is not proof of competence.')}</p>
            {member.ai.analyzedAt && <p className="text-xs text-neutral-600">{new Date(member.ai.analyzedAt).toLocaleString(locale)} · {member.ai.model}</p>}
            {member.ai.strength && <p className="text-sm leading-7">{member.ai.strength}</p>}
            {/* Do not turn a model's free-text weakness summary into missing-field facts.
                    Stored-field checks above and explicit review questions below are the admin workflow. */}
            {member.ai.verificationQuestions.length > 0 && <div><h5 className="text-sm font-semibold">{t('면담에서 확인할 질문', 'Questions for the review conversation')}</h5><ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">{member.ai.verificationQuestions.map((question, i) => <li key={i}>{question}</li>)}</ol></div>}
            {member.ai.evidenceRequests.length > 0 && <div><h5 className="text-sm font-semibold">{t('확인할 작업물·업무 자료', 'Work samples or scope documents to review')}</h5><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">{member.ai.evidenceRequests.map((request, i) => <li key={i}>{request}</li>)}</ul></div>}
            {member.ai.strength && !member.ai.verificationQuestions.length && <p className="text-sm leading-6 text-neutral-600">{t('이전 분석에는 면담 질문이 없습니다. 다시 분석하면 확인 질문과 요청 자료를 함께 저장합니다.', 'This earlier analysis has no review questions. Generate a new review to save questions and evidence requests.')}</p>}
            {!member.ai.strength && <p className="text-sm text-neutral-600">{t('저장된 AI 분석이 없습니다. 위 실제 정보로 검토하거나 분석을 요청하세요.', 'No saved AI analysis. Review the actual evidence above or request analysis.')}</p>}
          </section>
        </article>}
      </div>
      <p className="text-xs leading-5 text-neutral-500">{t('출처: 실제 회원 프로필 · 실제 공고 · 저장된 AI 분석. 비자·직업소개 적합성은 별도 전문가 확인이 필요합니다.', 'Sources: actual profiles, projects and saved AI assessments. Visa and placement compliance require separate qualified review.')}</p>
    </>}
  </div>;
}
