import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock3, RefreshCw, ShieldCheck } from "lucide-react";

interface ServiceConfiguration {
  supabaseAdmin: boolean;
  gemini: boolean;
  stripeSubscription: boolean;
  portoneProjectPayments: boolean;
  email: boolean;
  modusign: boolean;
}

interface ServiceStatusResponse {
  status: "healthy";
  timestamp: number;
  configuration: ServiceConfiguration;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: ServiceStatusResponse }
  | { kind: "error" };

const serviceLabels: Array<{
  key: keyof ServiceConfiguration;
  label: string;
  description: string;
  pendingLabel?: string;
}> = [
  { key: "supabaseAdmin", label: "회원·데이터", description: "Supabase 인증과 데이터 연결" },
  { key: "gemini", label: "AI 분석", description: "프로필·지원서 분석 서비스" },
  { key: "email", label: "이메일", description: "인증 및 거래 알림 발송" },
  { key: "portoneProjectPayments", label: "프로젝트 결제", description: "국내 PG·에스크로 연동", pendingLabel: "가맹점 계약 후 활성화" },
  { key: "modusign", label: "전자서명", description: "프로젝트 계약 전자서명", pendingLabel: "사업자 계약 후 활성화" },
];

export function StatusPage() {
  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState({ kind: "loading" });

    fetch("/api/system-status", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Status request failed");
        return response.json() as Promise<ServiceStatusResponse>;
      })
      .then((data) => setLoadState({ kind: "ready", data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadState({ kind: "error" });
      });

    return () => controller.abort();
  }, [refreshKey]);

  const isHealthy = loadState.kind === "ready" && loadState.data.status === "healthy";
  const checkedAt = loadState.kind === "ready"
    ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "medium" }).format(loadState.data.timestamp)
    : null;

  return (
    <main className="min-h-dvh bg-[#f6f8f3] px-5 py-8 text-neutral-950 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 flex items-center justify-between gap-4">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-950">
            <ArrowLeft aria-hidden="true" className="size-4" />
            KONEXA로 돌아가기
          </a>
          <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] text-neutral-500">
            SYSTEM STATUS
          </span>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_28px_90px_rgba(41,58,37,0.10)]">
          <div className="border-b border-black/8 px-6 py-9 sm:px-10 sm:py-11">
            <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#173f2b] text-white">
              <ShieldCheck aria-hidden="true" className="size-6" />
            </div>
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-[#417355]">KONEXA SERVICE HEALTH</p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {loadState.kind === "loading" && "서비스 상태를 확인하고 있습니다."}
              {loadState.kind === "error" && "상태 정보를 불러오지 못했습니다."}
              {isHealthy && "핵심 서비스가 정상 운영 중입니다."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
              회원가입, AI 분석, 이메일 알림 등 현재 공개된 KONEXA 기능의 연결 상태입니다.
            </p>
          </div>

          <div className="px-6 py-7 sm:px-10 sm:py-9">
            {loadState.kind === "error" ? (
              <div className="flex flex-col items-start gap-5 rounded-2xl bg-amber-50 p-6">
                <p className="text-sm leading-6 text-amber-950">잠시 후 다시 시도해 주세요. 문제가 계속되면 KONEXA 운영팀에 알려주세요.</p>
                <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-xs font-bold text-white">
                  <RefreshCw aria-hidden="true" className="size-3.5" />
                  다시 확인
                </button>
              </div>
            ) : (
              <div className="divide-y divide-black/7">
                {serviceLabels.map((service) => {
                  const enabled = loadState.kind === "ready" && loadState.data.configuration[service.key];
                  const isPending = Boolean(service.pendingLabel && !enabled);
                  return (
                    <div key={service.key} className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <h2 className="text-sm font-bold sm:text-base">{service.label}</h2>
                        <p className="mt-1 text-xs leading-5 text-neutral-500 sm:text-sm">{service.description}</p>
                      </div>
                      <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${isPending ? "bg-neutral-100 text-neutral-500" : "bg-emerald-50 text-emerald-700"}`}>
                        {isPending ? <Clock3 aria-hidden="true" className="size-3.5" /> : <Check aria-hidden="true" className="size-3.5" />}
                        {loadState.kind === "loading" ? "확인 중" : isPending ? service.pendingLabel : enabled ? "정상" : "점검 필요"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-2 px-2 text-xs leading-5 text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>공개 전 기능은 실제 계약과 운영 요건을 완료한 뒤 활성화됩니다.</p>
          {checkedAt && <p>마지막 확인: {checkedAt}</p>}
        </footer>
      </div>
    </main>
  );
}
