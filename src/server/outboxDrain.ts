export type OutboxBatch = { claimed: number; sent: number; failed: number; suppressed: number };
// Keep pair-sized claims, but continue draining fast deliveries. Reserve enough
// time for the worst-case final pair; never claim work we cannot start in time.
export async function drainOutbox(processPair: (limit: number) => Promise<OutboxBatch>, options: { limit: number; budgetMs?: number; deliveryReserveMs?: number; now?: () => number }) {
  const now = options.now || Date.now;
  const started = now();
  const limit = Math.max(1, Math.min(100, options.limit));
  const budget = options.budgetMs ?? 45_000;
  const reserve = options.deliveryReserveMs ?? 25_000;
  const summary = { claimed: 0, sent: 0, failed: 0, suppressed: 0, durationMs: 0, stopReason: 'empty' };
  while (summary.claimed < limit) {
    if (now() - started > budget - reserve) { summary.stopReason = 'time_budget'; break; }
    const batch = await processPair(Math.min(2, limit - summary.claimed));
    for (const key of ['claimed', 'sent', 'failed', 'suppressed'] as const) summary[key] += batch[key];
    if (batch.failed) { summary.stopReason = 'provider_failure'; break; }
    if (!batch.claimed) { summary.stopReason = 'empty'; break; }
    if (summary.claimed >= limit) summary.stopReason = 'batch_limit';
  }
  summary.durationMs = now() - started;
  return summary;
}
