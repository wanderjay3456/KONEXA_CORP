import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BookOpen, MessageCircle, Send, X, Mail, RotateCcw } from 'lucide-react';
import { useLocale, localeNames } from '../../i18n/LocaleContext';
import { SUPPORT_ARTICLES, SUPPORT_CATEGORIES, SUPPORT_FALLBACK, SUPPORT_KNOWLEDGE_VERSION, findSupportArticles, supportArticleView, type SupportCategory, type SupportLocale } from '../../lib/supportKnowledge';

const ui = {
  ko: { open: 'KONEXA 도움말', title: '무엇이 궁금하세요?', intro: '가입부터 프로젝트까지, 확인된 이용 안내를 찾아드려요.', label: '질문', placeholder: '궁금한 점을 짧게 적어 주세요', send: '질문 보내기', close: '도움말 닫기', reset: '대화 비우기', loading: '관련 도움말을 찾고 있어요…', note: 'AI는 관련 도움말만 찾습니다. 개인 계정은 조회하지 않습니다. 질문은 대화창에만 남고 서버 대화 기록으로 저장하지 않습니다. 자유 질문은 AI로 처리될 수 있으니 민감한 정보를 입력하지 마세요.', source: '확인된 이용 안내', fallback: '연결이 원활하지 않아 기본 도움말을 보여드려요.', contact: '운영팀에 이메일 문의', empty: '아래 주제를 선택하거나 직접 질문해 주세요.', more: '관련 질문', privacy: '비밀번호·인증코드·신분증 정보는 입력하지 마세요.' },
  en: { open: 'KONEXA help', title: 'How can we help?', intro: 'Find practical guidance, from sign-up to projects.', label: 'Your question', placeholder: 'Ask a short question', send: 'Send question', close: 'Close help', reset: 'Clear conversation', loading: 'Finding relevant guidance…', note: 'AI finds relevant help topics only. It cannot access private accounts. Questions stay in this chat window, not in a server conversation log. Free-text questions may be processed by AI; do not include sensitive details.', source: 'Reviewed product guidance', fallback: 'Connection is limited. Showing built-in help.', contact: 'Email the operations team', empty: 'Choose a topic below or ask your own question.', more: 'Related questions', privacy: 'Never enter passwords, codes or identity document details.' },
  vi: { open: 'Hỗ trợ KONEXA', title: 'Bạn cần hỗ trợ gì?', intro: 'Tìm hướng dẫn từ đăng ký đến dự án.', label: 'Câu hỏi', placeholder: 'Nhập câu hỏi ngắn gọn', send: 'Gửi câu hỏi', close: 'Đóng hỗ trợ', reset: 'Xóa cuộc trò chuyện', loading: 'Đang tìm hướng dẫn phù hợp…', note: 'AI chỉ tìm chủ đề hỗ trợ, không truy cập tài khoản riêng tư. Câu hỏi chỉ ở cửa sổ chat, không lưu thành lịch sử trên máy chủ. Câu hỏi tự nhập có thể được AI xử lý; không nhập thông tin nhạy cảm.', source: 'Hướng dẫn đã kiểm tra', fallback: 'Kết nối chưa ổn định. Đang hiển thị hướng dẫn có sẵn.', contact: 'Gửi email cho vận hành', empty: 'Chọn chủ đề bên dưới hoặc đặt câu hỏi.', more: 'Câu hỏi liên quan', privacy: 'Không nhập mật khẩu, mã xác nhận hoặc thông tin giấy tờ.' },
};
type Turn = { id: string; question: string; articleIds: string[]; fallback?: boolean; offline?: boolean };

export default function SupportChatbot() {
  const { locale, setLocale } = useLocale();
  const t = ui[locale];
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<SupportCategory>('start');
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const close = () => { setOpen(false); buttonRef.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'nearest' }); }, [turns, busy]);
  useEffect(() => () => { controllerRef.current?.abort(); }, []);
  const clear = () => { generation.current += 1; controllerRef.current?.abort(); setTurns([]); setInput(''); setBusy(false); inputRef.current?.focus(); };
  const choose = (id: string) => {
    const article = supportArticleView(id, locale);
    if (!article || busy) return;
    setTurns(items => [...items.slice(-9), { id: crypto.randomUUID(), question: article.title, articleIds: [id] }]);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    const run = ++generation.current;
    const id = crypto.randomUUID();
    setInput(''); setBusy(true);
    setTurns(items => [...items.slice(-9), { id, question, articleIds: [] }]);
    const controller = new AbortController(); controllerRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 18_000);
    try {
      const response = await fetch('/api/public/support/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, locale }), signal: controller.signal });
      if (!response.ok) throw new Error('SUPPORT_UNAVAILABLE');
      const body = await response.json();
      const articleIds = Array.isArray(body.articles) ? body.articles.map((item: { id: string }) => item.id).filter((entry: string) => SUPPORT_ARTICLES.some(article => article.id === entry)) : [];
      if (run === generation.current) setTurns(items => items.map(turn => turn.id === id ? { ...turn, articleIds, fallback: !articleIds.length, offline: body.source === 'reviewed_help_fallback' } : turn));
    } catch {
      const articleIds = findSupportArticles(question).filter(item => item.score >= 7).map(item => item.article.id);
      if (run === generation.current) setTurns(items => items.map(turn => turn.id === id ? { ...turn, articleIds, fallback: !articleIds.length, offline: true } : turn));
    } finally { clearTimeout(timeout); if (run === generation.current) setBusy(false); }
  };

  return <aside data-no-translate className="fixed bottom-5 right-4 z-[70] font-sans md:bottom-6 md:right-6">
    {open && <section role="dialog" aria-label={t.open} className="fixed inset-x-3 bottom-20 flex max-h-[calc(100dvh-6.5rem)] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white text-neutral-900 shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-16 sm:right-0 sm:w-[420px]">
      <header className="shrink-0 border-b border-neutral-100 px-5 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold tracking-widest text-teal-700">KONEXA HELP</span><div className="flex items-center gap-1">
          <select aria-label="Language" value={locale} onChange={e => setLocale(e.target.value as SupportLocale)} className="max-w-28 rounded-lg border border-neutral-200 px-1 py-1 text-xs">{Object.entries(localeNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <button aria-label={t.reset} title={t.reset} onClick={clear} className="rounded-lg p-2 hover:bg-neutral-100"><RotateCcw size={15} /></button>
          <button aria-label={t.close} onClick={close} className="rounded-lg p-2 hover:bg-neutral-100"><X size={18} /></button>
        </div></div>
        <h2 className="mt-2 text-lg font-semibold leading-7">{t.title}</h2><p className="mt-1 text-sm leading-6 text-neutral-600">{t.intro}</p>
      </header>
      <div className="min-h-24 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite" aria-relevant="additions text">
        {!turns.length && <p className="text-sm leading-6 text-neutral-600">{t.empty}</p>}
        {turns.map(turn => <div key={turn.id} className="space-y-3">
          <p className="ml-8 whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-neutral-900 px-4 py-3 text-sm leading-6 text-white [overflow-wrap:anywhere]">{turn.question}</p>
          {turn.offline && <p className="text-xs leading-5 text-amber-800">{t.fallback}</p>}
          {turn.articleIds.map(id => { const article = supportArticleView(id, locale); return article && <div key={id} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <h3 className="text-sm font-semibold leading-6">{article.title}</h3><p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-neutral-700">{article.answer}</p>
            <p className="mt-3 flex items-center gap-1 text-[11px] text-teal-800"><BookOpen size={12} />{t.source} · {SUPPORT_KNOWLEDGE_VERSION.split('.')[0]}</p>
          </div>; })}
          {turn.fallback && <p className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm leading-6">{SUPPORT_FALLBACK[locale]}</p>}
        </div>)}
        {busy && <p role="status" className="text-sm text-teal-700">{t.loading}</p>}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 border-t border-neutral-100 px-4 py-3">
        <label className="flex items-center justify-between gap-2 text-xs font-medium text-neutral-600">{t.more}<select aria-label={t.more} value={category} onChange={e => setCategory(e.target.value as SupportCategory)} className="max-w-52 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs">{Object.entries(SUPPORT_CATEGORIES).map(([key, names]) => <option key={key} value={key}>{names[locale]}</option>)}</select></label>
        <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">{SUPPORT_ARTICLES.filter(entry => entry.category === category).map(entry => <button key={entry.id} disabled={busy} onClick={() => choose(entry.id)} className="rounded-xl border border-neutral-200 px-2.5 py-1.5 text-left text-xs leading-5 hover:border-teal-500 hover:bg-teal-50 disabled:opacity-50">{entry.title[locale]}</button>)}</div>
        <form onSubmit={submit} className="mt-3 flex items-end gap-2"><textarea ref={inputRef} aria-label={t.label} value={input} onChange={e => setInput(e.target.value)} maxLength={1000} rows={2} placeholder={t.placeholder} className="min-w-0 flex-1 resize-none rounded-xl border border-neutral-300 px-3 py-2 text-sm leading-5 focus:outline-teal-600" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} /><button type="submit" aria-label={t.send} disabled={busy || !input.trim()} className="rounded-xl bg-teal-800 p-3 text-white disabled:opacity-40"><Send size={18} /></button></form>
        <p className="mt-2 text-[11px] leading-4 text-neutral-600">{t.privacy}</p>
        <details className="mt-2 text-[11px] leading-4 text-neutral-600"><summary className="cursor-pointer">AI · Privacy</summary><p className="mt-1">{t.note}</p></details>
        <a href="mailto:konexa.corp@gmail.com?subject=KONEXA%20Support" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-teal-800 underline underline-offset-2"><Mail size={13} />{t.contact}</a>
      </div>
    </section>}
    <button ref={buttonRef} aria-label={t.open} aria-expanded={open} onClick={() => open ? close() : setOpen(true)} className="flex items-center gap-2 rounded-full border border-teal-700 bg-teal-800 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"><MessageCircle size={18} /><span>{t.open}</span></button>
  </aside>;
}
