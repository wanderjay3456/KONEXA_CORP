import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, BriefcaseBusiness, Check, RefreshCw, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { maskedTalentName } from "../../lib/offPlatformGuard";
import { useToast } from "../ui/Toast";
import AiCoachPanel from '../ai/AiCoachPanel';
import AssessmentHistoryStatus from '../ai/AssessmentHistoryStatus';
import { useAssessmentHistory } from '../../lib/useAssessmentHistory';
import { useLocale } from '../../i18n/LocaleContext';

interface AiRecruitmentCenterProps {
  onNavigate: (tabId: string) => void;
}

interface TalentMatch {
  id: string;
  major: string;
  skills: string[];
  languages: string[];
  preferredJob: string;
  preferredIndustry: string;
  availability: string;
  workPreference: string;
  timezone: string;
  trustScore: number;
  completedProjects: number;
  careerReadiness: number;
  employabilityScore: number;
  suitabilityScore: number;
  confidence: number;
  matchingFactors: string[];
  explanation: string;
  strengths: string[];
  weaknesses: string[];
  skillGaps: Array<{ skill: string; severity: "High" | "Medium" | "Low"; advice: string }>;
  interviewQuestions: string[];
}

export default function AiRecruitmentCenter({ onNavigate }: AiRecruitmentCenterProps) {
  const { currentUser, companyProfile, projects } = useApp();
  const { locale } = useLocale();
  const t = (ko: string, en: string, vi: string) => locale === 'ko' ? ko : locale === 'vi' ? vi : en;
  const { success, error } = useToast();
  const ownedProjects = useMemo(
    () => projects.filter((project) => project.companyId === currentUser?.uid && project.status === "open"),
    [currentUser?.uid, projects],
  );
  const [projectId, setProjectId] = useState("");
  const [matches, setMatches] = useState<TalentMatch[]>([]);
  const [activeId, setActiveId] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [ran, setRan] = useState(false);
  const [coverage, setCoverage] = useState<any>(null);
  const requestRef = useRef<AbortController | null>(null);
  const history = useAssessmentHistory('talent_project_matching', companyProfile?.verified && companyProfile?.verifiedStatus === 'Verified' ? projectId : '');

  useEffect(() => {
    if (!ownedProjects.some((project) => project.id === projectId)) setProjectId(ownedProjects[0]?.id || "");
  }, [ownedProjects, projectId]);

  useEffect(() => {
    requestRef.current?.abort(); requestRef.current = null; setLoading(false);
    setMatches([]);
    setActiveId("");
    setModel(null);
    setLoadError(""); setRan(false); setCoverage(null);
  }, [projectId]);
  useEffect(() => () => { requestRef.current?.abort(); requestRef.current = null; }, []);

  useEffect(() => {
    const latest = history.rows[0];
    if (!latest) return;
    setMatches(latest.result.matches || []); setActiveId(latest.result.matches?.[0]?.id || "");
    setModel(latest.model); setCoverage(latest.result.coverage || null); setRan(true);
  }, [history.rows]);

  const activeProject = ownedProjects.find((project) => project.id === projectId);
  const activeMatch = matches.find((match) => match.id === activeId) || matches[0];

  const runMatching = async () => {
    if (!projectId || requestRef.current) return;
    const request = new AbortController(); requestRef.current = request;
    const timer = setTimeout(() => request.abort(), 55_000);
    setLoading(true);
    setLoadError("");
    setMatches([]);
    setActiveId("");
    try {
      const response = await fetch('/api/ai/matching', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, locale }), signal: request.signal });
      const payload = await response.json().catch(() => ({}));
      if (requestRef.current !== request) return;
      if (!response.ok) throw new Error(payload.error || t("AI 인재 매칭을 실행하지 못했습니다.", "Talent matching could not be completed.", "Không thể hoàn tất việc ghép nhân tài."));
      const nextMatches = Array.isArray(payload.matches) ? payload.matches : [];
      setMatches(nextMatches);
      setActiveId(nextMatches[0]?.id || "");
      setModel(typeof payload.model === "string" ? payload.model : null);
      setRan(true); setCoverage(payload.coverage || null);
      if (nextMatches.length) success("AI", t(`${nextMatches.length}명의 후보 분석을 저장했습니다. 점수는 참고 평가입니다.`, `Saved analysis of ${nextMatches.length} candidates. Scores are advisory.`, `Đã lưu phân tích ${nextMatches.length} ứng viên. Điểm chỉ để tham khảo.`));
    } catch (cause) {
      if (requestRef.current !== request) return;
      const message = t("분석을 완료하지 못했습니다. 시간 초과였다면 저장된 분석을 다시 불러온 뒤 재시도해 주세요.", "Analysis did not complete. After a timeout, reload saved analysis before trying again.", "Chưa hoàn tất phân tích. Nếu hết thời gian, hãy tải lại kết quả đã lưu trước khi thử lại.");
      setLoadError(message);
      error("AI", message);
    } finally {
      clearTimeout(timer);
      if (requestRef.current === request) { requestRef.current = null; setLoading(false); }
    }
  };



  if (!companyProfile?.verified || companyProfile.verifiedStatus !== "Verified") {
    return <div data-no-translate className="space-y-6"><AiCoachPanel contextKey="company:planning" /><div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-10 text-center">
      <ShieldCheck className="mx-auto h-9 w-9 text-neutral-300" />
      <h1 className="mt-4 text-2xl font-black text-neutral-950">{t("기업 인증 후 AI 매칭을 사용할 수 있습니다", "Verify your company to access talent matching", "Xác minh doanh nghiệp để ghép nhân tài")}</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-500">{t("인재 정보는 인증된 기업에만 제공되며, 연락처는 계약 전까지 공개되지 않습니다.", "Talent information is available to verified companies. Contact details remain private until the contract stage.", "Thông tin nhân tài dành cho doanh nghiệp đã xác minh. Thông tin liên hệ được giữ riêng tư đến giai đoạn hợp đồng.")}</p>
      <button onClick={() => onNavigate("identity")} className="mt-6 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white">{t("기업 인증 진행하기", "Verify company", "Xác minh doanh nghiệp")}</button>
    </div></div>;
  }

  if (!ownedProjects.length) {
    return <div data-no-translate className="space-y-6"><AiCoachPanel contextKey="company:planning" /><div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-10 text-center">
      <BriefcaseBusiness className="mx-auto h-9 w-9 text-neutral-300" />
      <h1 className="mt-4 text-2xl font-black text-neutral-950">{t("먼저 실제 공고를 등록해 주세요", "Post a project to start matching", "Đăng dự án để bắt đầu ghép")}</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-500">{t("공고의 업무 범위와 요구 역량을 기준으로 등록 조건을 충족한 인재를 비교합니다.", "Matching compares eligible profiles against your project scope and required skills. Profile information still needs human verification.", "Hệ thống so sánh hồ sơ đủ điều kiện với phạm vi và kỹ năng dự án yêu cầu. Thông tin hồ sơ vẫn cần con người xác minh.")}</p>
      <button onClick={() => onNavigate("create-challenge")} className="mt-6 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white">{t("공고 등록하기", "Post a project", "Đăng dự án")}</button>
    </div></div>;
  }

  return <div data-no-translate className="mx-auto max-w-7xl space-y-6 pb-12">
    <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Evidence-based AI matching</span><h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">{t("AI 인재 매칭", "AI talent matching", "Ghép nhân tài bằng AI")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">{t("등록된 공고와 실제 인재 프로필을 비교합니다. 업무 조건으로 후보를 좁힌 뒤 AI가 근거를 정리합니다. 점수는 채용 확률이 아니며 최종 판단은 운영자와 기업이 합니다.", "Compare your project with real talent profiles. Work requirements narrow the shortlist, then AI summarizes the evidence. Scores are not hiring probabilities; your company and KONEXA make the final decision.", "So sánh dự án với hồ sơ nhân tài thực. Điều kiện công việc giúp chọn danh sách ngắn, sau đó AI tổng hợp minh chứng. Điểm không phải xác suất tuyển dụng; doanh nghiệp và KONEXA quyết định cuối cùng.")}</p></div>
      <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
        <select value={projectId} disabled={loading || history.loading} onChange={(event) => setProjectId(event.target.value)} className="min-w-64 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none disabled:opacity-60">
          {ownedProjects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
        <button onClick={runMatching} disabled={loading || history.loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{loading ? t("분석 중", "Analyzing", "Đang phân tích") : t("실제 인재 분석", "Analyze talent", "Phân tích nhân tài")}</button>
      </div>
    </header>

    <AiCoachPanel contextKey={projectId ? `company:${projectId}` : "company:planning"} />
    <AssessmentHistoryStatus {...history} createdAt={history.rows[0]?.created_at} onReload={history.reload} />
    {coverage && <p className="text-sm leading-6 text-neutral-600">{t(`검토 대상 ${coverage.scanned}명 · 조건 검토 후 ${coverage.eligible}명 · 이번 AI 분석 ${matches.length}명. 누락된 정보와 실제 역량은 면접·프로젝트로 확인해 주세요.`, `${coverage.scanned} profiles reviewed · ${coverage.eligible} meet known conditions · ${matches.length} analyzed by AI. Confirm missing information and skills through interviews or projects.`, `Đã xem ${coverage.scanned} hồ sơ · ${coverage.eligible} hồ sơ đáp ứng điều kiện đã biết · AI phân tích ${matches.length} hồ sơ. Xác nhận thông tin còn thiếu và kỹ năng qua phỏng vấn hoặc dự án.`)}</p>}
    {loadError && <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><b>{t("분석을 완료하지 못했습니다.", "Analysis could not be completed.", "Không thể hoàn tất phân tích.")}</b><p className="mt-1">{loadError}</p></div></div>}
    {!loading && !loadError && matches.length === 0 && <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center"><Target className="mx-auto h-8 w-8 text-neutral-300" /><h2 className="mt-4 text-lg font-black">{ran ? t("현재 조건에 맞는 분석 후보가 없습니다", "No candidates currently meet these conditions", "Chưa có ứng viên phù hợp với điều kiện này") : t("공고를 선택하고 실제 인재 분석을 실행해 주세요", "Select a project and analyze talent", "Chọn dự án và phân tích nhân tài")}</h2><p className="mt-2 text-sm text-neutral-500">{t("정보 열람 동의·프로필 완성·계정 상태와 업무 조건을 확인합니다. 후보가 없으면 가상 인재나 점수를 생성하지 않습니다.", "Matching checks visibility consent, profile completion, account status and work requirements. It never invents candidates or scores when none are available.", "Hệ thống kiểm tra sự đồng ý hiển thị, mức hoàn thiện hồ sơ, trạng thái tài khoản và điều kiện công việc. Không tạo ứng viên hoặc điểm giả khi chưa có ứng viên.")}</p></div>}

    {activeMatch && <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
      <aside className="space-y-2 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between px-2 pb-2 text-xs font-bold uppercase tracking-wider text-neutral-400"><span>{t("후보 목록", "Candidates", "Ứng viên")}</span><span>{matches.length}</span></div>
        {matches.map((match) => <button key={match.id} onClick={() => { setActiveId(match.id); }} className={`w-full rounded-2xl border p-4 text-left ${match.id === activeMatch.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 hover:border-neutral-400"}`}>
          <div className="flex items-center justify-between gap-3"><b>{maskedTalentName(match.id)}</b><span className="text-sm font-black">{match.suitabilityScore}/100</span></div>
          <p className={`mt-1 text-xs ${match.id === activeMatch.id ? "text-neutral-300" : "text-neutral-500"}`}>{match.preferredJob || match.major || t("직무 정보 확인 중", "Role information pending", "Đang xác nhận nghề nghiệp")}</p>
          <div className="mt-3 flex flex-wrap gap-1">{match.skills.slice(0, 3).map((skill) => <span key={skill} className={`rounded-lg px-2 py-1 text-xs ${match.id === activeMatch.id ? "bg-white/10" : "bg-neutral-100"}`}>{skill}</span>)}</div>
        </button>)}
      </aside>

      <main className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <section className="flex flex-col justify-between gap-4 border-b border-neutral-100 pb-6 sm:flex-row"><div><span className="text-xs font-bold uppercase tracking-wider text-neutral-400">AI match for {activeProject?.title}</span><h2 className="mt-2 text-2xl font-black">{maskedTalentName(activeMatch.id)}</h2><p className="mt-2 text-sm leading-6 text-neutral-600">{activeMatch.explanation || t("설명 가능한 분석 결과가 없습니다.", "No explanation is available.", "Chưa có giải thích.")}</p></div><div className="grid min-w-40 grid-cols-2 gap-2"><div className="rounded-2xl bg-neutral-950 p-4 text-white"><span className="text-xs uppercase text-neutral-400">{t("적합도", "Suitability", "Mức phù hợp")}</span><b className="mt-1 block text-xl">{activeMatch.suitabilityScore}/100</b></div><div className="rounded-2xl bg-neutral-100 p-4"><span className="text-xs uppercase text-neutral-400">{t("근거 신뢰도", "Evidence confidence", "Độ tin cậy")}</span><b className="mt-1 block text-xl">{activeMatch.confidence}/100</b></div></div></section>
        <section className="grid gap-5 md:grid-cols-2"><div><h3 className="flex items-center gap-2 text-sm font-black"><Check className="h-4 w-4 text-emerald-600" />{t("근거에 나타난 강점", "Evidence-based strengths", "Thế mạnh có minh chứng")}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">{activeMatch.strengths.length ? activeMatch.strengths.map((item) => <li key={item}>• {item}</li>) : <li>{t("충분한 근거가 없습니다.", "Not enough evidence is available.", "Chưa có đủ minh chứng.")}</li>}</ul></div><div><h3 className="flex items-center gap-2 text-sm font-black"><AlertCircle className="h-4 w-4 text-amber-600" />{t("확인할 점", "Points to verify", "Điểm cần xác minh")}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">{activeMatch.weaknesses.length ? activeMatch.weaknesses.map((item) => <li key={item}>• {item}</li>) : <li>{t("추가로 제시된 항목이 없습니다. 최종 확인은 필요합니다.", "No additional items were suggested. Final verification is still required.", "Chưa có đề xuất thêm. Vẫn cần xác minh cuối cùng.")}</li>}</ul></div></section>
        <section><h3 className="text-sm font-black">{t("매칭 근거", "Matching evidence", "Minh chứng ghép")}</h3><div className="mt-3 flex flex-wrap gap-2">{activeMatch.matchingFactors.map((factor) => <span key={factor} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">{factor}</span>)}</div></section>
        <section><h3 className="text-sm font-black">{t("면접에서 확인할 질문", "Interview questions", "Câu hỏi phỏng vấn")}</h3><div className="mt-3 space-y-2">{activeMatch.interviewQuestions.map((question, index) => <div key={question} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6"><b className="mr-2 text-teal-700">Q{index + 1}</b>{question}</div>)}</div></section>
      </main>
    </div>}
  </div>;
}
