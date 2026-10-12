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
const heading = { en: 'Work together. Then decide.', ko: '채용 전에, 먼저 함께 일해보세요.' } as const;

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
  await expect(page).toHaveTitle('KONEXA | Work together before you hire');
  // The QA shell page has no description tag; the real index.html does.
  await page.evaluate(() => { const meta = document.createElement('meta'); meta.name = 'description'; meta.content = 'placeholder'; document.head.append(meta); });
  await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'KO' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading.ko);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page).toHaveTitle('KONEXA | 채용 전에 먼저 함께 일해보세요');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /첫 파트너 기업을 모집 중/);
  await page.getByRole('group', { name: '언어' }).getByRole('button', { name: 'EN' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading.en);
  expect(errors).toEqual([]);
});

test('hero CTAs open the company and talent sign-up forms and can return', async ({ page }) => {
  const errors: string[] = [];
  await open(page, 'en', errors);
  await page.getByRole('main').getByRole('button', { name: 'Create a company account' }).first().click();
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

for (const entry of ['company', 'talent'] as const) {
  test(`shared ${entry} registration link survives reload and returns without leaving KONEXA`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/?landing=1&locale=en&utm_source=outreach&start=${entry}`);
    const formHeading = entry === 'company' ? /Create the company account now/ : /Create your account now/;
    await expect(page.getByRole('heading', { name: formHeading })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Read the public policy review editions' })).toHaveAttribute('href', '/terms?locale=en');
    if (entry === 'company') await expect(page.getByText(/After sign-up, you will need your headquarters country/)).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: formHeading })).toBeVisible();
    // A direct entry must not skip agreements or submit an account request.
    for (const box of await page.getByRole('checkbox').all()) await expect(box).not.toBeChecked();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading.en);
    expect(new URL(page.url()).searchParams.has('start')).toBe(false);
    expect(new URL(page.url()).searchParams.get('utm_source')).toBe('outreach');
    expect(errors).toEqual([]);
  });
}

test('browser Back and Forward restore the registration entry point', async ({ page }) => {
  const errors: string[] = [];
  await open(page, 'en', errors);
  await page.getByRole('main').getByRole('button', { name: 'Create a company account' }).first().click();
  await expect(page.getByRole('heading', { name: /Create the company account now/ })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('start')).toBe('company');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading.en);
  await page.goForward();
  await expect(page.getByRole('heading', { name: /Create the company account now/ })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading.en);
  expect(new URL(page.url()).searchParams.has('start')).toBe(false);
  expect(errors).toEqual([]);
});

test('unknown entry points do not open forms and recovery takes precedence', async ({ page }) => {
  await page.goto('/?landing=1&locale=en&start=admin');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading.en);
  await page.goto('/?landing=1&locale=en&start=company#type=recovery');
  await expect(page.locator('#auth-modal-overlay')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Create the company account now/ })).toHaveCount(0);
});

test('footer links resolve and the mobile CTA appears only on small screens', async ({ page }) => {
  const errors: string[] = [];
  await page.setViewportSize({ width: 390, height: 780 });
  await open(page, 'en', errors);
  await expect(page.getByRole('link', { name: 'Status' })).toHaveAttribute('href', '/status');
  await expect(page.getByRole('link', { name: 'Terms', exact: true })).toHaveAttribute('href', '/terms?locale=en');
  await expect(page.getByRole('link', { name: 'Privacy', exact: true })).toHaveAttribute('href', '/privacy?locale=en');
  await expect(page.getByRole('link', { name: 'Discuss a project' }).first()).toHaveAttribute('href', /^mailto:konexa\.corp@gmail\.com\?subject=.*&body=/);
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
  await expect(page.getByText('Escrow payments', { exact: true })).toBeVisible();
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

test('example brief and pilot limits are readable without animated activity', async ({ page }) => {
  const errors: string[] = [];
  await open(page, 'en', errors);
  await expect(page.getByRole('heading', { name: 'Adapt a campaign for three ad formats' })).toBeVisible();
  await expect(page.getByText('Illustration / Example brief', { exact: true })).toBeVisible();
  await expect(page.getByText('pilot review required', { exact: true })).toBeVisible();
  await expect(page.getByText('in preparation', { exact: true })).toBeVisible();
  const loops = await page.evaluate(() => [...document.querySelectorAll('.lv3 *')].filter(node =>
    getComputedStyle(node).animationName !== 'none').length);
  expect(loops).toBe(0);
  expect(errors).toEqual([]);
});

 test('consultation opens a scoped email draft while company registration stays separate', async ({page}) => {
  await page.goto('/?landing=1&locale=en');
  const link = page.getByRole('link', {name:'Discuss a project'}).first();
  const href = await link.getAttribute('href');
  const query = new URLSearchParams(href!.split('?')[1]);
  expect(query.get('body')).toContain('Expected deliverables:');
  expect(query.get('body')).toContain('Budget range:');
  await expect(page.getByText('Opens an email draft. No account required.')).toBeVisible();
  await page.getByRole('group', {name:'Language'}).getByRole('button', {name:'KO'}).click();
  const koHref = await page.getByRole('link', {name:'프로젝트 상담하기'}).first().getAttribute('href');
  expect(new URLSearchParams(koHref!.split('?')[1]).get('body')).toContain('원하는 결과물:');
  await page.getByRole('button', {name:'기업 계정 만들기'}).first().click();
  expect(new URL(page.url()).searchParams.get('start')).toBe('company');
});

test('pilot responsibilities, worldwide enquiries and adult participation policy are visible in both locales', async ({page}) => {
 for(const locale of ['en','ko']) {
  await page.goto(`/?landing=1&locale=${locale}`);
  await expect(page.locator('.lv3-responsibilities')).toBeVisible();
  await expect(page.locator('.lv3-pilot-limit').first()).toContainText(locale === 'en' ? 'at least 18' : '만 18세');
  await expect(page.locator('.lv3-example-list article')).toHaveCount(2);
  await page.getByRole('button',{name:locale === 'en'?'Copy email address':'이메일 주소 복사'}).click();
  await expect(page.locator('.lv3-copy-status')).toContainText(locale === 'en' ? /copied|Could not copy/ : /복사했습니다|복사하지 못했습니다/);
 }
});

for (const locale of ['ko', 'en'] as const) {
  test(`public policies ${locale}: direct links, content, refresh and text reflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 360, height: 780 });
    for (const policy of ['terms', 'privacy', 'project-terms']) {
      await page.goto(`/${policy}?locale=${locale}`);
      await expect(page.locator('.lv3-policy h1')).toHaveText(locale === 'ko' ? ({terms:'이용약관', privacy:'개인정보처리방침', 'project-terms':'계약·결제·환불 조건'}[policy]!) : ({terms:'Terms of use', privacy:'Privacy policy', 'project-terms':'Contracts, payments & refunds'}[policy]!));
      await expect(page.locator('.lv3-policy-version')).toContainText('2026-10-12');
      await expect(page.locator('.lv3-policy-notice')).toBeVisible();
      await expect(page.locator('.lv3-policy article section')).not.toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      await page.locator('.lv3-policy article').evaluate(node => { (node as HTMLElement).style.letterSpacing = '.12em'; (node as HTMLElement).style.wordSpacing = '.16em'; (node as HTMLElement).style.lineHeight = '2'; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
    }
    const text = await page.locator('.lv3-policy article').innerText();
    expect(text).toMatch(locale === 'ko' ? /착수 전 취소.*전액 환불/ : /before work starts.*full refund/);
    expect(text).toContain(locale === 'ko' ? '수행하지 않은 부분은 환불' : 'Unperformed work is refunded');
    await page.locator('.lv3-policy-layout aside nav').first().getByRole('link', {name:locale === 'ko' ? '개인정보처리방침' : 'Privacy policy',exact:true}).click();
    await expect(page.locator('.lv3-policy article')).toContainText(locale === 'ko' ? '상담 종료 후 90일' : '90 days after the enquiry closes');
    await expect(page.locator('.lv3-policy-notice')).toContainText(locale === 'ko' ? '호스팅 이전의 실제 지역' : 'Hosting migration');
    await page.getByRole('link', {name:locale === 'ko' ? '← 홈으로' : '← Back to home'}).click();
    await expect(page.getByRole('heading', {level:1})).toHaveText(heading[locale]);
    expect(errors).toEqual([]);
  });
}
test('example deliverables can be inspected with the keyboard without fake live state', async ({page}) => {
  await page.goto('/?landing=1&locale=en');
  const details=page.locator('.lv3-brief-details');
  await expect(details).not.toHaveAttribute('open', '');
  await page.locator('.lv3-brief-details summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Three resized assets',{exact:true})).toBeVisible();
  await expect(page.getByText('Example review note',{exact:true})).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Three resized assets',{exact:true})).toBeHidden();
});

 test('migration preview is explicitly labelled in both languages', async ({page})=>{
   await page.route('**/api/public/runtime-mode', route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({previewOnly:true,externalAiEnabled:false})}));
   for(const locale of ['ko','en']) {
     await page.goto(`/?landing=1&locale=${locale}`);
     await expect(page.getByRole('status').filter({hasText:locale==='ko'?'무료 호스팅 이전 미리보기':'Free-hosting migration preview'})).toBeVisible();
   }
 });
