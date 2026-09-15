// Isolated browser fixture, not a replacement for SQL integration tests.
import type { Express } from 'express';
import { company,student,projectId,admin } from './ids';
export function registerDeliveryFixture(app:Express){
  const contractId='40000000-0000-4000-8000-000000000001';
  const snapshot:any={contracts:[{id:contractId,title:'Research project agreement',companyId:company,talentId:student,projectId,status:'active',monthlyAmountKrw:400000}],milestones:[],payments:[{id:'fixture-payment',contractId,status:'paid',amountKrw:400000}],workPassport:[],reviews:[],disputes:[]};
  const history:Record<string,any[]>={};
  app.get('/__qa/delivery',(_req,res)=>res.json(snapshot));
  app.post('/__qa/delivery/reset',(_req,res)=>{snapshot.contracts[0].status='active';delete snapshot.contracts[0].company_completed_at;delete snapshot.contracts[0].student_completed_at;snapshot.milestones=[];snapshot.workPassport=[];for(const key in history)delete history[key];res.json({ok:true});});
  app.post('/__qa/delivery/cases',(req:any,res)=>{if(req.user.uid!==admin)return res.sendStatus(403);snapshot.reviews=[{id:'fixture-review',reviewerRole:'student',moderationStatus:'pending',comment:'The team supplied clear weekly requirements.'}];snapshot.disputes=[{id:'fixture-dispute',category:'scope',status:'open',summary:'Clarify the agreed scope before continuing.'}];res.json({ok:true});});
  app.post('/api/v2/admin/reviews/:id/moderate',(req:any,res)=>{if(req.user.uid!==admin)return res.sendStatus(403);snapshot.reviews[0].moderationStatus=req.body.decision;res.json({data:{id:req.params.id}});});
  app.post('/api/v2/admin/disputes/:id/resolve',(req:any,res)=>{if(req.user.uid!==admin)return res.sendStatus(403);Object.assign(snapshot.disputes[0],{status:'resolved',resolution:{summary:req.body.summary}});res.json({data:{id:req.params.id}});});
  app.post('/api/v2/milestones',(req:any,res)=>{if(req.user.uid!==company)return res.sendStatus(403);const m={...req.body,id:crypto.randomUUID(),status:'scheduled'};snapshot.milestones.push(m);res.json({data:m});});
  app.get('/api/v2/milestones/:id/submissions',(req,res)=>res.json({data:history[String(req.params.id)]||[]}));
  app.post('/api/v2/milestones/:id/submissions',(req:any,res)=>{if(req.user.uid!==student)return res.sendStatus(403);if(req.body.notes.trim().length<10&&!req.body.storagePaths.length)return res.status(400).json({error:{message:'Evidence required'}});const id=String(req.params.id);const versions=history[id]||=[];versions.unshift({id:crypto.randomUUID(),version:versions.length+1,notes:req.body.notes,files:[],created_at:new Date().toISOString()});snapshot.milestones.find((m:any)=>m.id===id).status='submitted';res.json({data:{status:'submitted'}});});
  app.post('/api/v2/milestones/:id/review',(req:any,res)=>{if(req.user.uid!==company)return res.sendStatus(403);const id=String(req.params.id);snapshot.milestones.find((m:any)=>m.id===id).status=req.body.decision;Object.assign(history[id][0],{review_feedback:req.body.feedback,review_decision:req.body.decision});res.json({data:{status:req.body.decision}});});
  app.post('/api/v2/contracts/:id/completion',(req:any,res)=>{const c=snapshot.contracts[0];c[req.user.uid===company?'company_completed_at':'student_completed_at']=new Date().toISOString();if(c.company_completed_at&&c.student_completed_at){c.status='completed';snapshot.workPassport=[{id:'fixture-passport',evidence:{title:c.title}}];}res.json({data:{status:c.status}});});
}
