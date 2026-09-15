import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, Save } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLocale, type Locale } from "../../i18n/LocaleContext";
import { getCompanyCompletionErrors, getStudentCompletionErrors } from "../../lib/profileCompletion";
import { uploadPrivateFile, type PrivateStorageBucket } from "../../lib/privateStorage";
import { UserRole } from "../../types";
import { ROLE_FAMILIES } from '../../lib/talentTaxonomy';

type Text = readonly [string, string, string];
type Field = { key: string; label: Text; type?: "email" | "url" | "number" | "textarea" | "tags"; choices?: readonly string[]; required?: boolean; max?: number };
const tr = (text: readonly string[], locale: Locale) => text[locale === "ko" ? 0 : locale === "vi" ? 2 : 1];
const countries = ["South Korea", "Vietnam", "Singapore", "United Kingdom", "United States", "Japan", "Indonesia", "Philippines", "Thailand", "Malaysia", "India", "Other"];
const roles = ROLE_FAMILIES.map(row => row[1]);
const skills = ["Research", "English", "Korean", "Vietnamese", "Writing", "Translation", "Social Media", "Video Editing", "Graphic Design", "Figma", "Excel", "Data Analysis", "Project Management", "Customer Service", "Sales", "Accounting", "CAD", "Python", "JavaScript", "React"];
const studentFields: Field[][] = [
  [
    { key: "name", label: ["이름", "Full name", "Họ và tên"] },
    { key: "nationality", label: ["국적", "Nationality", "Quốc tịch"], choices: countries },
    { key: "currentCountry", label: ["거주 국가", "Country of residence", "Quốc gia cư trú"], choices: countries },
    { key: "timezone", label: ["시간대", "Time zone", "Múi giờ"], choices: ["Asia/Ho_Chi_Minh", "Asia/Seoul", "Asia/Singapore", "Europe/London", "America/New_York", "America/Los_Angeles"] },
    { key: "university", label: ["대학교", "University", "Trường đại học"] },
    { key: "degree", label: ["학위 과정", "Degree", "Bậc học"], choices: ["Bachelor", "Master", "Doctorate", "Associate", "Other"] },
    { key: "major", label: ["전공", "Major", "Chuyên ngành"] },
    { key: "graduationYear", label: ["졸업 또는 졸업 예정 연도", "Graduation year", "Năm tốt nghiệp"] },
  ],
  [
    { key: "englishLevel", label: ["영어 수준", "English proficiency", "Trình độ tiếng Anh"], choices: ["Beginner", "Intermediate", "Upper-intermediate", "Advanced", "Fluent / Native"] },
    { key: "careerInterests", label: ["관심 직무 (복수 선택)", "Roles you are interested in (select multiple)", "Công việc quan tâm (chọn nhiều)"], type: "tags", choices: roles },
    { key: "skills", label: ["보유 역량 (복수 선택)", "Your skills (select multiple)", "Kỹ năng (chọn nhiều)"], type: "tags", choices: skills },
    { key: "availability", label: ["업무 시작 가능 시점", "When can you start?", "Khi nào bạn có thể bắt đầu?"], choices: ["Immediately", "Within 2 weeks", "Within 1 month", "Within 3 months"] },
    { key: "workPreference", label: ["희망 근무 방식", "Work preference", "Hình thức làm việc"], choices: ["Remote", "Hybrid", "Onsite"] },
    { key: "preferredWeeklyPayKrw", label: ["희망 주급 (원)", "Preferred weekly pay (KRW)", "Thu nhập mong muốn mỗi tuần (KRW)"], type: "number" },
    { key: "availableHoursPerWeek", label: ["주당 참여 가능 시간 (선택)", "Available hours per week (optional)", "Số giờ có thể làm mỗi tuần (không bắt buộc)"], type: "number", required: false, max: 80 },
  ],
  [{ key: "bio", label: ["짧은 자기소개와 할 수 있는 업무", "A short introduction and the work you can do", "Giới thiệu ngắn và công việc bạn có thể làm"], type: "textarea" }],
];
const companyFields: Field[][] = [
  [
    { key: "companyName", label: ["기업명", "Company name", "Tên doanh nghiệp"] },
    { key: "businessRegistrationNumber", label: ["사업자등록번호", "Business registration number", "Mã số đăng ký doanh nghiệp"] },
    { key: "country", label: ["본사 국가", "Headquarters country", "Quốc gia đặt trụ sở"], choices: countries },
    { key: "industry", label: ["업종", "Industry", "Ngành nghề"], choices: ["Technology", "E-commerce & Retail", "Manufacturing", "Media & Entertainment", "Professional Services", "Tourism & Hospitality", "Education", "Finance", "Logistics", "Construction & Real Estate", "Food & Beverage", "Healthcare", "Other"] },
    { key: "companySize", label: ["기업 규모", "Company size", "Quy mô doanh nghiệp"], choices: ["1-10", "11-50", "51-200", "201-500", "501+"] },
    { key: "website", label: ["기업 웹사이트", "Company website", "Trang web doanh nghiệp"], type: "url" },
    { key: "officeLocation", label: ["사업장 주소", "Business address", "Địa chỉ doanh nghiệp"] },
  ],
  [
    { key: "contactPerson", label: ["담당자 이름", "Contact person's name", "Tên người liên hệ"] },
    { key: "position", label: ["담당자 직책", "Job title", "Chức danh"], choices: ["Founder / CEO", "HR / Recruiter", "Team Lead", "Manager", "Operations", "Other"] },
    { key: "corporateEmail", label: ["업무용 이메일", "Work email", "Email công việc"], type: "email" },
    { key: "phoneNumber", label: ["담당자 연락처", "Contact phone number", "Số điện thoại liên hệ"] },
    { key: "hiringRoles", label: ["필요한 직무 (복수 선택)", "Roles you need (select multiple)", "Vị trí cần tuyển (chọn nhiều)"], type: "tags", choices: roles, required: false },
    { key: "requiredSkills", label: ["필요 역량 (복수 선택)", "Skills you need (select multiple)", "Kỹ năng cần có (chọn nhiều)"], type: "tags", choices: skills },
    { key: "remotePolicy", label: ["협업 방식", "Working arrangement", "Hình thức làm việc"], choices: ["Remote", "Hybrid", "Onsite"] },
  ],
  [{ key: "companyIntroduction", label: ["기업 소개와 맡기고 싶은 업무", "Your company and the work you need help with", "Giới thiệu doanh nghiệp và công việc cần hỗ trợ"], type: "textarea" }],
];
const copy = {
  titleStudent: ["프로필을 완성하고 기회를 만나세요.", "Complete your profile to find opportunities.", "Hoàn thiện hồ sơ để tìm cơ hội."],
  titleCompany: ["기업 프로필을 완성하고 인재를 만나세요.", "Complete your company profile to find talent.", "Hoàn thiện hồ sơ doanh nghiệp để tìm ứng viên."],
  lead: ["관리자 승인 없이 가입이 완료되었습니다. 프로필은 세 단계로 작성하며, 다 채우지 않아도 임시저장할 수 있습니다. 공고 등록이나 프로젝트 지원 전에는 필수 정보를 완성해 주세요.", "You are signed up—no admin approval needed. Build your profile in three steps, or save an unfinished draft at any time. Complete the required details before posting or applying for projects.", "Đăng ký đã hoàn tất, không cần quản trị viên phê duyệt. Tạo hồ sơ trong ba bước hoặc lưu bản nháp bất cứ lúc nào. Hoàn thành thông tin bắt buộc trước khi đăng hoặc ứng tuyển dự án."],
  draft: ["임시저장", "Save draft", "Lưu bản nháp"],
  draftSaved: ["작성 내용이 저장되었습니다. 다시 로그인해도 이어서 작성할 수 있습니다.", "Draft saved. You can sign in again and continue where you left off.", "Đã lưu bản nháp. Bạn có thể đăng nhập lại để tiếp tục hoàn thiện hồ sơ."],
  studentSteps: ["기본·학적 정보", "업무·희망 조건", "소개·증빙 서류"],
  companySteps: ["기업 정보", "담당자·채용 수요", "소개·증빙 서류"],
  back: ["이전", "Back", "Quay lại"], next: ["저장하고 계속", "Save and continue", "Lưu và tiếp tục"],
  save: ["프로필 등록 완료", "Complete profile", "Hoàn tất hồ sơ"], saving: ["저장 중…", "Saving…", "Đang lưu…"],
  exit: ["로그아웃", "Sign out", "Đăng xuất"], required: ["표시된 필수 항목을 확인해 주세요.", "Please check the required fields below.", "Vui lòng kiểm tra các mục bắt buộc bên dưới."],
  add: ["직접 입력 후 Enter", "Type another option and press Enter", "Nhập lựa chọn khác và nhấn Enter"],
  uploaded: ["파일 등록 완료", "File uploaded", "Đã tải tệp lên"],
  proof: ["재학증명서 또는 학생증 · PDF/JPG/PNG, 최대 10MB", "Enrollment proof or student ID · PDF/JPG/PNG, up to 10MB", "Giấy xác nhận sinh viên hoặc thẻ sinh viên · PDF/JPG/PNG, tối đa 10MB"],
  resume: ["이력서 · PDF, 최대 5MB", "Resume · PDF, up to 5MB", "CV · PDF, tối đa 5MB"],
  license: ["사업자등록증 · PDF/JPG/PNG, 최대 10MB", "Business registration document · PDF/JPG/PNG, up to 10MB", "Giấy đăng ký doanh nghiệp · PDF/JPG/PNG, tối đa 10MB"],
  privacy: ["증빙 서류는 비공개 저장소에 보관되며 운영팀의 검증에 사용됩니다. 프로필 등록 완료와 서류 검증 승인은 별도입니다.", "Documents are stored privately for the operations team's review. Completing your profile does not mean the documents have been approved.", "Giấy tờ được lưu riêng tư để đội ngũ vận hành xét duyệt. Hoàn tất hồ sơ không có nghĩa là giấy tờ đã được phê duyệt."],
  fail: ["저장하지 못했습니다. 입력 내용과 인터넷 연결을 확인한 후 다시 시도해 주세요.", "We could not save your profile. Check your details and connection, then try again.", "Không thể lưu hồ sơ. Hãy kiểm tra thông tin và kết nối rồi thử lại."],
} satisfies Record<string, readonly string[]>;

export default function RequiredProfileSetup({ onComplete, onCancel }: { onComplete?: () => void; onCancel?: () => void }) {
  const { currentUser, studentProfile, companyProfile, updateStudentProfile, updateCompanyProfile, logoutUser, refreshWorkspaceProfile } = useApp();
  const { locale, setLocale } = useLocale();
  const isStudent = currentUser?.role === UserRole.STUDENT;
  const original = isStudent ? studentProfile : companyProfile;
  const previouslyComplete = original?.onboardingCompleted === true
    && Object.keys(isStudent ? getStudentCompletionErrors(studentProfile || {}) : getCompanyCompletionErrors(companyProfile || {})).length === 0;
  const [draft, setDraft] = useState<Record<string, any>>(() => ({
    ...original,
    ...(isStudent ? {
      careerInterests: studentProfile?.careerInterests?.length ? studentProfile.careerInterests : studentProfile?.preferredJob ? [studentProfile.preferredJob] : [],
      timezone: studentProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      workPreference: studentProfile?.workPreference || "Remote",
    } : { corporateEmail: companyProfile?.corporateEmail || currentUser?.email || "", remotePolicy: companyProfile?.remotePolicy || "Remote" }),
  }));
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [invalid, setInvalid] = useState<string[]>([]);
  const [failure, setFailure] = useState("");
  const fields = (isStudent ? studentFields : companyFields)[step];
  const t = (key: keyof typeof copy) => tr(copy[key], locale);
  const update = (key: string, value: unknown) => { setSavedMessage(""); setDraft((previous) => ({ ...previous, [key]: value })); setInvalid((previous) => previous.filter((item) => item !== key)); };
  const normalized = (value: Record<string, any>): Record<string, any> => isStudent ? { ...value, preferredJob: (value.careerInterests || []).join(", ") } : { ...value, description: value.companyIntroduction || "" };

  async function save(final: boolean, draftOnly = false) {
    if (saving.current || !currentUser) return;
    const fieldErrors = fields.filter((field) => field.required !== false && (field.type === "tags" ? !draft[field.key]?.length : field.type === "number" ? !(Number(draft[field.key]) > 0) : !String(draft[field.key] || "").trim())).map((field) => field.key);
    if (!draftOnly && fieldErrors.length) { setInvalid(fieldErrors); setFailure(t("required")); return; }
    const candidate = normalized({ ...draft });
    if (final) {
      for (const key of Object.keys(files)) candidate[key] = "pending-upload";
      const errors = isStudent ? getStudentCompletionErrors(candidate) : getCompanyCompletionErrors(candidate);
      if (Object.keys(errors).length) {
        const keys = Object.keys(errors); setInvalid(keys); setFailure(t("required"));
        const group = (isStudent ? studentFields : companyFields).findIndex((group) => group.some((field) => keys.includes(field.key)));
        if (group >= 0) setStep(group);
        return;
      }
    }
    saving.current = true;
    setBusy(true); setFailure(""); setSavedMessage("");
    try {
      for (const [key, file] of Object.entries(files) as [string, File][]) {
        const bucket: PrivateStorageBucket = key === "resumeUrl" ? "resumes" : key === "identityDocumentPath" ? "identity-documents" : "business-documents";
        const path = await uploadPrivateFile(bucket, currentUser.uid, file);
        candidate[key] = path;
        update(key, path);
        setFiles((previous) => { const next = { ...previous }; delete next[key]; return next; });
      }
      candidate.onboardingCompleted = final || previouslyComplete;
      const saved = isStudent ? await updateStudentProfile(candidate) : await updateCompanyProfile(candidate);
      if (!saved) throw new Error(t("fail"));
      if (draftOnly) { setInvalid([]); setSavedMessage(t("draftSaved")); return; }
      if (!final) { setStep((value) => value + 1); window.scrollTo({ top: 0 }); return; }
      // Profile registration is finished. AI analysis is an independent server
      // task and must never hold the user on this screen or undo saved data.
      void fetch("/api/gemini/analyze-profile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: isStudent ? "student" : "company", locale }), signal: AbortSignal.timeout(55000),
      }).then(async (response) => { if (response.ok) await refreshWorkspaceProfile(); }).catch(() => undefined);
      onComplete?.();
    } catch { setFailure(t("fail")); } finally { saving.current = false; setBusy(false); }
  }

  const fileField = (key: string, label: string, accept: string) => (
    <label key={key} className={`block rounded-2xl border p-5 ${invalid.includes(key) ? "border-red-500" : "border-[#17342d]/15"}`}>
      <span className="flex items-center gap-2 text-sm font-bold"><FileCheck2 className="h-5 w-5" />{label} *</span>
      {(files[key] || draft[key]) && <span className="mt-2 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />{files[key]?.name || t("uploaded")}</span>}
      <input aria-label={label} type="file" accept={accept} disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) { setFiles((previous) => ({ ...previous, [key]: file })); setInvalid((previous) => previous.filter((item) => item !== key)); } }} className="mt-3 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef1ed] file:px-3 file:py-2 file:font-semibold" />
    </label>
  );

  return <main data-no-translate className="min-h-screen w-full bg-[#f7f6f1] px-4 py-8 text-[#17342d] sm:py-12">
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <button type="button" disabled={busy} onClick={onCancel || (() => void logoutUser())} className="text-sm font-semibold">{onCancel ? t("back") : t("exit")}</button>
        <div role="group" aria-label="Language" className="flex gap-1 rounded-full border border-[#17342d]/15 bg-white p-1">{(["ko", "en", "vi"] as const).map((language) => <button type="button" key={language} aria-pressed={locale === language} onClick={() => setLocale(language)} className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${locale === language ? "bg-[#17342d] text-white" : ""}`}>{language}</button>)}</div>
      </div>
      <h1 className="mt-8 break-keep font-display text-3xl font-bold leading-tight tracking-[-.035em] sm:text-4xl">{t(isStudent ? "titleStudent" : "titleCompany")}</h1>
      <p className="mt-4 max-w-2xl break-keep text-sm leading-7 text-[#5a7068]">{t("lead")}</p>
      <ol aria-label="Profile progress" className="my-7 grid grid-cols-3 gap-2">{[0, 1, 2].map((index) => <li key={index} aria-current={index === step ? "step" : undefined} className={`rounded-xl px-3 py-3 text-center text-xs font-bold leading-5 ${index <= step ? "bg-[#17342d] text-white" : "bg-[#e7ebe4] text-[#61746c]"}`}>{index + 1}. {locale === "ko" ? copy[isStudent ? "studentSteps" : "companySteps"][index] : locale === "vi" ? ["Thông tin cơ bản", "Công việc", "Giấy tờ"][index] : ["About you", "Work preferences", "Documents"][index]}</li>)}</ol>
      <form onSubmit={(event) => { event.preventDefault(); void save(step === 2); }} className="rounded-[1.75rem] border border-[#17342d]/10 bg-white p-5 shadow-sm sm:p-8">
        <fieldset disabled={busy} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">{fields.map((field) => {
            const label = tr(field.label, locale);
            const id = `profile-${field.key}`;
            const inputClass = `mt-2 w-full rounded-xl border bg-white px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4361ee]/20 ${invalid.includes(field.key) ? "border-red-500" : "border-[#17342d]/20"}`;
            return <div key={field.key} className={field.type === "textarea" || field.type === "tags" ? "sm:col-span-2" : ""}>
              <label htmlFor={id} className="text-sm font-bold leading-6">{label}{field.required !== false ? " *" : ""}</label>
              {field.type === "tags" ? <div>
                <div role="group" aria-label={label} className="mt-2 flex flex-wrap gap-2">{Array.from(new Set([...(field.choices || []), ...(draft[field.key] || [])])).map((option) => <button type="button" key={option} aria-pressed={(draft[field.key] || []).includes(option)} onClick={() => update(field.key, (draft[field.key] || []).includes(option) ? draft[field.key].filter((item: string) => item !== option) : [...(draft[field.key] || []), option])} className={`rounded-lg border px-3 py-2 text-xs leading-5 ${(draft[field.key] || []).includes(option) ? "border-[#17342d] bg-[#17342d] text-white" : "border-[#17342d]/15 text-[#536c62] hover:bg-[#f3f5f0]"}`}>{option}</button>)}</div>
                <input id={id} className={inputClass} placeholder={t("add")} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); const input = event.currentTarget; const value = input.value.trim(); if (value) update(field.key, Array.from(new Set([...(draft[field.key] || []), value]))); input.value = ""; } }} />
              </div> : field.type === "textarea" ? <textarea id={id} required rows={4} value={draft[field.key] || ""} onChange={(event) => update(field.key, event.target.value)} className={inputClass} /> : <>
                <input id={id} required={field.required !== false} type={field.type || "text"} min={field.type === "number" ? 1 : undefined} max={field.max} list={field.choices ? `${id}-choices` : undefined} value={draft[field.key] ?? ""} onChange={(event) => update(field.key, field.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)} aria-invalid={invalid.includes(field.key)} className={inputClass} />
                {field.choices && <datalist id={`${id}-choices`}>{field.choices.map((option) => <option key={option} value={option} />)}</datalist>}
              </>}
            </div>;
          })}</div>
          {step === 2 && <div className="space-y-4">{isStudent ? <>{fileField("identityDocumentPath", t("proof"), ".pdf,.jpg,.jpeg,.png")}{fileField("resumeUrl", t("resume"), ".pdf")}</> : fileField("businessRegistrationDocumentPath", t("license"), ".pdf,.jpg,.jpeg,.png")}<p className="text-xs leading-6 text-[#62796e]">{t("privacy")}</p></div>}
          {failure && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{failure}</p>}
          {savedMessage && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{savedMessage}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#17342d]/10 pt-6">
            <button type="button" disabled={step === 0} onClick={() => { setStep((value) => value - 1); setFailure(""); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold disabled:opacity-30"><ArrowLeft className="h-4 w-4" />{t("back")}</button>
            <button type="button" onClick={() => void save(false, true)} className="inline-flex items-center gap-2 rounded-xl border border-[#17342d]/20 px-4 py-3 text-sm font-semibold"><Save className="h-4 w-4" />{t("draft")}</button>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17342d] px-5 py-3.5 text-sm font-bold text-white">{busy ? t("saving") : step === 2 ? t("save") : t("next")}{busy ? <Save className="h-4 w-4 animate-pulse" /> : <ArrowRight className="h-4 w-4" />}</button>
          </div>
        </fieldset>
      </form>
    </div>
  </main>;
}
