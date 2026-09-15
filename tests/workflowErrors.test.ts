import assert from 'node:assert/strict';
import test from 'node:test';
import { workflowClientError } from '../src/server/workflowErrors';
test('expected delivery gates provide safe localized recovery guidance instead of internal errors',()=>{
  const keys=['verified_funding_required','delivery_evidence_required','delivery_file_forbidden','completion_already_started','invalid_milestone_budget','review_feedback_required','invalid_milestone_review_transition','contract_not_ready','dispute_resolution_required','all_deliverables_approval_required','project_completion_required','resolution_summary_required','dispute_already_resolved'];
  for(const key of keys)for(const locale of ['ko','en','vi']){
    const result=workflowClientError({message:key},locale)!;
    assert.ok(result.status>=400&&result.status<500);assert.ok(result.message.length>10);assert.ok(!result.message.includes(key));
  }
  assert.equal(workflowClientError({message:'unexpected database secret'}),null);
  assert.equal(workflowClientError({message:'verified_funding_required: private data'}),null);
  assert.equal(workflowClientError({message:'contract_not_ready'},'unsupported')?.message,workflowClientError({message:'contract_not_ready'},'en')?.message);
});
