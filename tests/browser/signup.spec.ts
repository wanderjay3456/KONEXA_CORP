import { test, expect } from '@playwright/test';
import { student, company } from './ids';

for (const role of ['student', 'company'] as const) {
  test(`${role}: consent completes signup without admin approval and partial profile survives reload`, async ({ page, request }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    expect((await request.post('/__qa/signup/reset', { data: {}, headers: { 'x-test-actor': role === 'company' ? company : student } })).ok()).toBeTruthy();
    await page.goto(`/?signup=1&role=${role}&locale=en`);
    await expect(page.getByText('sign up without admin approval', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Finish sign-up and complete profile' }).click();
    await expect(page.getByRole('alert')).toHaveText('Please accept all three required agreements.');
    for (const box of await page.getByRole('checkbox').all()) await expect(box).not.toBeChecked();
    for (let index = 0; index < 3; index++) await page.getByRole('checkbox').nth(index).check();
    await page.getByRole('button', { name: 'Finish sign-up and complete profile' }).click();
    await expect(page.getByText('You are signed up—no admin approval needed.', { exact: false })).toBeVisible();
    const label = role === 'student' ? 'Full name' : 'Company name';
    await page.getByLabel(label, { exact: false }).fill(`Persistent ${role} draft`);
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Draft saved. You can sign in again and continue where you left off.');
    await page.reload();
    await expect(page.getByLabel(label, { exact: false })).toHaveValue(`Persistent ${role} draft`);
    await expect(page.getByRole('button', { name: 'Save draft', exact: true })).toBeVisible();
    const details: Record<string, string> = role === 'student' ? {
      nationality: 'Vietnam', currentCountry: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh', university: 'QA University', degree: 'Bachelor', major: 'Marketing', graduationYear: '2027',
    } : {
      businessRegistrationNumber: 'QA-TEST-ONLY', country: 'South Korea', industry: 'Technology', companySize: '1-10', website: 'https://example.invalid', officeLocation: 'QA location',
    };
    for (const [key, value] of Object.entries(details)) await page.locator(`#profile-${key}`).fill(value);
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click();
    if (role === 'student') {
      await page.locator('#profile-englishLevel').fill('Advanced');
      await page.getByRole('button', { name: 'Market Research', exact: true }).click();
      await page.getByRole('button', { name: 'Research', exact: true }).click();
      await page.locator('#profile-availability').fill('Immediately');
      await page.locator('#profile-preferredWeeklyPayKrw').fill('100000');
    } else {
      await page.locator('#profile-contactPerson').fill('QA Contact');
      await page.locator('#profile-position').fill('Founder / CEO');
      await page.locator('#profile-phoneNumber').fill('QA test only');
      await page.getByRole('button', { name: 'Research', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click();
    await page.locator(role === 'student' ? '#profile-bio' : '#profile-companyIntroduction').fill('Local-only profile completion test.');
    // File storage is a local double here; DB object ownership and completion
    // validation run separately in signup-rollback.sql against actual RLS.
    for (const input of await page.locator('input[type=file]').all()) await input.setInputFiles({ name: 'qa.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7 QA fixture') });
    await page.getByRole('button', { name: 'Complete profile', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Profile ready without admin approval' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Profile ready without admin approval' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('transient signup failure keeps consent choices and succeeds on retry', async ({ page, request }) => {
  expect((await request.post('/__qa/signup/reset', { data: {}, headers: { 'x-test-actor': student } })).ok()).toBeTruthy();
  await page.goto('/?signup=1&locale=ko');
  for (let index = 0; index < 3; index++) await page.getByRole('checkbox').nth(index).check();
  await page.route('**/api/auth/google-registration-complete', route => route.fulfill({ status: 500, json: { error: { code: 'BACKEND_ERROR', message: 'Google registration could not be completed.' } } }), { times: 1 });
  await page.getByRole('button', { name: '가입 완료하고 프로필 작성' }).click();
  await expect(page.getByRole('alert')).toContainText('재가입할 필요는 없습니다.');
  for (let index = 0; index < 3; index++) await expect(page.getByRole('checkbox').nth(index)).toBeChecked();
  await expect(page.getByRole('checkbox').nth(3)).not.toBeChecked();
  await page.getByRole('button', { name: '가입 완료하고 프로필 작성' }).click();
  await expect(page.getByRole('button', { name: '임시저장', exact: true })).toBeVisible();
});
