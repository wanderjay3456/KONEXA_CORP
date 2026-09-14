import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('public status page has a Vercel SPA route without intercepting protected APIs', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(config.rewrites[0], { source: '/api/(.*)', destination: '/api' });
  for (const source of ['/status', '/status/']) {
    assert.ok(config.rewrites.some((route: any) => route.source === source && route.destination === '/index.html'));
  }
});
