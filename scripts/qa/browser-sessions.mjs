// Internal QA: only two pre-existing inbox aliases owned by KONEXA are permitted.
// Confirmation links and access tokens stay in memory and never enter logs/files.
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { readFile } from 'node:fs/promises';
if (!process.argv.includes('--approved-owned-qa')) throw new Error('Explicit owned QA approval is required');
const target = process.env.KONEXA_QA_TARGET || 'http://localhost:3000/';
const targetUrl = new URL(target);
if (!(targetUrl.hostname === 'localhost' || targetUrl.hostname === 'konexa.co.kr' || /^konexa-corp(?:-api)?-[a-z0-9-]+\.vercel\.app$/.test(targetUrl.hostname))) throw new Error('QA target not allowed');
const nonce = randomBytes(16).toString('hex');
const accounts = new Map(['student', 'company'].map(role => [role, {
  email: `konexa.corp+qa-20260914122916-${role}@gmail.com`,
  client: createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }),
}]));
const emit = value => console.log(JSON.stringify(value));
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const request = new URL(req.url, 'http://127.0.0.1:3099');
    if (!request.pathname.startsWith(`/${nonce}/`)) { res.writeHead(404).end(); return; }
    const role = request.pathname.split('/')[2];
    const account = accounts.get(role);
    const { data } = await account.client.auth.getSession();
    if (!data.session) { res.writeHead(409).end('QA email confirmation required'); return; }
    const auth = data.session;
    const hash = new URLSearchParams({ access_token: auth.access_token, refresh_token: auth.refresh_token, expires_in: String(auth.expires_in), token_type: 'bearer', type: 'magiclink' });
    res.writeHead(302, { Location: `${targetUrl.origin}/#${hash}` }).end();
  } catch { res.writeHead(500).end('QA session unavailable'); }
});
server.listen(3099, '127.0.0.1', () => emit({ ready: true, student: `http://127.0.0.1:3099/${nonce}/student`, company: `http://127.0.0.1:3099/${nonce}/company`, target: targetUrl.origin }));
for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
  if (line.trim() === 'stop') break;
  try {
    const command = JSON.parse(line);
    const account = accounts.get(command.role || 'student');
    if (!account) throw new Error('Unknown QA role');
    if (command.action === 'send') {
      const { error } = await account.client.auth.signInWithOtp({ email: account.email, options: { shouldCreateUser: false } });
      if (error) throw error;
      emit({ sent: true, role: command.role });
    } else if (command.action === 'verify') {
      const { data, error } = await account.client.auth.verifyOtp({ type: 'magiclink', token_hash: command.tokenHash });
      if (error) throw error;
      emit({ verified: Boolean(data.session), role: command.role });
    } else if (command.action === 'fixture') {
      const { data: { user } } = await account.client.auth.getUser();
      if (user?.email !== account.email) throw new Error('Owned QA identity mismatch');
      const buckets = command.role === 'student' ? ['identity-documents', 'resumes'] : ['business-documents'];
      const paths = [];
      for (const bucket of buckets) {
        const path = `${user.id}/qa-help-20260914-${bucket}.pdf`;
        const result = command.remove
          ? await account.client.storage.from(bucket).remove([path])
          : await account.client.storage.from(bucket).upload(path, await readFile(new URL('../../tests/fixtures/qa-document.pdf', import.meta.url)), { contentType: 'application/pdf', upsert: false });
        if (result.error) throw result.error;
        paths.push({ bucket, path });
      }
      emit({ fixture: true, removed: Boolean(command.remove), paths });
    } else if (command.action === 'api') {
      if (!['/api/v2/operations', '/api/admin/directory', '/api/gemini/analyze-profile', '/api/auth/google-registration-complete', '/api/gemini/chat', '/api/gemini/chat-history?contextKey=career', '/api/ai/student-roadmap', '/api/ai/resume-review'].includes(command.path)) throw new Error('QA endpoint not permitted');
      const { data } = await account.client.auth.getSession();
      const response = await fetch(targetUrl.origin + command.path, { method: command.body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${data.session?.access_token}`, 'Content-Type': 'application/json' }, ...(command.body ? { body: JSON.stringify(command.body) } : {}), signal: AbortSignal.timeout(55000) });
      const body = await response.json();
      emit({ path: command.path, status: response.status, code: body.error?.code || body.code, message: body.error?.message, keys: Object.keys(body), assessment: Boolean(body.assessmentId), generationId: body.generationId, historyTurns: body.turns?.length, replyLength: body.reply?.length, model: body.model });
    }
  } catch (error) { emit({ error: error.message, code: error.code }); }
}
for (const account of accounts.values()) await account.client.auth.signOut().catch(() => {});
server.close();
