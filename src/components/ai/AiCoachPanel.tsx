import { useLocale } from '../../i18n/LocaleContext';
export default function AiCoachPanel({ contextKey }: { contextKey: string }) {
    const { locale } = useLocale();
    const t = (ko: string, en: string) => locale === 'ko' ? ko : en;
    return <section data-no-translate data-context={contextKey} className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="font-semibold">{t('프로젝트 준비', 'Prepare your project')}</h2><p className="mt-2 text-sm leading-7">{t('범위·결과물·주당 시간·업무 언어·예산을 먼저 정리해 주세요. 공개 파일럿은 외부 AI 대화를 제공하지 않으며, 이력서 분류와 조건 매칭은 별도 규칙 엔진으로 처리합니다.', 'Define scope, deliverables, weekly hours, working language and budget. External AI chat is paused for the public pilot; resume categorisation and matching use a separate rules engine.')}</p><a href="mailto:konexa.corp@gmail.com" className="mt-3 inline-flex min-h-11 items-center text-sm underline">{t('운영자에게 문의', 'Contact the operator')}</a></section>;
}
