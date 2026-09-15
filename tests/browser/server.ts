// Local component/API integration fixture. Never imported by production.
import { build } from 'esbuild';
import { aiFixture } from '../helpers/aiFixture';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const bundled = await build({ entryPoints: [path.join(root, 'tests/browser/ui.tsx')], absWorkingDir: root, bundle: true, write: false, format: 'esm', jsx: 'automatic', platform: 'browser', plugins: [{ name: 'local-test-context', setup(builder) {
  builder.onResolve({ filter: /context\/AppContext$/ }, () => ({ path: path.join(root, 'tests/browser/appFixture.tsx') }));
} }] });
const { app, state } = aiFixture();
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
shell.get('/', (_req, res) => res.type('html').send('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>KONEXA local workflow QA</title><style>body{font-family:Arial,sans-serif;margin:24px;line-height:1.6}button,input,textarea{font:inherit;margin:5px;padding:8px}textarea{width:90%}section{border:1px solid #ddd;border-radius:14px;padding:20px;margin:20px 0}</style></head><body><div id="root"></div><script type="module" src="/qa.js"></script></body></html>'));
shell.get('/qa.js', (_req, res) => res.type('js').send(bundled.outputFiles[0].text));
shell.use(async (req, res) => {
  const upstream = await fetch('http://127.0.0.1:4174' + req.originalUrl, { method: req.method, headers: { 'Content-Type': 'application/json', 'x-test-actor': String(req.headers['x-test-actor'] || '') }, ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: req.body } : {}) });
  res.status(upstream.status).type('json').send(await upstream.text());
});
const ui = shell.listen(4173, '127.0.0.1', () => console.log('Local-only workflow fixture: http://127.0.0.1:4173'));
function stop() { api.closeAllConnections(); api.close(); ui.closeAllConnections(); ui.close(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
