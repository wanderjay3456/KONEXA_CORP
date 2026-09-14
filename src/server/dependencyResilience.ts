export function isTransientDependencyError(error: unknown): boolean {
  const value = error as { status?: number; statusCode?: number; name?: string; message?: string } | null;
  const status = Number(value?.status || value?.statusCode || 0);
  return status === 429 || status >= 500
    || ['AuthRetryableFetchError', 'TimeoutError', 'AbortError'].includes(value?.name || '')
    || /failed to get (?:project config|api key info)|fetch failed|fetcherror|network request failed|timed? ?out|etimedout|econnreset/i.test(value?.message || '');
}

// Retry only idempotent reads. Never automatically replay a mutation, RPC,
// payment, signature, or auth POST after an uncertain network outcome.
export function resilientReadFetch(baseFetch: typeof fetch = fetch, pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))): typeof fetch {
  return async (input, init) => {
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (!['GET', 'HEAD'].includes(method)) return baseFetch(input, init);
    const originalSignal = init?.signal || (input instanceof Request ? input.signal : undefined);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const timeout = AbortSignal.timeout(8_000);
      const signal = originalSignal ? AbortSignal.any([originalSignal, timeout]) : timeout;
      try {
        const response = await baseFetch(input, { ...init, signal });
        let retryable = response.status === 429 || response.status >= 500;
        if (response.status === 401) {
          const detail = await response.clone().json().catch(() => null);
          retryable = isTransientDependencyError(detail);
        }
        if (!retryable || attempt === 1 || originalSignal?.aborted) return response;
        await response.body?.cancel();
      } catch (error) {
        if (attempt === 1 || originalSignal?.aborted || !isTransientDependencyError(error)) throw error;
      }
      await pause(200);
    }
    throw new Error('Dependency request exhausted');
  };
}
