import { test, expect } from '@playwright/test';

test('student saves a goal through API, reloads it, generates and restores a roadmap', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?locale=en');
  await page.getByLabel('Career goal').fill('Lead evidence-based Vietnam market research');
  await page.getByLabel('Available hours per week (optional)').fill('12');
  await page.getByRole('button', { name: 'Save goal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save goal', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel('Career goal')).toHaveValue('Lead evidence-based Vietnam market research');
  await expect(page.getByLabel('Available hours per week (optional)')).toHaveValue('12');
  await page.getByLabel('Available hours per week (optional)').fill('');
  await page.getByRole('button', { name: 'Save goal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save goal', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel('Available hours per week (optional)')).toHaveValue('');
  await page.getByRole('button', { name: 'Generate roadmap', exact: true }).click();
  await expect(page.getByText('Saved research roadmap')).toBeVisible();
  await page.reload(); await expect(page.getByText('Saved research roadmap')).toBeVisible();
  expect(errors).toEqual([]);
});

test('company can ask for preparation before a job exists, and matching restores after reload', async ({ page }) => {
  await page.goto('/?role=company&empty=1&locale=en');
  await expect(page.getByRole('heading', { name: 'AI hiring preparation assistant' })).toBeVisible();
  await expect(page.getByLabel('Hiring preparation question')).toBeEnabled();
  await page.goto('/?role=company&locale=en');
  await page.getByRole('button', { name: 'Analyze talent' }).click();
  await expect(page.getByText('301 profiles reviewed', { exact: false })).toBeVisible();
  await expect(page.getByText('Research evidence needs human confirmation.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Research evidence needs human confirmation.')).toBeVisible();
});

test('Korean and Vietnamese roadmap controls are native and goal text is not translated', async ({ page }) => {
  await page.goto('/?locale=en');
  await page.getByLabel('Career goal').fill('Preserve my original research goal');
  await page.getByRole('button', { name: 'Save goal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save goal', exact: true })).toBeDisabled();
  for (const [locale, label, button] of [['ko', '진로 목표', '목표 저장'], ['vi', 'Mục tiêu nghề nghiệp', 'Lưu mục tiêu']]) {
    await page.goto(`/?locale=${locale}`);
    await expect(page.getByLabel(label, { exact: true })).toHaveValue('Preserve my original research goal');
    await expect(page.getByRole('button', { name: button, exact: true })).toBeVisible();
  }
});
