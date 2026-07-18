import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BriefcaseBusiness, Building2, CheckCircle2, Clock3, Database, RefreshCw, Search, ShieldCheck, UserRoundCheck, Users2, XCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useToast } from "../ui/Toast";

interface DirectoryUser {
  id: string;
  email?: string;
  displayName?: string;
  role?: string;
  accountStatus?: "Active" | "Suspended";
  updatedAt?: string;
  profile?: Record<string, unknown> | null;
}

interface VerificationRequest {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  role?: string;
  verificationType?: string;
  status?: string;
  adminNotes?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}

type AdminTab = "overview" | "members" | "projects" | "verifications" | "activity";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "overview", label: "운영 현황" },
  { id: "members", label: "회원 관리" },
  { id: "projects", label: "프로젝트" },
  { id: "verifications", label: "인증 심사" },
  { id: "activity", label: "활동 기록" },
];

function formatDate(value?: string | number) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("ko-KR");
}

export default function AdminDashboard() {
  const { projects, applications, logs } = useApp();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRealData = useCallback(async () => {
    setLoading(true);
    try {
      const [directoryResponse, verificationResponse] = await Promise.all([
        fetch("/api/admin/directory"),
        fetch("/api/admin/verifications"),
      ]);
      const directoryPayload = await directoryResponse.json();
      const verificationPayload = await verificationResponse.json();
      if (!directoryResponse.ok) throw new Error(directoryPayload.error || "회원 데이터를 불러오지 못했습니다.");
      if (!verificationResponse.ok) throw new Error(verificationPayload.error || "인증 데이터를 불러오지 못했습니다.");
      setUsers(Array.isArray(directoryPayload.users) ? directoryPayload.users : []);
      setVerifications(Array.isArray(verificationPayload.requests) ? verificationPayload.requests : []);
    } catch (cause) {
      error("관리자 데이터 동기화 실패", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void loadRealData();
  }, [loadRealData]);

  const metrics = useMemo(() => ({
    totalUsers: users.length,
    students: users.filter((user) => user.role === "student").length,
    companies: users.filter((user) => user.role === "company").length,
    activeProjects: projects.filter((project) => project.status === "open").length,
    applications: applications.length,
    pendingVerifications: verifications.filter((request) => request.status === "Pending").length,
  }), [applications.length, projects, users, verifications]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => `${user.displayName || ""} ${user.email || ""} ${user.role || ""}`.toLowerCase().includes(normalized));
  }, [query, users]);

  const updateAccountStatus = async (user: DirectoryUser) => {
    const nextStatus = user.accountStatus === "Suspended" ? "Active" : "Suspended";
    setUpdatingId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus: nextStatus }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "계정 상태 변경에 실패했습니다.");
      success("계정 상태 변경 완료", `${user.displayName || user.email || user.id} 계정을 ${nextStatus} 상태로 변경했습니다.`);
      await loadRealData();
    } catch (cause) {
      error("계정 상태 변경 실패", cause instanceof Error ? cause.message : "다시 시도해 주세요.");
    } finally {
      setUpdatingId(null);
    }
  };

  const reviewVerification = async (request: VerificationRequest, status: "Approved" | "Rejected") => {
    const adminNotes = status === "Rejected"
      ? window.prompt("반려 사유 또는 보완 요청을 입력해 주세요.", "제출 서류를 다시 확인해 주세요.") || ""
      : "제출 정보와 증빙 서류를 확인했습니다.";
    if (status === "Rejected" && !adminNotes.trim()) return;

    setUpdatingId(request.id);
    try {
      const response = await fetch(`/api/admin/verifications/${encodeURIComponent(request.id)}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "인증 처리에 실패했습니다.");
      success(status === "Approved" ? "인증 승인 완료" : "보완 요청 전송", "실제 프로필 상태와 사용자 알림을 갱신했습니다.");
      await loadRealData();
    } catch (cause) {
      error("인증 처리 실패", cause instanceof Error ? cause.message : "다시 시도해 주세요.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-5 md:p-7">
      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        <header className="rounded-3xl bg-neutral-950 p-7 text-white">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300"><Database className="h-4 w-4" /> Supabase live operations</div>
              <h1 className="mt-3 text-3xl font-black">KONEXA 관리자</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">실제 회원·프로젝트·지원·인증 레코드만 표시합니다. 임의 생성 통계와 모의 보안 이벤트는 사용하지 않습니다.</p>
            </div>
            <button onClick={() => void loadRealData()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-xs font-bold hover:bg-white/10 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />새로고침</button>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-2" aria-label="관리자 메뉴">
          {tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold ${activeTab === tab.id ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-50"}`}>{tab.label}</button>)}
        </nav>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              {[
                { label: "전체 회원", value: metrics.totalUsers, icon: Users2 },
                { label: "학생", value: metrics.students, icon: UserRoundCheck },
                { label: "기업", value: metrics.companies, icon: Building2 },
                { label: "모집 프로젝트", value: metrics.activeProjects, icon: BriefcaseBusiness },
                { label: "지원서", value: metrics.applications, icon: Activity },
                { label: "대기 심사", value: metrics.pendingVerifications, icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                return <article key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-neutral-400" /><div className="mt-4 text-2xl font-black text-neutral-950">{item.value}</div><div className="mt-1 text-xs font-bold text-neutral-500">{item.label}</div></article>;
              })}
            </section>
            <section className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-3xl border border-neutral-200 bg-white p-6">
                <h2 className="text-sm font-black">최근 실제 프로젝트</h2>
                <div className="mt-4 space-y-3">{projects.slice(0, 5).map((project) => <div key={project.id} className="rounded-2xl bg-neutral-50 p-4"><div className="flex items-center justify-between gap-3"><b className="text-sm">{project.title}</b><span className="text-[10px] font-bold text-neutral-500">{project.status}</span></div><p className="mt-1 text-xs text-neutral-500">{project.companyName} · {formatDate(project.createdAt)}</p></div>)}{projects.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">등록된 프로젝트가 없습니다.</p>}</div>
              </article>
              <article className="rounded-3xl border border-neutral-200 bg-white p-6">
                <h2 className="text-sm font-black">최근 실제 활동</h2>
                <div className="mt-4 space-y-3">{logs.slice(0, 5).map((log) => <div key={log.id} className="rounded-2xl bg-neutral-50 p-4"><b className="text-sm">{log.action}</b><p className="mt-1 text-xs leading-5 text-neutral-500">{log.userName} · {log.details}</p><p className="mt-1 text-[10px] text-neutral-400">{formatDate(log.timestamp)}</p></div>)}{logs.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">기록된 활동이 없습니다.</p>}</div>
              </article>
            </section>
          </div>
        )}

        {activeTab === "members" && (
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h2 className="text-lg font-black">실제 회원 디렉터리</h2><p className="mt-1 text-xs text-neutral-500">Supabase `users`와 역할별 프로필을 연결해 표시합니다.</p></div><label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3"><Search className="h-4 w-4 text-neutral-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름·이메일·역할 검색" className="h-10 w-64 max-w-full text-sm outline-none" /></label></div>
            <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-neutral-200 text-xs text-neutral-500"><tr><th className="p-3">회원</th><th className="p-3">역할</th><th className="p-3">상태</th><th className="p-3">프로필</th><th className="p-3 text-right">관리</th></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user.id} className="border-b border-neutral-100 last:border-0"><td className="p-3"><b>{user.displayName || "이름 미등록"}</b><div className="mt-1 text-xs text-neutral-500">{user.email || user.id}</div></td><td className="p-3"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold">{user.role || "unknown"}</span></td><td className="p-3"><span className={`font-bold ${user.accountStatus === "Suspended" ? "text-rose-600" : "text-emerald-700"}`}>{user.accountStatus || "Active"}</span></td><td className="p-3 text-xs text-neutral-500">{user.profile ? "연결됨" : "미완료"}</td><td className="p-3 text-right"><button disabled={updatingId === user.id} onClick={() => void updateAccountStatus(user)} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-bold disabled:opacity-50">{user.accountStatus === "Suspended" ? "활성화" : "정지"}</button></td></tr>)}{filteredUsers.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-neutral-400">조건에 맞는 실제 회원이 없습니다.</td></tr>}</tbody></table></div>
          </section>
        )}

        {activeTab === "projects" && (
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">실제 프로젝트</h2><p className="mt-1 text-xs text-neutral-500">기업이 등록한 Supabase 프로젝트 레코드입니다.</p><div className="mt-5 space-y-3">{projects.map((project) => <article key={project.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-neutral-200 p-5 md:flex-row md:items-center"><div><b>{project.title}</b><p className="mt-1 text-xs text-neutral-500">{project.companyName} · {project.reward} · {formatDate(project.createdAt)}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold">{project.status}</span><span className="text-xs text-neutral-500">지원 {applications.filter((application) => application.projectId === project.id).length}건</span></div></article>)}{projects.length === 0 && <p className="py-10 text-center text-neutral-400">등록된 실제 프로젝트가 없습니다.</p>}</div></section>
        )}

        {activeTab === "verifications" && (
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">인증 심사</h2><p className="mt-1 text-xs text-neutral-500">회원가입 과정에서 실제 제출된 인증 요청만 표시합니다.</p><div className="mt-5 space-y-3">{verifications.map((request) => <article key={request.id} className="rounded-2xl border border-neutral-200 p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><b>{request.userName || request.userEmail || request.userId || "회원"}</b><p className="mt-1 text-xs text-neutral-500">{request.role} · {request.verificationType} · {formatDate(request.updatedAt || request.createdAt)}</p></div><div className="flex items-center gap-2"><span className="mr-2 text-xs font-bold text-neutral-500">{request.status || "Pending"}</span>{request.status === "Pending" && <><button disabled={updatingId === request.id} onClick={() => void reviewVerification(request, "Approved")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><CheckCircle2 className="h-4 w-4" />승인</button><button disabled={updatingId === request.id} onClick={() => void reviewVerification(request, "Rejected")} className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-bold"><XCircle className="h-4 w-4" />보완 요청</button></>}</div></div>{request.adminNotes && <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">관리자 메모: {request.adminNotes}</p>}</article>)}{verifications.length === 0 && <p className="py-10 text-center text-neutral-400">제출된 인증 요청이 없습니다.</p>}</div></section>
        )}

        {activeTab === "activity" && (
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">실제 활동 기록</h2><p className="mt-1 text-xs text-neutral-500">클라이언트가 Supabase `logs`에 기록한 운영 이벤트입니다.</p><div className="mt-5 space-y-3">{logs.map((log) => <article key={log.id} className="flex gap-3 rounded-2xl border border-neutral-200 p-4"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" /><div><b className="text-sm">{log.action}</b><p className="mt-1 text-xs leading-5 text-neutral-500">{log.userName} · {log.details}</p><p className="mt-1 text-[10px] text-neutral-400">{formatDate(log.timestamp)}</p></div></article>)}{logs.length === 0 && <p className="py-10 text-center text-neutral-400">기록된 활동이 없습니다.</p>}</div></section>
        )}
      </div>
    </div>
  );
}