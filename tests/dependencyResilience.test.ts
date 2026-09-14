import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { isTransientDependencyError, resilientReadFetch } from '../src/server/dependencyResilience';

const noWait = async () => {};
test('failed operation reads remain visible rather than becoming an empty successful workspace', () => {
  const ui=readFileSync(new URL('../src/components/trust/TrustOperationsCenter.tsx',import.meta.url),'utf8');
  assert.match(ui,/setLoadFailure\(true\)/);
  assert.match(ui,/if \(loadFailure\) return/);
  assert.match(ui,/role="alert"/);
});
test('provider config outages are not classified as expired credentials', () => {
  for (const error of [{message:'Failed to get project config'},{message:'Failed to get API key info'},{status:503},{name:'AuthRetryableFetchError'},{message:'TypeError: fetch failed'}]) assert.equal(isTransientDependencyError(error),true);
  for (const error of [{status:401,message:'Invalid JWT'},{status:403,message:'forbidden'},{code:'23505',message:'duplicate key'}]) assert.equal(isTransientDependencyError(error),false);
});

test('read-only transient failures retry once and recover without a new login', async () => {
  let calls=0;
  const request=resilientReadFetch((async()=>++calls===1?Response.json({message:'Failed to get project config'},{status:503}):Response.json({ok:true})) as typeof fetch,noWait);
  assert.deepEqual(await (await request('https://example.invalid/rest/v1/app_records')).json(),{ok:true});
  assert.equal(calls,2);
});

test('persistent read failures are bounded and real invalid JWTs are not replayed', async () => {
  for (const [message,status,expected] of [['Failed to get API key info',401,2],['Invalid JWT',401,1],['outage',503,2]] as const) {
    let calls=0;
    const request=resilientReadFetch((async()=>{calls++;return Response.json({message},{status});}) as typeof fetch,noWait);
    assert.equal((await request('https://example.invalid/auth/v1/user')).status,status);
    assert.equal(calls,expected);
  }
});

test('mutations and caller-cancelled requests are never automatically replayed', async () => {
  for (const method of ['POST','PATCH','PUT','DELETE']) {
    let calls=0;
    const request=resilientReadFetch((async()=>{calls++;return new Response('',{status:503});}) as typeof fetch,noWait);
    await request('https://example.invalid/rest/v1/rpc/command',{method});
    assert.equal(calls,1);
  }
  let calls=0; const controller=new AbortController();controller.abort();
  const request=resilientReadFetch((async()=>{calls++;throw new DOMException('Cancelled','AbortError');}) as typeof fetch,noWait);
  await assert.rejects(request('https://example.invalid/read',{signal:controller.signal}));
  assert.equal(calls,1);
});
