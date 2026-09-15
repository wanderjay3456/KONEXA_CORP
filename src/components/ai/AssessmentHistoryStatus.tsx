import React from 'react';
import { useLocale } from '../../i18n/LocaleContext';
export default function AssessmentHistoryStatus({ loading, error, createdAt, onReload }: {
    loading: boolean;
    error: boolean;
    createdAt?: string;
    onReload: () => void;
}) {
    const { locale } = useLocale();
    const t = (ko: string, en: string) => locale === 'ko' ? ko : en;
    return <div data-no-translate className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm ${error ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-neutral-200 bg-white text-neutral-600'}`} role="status">
    <span>{loading ? t('저장된 분석을 불러오는 중입니다.', 'Loading saved analysis.') : error ? t('저장된 분석을 불러오지 못했습니다. 다시 시도해 주세요.', 'Saved analysis could not be loaded. Please retry.') : createdAt ? `${t('저장된 분석', 'Saved analysis')} · ${new Date(createdAt).toLocaleString(locale)}` : t('아직 저장된 분석이 없습니다.', 'No saved analysis yet.')}</span>
    <button type="button" onClick={onReload} disabled={loading} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">{t('다시 불러오기', 'Reload')}</button>
  </div>;
}
