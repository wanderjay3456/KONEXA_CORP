import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLocale } from '../i18n/LocaleContext';
import { useToast } from '../components/ui/Toast';
type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};
export function useAiChat(contextKey: string, greeting = '') {
    const { currentUser } = useApp();
    const { locale } = useLocale();
    const { error } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [model, setModel] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const epoch = useRef(0);
    const sending = useRef(false);
    const controller = useRef<AbortController | null>(null);
    useEffect(() => {
        const run = ++epoch.current;
        controller.current?.abort();
        sending.current = false;
        setBusy(false);
        setInput('');
        setModel(null);
        setMessages(greeting ? [{ id: `greeting-${contextKey}`, role: 'assistant', content: greeting }] : []);
        if (!currentUser?.uid || !contextKey)
            return;
        const request = new AbortController();
        setRestoring(true);
        const timeout = setTimeout(() => request.abort(), 15000);
        void fetch(`/api/gemini/chat-history?contextKey=${encodeURIComponent(contextKey)}`, { signal: request.signal })
            .then(async (response) => { if (!response.ok)
            throw new Error('HISTORY_UNAVAILABLE'); return response.json(); })
            .then(body => {
            if (epoch.current !== run)
                return;
            const turns = Array.isArray(body.turns) ? body.turns : [];
            if (turns.length) {
                setMessages(turns.flatMap((turn: any) => [{ id: `${turn.id}-user`, role: 'user', content: String(turn.question) }, { id: `${turn.id}-assistant`, role: 'assistant', content: String(turn.reply) }]));
                setModel(turns.at(-1)?.model || null);
            }
        }).catch(() => {
            if (epoch.current === run && !request.signal.aborted)
                error('AI', locale === 'ko' ? '이전 대화를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.' : 'Could not restore the conversation. Please reload and retry.');
        }).finally(() => { clearTimeout(timeout); if (epoch.current === run)
            setRestoring(false); });
        return () => { epoch.current += 1; request.abort(); controller.current?.abort(); };
    }, [contextKey, currentUser?.uid, revision]);
    const send = async () => {
        const question = input.trim();
        if (!question || sending.current || restoring || !contextKey)
            return;
        const run = epoch.current;
        const requestId = crypto.randomUUID();
        const userMessage: Message = { id: `${requestId}-user`, role: 'user', content: question };
        // Keep a bounded recent context, with complete user/assistant pairs.
        let history = messages.slice(-12);
        while (history.reduce((sum, item) => sum + item.content.length, question.length) > 22000)
            history = history.slice(2);
        while (history[0]?.role === 'assistant')
            history = history.slice(1);
        sending.current = true;
        setBusy(true);
        setInput('');
        setMessages(items => [...items, userMessage]);
        const request = new AbortController();
        controller.current = request;
        const timeout = setTimeout(() => request.abort(), 55000);
        try {
            const response = await fetch('/api/gemini/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal,
                body: JSON.stringify({ messages: [...history, userMessage], contextKey, locale, requestId }) });
            const body = await response.json().catch(() => ({}));
            if (!response.ok || typeof body.reply !== 'string')
                throw new Error('COACH_UNAVAILABLE');
            if (epoch.current === run) {
                setMessages(items => [...items, { id: `${body.generationId || requestId}-assistant`, role: 'assistant', content: body.reply }]);
                setModel(body.model || null);
            }
        }
        catch {
            if (epoch.current === run) {
                setMessages(items => items.slice(0, -1));
                setInput(question);
                error('AI', locale === 'ko' ? '답변을 완료하지 못했습니다. 입력은 보존했습니다. 시간 초과였다면 대화를 다시 불러와 저장 여부를 확인해 주세요.' : 'The reply did not complete. Your draft is preserved. After a timeout, reload the conversation to check whether it was saved.');
            }
        }
        finally {
            clearTimeout(timeout);
            if (epoch.current === run) {
                sending.current = false;
                setBusy(false);
            }
        }
    };
    return { messages, input, setInput, busy, restoring, model, send, reload: () => { if (!sending.current)
            setRevision(value => value + 1); } };
}
