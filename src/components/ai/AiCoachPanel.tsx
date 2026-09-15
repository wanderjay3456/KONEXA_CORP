import React from 'react';
import { useAiChat } from '../../lib/useAiChat';
import { useLocale } from '../../i18n/LocaleContext';
export default function AiCoachPanel({ contextKey }: { contextKey: string }) {
  const chat = useAiChat(contextKey);
  const { locale } = useLocale();
  const t = (ko: string, en: string, vi: string) => locale === 'ko' ? ko : locale === 'vi' ? vi : en;
  const busy = chat.busy || chat.restoring;
  return <section data-no-translate className="rounded-2xl border border-neutral-200 bg-white p-5">
    <h2 className="font-semibold">{t('AI 채용 준비 도우미', 'AI hiring preparation assistant', 'Trợ lý chuẩn bị tuyển dụng AI')}</h2>
    <p className="mt-2 text-sm leading-6 text-neutral-600">{t('공고가 없어도 업무 범위와 주차별 결과물을 정리할 수 있습니다. 대화는 계정에 저장되며 Gemini로 처리됩니다. 개인정보·영업비밀은 입력하지 마세요. 승인·계약·채용 결정은 대신하지 않습니다.', 'Define scope and weekly deliverables even before posting a job. Conversations are saved to your account and processed by Gemini. Do not enter personal or confidential information. This assistant cannot approve accounts, contracts or hires.', 'Xác định phạm vi và kết quả theo tuần ngay cả khi chưa đăng tin. Hội thoại được lưu vào tài khoản và xử lý bởi Gemini. Không nhập thông tin cá nhân hoặc bí mật. Trợ lý không phê duyệt tài khoản, hợp đồng hay tuyển dụng.')}</p>
    <button onClick={chat.reload} disabled={busy} className="mt-3 text-sm underline">{t('대화 다시 불러오기', 'Reload conversation', 'Tải lại hội thoại')}</button>
    <div className="my-4 max-h-80 space-y-3 overflow-y-auto" role="log" aria-live="polite">{chat.messages.map(message => <div key={message.id} className={`whitespace-pre-wrap break-words rounded-xl p-3 text-sm leading-6 ${message.role === 'user' ? 'ml-8 bg-neutral-100' : 'mr-8 bg-teal-50'}`}>{message.content}</div>)}{busy && <p className="text-sm text-neutral-500">{t('처리 중입니다.', 'Working on it.', 'Đang xử lý.')}</p>}</div>
    <form className="flex gap-2" onSubmit={event => { event.preventDefault(); void chat.send(); }}><input aria-label={t('채용 준비 질문', 'Hiring preparation question', 'Câu hỏi chuẩn bị tuyển dụng')} value={chat.input} maxLength={4000} onChange={event => chat.setInput(event.target.value)} disabled={busy} className="min-w-0 flex-1 rounded-xl border p-3 text-sm" /><button type="submit" disabled={busy || !chat.input.trim()} className="rounded-xl bg-neutral-950 px-4 text-sm text-white disabled:opacity-40">{t('보내기', 'Send', 'Gửi')}</button></form>
  </section>;
}
