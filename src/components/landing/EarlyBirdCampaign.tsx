import { Award, BriefcaseBusiness, CalendarClock, Check, FileCheck2, GraduationCap, Percent, PlayCircle, ReceiptText, SearchCheck, Star } from "lucide-react";
import type { Locale } from "../../i18n/LocaleContext";

interface EarlyBirdCampaignProps {
  locale: Locale;
  onStudent: () => void;
  onCompany: () => void;
}

const campaignCopy = {
  ko: {
    eyebrow: "FOUNDING MEMBERS · 2026.08.05까지",
    title: "먼저 움직인 기업과 인재에게, 런칭 혜택을 드립니다.",
    lead: "런칭 전 결제는 필요 없습니다. 기업은 실제 공고 1건을 등록하고, 학생은 이력서와 1분 자기소개 영상을 완성하면 됩니다.",
    actionLabel: "참여 조건",
    company: "기업 파트너 혜택",
    companyTarget: "베트남 시장 진출이나 글로벌 인재 채용을 준비하는 국내 기업",
    companyAction: "회원가입 후 실제 채용 공고 또는 프로젝트 공고를 1건 이상 등록해 주세요.",
    companyBenefits: ["정식 요금제 출시 후 첫 5개월간 구독료 30% 할인", "프리미엄 인재 우선 열람권 1회 추가 제공"],
    companyCta: "첫 공고 등록하기",
    student: "학생 인재 혜택",
    studentTarget: "RMIT 등 글로벌 대학에서 검증된 인재",
    studentAction: "이력서를 100% 작성하고 1분 자기소개 영상을 업로드해 주세요.",
    studentBenefits: ["첫 구직이 완료될 때까지 Early Pioneer 뱃지와 우선 노출 제공", "한국 기업이 선호하는 성과 중심 이력서·포트폴리오 컨설팅 1회", "첫 매칭 후 4주 동안 주급 인출 시 발생하는 현지 수수료 100% 페이백"],
    studentCta: "인재 프로필 완성하기",
    condition: "마감 전까지 필수 조건을 모두 완료하면, 운영팀 확인 후 혜택이 확정됩니다.",
  },
  en: {
    eyebrow: "FOUNDING MEMBERS · APPLY BY AUG 5, 2026",
    title: "Take the first step. Unlock founding-member benefits.",
    lead: "There is no payment before launch. Companies qualify by posting one real role, while talent qualifies by completing a resume and a one-minute introduction video.",
    actionLabel: "How to qualify",
    company: "Founding company benefits",
    companyTarget: "Korean companies preparing to enter Vietnam or hire global talent",
    companyAction: "Create an account and publish at least one genuine job or project posting.",
    companyBenefits: ["30% off subscription fees for the first five months after paid plans launch", "One additional priority pass to view premium talent"],
    companyCta: "Post your first role",
    student: "Founding talent benefits",
    studentTarget: "Verified talent from RMIT and other global universities",
    studentAction: "Complete your resume and upload a one-minute introduction video.",
    studentBenefits: ["An Early Pioneer badge and priority placement until you secure your first role", "One results-focused resume and portfolio consultation tailored to Korean employers", "100% payback of eligible local withdrawal fees on your first four weekly payouts"],
    studentCta: "Complete your profile",
    condition: "Complete every requirement before the deadline. Benefits are confirmed after a short review by the KONEXA team.",
  },
  vi: {
    eyebrow: "THÀNH VIÊN TIÊN PHONG · ĐĂNG KÝ TRƯỚC 05.08.2026",
    title: "Đi trước một bước, nhận trọn quyền lợi tiên phong.",
    lead: "Bạn không cần thanh toán trước khi nền tảng ra mắt. Doanh nghiệp chỉ cần đăng một vị trí thực tế; ứng viên chỉ cần hoàn thiện CV và video giới thiệu dài một phút.",
    actionLabel: "Điều kiện tham gia",
    company: "Quyền lợi dành cho doanh nghiệp tiên phong",
    companyTarget: "Doanh nghiệp Hàn Quốc chuẩn bị vào thị trường Việt Nam hoặc tuyển nhân tài quốc tế",
    companyAction: "Tạo tài khoản và đăng ít nhất một tin tuyển dụng hoặc dự án thực tế.",
    companyBenefits: ["Giảm 30% phí thuê bao trong 5 tháng đầu sau khi gói trả phí ra mắt", "Tặng thêm một lượt ưu tiên xem hồ sơ nhân tài cao cấp"],
    companyCta: "Đăng tin đầu tiên",
    student: "Quyền lợi dành cho ứng viên tiên phong",
    studentTarget: "Nhân tài đã được xác thực từ RMIT và các trường đại học quốc tế",
    studentAction: "Hoàn thiện đầy đủ CV và tải lên video giới thiệu dài một phút.",
    studentBenefits: ["Huy hiệu Early Pioneer và ưu tiên hiển thị cho đến khi nhận được công việc đầu tiên", "Một buổi tư vấn CV và portfolio theo tiêu chí của doanh nghiệp Hàn Quốc", "Hoàn 100% phí rút tiền hợp lệ cho bốn lần nhận lương theo tuần đầu tiên"],
    studentCta: "Hoàn thiện hồ sơ",
    condition: "Hãy hoàn tất mọi điều kiện trước thời hạn. Quyền lợi sẽ được xác nhận sau khi đội ngũ KONEXA kiểm tra hồ sơ.",
  },
} as const;

export default function EarlyBirdCampaign({ locale, onStudent, onCompany }: EarlyBirdCampaignProps) {
  const t = campaignCopy[locale];
  return (
    <section id="early-bird" className="bg-[#f7f6f1] px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
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
            <div className="mt-7 rounded-2xl bg-white/8 p-4"><div className="flex items-center gap-2 text-[10px] font-black tracking-wider text-[#b9f4d0]"><FileCheck2 className="h-4 w-4" />{t.actionLabel}</div><p className="mt-2 text-sm font-bold leading-6">{t.companyAction}</p></div>
            <ul className="mt-6 space-y-3">{t.companyBenefits.map((benefit, index) => <li key={benefit} className="flex gap-3 text-sm leading-6 text-white/85">{index === 0 ? <Percent className="mt-0.5 h-4 w-4 shrink-0 text-[#b9f4d0]" /> : <SearchCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#b9f4d0]" />}{benefit}</li>)}</ul>
            <button onClick={onCompany} className="mt-8 w-full rounded-xl bg-white py-3.5 text-xs font-black text-[#17342d]">{t.companyCta}</button>
          </article>

          <article className="rounded-[2rem] border border-[#4361ee]/15 bg-[#edf0ff] p-6 text-[#17342d] shadow-[0_24px_70px_rgba(67,97,238,.1)] sm:p-8">
            <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#4361ee] text-white"><GraduationCap className="h-5 w-5" /></span><span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d9] px-3 py-1.5 text-[10px] font-black text-[#9a6100]"><Award className="h-3.5 w-3.5" />EARLY PIONEER</span></div>
            <h3 className="mt-8 font-display text-2xl font-bold">{t.student}</h3>
            <p className="mt-2 text-sm leading-6 text-[#617972]">{t.studentTarget}</p>
            <div className="mt-7 rounded-2xl bg-white/70 p-4"><div className="flex items-center gap-2 text-[10px] font-black tracking-wider text-[#4361ee]"><PlayCircle className="h-4 w-4" />{t.actionLabel}</div><p className="mt-2 text-sm font-bold leading-6">{t.studentAction}</p></div>
            <ul className="mt-6 space-y-3">{t.studentBenefits.map((benefit, index) => { const Icon = index === 0 ? Star : index === 1 ? FileCheck2 : ReceiptText; return <li key={benefit} className="flex gap-3 text-sm leading-6 text-[#405b54]"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#4361ee]" />{benefit}</li>; })}</ul>
            <button onClick={onStudent} className="mt-8 w-full rounded-xl bg-[#4361ee] py-3.5 text-xs font-black text-white">{t.studentCta}</button>
          </article>
        </div>
        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#617972]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2d8c69]" />{t.condition}</p>
      </div>
    </section>
  );
}
