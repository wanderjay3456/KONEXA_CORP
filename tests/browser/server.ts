// Local component/API integration fixture. Never imported by production.
import { build } from 'esbuild';
import { aiFixture } from '../helpers/aiFixture';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const bundled = await build({ entryPoints: [path.join(root, 'tests/browser/ui.tsx')], absWorkingDir: root, bundle: true, write: false, format: 'esm', jsx: 'automatic', platform: 'browser', plugins: [{ name: 'local-test-context', setup(builder) {
  builder.onResolve({ filter: /context\/AppContext$/ }, () => ({ path: path.join(root, 'tests/browser/appFixture.tsx') }));
  builder.onResolve({ filter: /lib\/(supabaseAuth|privateStorage)$/ }, () => ({ path: path.join(root, 'tests/browser/signupFixture.tsx') }));
} }] });
const { app, state } = aiFixture();
// Explicitly local-only signup store. Never connected to Supabase or email.
const signups = new Map<string, any>();
const intents = new Map<string, any>();
const blankSignup = (req: any) => ({ user: { uid: req.user.uid, email: 'signup-qa@example.invalid', role: req.user.role, onboardingStatus: 'pending_google' }, profile: { uid: req.user.uid, onboardingCompleted: false, verified: false, verifiedStatus: 'Pending' } });
app.post('/__qa/signup/reset', (req: any, res) => { signups.set(req.user.uid, blankSignup(req)); res.json({ ok: true }); });
app.get('/__qa/signup', (req: any, res) => res.json(signups.get(req.user.uid) || blankSignup(req)));
app.post('/api/auth/google-registration-intents', (req: any, res) => {
  const id = crypto.randomUUID(); intents.set(id, req.body); res.status(201).json({ data: { registrationId: id } });
});
app.post('/api/auth/google-registration-complete', (req: any, res) => {
  const intent = intents.get(req.body.registrationId);
  if (!intent || !['student', 'company'].includes(intent.role) || !['terms', 'nonCircumvention', 'messageAnalysis', 'crossBorderPrivacy'].every(key => intent.consents?.[key] === true)) return res.status(400).json({ error: { code: 'CONSENT_REQUIRED' } });
  const value = signups.get(req.user.uid) || blankSignup(req);
  value.user = { ...value.user, role: intent.role, onboardingStatus: 'complete' };
  signups.set(req.user.uid, value); intents.delete(req.body.registrationId);
  res.json({ data: { role: intent.role } });
});
app.post('/__qa/signup/profile', (req: any, res) => {
  const value = signups.get(req.user.uid);
  if (!value || value.user.onboardingStatus !== 'complete') return res.sendStatus(403);
  value.profile = { ...value.profile, ...req.body, verified: false, verifiedStatus: 'Pending' };
  res.json(value);
});
app.get('/__qa/profile', (req: any, res) => res.json(state.tables.app_records.find(row => row.record_id === req.user.uid)?.data || {}));
app.post('/__qa/profile', (req: any, res) => {
  const row = state.tables.app_records.find(row => row.record_id === req.user.uid)!;
  Object.assign(row.data, req.body); res.json(row.data);
});
app.get('/api/gemini/chat-history', (_req, res) => res.json({ turns: [] }));
// Browser document navigation has no test header. The public shell is served by
// a separate server, while only explicit QA fetch requests reach the fixture API.
const api = app.listen(4174, '127.0.0.1');
const { default: express } = await import('express');
const shell = express(); shell.use(express.raw({ type: '*/*', limit: '1mb' }));
shell.use('/assets', express.static(path.join(root, 'dist/assets')));
shell.use(express.static(path.join(root, 'public')));
shell.get('/', (_req, res) => res.type('html').send('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>KONEXA local workflow QA</title><link rel="stylesheet" href="/qa.css"></head><body style="margin:24px"><div id="root"></div><script type="module" src="/qa.js"></script></body></html>'));
shell.get('/qa.css', (_req, res) => {
  const assets = path.join(root, 'dist/assets');
  const css = existsSync(assets) ? readdirSync(assets).find(name => /^index-.*\.css$/.test(name)) : null;
  res.type('css').send(css ? readFileSync(path.join(assets, css), 'utf8') : 'body{font-family:Arial,sans-serif;line-height:1.6}button,input,textarea,select{font:inherit;margin:5px;padding:8px}');
});
shell.get('/qa.js', (_req, res) => res.type('js').send(bundled.outputFiles[0].text));
shell.use(async (req, res) => {
  const upstream = await fetch('http://127.0.0.1:4174' + req.originalUrl, { method: req.method, headers: { 'Content-Type': 'application/json', 'x-test-actor': String(req.headers['x-test-actor'] || '') }, ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: req.body } : {}) });
  res.status(upstream.status).type('json').send(await upstream.text());
});
const ui = shell.listen(4173, '127.0.0.1', () => console.log('Local-only workflow fixture: http://127.0.0.1:4173'));
function stop() { api.closeAllConnections(); api.close(); ui.closeAllConnections(); ui.close(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
