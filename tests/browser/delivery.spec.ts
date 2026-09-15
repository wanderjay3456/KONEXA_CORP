import { test,expect } from '@playwright/test';
import { company,admin } from './ids';
test('weekly delivery, revision, approval and bilateral completion survive reload',async({page,request})=>{
  const reset=await request.post('/__qa/delivery/reset',{headers:{'x-test-actor':company},data:{}});
  expect(reset.ok()).toBeTruthy();
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?delivery=1&role=company&locale=en');
  await page.getByLabel('Milestone title').fill('Week one market research');
  await page.getByLabel('Expected deliverable').fill('A sourced market research brief with interview findings.');
  await page.getByLabel('Due date',{exact:true}).fill('2099-01-01');
  await page.getByLabel('Milestone amount (KRW)').fill('100000');
  await page.getByRole('button',{name:'Add milestone',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Week one market research'})).toBeVisible();
  await page.goto('/?delivery=1&role=student&locale=en');
  await page.getByLabel('Result or submission notes').fill('First market research brief with sources.');
  await page.getByRole('button',{name:'Submit for review',exact:true}).click();
  await expect(page.getByText('Awaiting review',{exact:true})).toBeVisible();
  await page.goto('/?delivery=1&role=company&locale=en');
  await page.getByRole('button',{name:'Submission history'}).click();
  await expect(page.getByText('First market research brief with sources.',{exact:true})).toBeVisible();
  await page.getByLabel('Review feedback (at least 10 characters)').fill('Please add the dates of the interviews.');
  await page.getByRole('button',{name:'Request revision',exact:true}).click();
  await expect(page.getByText('Revision requested',{exact:true})).toBeVisible();
  await page.goto('/?delivery=1&role=student&locale=en');
  await page.getByLabel('Result or submission notes').fill('Updated brief with the interview dates and sources.');
  await page.getByRole('button',{name:'Submit for review',exact:true}).click();
  await expect(page.getByText('Awaiting review',{exact:true})).toBeVisible();
  await page.goto('/?delivery=1&role=company&locale=en');
  await page.getByLabel('Review feedback (at least 10 characters)').fill('All agreed findings and sources have been checked.');
  await page.getByRole('button',{name:'Approve deliverable',exact:true}).click();
  await page.getByLabel('I have checked every deliverable and confirm this project is complete.').check();
  await page.getByRole('button',{name:'Confirm project completion',exact:true}).click();
  await expect(page.getByText('Your confirmation is saved. Waiting for the other party.')).toBeVisible();
  await page.goto('/?delivery=1&role=student&locale=en');
  await page.getByLabel('I have checked every deliverable and confirm this project is complete.').check();
  await page.getByRole('button',{name:'Confirm project completion',exact:true}).click();
  await expect(page.getByText('Both parties confirmed completion. Work Passport evidence is recorded.')).toBeVisible();
  await page.reload();await page.getByRole('button',{name:'Submission history'}).click();
  await expect(page.getByText('Updated brief with the interview dates and sources.',{exact:true})).toBeVisible();
  await expect(page.getByText('First market research brief with sources.',{exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});
test('delivery controls render natively in Korean and English',async({page})=>{
  for(const [locale,title] of [['ko','결과물 제출·검수·프로젝트 종료'],['en','Deliverables and project completion']]){
    await page.goto(`/?delivery=1&role=student&locale=${locale}`);await expect(page.getByRole('heading',{name:title})).toBeVisible();
  }
});
test('delivery form fits a narrow screen without horizontal overflow',async({page,request})=>{
  await request.post('/__qa/delivery/reset',{headers:{'x-test-actor':company},data:{}});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?delivery=1&role=company&locale=en');
  await expect(page.getByRole('button',{name:'Add milestone',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.screenshot({path:'test-results/delivery-mobile.png',fullPage:true});
});
test('administrator can moderate a review and record a reasoned dispute decision',async({page,request})=>{
  const reset=await request.post('/__qa/delivery/cases',{headers:{'x-test-actor':admin},data:{}});expect(reset.ok()).toBeTruthy();
  await page.goto('/?delivery=1&role=admin&locale=en');
  await page.getByRole('button',{name:'Approve content',exact:true}).click();
  await expect(page.getByText('The team supplied clear weekly requirements.')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Save case resolution',exact:true})).toBeDisabled();
  const summary='Both parties confirmed the written scope and the revised delivery schedule.';
  await page.getByLabel('Evidence and resolution (at least 20 characters)').fill(summary);
  await page.getByLabel('Restore the evidence-backed workflow state if no other dispute remains').check();
  await page.getByRole('button',{name:'Save case resolution',exact:true}).click();
  await expect(page.getByText(summary,{exact:true})).toBeVisible();await page.reload();
  await expect(page.getByText(summary,{exact:true})).toBeVisible();
  await expect(page.getByText('Review the submitted evidence before deciding. Resolving a case does not execute a refund or payout.')).toBeVisible();
});
