import { Award, BriefcaseBusiness, CalendarClock, Check, FileCheck2, GraduationCap, Percent, PlayCircle, ReceiptText, SearchCheck, Star } from "lucide-react";
import type { Locale } from "../../i18n/LocaleContext";

interface EarlyBirdCampaignProps {
  locale: Locale;
  onStudent: () => void;
  onCompany: () => void;
}

const campaignCopy = {
  ko: {
    eyebrow: "FOUNDING MEMBERS · 2026.08.05 마감",
    title: "먼저 증명하는 팀과 인재에게,\n첫 번째 혜택을 드립니다.",
    lead: "결제 선납이 아니라 실제 행동으로 참여하는 얼리버드 프로그램입니다. 기업은 첫 공고를, 학생은 완성된 이력서와 1분 영상을 등록해 주세요.",
    company: "기업 얼리버드",
    companyTarget: "베트남 시장·글로벌 인재 채용을 준비하는 국내 기업",
    companyAction: "회원가입 후 최초 구인공고 1건 이상 공개",
    companyBenefits: ["정식 SaaS 과금 시작 후 5개월간 구독료 30% 할인", "프리미엄 인재 우선 열람권 1회 추가"],
    companyCta: "기업 프로젝트 등록",
    student: "학생 얼리버드",
    studentTarget: "RMIT 등 글로벌 대학의 검증된 인재",
    studentAction: "이력서 100% 등록 + 1분 자기소개 영상 업로드",
    studentBenefits: ["Early Pioneer 뱃지 및 첫 구직 완료 전까지 우선 노출", "한국형 성과 중심 이력서·포트폴리오 컨설팅 1회", "첫 매칭 4주간 주급 인출 관련 현지 수수료 100% 페이백"],
    studentCta: "학생 프로필 시작",
    condition: "마감 시각 이전 필수 조건 완료 기록을 기준으로 운영 검증 후 혜택이 확정됩니다.",
  },
  en: {
    eyebrow: "FOUNDING MEMBERS · ENDS AUG 5, 2026",
    title: "Early action earns\nfounding-member benefits.",
    lead: "No pre-launch payment. Companies publish a real first role, while talent completes a resume and a one-minute introduction video.",
    company: "Company early bird",
    companyTarget: "Korean SMEs exploring Vietnam and global talent",
    companyAction: "Create an account and publish at least one real job or project description",
    companyBenefits: ["30% off the first five months once SaaS billing launches", "One additional premium-talent priority viewing credit"],
    companyCta: "Post a company project",
    student: "Talent early bird",
    studentTarget: "Verified students from RMIT and other global universities",
    studentAction: "Complete a full resume and upload a one-minute introduction video",
    studentBenefits: ["Early Pioneer badge and priority visibility until the first successful placement", "One Korean-style results-focused resume and portfolio consultation", "100% payback of eligible local withdrawal fees for the first four weekly payouts"],
    studentCta: "Build a talent profile",
    condition: "Benefits are confirmed after operational review of the required actions completed before the deadline.",
  },
  vi: {
    eyebrow: "THÀNH VIÊN TIÊN PHONG · HẾT HẠN 05.08.2026",
    title: "Hành động sớm,\nnhận quyền lợi tiên phong.",
    lead: "Không cần trả phí trước khi ra mắt. Doanh nghiệp đăng dự án thật; sinh viên hoàn thiện CV và video giới thiệu một phút.",
    company: "Ưu đãi doanh nghiệp",
    companyTarget: "Doanh nghiệp Hàn Quốc quan tâm thị trường Việt Nam và nhân tài quốc tế",
    companyAction: "Đăng ký và công khai ít nhất một mô tả việc làm hoặc dự án thật",
    companyBenefits: ["Giảm 30% phí thuê bao trong 5 tháng đầu khi SaaS bắt đầu tính phí", "Thêm một lượt xem ưu tiên nhân tài cao cấp"],
    companyCta: "Đăng dự án doanh nghiệp",
    student: "Ưu đãi sinh viên",
    studentTarget: "Sinh viên đã xác minh từ RMIT và các trường đại học quốc tế",
    studentAction: "Hoàn thiện CV 100% và tải video giới thiệu một phút",
    studentBenefits: ["Huy hiệu Early Pioneer và ưu tiên hiển thị đến khi có việc đầu tiên", "Một lần tư vấn CV và portfolio theo chuẩn doanh nghiệp Hàn Quốc", "Hoàn 100% phí rút tiền hợp lệ cho 4 lần nhận lương tuần đầu tiên"],
    studentCta: "Tạo hồ sơ sinh viên",
    condition: "Quyền lợi được xác nhận sau khi kiểm tra các điều kiện đã hoàn tất trước hạn.",
  },
} as const;

export default function EarlyBirdCampaign({ locale, onStudent, onCompany }: EarlyBirdCampaignProps) {
  const t = campaignCopy[locale];
  return (
    <section id="early-bird" className="bg-[#f7f6f1] px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4361ee]/20 bg-[#edf0ff] px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.12em] text-[#4361ee]"><CalendarClock className="h-3.5 w-3.5" />{t.eyebrow}</div>
            <h2 className="mt-6 whitespace-pre-line font-display text-3xl font-bold leading-[1.08] tracking-[-0.045em] text-[#17342d] sm:text-5xl">{t.title}</h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[#617972]">{t.lead}</p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-[#17342d]/10 bg-[#17342d] p-6 text-white shadow-[0_24px_70px_rgba(23,52,45,.15)] sm:p-8">
            <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/10"><BriefcaseBusiness className="h-5 w-5 text-[#b9f4d0]" /></span><span className="rounded-full bg-[#b9f4d0] px-3 py-1.5 text-[10px] font-black text-[#17342d]">B2B</span></div>
            <h3 className="mt-8 font-display text-2xl font-bold">{t.company}</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">{t.companyTarget}</p>
            <div className="mt-7 rounded-2xl bg-white/8 p-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#b9f4d0]"><FileCheck2 className="h-4 w-4" />Required action</div><p className="mt-2 text-sm font-bold leading-6">{t.companyAction}</p></div>
            <ul className="mt-6 space-y-3">{t.companyBenefits.map((benefit, index) => <li key={benefit} className="flex gap-3 text-sm leading-6 text-white/85">{index === 0 ? <Percent className="mt-0.5 h-4 w-4 shrink-0 text-[#b9f4d0]" /> : <SearchCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#b9f4d0]" />}{benefit}</li>)}</ul>
            <button onClick={onCompany} className="mt-8 w-full rounded-xl bg-white py-3.5 text-xs font-black text-[#17342d]">{t.companyCta}</button>
          </article>

          <article className="rounded-[2rem] border border-[#4361ee]/15 bg-[#edf0ff] p-6 text-[#17342d] shadow-[0_24px_70px_rgba(67,97,238,.1)] sm:p-8">
            <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#4361ee] text-white"><GraduationCap className="h-5 w-5" /></span><span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d9] px-3 py-1.5 text-[10px] font-black text-[#9a6100]"><Award className="h-3.5 w-3.5" />EARLY PIONEER</span></div>
            <h3 className="mt-8 font-display text-2xl font-bold">{t.student}</h3>
            <p className="mt-2 text-sm leading-6 text-[#617972]">{t.studentTarget}</p>
            <div className="mt-7 rounded-2xl bg-white/70 p-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#4361ee]"><PlayCircle className="h-4 w-4" />Required action</div><p className="mt-2 text-sm font-bold leading-6">{t.studentAction}</p></div>
            <ul className="mt-6 space-y-3">{t.studentBenefits.map((benefit, index) => { const Icon = index === 0 ? Star : index === 1 ? FileCheck2 : ReceiptText; return <li key={benefit} className="flex gap-3 text-sm leading-6 text-[#405b54]"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#4361ee]" />{benefit}</li>; })}</ul>
            <button onClick={onStudent} className="mt-8 w-full rounded-xl bg-[#4361ee] py-3.5 text-xs font-black text-white">{t.studentCta}</button>
          </article>
        </div>
        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#617972]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2d8c69]" />{t.condition}</p>
      </div>
    </section>
  );
}