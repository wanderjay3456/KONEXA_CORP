import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { registerDeliveryReadRoutes } from '../src/server/deliveryRoutes';
import { parseMilestoneSubmission } from '../src/server/backendV2Validation';

test('a submission requires real content rather than an empty success',()=>{
  assert.throws(()=>parseMilestoneSubmission({notes:'   ',storagePaths:[]}));
  assert.equal(parseMilestoneSubmission({notes:'A documented research finding.'}).notes,'A documented research finding.');
  assert.equal(parseMilestoneSubmission({storagePaths:['owner/result.pdf']}).storagePaths.length,1);
});
test('delivery evidence reads enforce participant access and sign only the deliverables bucket',async()=>{
  const company='10000000-0000-4000-8000-000000000001', student='20000000-0000-4000-8000-000000000001';
  const milestone='30000000-0000-4000-8000-000000000001';const signed:string[]=[];
  const db:any={from:(table:string)=>{
    const q:any={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,
      maybeSingle:async()=>({data:{id:milestone,company_id:company,student_id:student}}),
      then:(resolve:any)=>resolve({data:table==='konexa_milestone_submissions'?[{id:'submission',storage_paths:[`${student}/result.pdf`,'other/private.pdf']}]:[]})};return q;
  },storage:{from:(bucket:string)=>({createSignedUrl:async(path:string)=>{signed.push(`${bucket}/${path}`);return {data:{signedUrl:'https://storage.example.invalid/result'}};}})}};
  const app=express();app.use((req:any,_res,next)=>{const uid=req.header('x-actor');if(uid)req.user={uid,role:uid==='admin'?'admin':'student'};next();});registerDeliveryReadRoutes(app,()=>db);
  const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${(server.address() as any).port}/api/v2/milestones/${milestone}/submissions`;
  try{
    assert.equal((await fetch(base)).status,401);
    assert.equal((await fetch(base,{headers:{'x-actor':'unrelated'}})).status,404);
    for(const actor of [company,student,'admin']){
      const response=await fetch(base,{headers:{'x-actor':actor}});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');
      const value:any=await response.json();assert.equal(value.data[0].files[1].url,null);
    }
    assert.deepEqual(signed,Array(3).fill(`project-deliverables/${student}/result.pdf`));
  }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
