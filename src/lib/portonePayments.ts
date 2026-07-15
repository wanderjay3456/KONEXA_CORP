import PortOne from "@portone/browser-sdk/v2";

interface PreparedPayment {
  paymentId: string;
  storeId: string;
  channelKey: string;
  orderName: string;
  amount: { total: number };
  currency: "CURRENCY_KRW";
  payMethod: "CARD";
  redirectUrl: string;
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Payment request failed (${response.status})`);
  return payload;
}

export async function payProjectContract(contractId: string) {
  const prepared = await readJson(await fetch("/api/payments/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractId }),
  })) as PreparedPayment;

  const response = await PortOne.requestPayment({
    storeId: prepared.storeId,
    channelKey: prepared.channelKey,
    paymentId: prepared.paymentId,
    orderName: prepared.orderName,
    totalAmount: prepared.amount.total,
    currency: prepared.currency,
    payMethod: prepared.payMethod,
    redirectUrl: prepared.redirectUrl,
  });

  if (!response) throw new Error("결제창이 닫혔습니다.");
  if (response.code) throw new Error(response.message || "PG 결제가 완료되지 않았습니다.");

  return readJson(await fetch("/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId: prepared.paymentId }),
  })) as Promise<{ paymentId: string; status: string; amountMatches: boolean }>;
}
