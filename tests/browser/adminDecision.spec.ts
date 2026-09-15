import { test, expect } from '@playwright/test';
import { projectId } from './ids';

test('admin reviews real fixture evidence, filters roles, compares a job and restores persisted analysis', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?role=admin&locale=en');
  await expect(page.getByRole('heading', { name: 'Talent & company review' })).toBeVisible();
  await page.getByLabel('Member type').selectOption('company');
  await expect(page.getByRole('button', { name: /Research company/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Research candidate/ })).toHaveCount(0);
  await page.getByLabel('Member type').selectOption('all');
  await page.getByLabel('Project to compare').selectOption(projectId);
  await expect(page.getByText('Visible, complete profiles: 301', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /Research candidate/ }).click();
  await expect(page.getByRole('heading', { name: 'Project-to-profile comparison' })).toBeVisible();
  await expect(page.getByText('English:')).toHaveCount(0);
  await page.getByRole('button', { name: 'Review resume', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open secure link (valid for 60s)' })).toBeVisible();
  await page.getByRole('button', { name: 'Generate AI review' }).click();
  await expect(page.getByText('Declared research skills support an initial project discussion.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Questions for the review conversation' })).toBeVisible();
  await expect(page.getByText('How many hours can you commit each week?')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Work samples or scope documents to review' })).toBeVisible();
  await expect(page.getByText('Practice structured research interviews.')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: /Research candidate/ }).click();
  await expect(page.getByText('Declared research skills support an initial project discussion.')).toBeVisible();
  await expect(page.getByText('How many hours can you commit each week?')).toBeVisible();
  expect(errors).toEqual([]);
});

test('admin load failure is not shown as zero members; retry and native locales work', async ({ page }) => {
  await page.route('**/api/admin/decision-workspace', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.goto('/?role=admin&locale=en');
  await expect(page.getByRole('alert')).toContainText('This does not mean there are no members');
  await page.unroute('**/api/admin/decision-workspace');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByLabel('Member type')).toBeVisible();
  for (const [locale, title] of [['ko', '인재·기업 검토실'], ['vi', 'Đánh giá nhân tài & doanh nghiệp']]) {
    await page.goto(`/?role=admin&locale=${locale}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  }
});

test('admin evidence summary fits a narrow screen without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?role=admin&locale=ko');
  await page.getByRole('button', { name: /Research candidate/ }).click();
  await expect(page.getByRole('button', { name: 'AI 요약·확인 질문 생성' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByLabel('매칭할 공고').selectOption(projectId);
  await expect(page.getByRole('heading', { name: '공고와 프로필 비교' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
