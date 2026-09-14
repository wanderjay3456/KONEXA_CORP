import assert from 'node:assert/strict';
import test from 'node:test';
import { generateWithModelFallback, normalizeStructuredResponse } from '../src/server/providerResponse';
import { existingSmtpDelivery, smtpAuthentication, smtpSecurity } from '../src/server/smtpPolicy';

test('structured AI accepts complete JSON with harmless wrappers and trailing prose', () => {
  for (const text of ['{"ok":true}', '```json\n{"ok":true}\n```', 'Result:\n{"ok":true}\nResponse complete.']) {
    assert.deepEqual(JSON.parse(normalizeStructuredResponse(text)),{ok:true});
  }
});
test('AI JSON scanner handles arrays, nested objects and quoted delimiters', () => {
  const value = [{text:'a } [ " quotation',nested:{ready:true}}];
  assert.deepEqual(JSON.parse(normalizeStructuredResponse(`\n${JSON.stringify(value)}\n`)),value);
});
test('ambiguous, malformed and truncated AI outputs are rejected', () => {
  for (const text of ['{"ok":true}{"ok":false}', '{"ok":', '[{"ok":true}]\n```json\n{}', 'not JSON', 'null','{"a":]}']) {
    assert.throws(()=>normalizeStructuredResponse(text));
  }
});
test('malformed structured output triggers the next configured model', async () => {
  const calls:string[]=[];
  const result=await generateWithModelFallback(['first','second'],async model=>{
    calls.push(model); return {text:model==='first'?'broken':'```json\n{"ok":true}\n```'};
  },true);
  assert.deepEqual(calls,['first','second']);
  assert.equal(result.model,'second');
  assert.deepEqual(JSON.parse(result.response.text),{ok:true});
});
test('chat text remains unchanged and exhausted providers fail visibly', async () => {
  const result=await generateWithModelFallback(['chat'],async()=>({text:'Plain reply.'}),false);
  assert.equal(result.response.text,'Plain reply.');
  await assert.rejects(generateWithModelFallback(['bad'],async()=>({text:''}),true));
});
test('SMTP uses implicit TLS on 465 and required STARTTLS on submission ports', () => {
  assert.deepEqual(smtpSecurity(465,'false'),{secure:true,requireTLS:false});
  for (const port of [25,587,2587]) assert.deepEqual(smtpSecurity(port,'true'),{secure:false,requireTLS:true});
  assert.deepEqual(smtpSecurity(2465,'true'),{secure:true,requireTLS:false});
  assert.deepEqual(smtpSecurity(2465,'false'),{secure:true,requireTLS:false});
  assert.throws(()=>smtpSecurity(0));
});

test('Resend SMTP uses its fixed username and existing API key only on its exact host', () => {
  assert.deepEqual(smtpAuthentication(' SMTP.RESEND.COM ','dashboard@example.invalid',' re_test_only '),{user:'resend',pass:'re_test_only'});
  assert.deepEqual(smtpAuthentication('smtp.other.invalid',' account ',' untouched '),{user:'account',pass:' untouched '});
  assert.deepEqual(smtpAuthentication('smtp.resend.com.other.invalid','account','password'),{user:'account',pass:'password'});
  assert.throws(()=>smtpAuthentication('smtp.resend.com','account','dashboard-password'),/API key/);
});
test('SMTP in-progress delivery is never reported as sent', () => {
  assert.equal(existingSmtpDelivery('sent'),'sent');
  assert.equal(existingSmtpDelivery('sending'),'pending');
  assert.equal(existingSmtpDelivery('failed'),'retry');
});
