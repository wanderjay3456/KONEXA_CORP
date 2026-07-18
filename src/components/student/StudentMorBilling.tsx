import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, Globe2, LoaderCircle, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { useToast } from "../ui/Toast";

interface BillingStatus {
  configured: boolean;
  environment: "sandbox" | "live";
  subscription: {
    status?: string;
    active?: boolean;
    nextBilledAt?: string | null;
  };
  plan: {
    name: string;
    amount: string | null;
    currency: string | null;
    interval: string | null;
  } | null;
  canManage: boolean;
}

function formatPrice(plan: BillingStatus["plan"]) {
  if (!plan?.amount || !plan.currency) return "Price shown in secure checkout";
  const zeroDecimal = new Set(["JPY", "KRW", "VND"]);
  const value = Number(plan.amount) / (zeroDecimal.has(plan.currency) ? 1 : 100);
  if (!Number.isFinite(value)) return "Price shown in secure checkout";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: plan.currency }).format(value);
}

export default function StudentMorBilling() {
  const { success, error } = useToast();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"checkout" | "portal" | "">("");

  const load = () => {
    setLoading(true);
    fetch("/api/student-billing/status", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Billing status could not be loaded.");
        setStatus(payload);
      })
      .catch((reason) => error("Billing unavailable", reason instanceof Error ? reason.message : "Try again later."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCheckout = async () => {
    setAction("checkout");
    try {
      const response = await fetch("/api/student-billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Idempotency-Key": crypto.randomUUID() },
        body: "{}",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) throw new Error(payload.error || "Secure checkout could not be created.");
      window.location.assign(payload.url);
    } catch (reason) {
      error("Checkout unavailable", reason instanceof Error ? reason.message : "Try again later.");
      setAction("");
    }
  };

  const openPortal = async () => {
    setAction("portal");
    try {
      const response = await fetch("/api/student-billing/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) throw new Error(payload.error || "The billing portal could not be opened.");
      success("Secure portal ready", "Opening your Merchant of Record billing portal.");
      window.location.assign(payload.url);
    } catch (reason) {
      error("Portal unavailable", reason instanceof Error ? reason.message : "Try again later.");
      setAction("");
    }
  };

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><LoaderCircle className="h-7 w-7 animate-spin text-neutral-500" /></div>;

  if (!status?.configured) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
        <Globe2 className="h-8 w-8 text-amber-600" />
        <h1 className="mt-4 text-2xl font-black">Global student billing activation pending</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">The Merchant of Record checkout remains disabled until KONEXA completes seller verification and registers a live software subscription product. No simulated payment can create access.</p>
      </div>
    );
  }

  const active = Boolean(status.subscription?.active);

  return (
    <div className="mx-auto max-w-5xl">
      <section className="overflow-hidden rounded-[2rem] bg-neutral-950 text-white shadow-2xl">
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.1fr_.9fr] lg:p-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-teal-300"><Sparkles className="h-4 w-4" />KONEXA Student Pro</div>
            <h1 className="mt-4 max-w-xl text-3xl font-black leading-tight sm:text-4xl">One global checkout, with tax and receipts handled by the Merchant of Record.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-300">This subscription covers KONEXA software features only. Project compensation, hiring fees, and talent payouts are kept outside this checkout.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {active ? <button type="button" disabled={!status.canManage || action !== ""} onClick={openPortal} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-neutral-950 disabled:opacity-50">{action === "portal" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}Manage billing</button>
                : <button type="button" disabled={action !== ""} onClick={openCheckout} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-neutral-950 disabled:opacity-50">{action === "checkout" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}Open secure checkout</button>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">Current plan</div>
            <div className="mt-3 text-3xl font-black">{formatPrice(status.plan)}</div>
            <div className="mt-1 text-xs text-neutral-400">{status.plan?.interval ? `per ${status.plan.interval}` : "Final amount and local tax appear at checkout"}</div>
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold"><CheckCircle2 className={`h-5 w-5 ${active ? "text-emerald-400" : "text-neutral-400"}`} />{active ? "Subscription active" : "Free plan"}</div>
            <div className="mt-4 text-xs leading-5 text-neutral-400">Status: {status.subscription?.status || "free"}{status.subscription?.nextBilledAt ? ` / Next billing: ${new Date(status.subscription.nextBilledAt).toLocaleDateString()}` : ""}</div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Tax handling", "The MoR calculates and remits applicable sales tax or VAT."], ["Payment security", "Card data is entered only in the provider-hosted checkout."], ["Receipts and cancellation", "Invoices, payment methods, and cancellation are managed in the hosted portal."]].map(([title, text], index) => <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex items-center gap-2 text-sm font-black">{index === 0 ? <Globe2 className="h-4 w-4 text-teal-700" /> : index === 1 ? <ShieldCheck className="h-4 w-4 text-teal-700" /> : <ReceiptText className="h-4 w-4 text-teal-700" />}{title}</div><p className="mt-2 text-xs leading-5 text-neutral-500">{text}</p></div>)}
      </div>
    </div>
  );
}
