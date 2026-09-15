type Guidance = [status:number, ko:string, en:string, vi:string];
const guidance: Record<string, Guidance> = {
  verified_funding_required: [409,'해당 계약의 대금 확보가 아직 확인되지 않았습니다. 결제 기록이 확인된 후 다시 시도해 주세요.','Funding has not been verified for this agreement. Retry after its payment record is confirmed.','Nguồn tiền của hợp đồng chưa được xác minh. Hãy thử lại sau khi thanh toán được xác nhận.'],
  delivery_evidence_required: [400,'결과물 파일을 첨부하거나 내용을 10자 이상 작성해 주세요.','Attach a deliverable or describe the result in at least 10 characters.','Đính kèm sản phẩm hoặc mô tả kết quả bằng ít nhất 10 ký tự.'],
  delivery_file_forbidden: [403,'본인 계정으로 업로드한 프로젝트 결과물만 제출할 수 있습니다. 파일을 다시 선택해 주세요.','Only project deliverables uploaded by your account can be submitted. Please select the file again.','Chỉ được nộp sản phẩm do tài khoản của bạn tải lên. Vui lòng chọn lại tệp.'],
  completion_already_started: [409,'완료 확인이 시작되어 마일스톤을 추가할 수 없습니다. 기록을 새로고침해 주세요.','Completion confirmation has started. No further milestones can be added; refresh the records.','Đã bắt đầu xác nhận hoàn thành. Không thể thêm mốc công việc; hãy tải lại dữ liệu.'],
  invalid_milestone_budget: [400,'마일스톤 금액의 합계는 계약 금액을 초과할 수 없습니다.','The sum of milestone amounts cannot exceed the agreement amount.','Tổng giá trị các mốc công việc không được vượt quá giá trị hợp đồng.'],
  review_feedback_required: [400,'검수 의견을 10자 이상 작성해 주세요.','Write at least 10 characters of review feedback.','Viết nhận xét bằng ít nhất 10 ký tự.'],
  invalid_milestone_review_transition: [409,'이미 검수했거나 제출 상태가 변경되었습니다. 기록을 새로고침해 주세요.','This submission was already reviewed or changed. Refresh the records.','Sản phẩm đã được đánh giá hoặc trạng thái đã thay đổi. Hãy tải lại dữ liệu.'],
  contract_not_ready: [409,'계약의 서명·대금 확보·진행 상태를 먼저 확인해 주세요.','Check the agreement signing, funding and workflow status first.','Vui lòng kiểm tra trạng thái ký hợp đồng, nguồn tiền và tiến độ trước.'],
  dispute_resolution_required: [409,'미해결 분쟁이 있어 프로젝트를 완료할 수 없습니다. 운영팀의 처리 결과를 확인해 주세요.','An unresolved dispute prevents completion. Review the case with the operations team.','Không thể hoàn thành khi còn tranh chấp chưa giải quyết. Hãy liên hệ đội ngũ vận hành.'],
  all_deliverables_approval_required: [409,'등록한 모든 결과물의 검수가 완료되어야 합니다.','All agreed deliverables must be approved before completion.','Tất cả sản phẩm đã thỏa thuận phải được duyệt trước khi hoàn thành.'],
  project_completion_required: [409,'양측이 프로젝트 완료를 확인한 후 최종 리뷰를 작성할 수 있습니다.','Final reviews are available after both parties confirm project completion.','Chỉ có thể viết đánh giá cuối cùng sau khi hai bên xác nhận hoàn thành dự án.'],
  resolution_summary_required: [400,'확인한 근거와 분쟁 처리 결과를 20자 이상 작성해 주세요.','Describe the evidence and resolution in at least 20 characters.','Mô tả minh chứng và kết quả giải quyết bằng ít nhất 20 ký tự.'],
  dispute_already_resolved: [409,'이미 처리된 분쟁입니다. 기록을 새로고침해 주세요.','This case is already resolved. Refresh the records.','Tranh chấp này đã được giải quyết. Hãy tải lại dữ liệu.'],
};
export function workflowClientError(cause:unknown, locale:unknown='en') {
  const key=String((cause as {message?:unknown})?.message||'').trim();
  const value=guidance[key];
  if(!value)return null;
  return {status:value[0],code:key.toUpperCase(),message:value[locale==='ko'?1:locale==='vi'?3:2]};
}
