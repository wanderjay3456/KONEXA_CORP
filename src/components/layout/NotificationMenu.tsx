import { useState } from "react";
import { Bell, CheckCheck, CircleAlert, FileCheck2, ShieldCheck, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { NotificationKind } from "../../types";

const kindIcons: Partial<Record<NotificationKind, typeof Bell>> = {
  application: FileCheck2,
  contract: FileCheck2,
  payment: ShieldCheck,
  security: CircleAlert,
  verification: ShieldCheck,
};

function relativeTime(timestamp: number) {
  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(timestamp);
}

interface NotificationMenuProps {
  onNavigate?: (tab: string) => void;
}

export default function NotificationMenu({ onNavigate }: NotificationMenuProps) {
  const { notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [open, setOpen] = useState(false);

  const selectNotification = async (notificationId: string, actionTab?: string) => {
    await markNotificationRead(notificationId);
    if (actionTab) onNavigate?.(actionTab);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="relative grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50" aria-label={`알림 ${unreadNotificationCount}개 읽지 않음`} aria-expanded={open}>
        <Bell className="h-4.5 w-4.5" />
        {unreadNotificationCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">{unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}</span>}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-20 z-50 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <div><div className="text-sm font-black text-neutral-950">알림</div><div className="text-[10px] text-neutral-500">계정별로 저장되는 실시간 알림입니다.</div></div>
            <div className="flex items-center gap-1">
              {unreadNotificationCount > 0 && <button type="button" onClick={() => void markAllNotificationsRead()} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-neutral-600 hover:bg-neutral-100"><CheckCheck className="h-3.5 w-3.5" /> 모두 읽음</button>}
              <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100" aria-label="알림 닫기"><X className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="max-h-[min(60vh,520px)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center"><Bell className="mx-auto h-6 w-6 text-neutral-300" /><p className="mt-3 text-xs font-bold text-neutral-700">아직 알림이 없습니다.</p><p className="mt-1 text-[10px] text-neutral-400">지원·계약·결제·검증 상태가 변경되면 표시됩니다.</p></div>
            ) : notifications.slice(0, 20).map((notification) => {
              const Icon = kindIcons[notification.kind] || Bell;
              const unread = !notification.readAt;
              return (
                <button type="button" key={notification.id} onClick={() => void selectNotification(notification.id, notification.actionTab)} className={`flex w-full gap-3 border-b border-neutral-100 px-4 py-3 text-left transition hover:bg-neutral-50 ${unread ? "bg-blue-50/50" : "bg-white"}`}>
                  <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${unread ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-500"}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className="text-xs font-black text-neutral-900">{notification.title}</span><span className="shrink-0 text-[9px] text-neutral-400">{relativeTime(notification.createdAt)}</span></span><span className="mt-1 block text-[11px] leading-4 text-neutral-500">{notification.message}</span></span>
                  {unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="읽지 않음" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
