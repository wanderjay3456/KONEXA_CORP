import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Building2, Check, Clipboard, Landmark, LoaderCircle, QrCode, ShieldCheck } from "lucide-react";
import { useToast } from "../ui/Toast";

interface BankConfiguration {
  configured: boolean;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  qrPayload?: string;
}

interface TransferIntent extends BankConfiguration {
  intentId: string;
  reference: string;
  amountKrw: number;
  status: string;
  createdAt: number;
}

export default function CompanyBankTransferPayment() {
  const { success, error } = useToast();
  const [configuration, setConfiguration] = useState<BankConfiguration | null>(null);
  const [intent, setIntent] = useState<TransferIntent | null>(null);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/api/company-bank-payments/config", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Bank account configuration could not be loaded.");
        setConfiguration(payload);
      })
      .catch((reason) => error("Payment configuration unavailable", reason instanceof Error ? reason.message : "Try again later."))
      .finally(() => setLoading(false));
  }, []);

  const activeDetails = intent || configuration;
  const qrPayload = activeDetails?.qrPayload || "";
  useEffect(() => {
    let active = true;
    if (!qrPayload) {
      setQrUrl("");
      return;
    }
    QRCode.toDataURL(qrPayload, { width: 360, margin: 2, errorCorrectionLevel: "M", color: { dark: "#0a0a0a", light: "#ffffff" } })
      .then((value) => active && setQrUrl(value))
      .catch((reason) => {
        console.error("Bank QR generation failed:", reason);
        if (active) setQrUrl("");
      });
    return () => { active = false; };
  }, [qrPayload]);

  const normalizedAmount = useMemo(() => Number(amount.replace(/[^0-9]/g, "")), [amount]);

  const createIntent = async () => {
    if (!Number.isSafeInteger(normalizedAmount) || normalizedAmount < 1_000) {
      error("Check the amount", "Enter a whole KRW amount of at least 1,000.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/company-bank-payments/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountKrw: normalizedAmount, memo }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The transfer request could not be created.");
      setIntent(payload);
      success("Transfer request created", "Use the exact amount and reference shown below.");
    } catch (reason) {
      error("Transfer request failed", reason instanceof Error ? reason.message : "Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1500);
  };

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><LoaderCircle className="h-7 w-7 animate-spin text-neutral-500" /></div>;

  if (!configuration?.configured) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
        <Landmark className="h-8 w-8 text-amber-600" />
        <h1 className="mt-4 text-2xl font-black">Settlement account activation pending</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">No account number is displayed until the verified KONEXA settlement account is registered. This prevents a placeholder or personal account from being shown as a production payment destination.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-teal-700"><Building2 className="h-4 w-4" />Company project payment</div>
        <h1 className="mt-2 text-2xl font-black text-neutral-950">Create a bank transfer request</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">Enter the agreed project amount. KONEXA records the request and generates a unique reference for reconciliation.</p>

        <div className="mt-7 space-y-4">
          <label className="block"><span className="text-xs font-bold text-neutral-700">Amount (KRW)</span><input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))} placeholder="Enter amount" className="mt-2 h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-bold outline-none focus:border-neutral-900" /></label>
          <label className="block"><span className="text-xs font-bold text-neutral-700">Transfer memo (optional)</span><input maxLength={100} value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="Project or contract reference" className="mt-2 h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none focus:border-neutral-900" /></label>
          <button type="button" disabled={submitting} onClick={createIntent} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-4 text-sm font-bold text-white disabled:opacity-50">{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}Generate amount-specific QR</button>
        </div>

        {intent && <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 text-sm font-black text-emerald-900"><ShieldCheck className="h-5 w-5" />Transfer request recorded</div><dl className="mt-4 grid gap-3 text-xs"><div className="flex justify-between gap-4"><dt className="text-emerald-700">Amount</dt><dd className="font-black text-emerald-950">{intent.amountKrw.toLocaleString()} KRW</dd></div><div className="flex justify-between gap-4"><dt className="text-emerald-700">Reference</dt><dd className="font-mono font-black text-emerald-950">{intent.reference}</dd></div><div className="flex justify-between gap-4"><dt className="text-emerald-700">Status</dt><dd className="font-bold text-emerald-950">Awaiting transfer</dd></div></dl></div>}
      </section>

      <section className="rounded-3xl bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
        <div className="text-xs font-bold uppercase tracking-[.16em] text-neutral-400">Secure transfer details</div>
        <div className="mt-5 grid gap-5 sm:grid-cols-[190px_1fr] lg:grid-cols-1 xl:grid-cols-[190px_1fr]">
          <div className="rounded-2xl bg-white p-3">{qrUrl ? <img src={qrUrl} alt="KONEXA bank account QR code" className="aspect-square w-full" /> : <div className="flex aspect-square items-center justify-center text-neutral-400"><QrCode className="h-8 w-8" /></div>}</div>
          <div className="space-y-4">
            {[["Bank", activeDetails?.bankName || ""], ["Account", activeDetails?.accountNumber || ""], ["Holder", activeDetails?.accountHolder || ""]].map(([label, value]) => <div key={label}><div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</div><div className="mt-1 flex items-center justify-between gap-2"><span className="break-all text-sm font-bold">{value}</span><button type="button" onClick={() => copy(label, value)} className="rounded-lg bg-white/10 p-2 text-neutral-300 hover:bg-white/20" aria-label={`Copy ${label}`}>{copied === label ? <Check className="h-4 w-4 text-emerald-400" /> : <Clipboard className="h-4 w-4" />}</button></div></div>)}
          </div>
        </div>
        <p className="mt-6 text-xs leading-5 text-neutral-400">The QR contains transfer instructions, not a universal bank-app deep link. Confirm the bank, account holder, amount, and reference before sending. Payment is marked complete only after KONEXA reconciles the deposit.</p>
      </section>
    </div>
  );
}
