// Explicit, opt-in live smoke harness. Passwords and access tokens stay in memory.
// Never run against an inbox you do not own. No payments or public jobs are created.
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';

if (process.env.KONEXA_QA_LIVE !== 'approved-owned-test-accounts') {
  throw new Error('Live QA requires explicit approval and an owned test inbox.');
}
const url = process.env.QA_SUPABASE_URL;
const key = process.env.QA_SUPABASE_PUBLISHABLE_KEY;
const inbox = process.env.QA_INBOX;
if (!url || !key || !inbox || !/^[^+@]+@[^@]+$/.test(inbox)) throw new Error('Missing QA configuration');
const run = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const accounts = new Map();
const emit = value => console.log(JSON.stringify(value));
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const consents = { terms: true, nonCircumvention: true, messageAnalysis: true, crossBorderPrivacy: true, marketing: false, documentVersion: '2026-07-27', testWorkflow: true };

async function command(input) {
  const { action, role = 'student' } = input;
  if (!['student', 'company'].includes(role)) throw new Error('Test roles only');
  if (action === 'signup') {
    if (accounts.has(role)) throw new Error('An account already exists in this run');
    const [name, domain] = inbox.split('@');
    const email = `${name}+qa-${run}-${role}@${domain}`;
    const password = randomBytes(24).toString('base64url') + '!Aa9';
    const db = client();
    const profile = role === 'student'
      ? { name: `[QA] KONEXA Student ${run}`, currentCountry: 'Vietnam', nationality: 'Vietnam', skills: ['Research'], careerInterests: ['Market Research'], workPreference: 'Remote', onboardingCompleted: false, privacySettings: { publicProfile: false, showResume: false }, notificationPreferences: { email: true, push: true, marketing: false }, isTest: true }
      : { companyName: `[QA] KONEXA Company ${run}`, country: 'South Korea', industry: 'Market Research', companySize: '1-10', onboardingCompleted: false, notificationPreferences: { email: true, system: true }, isTest: true };
    const { data, error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: 'https://konexa.co.kr', data: { display_name: profile.name || profile.companyName, role, [`${role}_profile`]: profile, consent_bundle: consents, qa_run: run } } });
    if (error) throw error;
    accounts.set(role, { db, email, password, uid: data.user?.id });
    return { action, role, uid: data.user?.id, email, confirmationRequired: !data.session, identities: data.user?.identities?.length };
  }
  const account = accounts.get(role);
  if (!account) throw new Error('No test account in this process');
  if (action === 'verify') {
    const { data, error } = await account.db.auth.verifyOtp({ token_hash: input.tokenHash, type: input.type || 'signup' });
    if (error) throw error;
    return { action, role, confirmed: Boolean(data.user?.email_confirmed_at), session: Boolean(data.session) };
  }
  if (action === 'login') {
    const { data, error } = await account.db.auth.signInWithPassword({ email: account.email, password: account.password });
    if (error) throw error;
    return { action, role, uid: data.user?.id, session: Boolean(data.session) };
  }
  if (action === 'magiclink') {
    const { error } = await account.db.auth.signInWithOtp({ email: account.email, options: { shouldCreateUser: false, emailRedirectTo: 'https://konexa.co.kr' } });
    if (error) throw error;
    return { action, role, sent: true };
  }
  if (action === 'profiles') {
    const { data, error } = await account.db.from('app_records').select('collection_name,record_id,data').eq('owner_id', account.uid).in('collection_name', ['users', `${role}_profiles`]);
    if (error) throw error;
    return { action, role, records: data.map(row => ({ collection: row.collection_name, uid: row.record_id, role: row.data.role, name: row.data.name || row.data.companyName, trustScore: row.data.trustScore, verified: row.data.verified, onboardingCompleted: row.data.onboardingCompleted, isTest: row.data.isTest })) };
  }
  if (action === 'saveProfile') {
    if (Object.keys(input.patch || {}).some(key => !['bio', 'description', 'notificationPreferences'].includes(key))) throw new Error('Only harmless test fields may be changed');
    const { data, error: readError } = await account.db.from('app_records').select('data').eq('collection_name', `${role}_profiles`).eq('record_id', account.uid).single();
    if (readError) throw readError;
    const { error } = await account.db.from('app_records').update({ data: { ...data.data, ...input.patch } }).eq('collection_name', `${role}_profiles`).eq('record_id', account.uid);
    if (error) throw error;
    return { action, role, saved: true };
  }
  if (action === 'api') {
    const { data } = await account.db.auth.getSession();
    const path = String(input.path);
    if (!path.startsWith('/api/') || /payment|billing|signature|email\/notify|admin/.test(path)) throw new Error('Live QA forbids financial, signature, direct email and admin actions');
    const response = await fetch(`https://konexa.co.kr${path}`, { method: input.method || 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}`, 'x-idempotency-key': `qa-${run}-${input.testId || action}` }, ...(input.body ? { body: JSON.stringify(input.body) } : {}), signal: AbortSignal.timeout(60000) });
    return { action, role, testId: input.testId, status: response.status, result: await response.json() };
  }
  if (action === 'logout') { const { error } = await account.db.auth.signOut(); if (error) throw error; return { action, role, signedOut: true }; }
  throw new Error('Unsupported QA action');
}
emit({ ready: true, run, credentials: 'memory-only' });
for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
  if (line.trim() === 'stop') break;
  try { emit(await command(JSON.parse(line))); }
  catch (error) { emit({ error: error.message, code: error.code, status: error.status }); }
}
for (const account of accounts.values()) await account.db.auth.signOut().catch(() => {});
