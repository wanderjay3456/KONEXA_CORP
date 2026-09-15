export type CoordinationKind = 'meeting' | 'change' | 'support';
export interface CoordinationItem {
  id: string; kind: CoordinationKind; relationship_id: string; contract_id: string | null;
  company_id: string; student_id: string; created_by: string; title: string;
  status: string; version: number; details: Record<string, any>;
  slots: string[]; duration_minutes: number | null; starts_at: string | null;
  ends_at: string | null; due_at: string | null; created_at: string; updated_at: string;
}
export interface CoordinationEvent { id: string; action: string; actor_id: string; note: string; created_at: string; version: number }
export const coordinationStatuses: Record<string, [string, string]> = {
  proposed: ['상대방 확인 대기', 'Awaiting response'], confirmed: ['일정 확정', 'Confirmed'],
  declined: ['일정 거절', 'Declined'], cancelled: ['취소됨', 'Cancelled'], rescheduled: ['일정 변경됨', 'Rescheduled'],
  completed: ['진행 완료', 'Completed'], agreed: ['변경안 합의 · 계약 절차 필요', 'Agreed · contract steps required'],
  rejected: ['승인되지 않음', 'Rejected'], withdrawn: ['요청 철회', 'Withdrawn'],
  open: ['접수됨', 'Submitted'], in_review: ['검토 중', 'Under review'], matching: ['대체 인재 탐색 중', 'Finding replacement'],
  proposal_sent: ['대체 소개 제안됨', 'Replacement proposed'], resolved: ['처리 완료', 'Resolved'], closed: ['종료됨', 'Closed'],
};

function icsText(value: string) { return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
function icsDate(value: string) { return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
/** A calendar record, not an external invitation. No names or private contacts. */
export function meetingCalendar(item: CoordinationItem, now = new Date()) {
  if (item.kind !== 'meeting' || item.status !== 'confirmed' || !item.starts_at || !item.ends_at) throw new Error('A confirmed meeting is required.');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KONEXA//Meetings//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${item.id}@konexa.co.kr`, `DTSTAMP:${icsDate(now.toISOString())}`,
    `DTSTART:${icsDate(item.starts_at)}`, `DTEND:${icsDate(item.ends_at)}`, `SUMMARY:${icsText(item.title)}`,
    'DESCRIPTION:Open your KONEXA workspace for the latest meeting details.', 'URL:https://konexa.co.kr', 'END:VEVENT', 'END:VCALENDAR'];
  // RFC 5545 line folding by UTF-8 octets, without cutting a Unicode code point.
  return lines.map(line => { let result = '', bytes = 0; for (const char of line) { const size = new TextEncoder().encode(char).length; if (bytes + size > 74) { result += '\r\n '; bytes = 1; } result += char; bytes += size; } return result; }).join('\r\n') + '\r\n';
}
