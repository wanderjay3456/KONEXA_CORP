import { test, expect } from '@playwright/test';
test('automatic localization leaves native and private copy unchanged',async({page})=>{
  const bodies:Array<{locale:string;texts:string[]}>=[];
  await page.route('**/api/localization/translate',async route=>{
    const body=route.request().postDataJSON();bodies.push(body);
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({translations:body.texts.map(()=>body.locale==='ko'?'제출 이력':'Delivery review')})});
  });
  await page.goto('/?translation=1&locale=ko');
  await expect(page.getByText('제출 이력',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'결과물 및 종료 검토',exact:true})).toBeVisible();
  expect(bodies).toEqual([]);
  await page.goto('/?translation=1&locale=en');
  await expect(page.getByRole('heading',{name:'Delivery review',exact:true})).toBeVisible();
  await expect(page.getByText('Submission history',{exact:true})).toBeVisible();
  await expect(page.getByText('Do not translate private content',{exact:true})).toBeVisible();
  expect(bodies).toEqual([]);
});
