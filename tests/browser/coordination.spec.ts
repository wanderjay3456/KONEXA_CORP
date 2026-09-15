import {test,expect,type Page} from '@playwright/test';
import {company,student,admin} from './ids';
import {relationId,contractId} from './coordinationFixture';
async function fixture(page:Page){
 const state:{items:any[];events:any[];keys:string[];failOnce:boolean}={items:[],events:[],keys:[],failOnce:false};
 await page.route('**/api/v2/coordination**',async route=>{
  const request=route.request(),url=new URL(request.url()),headers=request.headers(),actor=headers['x-test-actor'];
  const send=(body:any,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  if(request.method()==='GET')return send(url.pathname.endsWith('/events')?{data:state.events,nextOffset:null}:{data:state.items.filter(x=>x.kind===url.searchParams.get('kind')),nextOffset:null});
  state.keys.push(headers['x-idempotency-key']);
  if(state.failOnce){state.failOnce=false;return send({error:{message:'Temporary test outage. Your input is preserved.'}},503);}
  const body=request.postDataJSON();
  if(url.pathname.endsWith('/actions')){const item=state.items.find(x=>url.pathname.includes(x.id));if(body.version!==item.version)return send({error:{message:'Refresh and review the latest version.'}},409);
   Object.assign(item,{status:({confirm:'confirmed',agree:'agreed'} as any)[body.action]||body.action,version:item.version+1});if(body.slot){item.starts_at=body.slot;item.ends_at=new Date(Date.parse(body.slot)+1800000).toISOString();}
   state.events.unshift({id:crypto.randomUUID(),actor_id:actor,action:body.action,note:body.note,version:item.version,created_at:new Date().toISOString()});return send({data:item});}
  const item={id:crypto.randomUUID(),kind:body.kind,relationship_id:relationId,contract_id:body.contractId,company_id:company,student_id:student,created_by:actor,title:body.title,status:body.kind==='support'?'open':'proposed',version:1,details:{...body.details,beforeScope:{deliverables:'Research report'},beforeAmountKrw:100000},slots:body.details.slots||[],duration_minutes:body.details.durationMinutes||null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  state.items.push(item);state.events=[{id:crypto.randomUUID(),actor_id:actor,action:'created',note:'',version:1,created_at:item.created_at}];return send({data:item},201);
 });return state;
}
test('company proposes an interview, student confirms and saved history survives reload',async({page})=>{
 const state=await fixture(page);await page.goto('/?coordination=1&role=company&locale=en');
 await page.getByText('Create a request',{exact:true}).click();await page.getByLabel('Introduction',{exact:true}).selectOption(relationId);
 await page.getByLabel('Title',{exact:true}).fill('Research interview');const future=new Date(Date.now()+86400000);future.setMinutes(0,0,0);
 await page.getByLabel('Proposed time 1').fill(future.toISOString().slice(0,16));await page.getByRole('button',{name:'Send request',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Request saved');expect(state.items).toHaveLength(1);
 await page.goto('/?coordination=1&role=student&locale=en');await page.getByLabel('Time to accept').selectOption(state.items[0].slots[0]);await page.getByRole('button',{name:'Save action',exact:true}).click();
 await expect(page.getByText('Confirmed',{exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'Research interview'})).toBeVisible();
 await page.getByRole('button',{name:'View history'}).click();await expect(page.getByText('Request created',{exact:false})).toBeVisible();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save to calendar (.ics)'}).click();expect((await download).suggestedFilename()).toMatch(/\.ics$/);
});
test('a failed scope request preserves text and its retry key, then requires the other party to acknowledge',async({page})=>{
 const state=await fixture(page);state.failOnce=true;await page.goto('/?coordination=1&role=company&locale=en');
 await page.getByRole('tab',{name:'Scope changes'}).click();await page.getByText('Create a request',{exact:true}).click();await page.getByLabel('Introduction',{exact:true}).selectOption(relationId);await page.getByLabel('Contract (required)').selectOption(contractId);
 await page.getByLabel('Title',{exact:true}).fill('Additional market research');await page.getByLabel('Reason and supporting facts').fill('We need to compare a second market segment.');await page.getByLabel('Proposed work and deliverables').fill('A sourced summary of the additional segment.');await page.getByLabel('Revised schedule and deadlines').fill('Next week Friday');await page.getByLabel('Additional amount (KRW;').fill('0');
 await page.getByRole('button',{name:'Send request',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Temporary test outage');await expect(page.getByLabel('Title',{exact:true})).toHaveValue('Additional market research');
 await page.getByRole('button',{name:'Send request',exact:true}).click();await expect(page.getByRole('status')).toContainText('Request saved');expect(state.keys[0]).toBe(state.keys[1]);
 await page.goto('/?coordination=1&role=student&locale=en');await page.getByRole('tab',{name:'Scope changes'}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Save action',exact:true}).click();await expect(page.getByText('Agreed · contract steps required',{exact:true})).toBeVisible();await expect(page.getByText(/The original contract and payment remain unchanged/)).toBeVisible();
});
test('support requests use real case state and admin must provide a reason; mobile Korean layout fits',async({page})=>{
 const state=await fixture(page);await page.goto('/?coordination=1&role=student&locale=en');await page.getByRole('tab',{name:'Replacement & guarantee'}).click();await page.getByText('Create a request',{exact:true}).click();await page.getByLabel('Introduction',{exact:true}).selectOption(relationId);await page.getByLabel('Title',{exact:true}).fill('Replacement review');await page.getByLabel('Reason and supporting facts').fill('Please review the project handover record and discuss the next step.');await page.getByRole('button',{name:'Send request',exact:true}).click();await expect(page.getByRole('status')).toContainText('Request saved');
 await page.goto('/?coordination=1&role=admin&locale=en');await page.getByRole('tab',{name:'Replacement & guarantee'}).click();await page.getByLabel('Next action').selectOption('in_review');await page.getByLabel('Reason and supporting details').fill('We are reviewing the submitted records with both participants.');await page.getByRole('button',{name:'Save action',exact:true}).click();expect(state.items[0].status).toBe('in_review');expect(state.events[0].actor_id).toBe(admin);
 await page.setViewportSize({width:390,height:844});await page.goto('/?coordination=1&role=student&locale=ko');await page.getByRole('tab',{name:'대체·보증 요청'}).click();await expect(page.getByText('검토 중',{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('removed Vietnamese preference becomes English, with no runtime translation requests',async({page})=>{
 let calls=0;await page.route('**/api/localization/translate',route=>{calls++;return route.abort();});await page.goto('/?translation=1&locale=vi');await expect(page.getByRole('heading',{name:'Delivery review'})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('konexa_locale'))).toBe('en');expect(calls).toBe(0);
});
