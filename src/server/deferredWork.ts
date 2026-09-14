import { waitUntil } from "@vercel/functions";

/** The persistent outbox owns retries; this keeps best-effort work alive per request. */
export function deferNotificationWork(
  work: () => Promise<unknown>,
  retain: (promise: Promise<void>) => void = waitUntil,
  reportFailure: () => void = () => console.warn("Deferred notification processing failed; the outbox will retry."),
) {
  const pending = Promise.resolve().then(work).then(() => undefined).catch(reportFailure);
  retain(pending);
  return pending;
}
