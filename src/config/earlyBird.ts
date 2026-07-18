export const EARLY_BIRD_DEADLINE_LABEL = "2026.08.05";
export const EARLY_BIRD_DEADLINE_AT = Date.parse("2026-08-05T23:59:59+09:00");

export function isEarlyBirdOpen(now = Date.now()) {
  return now <= EARLY_BIRD_DEADLINE_AT;
}