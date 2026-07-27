import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Building2, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { Locale } from "../../i18n/LocaleContext";
import { Project, ProjectStatus } from "../../types";

interface PublicOpportunityPreviewProps {
  locale: Locale;
  onLogin: () => void;
  onStudent: () => void;
  onCompany: () => void;
}

const copy = {
  ko: {
    eyebrow: "실시간 채용 수요",
    preview: "로그인 전 최신 공고 3건만 공개",
    title: "가입하기 전에, 어떤 기회가 있는지 먼저 확인하세요.",
    lead: "기업이 공개한 실제 공고에서 회사명, 모집 직무와 핵심 요구 기술만 미리 보여드립니다. 연락처와 지원 상세정보는 로그인 후 안전하게 확인할 수 있습니다.",
    demand: "현재 많이 찾는 기술",
    details: "상세 조건 보기",
    private: "연락처 비공개",
    weeks: "주",
    loading: "공개 공고를 불러오고 있습니다.",
    emptyTitle: "첫 공개 공고를 준비하고 있습니다.",
    emptyBody: "가짜 공고는 표시하지 않습니다. 학생 계정을 만들면 새 공고 알림을 받을 수 있고, 기업은 간단한 양식으로 첫 공고를 등록할 수 있습니다.",
    student: "인재로 시작",
    company: "첫 공고 등록",
  },
  en: {
    eyebrow: "Live hiring demand",
    preview: "The latest 3 posts are visible before sign-in",
    title: "See the opportunities before you sign up.",
    lead: "Preview the company, role, and core skills from real public posts. Contact details and full application terms stay protected until you sign in.",
    demand: "Skills in current demand",
    details: "View full details",
    private: "Contact protected",
    weeks: "weeks",
    loading: "Loading public opportunities.",
    emptyTitle: "The first public opportunities are being prepared.",
    emptyBody: "We do not display fake job posts. Create a talent account for new-role alerts, or register a company to publish the first opportunity.",
    student: "Join as talent",
    company: "Post the first role",
  },
  vi: {
    eyebrow: "Nhu cầu tuyển dụng thực tế",
    preview: "Hiển thị 3 tin mới nhất trước khi đăng nhập",
    title: "Xem cơ hội trước khi đăng ký.",
    lead: "Xem trước doanh nghiệp, vị trí và kỹ năng chính từ các tin công khai thực tế. Thông tin liên hệ và điều kiện chi tiết chỉ hiển thị an toàn sau khi đăng nhập.",
    demand: "Kỹ năng đang được tìm kiếm",
    details: "Xem chi tiết",
    private: "Đã ẩn liên hệ",
    weeks: "tuần",
    loading: "Đang tải cơ hội công khai.",
    emptyTitle: "Các cơ hội công khai đầu tiên đang được chuẩn bị.",
    emptyBody: "KONEXA không hiển thị tin tuyển dụng giả. Tạo tài khoản ứng viên để nhận thông báo hoặc đăng ký doanh nghiệp để đăng cơ hội đầu tiên.",
    student: "Tham gia với tư cách ứng viên",
    company: "Đăng cơ hội đầu tiên",
  },
} as const;

function createdAtValue(project: Project) {
  const value = project.createdAt as unknown;
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "epochMs" in value) return Number((value as { epochMs: number }).epochMs);
  return 0;
}

function isPublicMarketProject(project: Project) {
  const candidate = project as Project & { isTest?: boolean; testRecord?: boolean };
  const fingerprint = `${project.companyName} ${project.title}`.toLowerCase();
  const testMarkers = ["e2e", "test company", "demo company", "konexa lab"];
  return !candidate.isTest && !candidate.testRecord && !testMarkers.some((marker) => fingerprint.includes(marker));
}

export default function PublicOpportunityPreview({ locale, onLogin, onStudent, onCompany }: PublicOpportunityPreviewProps) {
  const t = copy[locale];
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/public/projects", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.message || "Public opportunities are unavailable");
        const publicProjects = (Array.isArray(payload?.data) ? payload.data : [])
          .map((item) => item as Project)
          .filter((project) => project.status === ProjectStatus.OPEN && Boolean(project.companyName) && Boolean(project.title) && isPublicMarketProject(project))
          .sort((left, right) => createdAtValue(right) - createdAtValue(left))
          .slice(0, 3);
        setProjects(publicProjects);
        setLoading(false);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setProjects([]);
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => [...(project.requirements || []), ...(project.tags || [])].forEach((skill) => {
      const normalized = skill.trim();
      if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1);
    }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([skill]) => skill);
  }, [projects]);

  return (
    <section id="opportunities" className="bg-[#f7f6f1] px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:gap-14">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#4361ee]"><Sparkles className="h-3.5 w-3.5" />{t.eyebrow}</p>
            <p className="mt-3 inline-flex rounded-full border border-[#17342d]/10 bg-white px-3 py-1.5 text-[11px] font-bold text-[#587069]">{t.preview}</p>
            <h2 className="mt-5 max-w-xl break-keep font-display text-3xl font-bold leading-[1.14] tracking-[-.04em] text-[#17342d] sm:text-5xl">{t.title}</h2>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-8 text-[#557069]">{t.lead}</p>
            {topSkills.length > 0 && <div className="mt-7"><p className="text-xs font-black uppercase tracking-[.08em] text-[#647a74]">{t.demand}</p><div className="mt-3 flex flex-wrap gap-2">{topSkills.map((skill) => <span key={skill} className="rounded-full bg-[#eaf0ff] px-3 py-1.5 text-xs font-bold text-[#324fc0]">{skill}</span>)}</div></div>}
          </div>
        </div>

        {loading ? (
          <div role="status" aria-live="polite" className="mt-12 grid gap-4 md:grid-cols-3">
            <span className="sr-only">{t.loading}</span>
            {[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-[1.7rem] bg-[#17342d]/5" />)}
          </div>
        ) : projects.length > 0 ? (
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const requiredSkills = [...new Set([...(project.requirements || []), ...(project.tags || [])])].slice(0, 4);
              return (
                <article key={project.id} className="group flex min-h-72 flex-col rounded-[1.7rem] border border-[#17342d]/10 bg-white p-6 shadow-[0_18px_60px_rgba(23,52,45,.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(23,52,45,.11)]">
                  <div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf0ff] text-[#4361ee]"><Building2 className="h-5 w-5" /></span><span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f2] px-2.5 py-1 text-[10px] font-bold text-[#587069]"><LockKeyhole className="h-3 w-3" />{t.private}</span></div>
                  <p className="mt-6 text-xs font-black uppercase tracking-[.08em] text-[#637a73]">{project.companyName}</p>
                  <h3 className="mt-2 break-keep font-display text-xl font-bold leading-snug tracking-[-.025em] text-[#17342d]">{project.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-1.5">{requiredSkills.map((skill) => <span key={skill} className="rounded-full border border-[#17342d]/10 px-2.5 py-1 text-[11px] font-bold text-[#4a655e]">{skill}</span>)}</div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-7">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#60756f]"><Clock3 className="h-3.5 w-3.5" />{project.durationWeeks ? `${project.durationWeeks} ${t.weeks}` : project.workType || "Project"}</span>
                    <button type="button" onClick={onLogin} className="inline-flex items-center gap-1.5 text-xs font-black text-[#324fc0]">{t.details}<ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 rounded-[2rem] border border-dashed border-[#17342d]/20 bg-white/70 px-6 py-12 text-center sm:px-10">
            <BriefcaseBusiness className="mx-auto h-8 w-8 text-[#4361ee]" />
            <h3 className="mt-5 font-display text-2xl font-bold tracking-[-.03em] text-[#17342d]">{t.emptyTitle}</h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#557069]">{t.emptyBody}</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={onStudent} className="rounded-full bg-[#17342d] px-5 py-3 text-sm font-black text-white">{t.student}</button>
              <button type="button" onClick={onCompany} className="rounded-full border border-[#17342d]/15 bg-white px-5 py-3 text-sm font-black text-[#17342d]">{t.company}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
