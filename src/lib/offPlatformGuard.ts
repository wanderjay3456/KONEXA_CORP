export type ContactSignal = "email" | "phone" | "social_id" | "direct_url";

export interface ContactInspection {
  blocked: boolean;
  signals: ContactSignal[];
  message: string;
}
const rules: Array<{ signal: ContactSignal; pattern: RegExp }> = [
  { signal: "email", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  { signal: "phone", pattern: /(?:\+?[0-9][0-9 ()-]{7,}[0-9])/ },
  { signal: "social_id", pattern: /(?:linkedin\.com|instagram\.com|facebook\.com|t\.me\/|telegram|kakao|zalo|whatsapp|wechat)/i },
  { signal: "direct_url", pattern: /https?:\/\/(?![^\s]*(?:konexa|supabase\.co))[^\s]+/i },
];

export function inspectOffPlatformContact(text: string, contactUnlocked = false): ContactInspection {
  if (contactUnlocked) return { blocked: false, signals: [], message: "" };
  const signals = rules.filter(({ pattern }) => pattern.test(text)).map(({ signal }) => signal);
  return {
    blocked: signals.length > 0,
    signals: [...new Set(signals)],
    message: signals.length
      ? "계약과 등록 PG의 대금 확보가 완료되기 전에는 전화번호·개인 이메일·SNS 주소를 보낼 수 없습니다. 플랫폼의 소개·계약 절차를 이용해 주세요."
      : "",
  };
}

export function maskedTalentName(candidateId: string) {
  const suffix = candidateId.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase().padStart(4, "0");
  return `검증 인재 ${suffix}`;
}

export function maskedContact(value: string) {
  if (!value) return "비공개";
  if (value.includes("@")) {
    const [, domain = ""] = value.split("@");
    return `••••@${domain.replace(/^[^.]+/, "••••")}`;
  }
  return "계약·결제 완료 후 공개";
}
