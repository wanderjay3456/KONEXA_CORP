import { test, expect, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

// These specs render the real LandingHero against the built stylesheet, so they
// need `npm run build` first (CI always builds before the browser tests).
const assets = path.join(process.cwd(), 'dist/assets');
test.beforeAll(() => {
  const built = existsSync(assets) && readdirSync(assets).some(name => /^index-.*\.css$/.test(name));
  if (!built) throw new Error('dist/assets/index-*.css is missing. Run `npm run build` before the landing browser tests.');
});

const widths = [360, 390, 768, 1440] as const;
const locales = ['en', 'ko'] as const;
const heading = { en: 'Hire after one real project.', ko: '이력서 말고, 프로젝트 하나로 결정하세요.' } as const;

async function open(page: Page, locale: (typeof locales)[number], errors: string[]) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`/?landing=1&locale=${locale}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading[locale]);
}

for (const locale of locales) {
  for (const width of widths) {
    test(`landing ${locale} @${width}px: no horizontal scroll, 44px targets, no console errors`, async ({ page }) => {
      const errors: string[] = [];
      await page.setViewportSize({ width, height: width < 700 ? 780 : 900 });
      await open(page, locale, errors);
      await page.waitForTimeout(1600);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const small: string[] = [];
      for (const target of await page.locator('.lv3 a, .lv3 button').all()) {
        const box = await target.boundingBox();
        if (box && (box.height < 43.5 || box.width < 43.5)) small.push(`${(await target.innerText()).trim()} ${Math.round(box.width)}x${Math.round(box.height)}`);
      }
      expect(small).toEqual([]);
      const shots = process.env.LANDING_SHOTS;
      if (shots) {
        mkdirSync(shots, { recursive: true });
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < height; y += 400) { await page.evaluate(value => window.scrollTo(0, value), y); await page.waitForTimeout(120); }
        await page.waitForTimeout(900);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(shots, `landing-${locale}-${width}.png`), fullPage: true });
      }
      expect(errors).toEqual([]);
    });
  }
}

test('KO/EN toggle switches copy, document language and metadata', async ({ page }) => {
  const errors: string[] = [];
  await open(page, 'en', errors);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle('KONEXA | Hire after one real project');
  // The QA shell page has no description tag; the real index.html does.
  await page.evaluate(() => { const meta = document.createElement('meta'); meta.name = 'description'; meta.content = 'placeholder'; document.head.append(meta); });
  await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'KO' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading.ko);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page).toHaveTitle('KONEXA | 프로젝트 하나로 결정하는 채용');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /첫 파트너 기업을 모집 중/);
  await page.getByRole('group', { name: '언어' }).getByRole('button', { name: 'EN' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading.en);
  expect(errors).toEqual([]);
});

test('hero CTAs open the company and talent sign-up forms and can return', async ({ page }) => {
  const errors: string[] = [];
  await open(page, 'en', errors);
  await page.getByRole('main').getByRole('button', { name: 'Post a project' }).first().click();
  await expect(page.getByRole('heading', { name: /Create the company account now/ })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading.en);
  await page.getByRole('button', { name: /Join as talent/ }).first().click();
  await expect(page.getByRole('heading', { name: /Create your account now/ })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.locator('#auth-modal-overlay')).toBeVisible();
  expect(errors).toEqual([]);
});

test('footer links resolve and the mobile CTA appears only on small screens', async ({ page }) => {
  const errors: string[] = [];
  await page.setViewportSize({ width: 390, height: 780 });
  await open(page, 'en', errors);
  await expect(page.getByRole('link', { name: 'Status' })).toHaveAttribute('href', '/status');
  await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', /^mailto:konexa\.corp@gmail\.com/);
  await expect(page.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', /^mailto:konexa\.corp@gmail\.com/);
  await expect(page.getByRole('link', { name: 'Email KONEXA' })).toHaveAttribute('href', 'mailto:konexa.corp@gmail.com');
  await expect(page.locator('.lv3-mobile-cta')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.lv3-mobile-cta')).toBeHidden();
  expect(errors).toEqual([]);
});

test('reduced motion freezes repeating animation and shows content immediately', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors: string[] = [];
  await open(page, 'en', errors);
  const animated = await page.evaluate(() => [...document.querySelectorAll('.lv3, .lv3 *')].filter(node => {
    const style = getComputedStyle(node);
    return style.animationName !== 'none';
  }).length);
  expect(animated).toBe(0);
  const lead = await page.locator('.lv3-lead').evaluate(node => getComputedStyle(node.parentElement!).opacity);
  expect(lead).toBe('1');
  await expect(page.locator('.lv3-ticker-set[aria-hidden="true"]')).toBeHidden();
  expect(errors).toEqual([]);
  await context.close();
});

test('landing text makes no numeric, testimonial or guarantee claims', async ({ page }) => {
  const errors: string[] = [];
  for (const locale of locales) {
    await open(page, locale, errors);
    const text = await page.locator('.lv3').innerText();
    expect(text).not.toMatch(/\d\s*%|top\s*1|\d{2,}\s*\+|★|testimonial|guarantee|보장|후기/i);
  }
  expect(errors).toEqual([]);
});
