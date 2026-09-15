import { useLocale } from '../../i18n/LocaleContext';
import type { Criterion } from '../../server/matching';

const labels: Record<string, [string, string, string]> = {
  profile: ['프로필 완성', 'Complete profile', 'Hoàn thiện hồ sơ'], roles: ['희망·필요 직무', 'Target roles', 'Vị trí mong muốn'],
  skills: ['보유·필요 역량', 'Skills', 'Kỹ năng'], required_skills: ['필요 역량 증거', 'Required skill evidence', 'Minh chứng kỹ năng'],
  weekly_hours: ['주당 참여 시간', 'Weekly hours', 'Số giờ mỗi tuần'], weekly_pay: ['주급 (원)', 'Weekly pay (KRW)', 'Thu nhập mỗi tuần (KRW)'],
  work_mode: ['근무 방식', 'Work arrangement', 'Hình thức làm việc'], required_language: ['업무 언어', 'Working language', 'Ngôn ngữ làm việc'],
  language_proficiency_confirmation: ['업무 언어 실력 확인', 'Verify working-language proficiency', 'Xác minh trình độ ngôn ngữ'],
  start_date: ['시작 가능 시점', 'Start availability', 'Thời điểm bắt đầu'], resume: ['이력서', 'Resume', 'CV'],
  scope: ['구체적인 업무 범위', 'Concrete scope', 'Phạm vi cụ thể'], open_project: ['실제 모집 공고', 'Open project', 'Dự án đang tuyển'],
  deliverables: ['검수할 결과물', 'Deliverables', 'Sản phẩm bàn giao'], project_requirements: ['공고 요구 조건', 'Project requirements', 'Yêu cầu dự án'],
  no_relevant_evidence: ['관련 직무·역량 근거 부족', 'No relevant role or skill evidence', 'Thiếu minh chứng liên quan'], skill: ['필요 역량', 'Required skill', 'Kỹ năng yêu cầu'],
};
export function criterionLabel(key: string, locale = 'ko') { return labels[key]?.[locale === 'ko' ? 0 : locale === 'vi' ? 2 : 1] || key; }
export default function MatchCriteria({ criteria }: { criteria: Criterion[] }) {
  const { locale } = useLocale();
  const t = (ko: string, en: string, vi: string) => locale === 'ko' ? ko : locale === 'vi' ? vi : en;
  return <section className="space-y-3">
    <h3 className="text-sm font-bold">{t('공고와 프로필 비교', 'Project-to-profile comparison', 'So sánh dự án và hồ sơ')}</h3>
    <p className="text-xs leading-5 text-neutral-600">{t('입력 내용의 일치 여부입니다. 역량 검증이나 채용 확률을 뜻하지 않습니다.', 'Compares declared information. This is not verified ability or a hiring probability.', 'So sánh thông tin tự khai, không phải năng lực đã xác minh hay xác suất tuyển dụng.')}</p>
    <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
      {criteria.map((item, i) => <div key={`${item.key}-${i}`} className="grid gap-2 p-3 text-sm sm:grid-cols-[1fr_1fr_auto]">
        <div className="min-w-0 break-words"><span className="block text-xs text-neutral-500">{criterionLabel(item.key, locale)}</span><b className="font-semibold">{item.required}</b></div>
        <div className="min-w-0 break-words text-neutral-700">{item.declared || t('미입력', 'Not provided', 'Chưa cung cấp')}</div>
        <span className={`self-start whitespace-nowrap rounded-md px-2 py-1 text-xs ${item.status === 'declared' ? 'bg-teal-50 text-teal-800' : item.status === 'conflict' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-900'}`}>{item.status === 'declared' ? t('입력상 일치', 'Declared match', 'Khớp theo tự khai') : item.status === 'conflict' ? t('조건 충돌', 'Conflict', 'Không khớp') : t('확인 필요', 'Verify', 'Cần xác minh')}</span>
      </div>)}
    </div>
  </section>;
}
